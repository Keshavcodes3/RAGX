// NOTE: object-storage port (interface boundary).
//
// Domain code (DocumentService) depends only on `ObjectStorage` — never on
// `LocalObjectStorage`, S3, R2, or MinIO. Binaries live behind this
// interface; PostgreSQL stores only the `objectKey` reference.
//
//! Storage keys are tenant-scoped (`projects/{projectId}/...`). Never build
// keys from unsanitized user input without going through `documentObjectKey`
// or the driver's traversal guard.

export interface ObjectStorage {
  upload(key: string, data: Buffer, contentType: string): Promise<void>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

/** Storage key for a document original. Tenant-scoped by construction. */
export function buildDocumentObjectKey(
  projectId: string,
  documentId: string,
): string {
  return `projects/${projectId}/documents/${documentId}/original`;
}
