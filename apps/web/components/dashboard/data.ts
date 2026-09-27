export interface Project {
  id: string;
  name: string;
  documents: number;
  chunks: number;
  updated: string;
}

export interface DocItem {
  id: string;
  name: string;
  type: "PDF" | "MD" | "DOCX" | "TXT" | "HTML";
  chunks: number;
  pages: number;
  status: "ready" | "processing" | "failed";
  stage?: "parsing" | "chunking" | "embedding";
  updated: string;
  headings: number;
  paragraphs: number;
  tables: number;
  images: number;
  codeBlocks: number;
}

export interface Activity {
  id: string;
  text: string;
  time: string;
}

export interface Collection {
  id: string;
  name: string;
  documents: number;
  chunks: number;
}

export interface Chunk {
  id: string;
  content: string;
  document: string;
  docId: string;
  page: number;
  section: string;
  tokens: number;
  score?: number;
}

export interface ApiKey {
  id: string;
  name: string;
  preview: string;
  created: string;
  lastUsed: string;
}

/* Demo workspace shaped like real API responses.
   Swap these imports for fetch() calls when the backend is wired —
   every page already renders EmptyStates when its list is empty. */

export const projects: Project[] = [
  { id: "docs-assistant", name: "Docs Assistant", documents: 482, chunks: 18492, updated: "2m" },
  { id: "support-kb", name: "Support Knowledge Base", documents: 128, chunks: 7842, updated: "1h" },
  { id: "api-reference", name: "API Reference", documents: 64, chunks: 3210, updated: "3h" },
];

export const documents: DocItem[] = [
  { id: "manual", name: "manual.pdf", type: "PDF", chunks: 842, pages: 48, status: "ready", updated: "2m", headings: 42, paragraphs: 812, tables: 18, images: 34, codeBlocks: 12 },
  { id: "api-ref", name: "api-reference", type: "MD", chunks: 291, pages: 12, status: "ready", updated: "18m", headings: 24, paragraphs: 260, tables: 6, images: 2, codeBlocks: 31 },
  { id: "research", name: "research.pdf", type: "PDF", chunks: 1284, pages: 96, status: "processing", stage: "embedding", updated: "now", headings: 58, paragraphs: 1210, tables: 24, images: 51, codeBlocks: 4 },
  { id: "readme", name: "README.md", type: "MD", chunks: 74, pages: 3, status: "ready", updated: "2h", headings: 9, paragraphs: 61, tables: 1, images: 0, codeBlocks: 8 },
];

export const activity: Activity[] = [
  { id: "a1", text: "manual.pdf processed", time: "2 minutes ago" },
  { id: "a2", text: "482 chunks created", time: "4 minutes ago" },
  { id: "a3", text: "Embedding job completed", time: "7 minutes ago" },
  { id: "a4", text: "New API key created", time: "18 minutes ago" },
  { id: "a5", text: "research.pdf upload started", time: "24 minutes ago" },
];

export const collections: Collection[] = [
  { id: "eng", name: "Engineering Docs", documents: 1284, chunks: 48291 },
  { id: "product", name: "Product Docs", documents: 382, chunks: 12842 },
  { id: "support", name: "Support Knowledge", documents: 729, chunks: 24912 },
];

export const chunks: Chunk[] = [
  { id: "ch_0042", content: "JWT tokens are used to authenticate requests. Include the token in the Authorization header as a Bearer token.", document: "manual.pdf", docId: "manual", page: 12, section: "Authentication", tokens: 186, score: 0.94 },
  { id: "ch_0043", content: "Access tokens expire after 15 minutes. Use the refresh token to obtain a new access token without re-authenticating.", document: "manual.pdf", docId: "manual", page: 13, section: "Token expiration", tokens: 142, score: 0.89 },
  { id: "ch_0044", content: "Refresh tokens should be stored securely and rotated on every use. Revoke them immediately on logout.", document: "security.md", docId: "api-ref", page: 14, section: "Security", tokens: 121, score: 0.84 },
  { id: "ch_0045", content: "Rate limits are applied per API key. Exceeding the limit returns HTTP 429 with a Retry-After header.", document: "manual.pdf", docId: "manual", page: 21, section: "Rate limiting", tokens: 98, score: 0.78 },
];

export const apiKeys: ApiKey[] = [
  { id: "k1", name: "Production", preview: "rgx_live_••••••••••••••", created: "Sep 25", lastUsed: "2 min ago" },
  { id: "k2", name: "Staging", preview: "rgx_test_••••••••••••••", created: "Sep 12", lastUsed: "1 h ago" },
];

export const tablePreview: Record<string, string[][]> = {
  manual: [
    ["Header", "Type", "Required"],
    ["Authorization", "string", "yes"],
    ["Content-Type", "string", "yes"],
    ["X-Request-Id", "string", "no"],
  ],
};

export const usageSeries: Record<string, number[]> = {
  "24h": [12, 18, 9, 22, 31, 27, 40, 36, 52, 48, 61, 58],
  "7d": [180, 240, 210, 320, 290, 410, 380],
  "30d": [900, 1200, 1050, 1400, 1600, 1500, 1900, 2100, 1950, 2300],
  "90d": [3000, 4200, 5100, 6300, 7200, 8100, 9400, 10800, 12100, 12842],
};
