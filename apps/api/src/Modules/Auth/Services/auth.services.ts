import argon2 from "argon2";

import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "@/Utils/httpError";

import { AuthRepository, type UserRow } from "../Repository/auth.repo";

export interface PublicUser {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export function toPublicUser(user: UserRow): PublicUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export class AuthService {
  constructor(
    private readonly authRepository = new AuthRepository(),
  ) {}

  async register(data: {
    username: string;
    email: string;
    password: string;
  }): Promise<PublicUser> {
    const existing = await this.authRepository.findByEmail(data.email);

    if (existing) {
      throw new ConflictError("Email already exists");
    }

    const passwordHash = await argon2.hash(data.password);

    const created = await this.authRepository.create({
      username: data.username,
      email: data.email,
      passwordHash,
    });

    if (!created) {
      throw new Error("Failed to create user");
    }

    return toPublicUser(created);
  }

  async login(data: {
    email: string;
    password: string;
  }): Promise<PublicUser> {
    const user = await this.authRepository.findByEmail(data.email);

    if (!user) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const valid = await argon2.verify(user.passwordHash, data.password);

    if (!valid) {
      throw new UnauthorizedError("Invalid credentials");
    }

    return toPublicUser(user);
  }

  async getCurrentUser(userId: string): Promise<PublicUser> {
    const user = await this.authRepository.findById(userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return toPublicUser(user);
  }
}
