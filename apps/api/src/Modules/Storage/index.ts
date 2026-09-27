// NOTE: storage barrel — canonical `ObjectStorage` port plus the local
// filesystem driver. S3/R2/MinIO drivers register here later; the
// ingestion pipeline keeps importing only the interface.
export type { ObjectStorage } from "./object-storage.types";
export { buildDocumentObjectKey } from "./object-storage.types";
export {
  documentObjectKey,
  getObjectStorage,
  LocalObjectStorage,
  resetObjectStorage,
} from "./objectStorage";
export type { ObjectStorage as ObjectStorageClient } from "./objectStorage";
