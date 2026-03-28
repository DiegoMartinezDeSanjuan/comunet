import 'server-only'
import * as fs from 'fs/promises'
import * as fsSync from 'fs'
import * as path from 'path'

// ─── Interface ──────────────────────────────────────────

export interface StorageAdapter {
  save(filename: string, data: Buffer, mimeType?: string): Promise<string>
  read(storagePath: string): Promise<Buffer>
  delete(storagePath: string): Promise<void>
  exists(storagePath: string): Promise<boolean>
  getUrl(storagePath: string): string
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
    return fsSync.existsSync(fullPath)
  }

  getUrl(storagePath: string): string {
    return `/api/documents/${encodeURIComponent(storagePath)}/download`
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
    // Dynamic import to avoid bundling @aws-sdk when using local storage
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
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    )

    if (!response.Body) {
      throw new Error(`S3: Empty body for key ${key}`)
    }

    // Convert readable stream to Buffer
    const chunks: Uint8Array[] = []
    const stream = response.Body as AsyncIterable<Uint8Array>
    for await (const chunk of stream) {
      chunks.push(chunk)
    }
    return Buffer.concat(chunks)
  }

  async delete(storagePath: string): Promise<void> {
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3')
    const client = await this.getClient()
    const key = this.getKey(storagePath)

    await client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    )
  }

  async exists(storagePath: string): Promise<boolean> {
    const { HeadObjectCommand } = await import('@aws-sdk/client-s3')
    const client = await this.getClient()
    const key = this.getKey(storagePath)

    try {
      await client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      )
      return true
    } catch {
      return false
    }
  }

  getUrl(storagePath: string): string {
    // Always go through our API for auth checking
    return `/api/documents/${encodeURIComponent(storagePath)}/download`
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
