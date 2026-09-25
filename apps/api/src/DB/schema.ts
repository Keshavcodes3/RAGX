import { uuid } from "drizzle-orm/pg-core";
import { timestamp } from "drizzle-orm/pg-core";
import { integer, pgTable, varchar } from "drizzle-orm/pg-core";



export const userTable=pgTable("user",{
    id: uuid("id").defaultRandom().primaryKey(),
    username:varchar({length:30}).notNull(),
    email:varchar({length:50}).notNull().unique(),
    createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

    updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),
})


export const projectTable=pgTable("project",{
    id: uuid("id").defaultRandom().primaryKey(),

    userId:uuid("user_id").notNull().references(()=>userTable.id,{
        onDelete:"cascade"
    }),

    name:varchar({length:50}).notNull(),
    description:varchar({length:200}),
    apiKey:varchar().notNull(),
    createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),
})


