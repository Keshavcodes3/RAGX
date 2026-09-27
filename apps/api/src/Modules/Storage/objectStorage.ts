import { mkdir, rm, stat, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { envConfig } from "@/config/envConfig";

/**
 * Object storage abstraction. The ingestion pipeline depends only on
 * this interface — never on a concrete provider. Binaries live here;
 * PostgreSQL stores only the `objectKey` reference.
 *
 * Swap the driver in `getObjectStorage()` for S3/R2/MinIO later
 * without touching the pipeline.
 */
export interface ObjectStorage {
  upload(key: string, data: Buffer, contentType: string): Promise<void>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

/** Storage key for a document original. Tenant-scoped by construction. */
export function documentObjectKey(projectId: string, documentId: string): string {
  return `projects/${projectId}/documents/${documentId}/original`;
}

/**
 * Filesystem driver (dev / single-node). Guards against key traversal
 * so a crafted key can never escape the storage root.
 */
export class LocalObjectStorage implements ObjectStorage {
  constructor(private readonly rootDir: string) {}

  private resolve(key: string): string {
    const absolute = path.resolve(this.rootDir, key);
    const root = path.resolve(this.rootDir);
    if (absolute !== root && !absolute.startsWith(root + path.sep)) {
      throw new Error("Invalid storage key");
    }
    return absolute;
  }

  async upload(key: string, data: Buffer, _contentType: string): Promise<void> {
    const filePath = this.resolve(key);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, data);
  }

  async download(key: string): Promise<Buffer> {
    return readFile(this.resolve(key));
  }

  async delete(key: string): Promise<void> {
    await rm(this.resolve(key), { force: true });
  }

  async exists(key: string): Promise<boolean> {
    try {
      const info = await stat(this.resolve(key));
      return info.isFile();
    } catch {
      return false;
    }
  }
}

let singleton: ObjectStorage | null = null;

/** Process-wide driver. Override in tests via `resetObjectStorage()`. */
export function getObjectStorage(): ObjectStorage {
  if (!singleton) {
    singleton = new LocalObjectStorage(envConfig.STORAGE_DIR);
  }
  return singleton;
}

export function resetObjectStorage(driver?: ObjectStorage | null): void {
  singleton = driver ?? null;
}
