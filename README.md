RAGX
The retrieval layer for AI.

RAGX is a developer-first retrieval infrastructure platform that turns your documents into searchable, AI-ready context.

```

Upload your documents.
RAGX handles ingestion, parsing, chunking, embeddings, and vector search.

```
Your application brings the LLM.

Why RAGX?

Building RAG from scratch usually means wiring together:

```TS
Documents
   ↓
Parser
   ↓
Chunker
   ↓
Embedding Model
   ↓
Vector Database
   ↓
Similarity Search
   ↓
Context
   ↓
LLM
```
RAGX handles everything up to the LLM.

```TS
Your Application
       │
       ▼
     RAGX
       │
       ├── Ingestion
       ├── Parsing
       ├── Chunking
       ├── Embeddings
       ├── Vector Storage
       └── Retrieval
       │
       ▼
Relevant Context
       │
       ▼
Your LLM

```
No vector database setup.
No ingestion pipeline.
No chunking implementation.
No embedding infrastructure.
Just an API.

Quick Start

<b>1. Create a RAGX project</b>

Create a project from the RAGX dashboard and generate an API key.

```
ragx_live_xxxxxxxxxxxxx
```

Keep your API key secret.

2. Install the SDK

```
bun add @ragx/sdk
```

or:
```
npm install @ragx/sdk

```

3. Initialize RAGX

```
import RAGX from "@ragx/sdk";

const ragx = new RAGX({
  apiKey: process.env.RAGX_API_KEY
});


```
Upload a Document
```

const document = await ragx.upload("./docs/postgres.pdf");

console.log(document);

```
RAGX automatically processes the document:


```TS
PDF
 ↓
Text Extraction
 ↓
Chunking
 ↓
Embeddings
 ↓
Vector Storage
```
Example response:
```

{
  "id": "doc_8f92",
  "name": "postgres.pdf",
  "status": "ready",
  "chunks": 421
}

```
Search Your Knowledge

Once your document is indexed:

```
const results = await ragx.search(
  "How does PostgreSQL handle concurrent transactions?"
);

```
Example response:

```TS
{
  "results": [
    {
      "text": "PostgreSQL uses MVCC...",
      "score": 0.94,
      "documentId": "doc_8f92",
      "page": 17
    },
    {
      "text": "Each transaction sees a consistent snapshot...",
      "score": 0.89,
      "documentId": "doc_8f92",
      "page": 18
    }
  ]
}
```

You can pass this context to any LLM you want.

Bring Your Own LLM

RAGX does not require you to use a specific LLM provider.

```TS

                    RAGX

              ┌─────────────┐
              │  Retrieval  │
              └──────┬──────┘
                     │
                     ▼
              Relevant Context
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
        OpenAI    Anthropic   Gemini

```
Example:
```

const results = await ragx.search(
  "Explain PostgreSQL MVCC"
);
```

// Send results to your preferred LLM.

RAGX focuses on retrieval, while you remain in control of generation.

Output Guardrail

A server-side output guardrail is implemented in
`apps/api/src/Modules/Guardrails/` and enforced in the `/v1/ask` flow
(`apps/api/src/Modules/Documents/Services/retrieval.services.ts`): after
LLM generation, the actual generated answer is checked via
`outputGuardrail(answer, { userQuery, retrievedContext, knownSecrets })`.
Only `allow` releases the answer; `block` (403) and `review` (502,
including guardrail failures) fail closed with safe static messages and
never expose the candidate answer, guardrail reasoning, or credentials.

- `secret.scanner.ts` detects likely credentials locally and reports their types.
- `output.guardrail.prompt.ts` defines the AI security review instructions.
- `output.guardrail.ts` exports `outputGuardrail(output, options)` and combines
  the scanner with the Gemini client in `apps/api/src/config/aiConfig.ts`.

The guardrail blocks locally detected credentials without sending the candidate
output to Gemini. Otherwise, Gemini reviews the output for credential leaks,
prompt injection, jailbreaks, data exfiltration, malicious payloads, and exposure
of confidential information. These checks are heuristic and may miss attacks.

