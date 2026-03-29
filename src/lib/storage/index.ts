import 'server-only'
import * as fs from 'fs/promises'

import * as path from 'path'
import { Readable } from 'stream'

// ─── Interface ──────────────────────────────────────────

export interface StorageAdapter {
  save(filename: string, data: Buffer, mimeType?: string): Promise<string>
  /**
   * Read file as Buffer. Use only for small files or when you need
   * the full contents in memory (e.g. CSV generation).
   * For downloads, prefer getDownloadStream() or getSignedDownloadUrl().
   */
  read(storagePath: string): Promise<Buffer>
  delete(storagePath: string): Promise<void>
  exists(storagePath: string): Promise<boolean>
  getUrl(documentId: string): string

  /**
   * Returns a ReadableStream for streaming file contents without loading
   * the entire file into memory. Falls back to read() + wrapping if
   * the adapter doesn't support native streaming.
   */
  getDownloadStream(storagePath: string): Promise<ReadableStream<Uint8Array>>

  /**
   * Returns a presigned URL for direct download (S3 only).
   * Local storage returns null — the caller should fall back to streaming
   * through the app server.
   */
  getSignedDownloadUrl(
    storagePath: string,
    expiresInSeconds?: number,
    downloadName?: string,
    mimeType?: string
  ): Promise<string | null>
}

// ─── Local Storage (dev + single-instance prod) ─────────

class LocalStorageAdapter implements StorageAdapter {
  private basePath: string

  constructor(basePath?: string) {
    this.basePath = basePath || process.env.STORAGE_PATH || './uploads'
  }

  async save(filename: string, data: Buffer): Promise<string> {
    const dir = path.join(this.basePath, new Date().getFullYear().toString())
    await fs.mkdir(dir, { recursive: true })

    const uniqueName = `${Date.now()}-${filename}`
    const filePath = path.join(dir, uniqueName)
    await fs.writeFile(filePath, data)

    return path.relative(this.basePath, filePath).replace(/\\/g, '/')
  }

  async read(storagePath: string): Promise<Buffer> {
    const fullPath = path.join(this.basePath, storagePath)
    return fs.readFile(fullPath)
  }

  async getDownloadStream(storagePath: string): Promise<ReadableStream<Uint8Array>> {
    const fullPath = path.join(this.basePath, storagePath)

    // Verify the file exists before creating the stream
    await fs.access(fullPath)

    const fileHandle = await fs.open(fullPath, 'r')
    const nodeStream = fileHandle.createReadStream()

    return new ReadableStream<Uint8Array>({
      start(controller) {
        nodeStream.on('data', (chunk) => {
          controller.enqueue(new Uint8Array(chunk as Buffer))
        })
        nodeStream.on('end', async () => {
          await fileHandle.close()
          controller.close()
        })
        nodeStream.on('error', async (err) => {
          await fileHandle.close()
          controller.error(err)
        })
      },
      async cancel() {
        nodeStream.destroy()
        await fileHandle.close()
      },
    })
  }

  async getSignedDownloadUrl(
    storagePath: string,
    expiresInSeconds?: number,
    downloadName?: string,
    mimeType?: string
  ): Promise<string | null> {
    // Local storage doesn't support presigned URLs
    return null
  }

  async delete(storagePath: string): Promise<void> {
    const fullPath = path.join(this.basePath, storagePath)
    try {
      await fs.unlink(fullPath)
    } catch {
      // File may already be deleted
    }
  }

  async exists(storagePath: string): Promise<boolean> {
    const fullPath = path.join(this.basePath, storagePath)
    try {
      await fs.access(fullPath)
      return true
    } catch {
      return false
    }
  }

  getUrl(documentId: string): string {
    return `/api/documents/${encodeURIComponent(documentId)}/download`
  }
}

// ─── S3-compatible Storage (production multi-instance) ──

class S3StorageAdapter implements StorageAdapter {
  private bucket: string
  private region: string
  private endpoint: string | undefined
  private prefix: string

  constructor() {
    this.bucket = process.env.S3_BUCKET || ''
    this.region = process.env.S3_REGION || 'eu-west-1'
    this.endpoint = process.env.S3_ENDPOINT || undefined
    this.prefix = process.env.S3_PREFIX || 'documents'

    if (!this.bucket) {
      throw new Error(
        'S3StorageAdapter requires S3_BUCKET env var. ' +
        'Set STORAGE_ADAPTER=local to use local filesystem instead.',
      )
    }
  }

  private async getClient() {
    const { S3Client } = await import('@aws-sdk/client-s3')
    return new S3Client({
      region: this.region,
      ...(this.endpoint ? { endpoint: this.endpoint, forcePathStyle: true } : {}),
    })
  }

