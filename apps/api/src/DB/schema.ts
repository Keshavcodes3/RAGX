import { uuid } from "drizzle-orm/pg-core";
import { timestamp } from "drizzle-orm/pg-core";
import { integer, pgTable, varchar } from "drizzle-orm/pg-core";



export const userTable=pgTable("user",{
    id: uuid("id").defaultRandom().primaryKey(),
    username:varchar({length:30}).notNull(),
    email:varchar({length:50}).notNull().unique(),
    passwordHash:varchar("password_hash",{length:255}).notNull(),
    createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

    updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),
})

export const projectTable = pgTable("project", {
  id: uuid("id").defaultRandom().primaryKey(),

  userId: uuid("user_id")
    .notNull()
    .references(() => userTable.id, {
      onDelete: "cascade",
    }),

  name: varchar({ length: 50 }).notNull(),

  description: varchar({ length: 200 }),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),
});


export const ApiKeys=pgTable("api-keys",{
    id: uuid("id").defaultRandom().primaryKey(),
    projectId:uuid("project_id").notNull().references(()=>projectTable.id,{
        onDelete:"cascade"
    }),
    name:varchar({length:50}).notNull(),
    keyHash:varchar({length:64}).notNull().unique(),
    createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),

    revokedAt:timestamp("revoked_at"),



})
