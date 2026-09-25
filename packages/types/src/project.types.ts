

export interface CreateProjectInput {
  userId: string;
  name: string;
  description?: string;
}


export interface CreateApiKeyInput {
  projectId: string;
  name: string;
}

export interface CreateApiKeyResponse {
  id: string;
  name: string;
  key: string;
  projectId: string;
  createdAt: Date;
}


export interface UpdateProjectInput {
  name?: string;
  description?: string;
}
