import 'server-only'
import * as fs from 'fs'
import * as path from 'path'

export interface StorageAdapter {
  save(filename: string, data: Buffer, mimeType?: string): Promise<string>
  read(storagePath: string): Promise<Buffer>
  delete(storagePath: string): Promise<void>
  exists(storagePath: string): Promise<boolean>
  getUrl(storagePath: string): string
}

class LocalStorageAdapter implements StorageAdapter {
  private basePath: string

  constructor(basePath?: string) {
    this.basePath = basePath || process.env.STORAGE_PATH || './uploads'
  }

  async save(filename: string, data: Buffer, _mimeType?: string): Promise<string> {
    const dir = path.join(this.basePath, new Date().getFullYear().toString())
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    const uniqueName = `${Date.now()}-${filename}`
    const filePath = path.join(dir, uniqueName)
    fs.writeFileSync(filePath, data)

    return path.relative(this.basePath, filePath).replace(/\\/g, '/')
  }

  async read(storagePath: string): Promise<Buffer> {
    const fullPath = path.join(this.basePath, storagePath)
    return fs.readFileSync(fullPath)
  }

  async delete(storagePath: string): Promise<void> {
    const fullPath = path.join(this.basePath, storagePath)
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath)
    }
  }

  async exists(storagePath: string): Promise<boolean> {
    const fullPath = path.join(this.basePath, storagePath)
    return fs.existsSync(fullPath)
  }

  getUrl(storagePath: string): string {
    return `/api/documents/${encodeURIComponent(storagePath)}/download`
  }
}

// S3 adapter stub — prepared for future implementation
class S3StorageAdapter implements StorageAdapter {
  async save(): Promise<string> {
    throw new Error('S3StorageAdapter not implemented. Configure AWS credentials and implement.')
  }

  async read(): Promise<Buffer> {
    throw new Error('S3StorageAdapter not implemented.')
  }

  async delete(): Promise<void> {
    throw new Error('S3StorageAdapter not implemented.')
  }

  async exists(): Promise<boolean> {
    throw new Error('S3StorageAdapter not implemented.')
  }

  getUrl(): string {
    throw new Error('S3StorageAdapter not implemented.')
  }
}

// Factory
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
