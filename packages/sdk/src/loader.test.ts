import { describe, expect, it } from "bun:test";
import { unlink, writeFile } from "node:fs/promises";

import { RAGX } from "./index.js";
import {
  BlobSource,
  BufferSource,
  LocalFileSource,
  MAX_BATCH_FILES,
  MAX_FILE_BYTES,
  loadDocument,
  loadDocuments,
} from "./loader.js";

const CONFIG = {
  provider: "openai" as const,
  providerApiKey: "sk-test-provider-key",
  apiKey: "ragx_test_key",
};

function loader() {
  return new RAGX(CONFIG).loader;
}

function bytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function decode(data: Uint8Array): string {
  return new TextDecoder().decode(data);
}

let tmpSeq = 0;
async function tmpFile(name: string, content: string): Promise<string> {
  const file = `./ragx-loader-test-${Date.now()}-${tmpSeq++}-${name}`;
  await writeFile(file, content);
  return file;
}

async function remove(file: string): Promise<void> {
  await unlink(file).catch(() => undefined);
}

describe("loader local path", () => {
  it("loads a markdown file with inferred name and MIME", async () => {
    const file = await tmpFile("manual.md", "# Hello\n\nWorld");
    try {
      const doc = await loader().load(file);
      expect(doc.name).toBe(file.slice(2));
      expect(doc.mimeType).toBe("text/markdown");
      expect(decode(doc.content)).toBe("# Hello\n\nWorld");
      expect(doc.size).toBe(doc.content.byteLength);
      expect(doc.metadata).toMatchObject({ source: "file" });
    } finally {
      await remove(file);
    }
  });

  it("infers the bare filename from nested relative paths", async () => {
    const file = await tmpFile("postgres.pdf", "%PDF-1.4 hello");
    try {
      // `./src/../` resolves through the existing `src` directory, so the
      // `..` segment exercises basename handling without missing dirs.
      const doc = await loadDocument(`./src/../${file.slice(2)}`);
      expect(doc.name).toBe(file.slice(2));
      expect(doc.mimeType).toBe("application/pdf");
    } finally {
      await remove(file);
    }
  });

  it("infers MIME types per extension", async () => {
    const cases: [string, string][] = [
      ["a.pdf", "application/pdf"],
      ["a.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
      ["a.html", "text/html"],
      ["a.txt", "text/plain"],
      ["a.csv", "text/csv"],
      ["a.md", "text/markdown"],
      ["a.json", "application/json"],
    ];
    for (const [name, mimeType] of cases) {
      const doc = await loadDocument(bytes("content"), { name });
      expect(doc.mimeType).toBe(mimeType);
    }
  });

  it("rejects missing files without leaking internals", async () => {
    await expect(
      loader().load("./ragx-loader-does-not-exist.pdf"),
    ).rejects.toThrowError(/RAGX load failed/);
  });

  it("rejects empty files", async () => {
    const file = await tmpFile("empty.txt", "");
    try {
      await expect(loader().load(file)).rejects.toThrowError(/empty/);
    } finally {
      await remove(file);
    }
  });
});

describe("loader buffer and Blob", () => {
  it("loads raw bytes with explicit name and MIME", async () => {
    const doc = await loader().load(bytes("%PDF-1.4 hello"), {
      name: "postgres.pdf",
      mimeType: "application/pdf",
    });
    expect(doc.name).toBe("postgres.pdf");
    expect(doc.mimeType).toBe("application/pdf");
    expect(doc.size).toBe(doc.content.byteLength);
    expect(doc.metadata).toMatchObject({ source: "buffer" });
  });

  it("uses the explicit filename verbatim as a bare name", async () => {
    const doc = await loadDocument(bytes("x"), { name: "report.pdf" });
    expect(doc.name).toBe("report.pdf");
  });

  it("strips directories from explicit filenames", async () => {
    const doc = await loadDocument(bytes("x"), { name: "a/b/c.pdf" });
    expect(doc.name).toBe("c.pdf");
    expect(doc.mimeType).toBe("application/pdf");
  });

  it("prefers Blob.type unless overridden", async () => {
    const blob = new Blob(["<h1>Hi</h1>"], { type: "text/html" });
    const inferred = await loadDocument(blob, { name: "page.bin" });
    expect(inferred.mimeType).toBe("text/html");
    expect(inferred.metadata).toMatchObject({ source: "blob" });

    const overridden = await loadDocument(blob, {
      name: "page.bin",
      mimeType: "text/plain",
    });
    expect(overridden.mimeType).toBe("text/plain");
  });

  it("rejects empty bytes and empty Blobs", async () => {
    await expect(
      loadDocument(new Uint8Array(0), { name: "e.pdf" }),
    ).rejects.toThrowError(/empty/);
    await expect(
      loadDocument(new Blob([]), { name: "e.pdf" }),
    ).rejects.toThrowError(/empty/);
  });

  it("rejects oversized bytes without materializing uploads", async () => {
    const big = new Uint8Array(MAX_FILE_BYTES + 1);
    expect(big.byteLength).toBe(MAX_FILE_BYTES + 1);
    await expect(
      loadDocument(big, { name: "big.pdf" }),
    ).rejects.toThrowError(/exceeds the 15MB limit/);
  });
});

describe("loader validation", () => {
  it("rejects unknown extensions without an override", async () => {
    await expect(
      loadDocument(bytes("x"), { name: "archive.zip" }),
    ).rejects.toThrowError(/unsupported file type/);
  });

  it("rejects malformed MIME overrides", async () => {
    await expect(
      loadDocument(bytes("x"), { name: "a.pdf", mimeType: "not-a-mime" }),
    ).rejects.toThrowError(/invalid mimeType/);
  });

  it("rejects invalid inputs", async () => {
    for (const input of [123, null, undefined, {}, true]) {
      await expect(
        loadDocument(input as never),
      ).rejects.toThrowError(/RAGX load failed/);
    }
    await expect(loadDocument("" as never)).rejects.toThrowError(
      /RAGX load failed/,
    );
  });

  it("rejects remote URLs without attempting a fetch", async () => {
    await expect(
      loadDocument("https://example.com/docs/postgres.pdf"),
    ).rejects.toThrowError(/remote URL loading is not supported/);
  });
});

describe("loader batch", () => {
  it("loads mixed sources in order", async () => {
    const file = await tmpFile("a.txt", "from disk");
    try {
      const docs = await loader().load([
        file,
        { data: bytes("{\"a\":1}"), name: "data.json" },
        { data: new Blob(["<p>hi</p>"], { type: "text/html" }), name: "p.html" },
      ]);
      expect(docs).toHaveLength(3);
      expect(docs[0]!.name).toBe(file.slice(2));
      expect(docs[0]!.mimeType).toBe("text/plain");
      expect(decode(docs[0]!.content)).toBe("from disk");
      expect(docs[1]!.mimeType).toBe("application/json");
      expect(docs[2]!.mimeType).toBe("text/html");
    } finally {
      await remove(file);
    }
  });

  it("rejects empty and oversized batches", async () => {
    await expect(loadDocuments([])).rejects.toThrowError(/at least one file/);
    const tooMany = Array.from({ length: MAX_BATCH_FILES + 1 }, (_, i) => ({
      data: bytes("x"),
      name: `f${i}.txt`,
    }));
    await expect(loadDocuments(tooMany)).rejects.toThrowError(/at most/);
  });
});

describe("loader source abstraction", () => {
  it("exposes file, buffer, and Blob sources with kinds", async () => {
    const file = await tmpFile("k.txt", "hi");
    try {
      const fromFile = new LocalFileSource(file);
      const fromBuffer = new BufferSource(bytes("hi"), { name: "k.txt" });
      const fromBlob = new BlobSource(new Blob(["hi"]), { name: "k.txt" });
      expect(fromFile.kind).toBe("file");
      expect(fromBuffer.kind).toBe("buffer");
      expect(fromBlob.kind).toBe("blob");
      expect((await fromFile.load()).metadata).toMatchObject({
        source: "file",
      });
      expect((await fromBuffer.load()).metadata).toMatchObject({
        source: "buffer",
      });
      expect((await fromBlob.load()).metadata).toMatchObject({
        source: "blob",
      });
    } finally {
      await remove(file);
    }
  });

  it("loaded documents map onto the upload payload shape", async () => {
    const doc = await loadDocument(bytes("hello"), { name: "a.txt" });
    const body = {
      name: doc.name,
      mimeType: doc.mimeType,
      contentBase64: Buffer.from(doc.content).toString("base64"),
    };
    expect(body.name).toBe("a.txt");
    expect(body.mimeType).toBe("text/plain");
    expect(typeof body.contentBase64).toBe("string");
  });
});