  private getKey(storagePath: string): string {
    return `${this.prefix}/${storagePath}`
  }

  async save(filename: string, data: Buffer, mimeType?: string): Promise<string> {
    const { PutObjectCommand } = await import('@aws-sdk/client-s3')
    const client = await this.getClient()

    const year = new Date().getFullYear().toString()
    const storagePath = `${year}/${Date.now()}-${filename}`
    const key = this.getKey(storagePath)

    await client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: data,
        ContentType: mimeType || 'application/octet-stream',
      }),
    )

    return storagePath
  }

  async read(storagePath: string): Promise<Buffer> {
    const { GetObjectCommand } = await import('@aws-sdk/client-s3')
    const client = await this.getClient()
    const key = this.getKey(storagePath)

    const response = await client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    )

    if (!response.Body) {
      throw new Error(`S3: Empty body for key ${key}`)
    }

    const chunks: Uint8Array[] = []
    const stream = response.Body as AsyncIterable<Uint8Array>
    for await (const chunk of stream) {
      chunks.push(chunk)
    }
    return Buffer.concat(chunks)
  }

  async getDownloadStream(storagePath: string): Promise<ReadableStream<Uint8Array>> {
    const { GetObjectCommand } = await import('@aws-sdk/client-s3')
    const client = await this.getClient()
    const key = this.getKey(storagePath)

    const response = await client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    )

    if (!response.Body) {
      throw new Error(`S3: Empty body for key ${key}`)
    }

    // S3 SDK returns a web ReadableStream or a Node.js Readable
    const body = response.Body

    // If it's already a web ReadableStream, return it
    if ('getReader' in body && typeof body.getReader === 'function') {
      return body as ReadableStream<Uint8Array>
    }

    // Otherwise, convert Node.js Readable to web ReadableStream
    const nodeReadable = body as Readable
    return new ReadableStream<Uint8Array>({
      start(controller) {
        nodeReadable.on('data', (chunk: Buffer) => {
          controller.enqueue(new Uint8Array(chunk))
        })
        nodeReadable.on('end', () => {
          controller.close()
        })
        nodeReadable.on('error', (err) => {
          controller.error(err)
        })
      },
      cancel() {
        nodeReadable.destroy()
      },
    })
  }

  async getSignedDownloadUrl(
    storagePath: string,
    expiresInSeconds = 300,
    downloadName?: string,
    mimeType?: string
  ): Promise<string | null> {
    const { GetObjectCommand, S3Client } = await import('@aws-sdk/client-s3')
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner')
    
    // Creamos un cliente específico solo para firmar, asegurando que el AWS SDK utilice el
    // hostname final (S3_PUBLIC_URL) al generar la firma criptográfica HMAC. Si se forma con 'minio:9000'
    // y luego se reemplaza con 'localhost:9000', el servidor de almacenamiento rechaza la firma al no coincidir su validación.
    const publicEndpoint = process.env.S3_PUBLIC_URL || 'http://localhost:9000'
    const signingClient = new S3Client({
      region: this.region,
      endpoint: publicEndpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      }
    })

    const key = this.getKey(storagePath)

    const commandInput: { Bucket: string; Key: string; ResponseContentDisposition?: string; ResponseContentType?: string } = {
      Bucket: this.bucket,
      Key: key,
    }

    if (downloadName) {
      commandInput.ResponseContentDisposition = `attachment; filename*=UTF-8''${encodeURIComponent(downloadName)}`
    }
    if (mimeType) {
      commandInput.ResponseContentType = mimeType
    }

    const url = await getSignedUrl(
      signingClient,
      new GetObjectCommand(commandInput),
      { expiresIn: expiresInSeconds },
    )

    return url
  }

  async delete(storagePath: string): Promise<void> {
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3')
    const client = await this.getClient()
    const key = this.getKey(storagePath)

    await client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    )
  }

  async exists(storagePath: string): Promise<boolean> {
    const { HeadObjectCommand } = await import('@aws-sdk/client-s3')
    const client = await this.getClient()
    const key = this.getKey(storagePath)

    try {
      await client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      )
      return true
    } catch {
      return false
    }
  }

  getUrl(documentId: string): string {
    return `/api/documents/${encodeURIComponent(documentId)}/download`
  }
}

// ─── Factory ────────────────────────────────────────────

export function getStorageAdapter(): StorageAdapter {
  const adapter = process.env.STORAGE_ADAPTER || 'local'
  switch (adapter) {
    case 's3':
      return new S3StorageAdapter()
    default:
      return new LocalStorageAdapter()
  }
}

export const storage = getStorageAdapter()
