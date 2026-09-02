import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const documents = sqliteTable('documents', {
  id: text('id').primaryKey(),
  draft: text('draft').notNull(),
  published: text('published').notNull(),
  revision: integer('revision').notNull().default(0),
  updatedAt: text('updated_at').notNull(),
  publishedAt: text('published_at'),
  updatedBy: text('updated_by').notNull(),
  writeToken: text('write_token').notNull().default(''),
});

export const images = sqliteTable('images', {
  id: text('id').primaryKey(),
  objectKey: text('object_key').notNull(),
  name: text('name').notNull(),
  mime: text('mime').notNull(),
  size: integer('size').notNull(),
  ownerId: text('owner_id').notNull(),
  published: integer('published').notNull().default(0),
  createdAt: text('created_at').notNull(),
});