Set `GEMINI_GUARD_API_KEY` in `apps/api/.env` for AI review. The default model is
`gemini-2.5-flash`; callers can override it with the `model` option. Other optional
inputs are `userQuery`, `retrievedContext`, and `knownSecrets`.

The result contains `decision`, `attackTypes`, `credentialTypes`, and `reason`.
Decisions are `allow`, `block`, or `review`; failed or invalid AI checks return
`review`. Only `allow` releases the answer. This is an internal backend
function, not an exported SDK feature.

Run the scanner and guardrail tests from `apps/api`:

```powershell
bun test src/Modules/Guardrails/
```

The guardrail tests mock Gemini requests; live model detection is not verified
by these tests.

Knowledge Bases

Group documents into isolated knowledge bases.
```

const knowledgeBase = await ragx.knowledgeBases.create({
  name: "PostgreSQL Documentation"
});
```

Add documents:

```TS
await ragx.knowledgeBases.addDocument(
  knowledgeBase.id,
  document.id
);

```
Query the knowledge base:


```
const results = await ragx.search(
  "How does MVCC work?",
  {
    knowledgeBase: knowledgeBase.id
  }
);

```
A knowledge base can contain:

```
PostgreSQL Documentation
├── postgres.pdf
├── transactions.md
├── mvcc.md
└── indexing.pdf
```
RAGX API
```TS

Documents
POST   /v1/documents
GET    /v1/documents
GET    /v1/documents/:id
DELETE /v1/documents/:id
Knowledge Bases
POST   /v1/knowledge-bases
GET    /v1/knowledge-bases
GET    /v1/knowledge-bases/:id
DELETE /v1/knowledge-bases/:id
Search
POST /v1/search
```

Example:

```
{
  "knowledgeBase": "kb_123",
  "query": "How does MVCC work?",
  "topK": 5
}


```

Architecture

  ```
                         RAGX

                         API
                          │
             ┌────────────┼────────────┐
             │            │            │
             ▼            ▼            ▼
          Auth        Documents     Search
             │            │            │
             │            ▼            │
             │         Ingestion       │
             │            │            │
             │      ┌─────┴─────┐      │
             │      ▼           ▼      │
             │   Parser      Chunker   │
             │                    │     │
             │                    ▼     │
             │               Embeddings│
             │                    │     │
             │                    ▼     ▼
             │              PostgreSQL
             │                + pgvector
             │                    │
             │                    ▼
             │                Retrieval
             │                    │
             └────────────────────┘

```
Storage

RAGX uses:

```
PostgreSQL for application data
pgvector for vector storage and similarity search
Object storage for uploaded documents
```
Documents and vectors are associated with projects and knowledge bases.

API Keys

Every project receives API keys for authenticated access.
```
Project
   │
   ├── API Keys
   │
   ├── Knowledge Bases
   │
   └── Documents
```
Example:
```TS
const ragx = new RAGX({
  apiKey: "ragx_live_xxx"
});
```
API keys should always be stored in environment variables.

```

RAGX_API_KEY=ragx_live_xxxxxxxxx

```

Never expose secret API keys in browser-side code.

Supported Documents

The initial ingestion pipeline targets:
```

PDF
Markdown
TXT
HTML
JSON
CSV
DOCX

```

More formats can be added through the ingestion pipeline.

Retrieval Pipeline

RAGX starts with semantic vector retrieval:
```

Query
 ↓
Embedding
 ↓
pgvector
 ↓
Similarity Search
 ↓
Top-K Chunks



```
The retrieval system is designed to evolve toward:

```TS
             Query
               │
        ┌──────┴──────┐
        ▼             ▼
   Vector Search   BM25 Search
        │             │
        └──────┬──────┘
               ▼
        Hybrid Retrieval
               │
               ▼
            Reranker
               │
               ▼
         Final Context

```


RAGX is currently an experimental project focused on building a retrieval infrastructure layer from first principles.

The goal is to understand and implement the systems behind modern RAG applications rather than simply wrapping an existing framework.

License

MIT
