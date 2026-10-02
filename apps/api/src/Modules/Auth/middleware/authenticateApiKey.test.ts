import { describe, expect, it } from "bun:test";

import { hashApiKey } from "@/Utils/generateApiKey";
import { authenticateApiKey } from "./authenticateApiKey";

const RAW_KEY = "ragx_live_testkey000000000000000001";
const PROJECT_ID = "project-1";
const KEY_ID = "key-1";

function fakeRepository(record: { id: string; projectId: string } | undefined) {
  return {
    // `as never`: the fake returns a subset of the row; the middleware only
    // reads `id`/`projectId`, and the cast keeps DB types out of the test.
    findApiKeyByHash: async (_hash: string) => record as never,
  };
}

function requestWith(authHeader: string | undefined) {
  return {
    headers: authHeader === undefined ? {} : { authorization: authHeader },
  } as never;
}

function responseRecorder() {
  const recorded: { status?: number; body?: unknown } = {};
  const res = {
    status: (code: number) => {
      recorded.status = code;
      return {
        json: (body: unknown) => {
          recorded.body = body;
        },
      };
    },
  } as never;
  return { res, recorded };
}

describe("authenticateApiKey", () => {
  it("resolves the project from a valid RAGX API key", async () => {
    const req = requestWith(`Bearer ${RAW_KEY}`) as {
      headers: Record<string, string>;
      apiKeyContext?: unknown;
    } & Parameters<typeof authenticateApiKey>[0];
    const { res } = responseRecorder();
    let nextCalled = false;

    await authenticateApiKey(
      req,
      res,
      () => {
        nextCalled = true;
      },
      fakeRepository({ id: KEY_ID, projectId: PROJECT_ID }),
    );

    expect(nextCalled).toBe(true);
    expect(req.apiKeyContext).toEqual({
      projectId: PROJECT_ID,
      keyId: KEY_ID,
    });
  });

  it("rejects missing credentials with 401", async () => {
    for (const header of [undefined, "Bearer ", "Bearer    "]) {
      const { res, recorded } = responseRecorder();
      let nextCalled = false;
      await authenticateApiKey(
        requestWith(header),
        res,
        () => {
          nextCalled = true;
        },
        fakeRepository({ id: KEY_ID, projectId: PROJECT_ID }),
      );
      expect(nextCalled).toBe(false);
      expect(recorded.status).toBe(401);
      expect(recorded.body).toMatchObject({
        success: false,
        message: "Missing RAGX API key",
      });
    }
  });

  it("rejects invalid and revoked keys with 401 and never echoes the key", async () => {
    const presented = "ragx_live_wrong00000000000000000002";
    const { res, recorded } = responseRecorder();
    let nextCalled = false;

    await authenticateApiKey(
      requestWith(`Bearer ${presented}`),
      res,
      () => {
        nextCalled = true;
      },
      // undefined record covers both unknown hashes and revoked keys:
      // the repository only returns non-revoked rows.
      fakeRepository(undefined),
    );

    expect(nextCalled).toBe(false);
    expect(recorded.status).toBe(401);
    expect(recorded.body).toMatchObject({
      success: false,
      message: "Invalid or revoked API key",
    });
    expect(JSON.stringify(recorded.body)).not.toContain(presented);
    expect(hashApiKey(presented)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("looks keys up by hash, never by client-supplied project", async () => {
    let seenHash = "";
    const repo = {
      findApiKeyByHash: async (hash: string) => {
        seenHash = hash;
        return { id: KEY_ID, projectId: PROJECT_ID } as never;
      },
    };
    const { res } = responseRecorder();
    const req = requestWith(`Bearer ${RAW_KEY}`) as {
      headers: Record<string, string>;
      apiKeyContext?: unknown;
      body?: unknown;
    } & Parameters<typeof authenticateApiKey>[0];
    // A malicious client-supplied projectId must be ignored: the project
    // always comes from the key record.
    req.body = { projectId: "attacker-project" };

    await authenticateApiKey(
      req,
      res,
      () => undefined,
      repo,
    );

    expect(seenHash).toBe(hashApiKey(RAW_KEY));
    expect(req.apiKeyContext).toEqual({
      projectId: PROJECT_ID,
      keyId: KEY_ID,
    });
  });
});
