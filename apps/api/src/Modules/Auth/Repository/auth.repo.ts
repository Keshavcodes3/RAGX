import { eq } from "drizzle-orm";

import { db } from "@/config/database";
import { userTable } from "@/DB/schema";

export type UserRow = typeof userTable.$inferSelect;

export class AuthRepository {
  private DB = db;

  async findByEmail(email: string): Promise<UserRow | undefined> {
    const [user] = await this.DB.select()
      .from(userTable)
      .where(eq(userTable.email, email));

    return user;
  }

  async findById(id: string): Promise<UserRow | undefined> {
    const [user] = await this.DB.select()
      .from(userTable)
      .where(eq(userTable.id, id));

    return user;
  }

  async create(data: {
    username: string;
    email: string;
    passwordHash: string;
  }): Promise<UserRow | undefined> {
    const [created] = await this.DB.insert(userTable)
      .values({
        username: data.username,
        email: data.email,
        passwordHash: data.passwordHash,
      })
      .returning();

    return created;
  }
}
