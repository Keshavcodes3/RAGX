declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
      };
      /** Set by authenticateApiKey for SDK (RAGX API key) requests. */
      apiKeyContext?: {
        projectId: string;
        keyId: string;
      };
    }
  }
}

export {};
