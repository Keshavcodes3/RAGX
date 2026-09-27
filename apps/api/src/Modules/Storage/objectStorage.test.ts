import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "bun:test";

import {
  LocalObjectStorage,
  documentObjectKey,
  getObjectStorage,
  resetObjectStorage,
} from "./objectStorage";

let dirs: string[] = [];

afterEach(async () => {
  resetObjectStorage();
  await Promise.all(dirs.map((d) => rm(d, { recursive: true, force: true })));
  dirs = [];
});

async function tempRoot(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), "ragx-storage-"));
  dirs.push(dir);
  return dir;
}

describe("object storage", () => {
  it("round-trips binaries under tenant-scoped keys", async () => {
    const storage = new LocalObjectStorage(await tempRoot());
    const key = documentObjectKey("project-1", "doc-1");
    const data = Buffer.from("%PDF-1.4 binary-bytes");

    expect(key).toBe("projects/project-1/documents/doc-1/original");
    expect(await storage.exists(key)).toBe(false);
    await storage.upload(key, data, "application/pdf");
    expect(await storage.exists(key)).toBe(true);
    expect((await storage.download(key)).equals(data)).toBe(true);
    await storage.delete(key);
    expect(await storage.exists(key)).toBe(false);
  });

  it("deletes idempotently and fails loudly on missing downloads", async () => {
    const storage = new LocalObjectStorage(await tempRoot());
    await storage.delete("projects/p/documents/d/original");
    await expect(
      storage.download("projects/p/documents/d/original"),
    ).rejects.toThrow();
  });

  it("rejects keys that escape the storage root", async () => {
    const storage = new LocalObjectStorage(await tempRoot());
    const data = Buffer.from("x");

    for (const key of ["../escape", "a/../../escape", ".."]) {
      await expect(storage.upload(key, data, "text/plain")).rejects.toThrow(
        /Invalid storage key/,
      );
      await expect(storage.download(key)).rejects.toThrow();
    }
  });

  it("exposes a resettable process singleton", () => {
    const first = getObjectStorage();
    expect(getObjectStorage()).toBe(first);
    resetObjectStorage();
    expect(getObjectStorage()).not.toBe(first);
    resetObjectStorage();
  });
});
