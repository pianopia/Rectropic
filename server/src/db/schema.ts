import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

// ユーザーテーブル
export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  avatar: text('avatar'),
  provider: text('provider').notNull(), // 'google', 'apple', or 'anonymous'
  providerId: text('provider_id').notNull(),
  isPremium: integer('is_premium', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

// リストテーブル
export const lists = sqliteTable('lists', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  description: text('description'),
  ownerId: text('owner_id').notNull().references(() => users.id),
  isPublic: integer('is_public', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

// リストメンバーテーブル（招待された友達）
export const listMembers = sqliteTable('list_members', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  listId: text('list_id').notNull().references(() => lists.id),
  userId: text('user_id').notNull().references(() => users.id),
  role: text('role').default('member'), // 'owner' or 'member'
  joinedAt: integer('joined_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

// コンテンツテーブル（画像・動画・URL）
export const contents = sqliteTable('contents', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  listId: text('list_id').notNull().references(() => lists.id),
  addedBy: text('added_by').notNull().references(() => users.id),
  type: text('type').notNull(), // 'image', 'video', 'url'
  title: text('title'),
  description: text('description'),
  url: text('url').notNull(), // 画像/動画のURL、またはTikTok/YouTubeのURL
  thumbnailUrl: text('thumbnail_url'),
  metadata: text('metadata', { mode: 'json' }), // 追加のメタデータ（動画の長さ、サイズなど）
  order: integer('order').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

// リアクションテーブル（いいね）
export const reactions = sqliteTable('reactions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  contentId: text('content_id').notNull().references(() => contents.id),
  userId: text('user_id').notNull().references(() => users.id),
  type: text('type').default('like'), // 'like', 'love', 'dislike'
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

// リレーション定義
export const usersRelations = relations(users, ({ many }) => ({
  ownedLists: many(lists),
  listMemberships: many(listMembers),
  addedContents: many(contents),
  reactions: many(reactions),
}))

export const listsRelations = relations(lists, ({ one, many }) => ({
  owner: one(users, {
    fields: [lists.ownerId],
    references: [users.id],
  }),
  members: many(listMembers),
  contents: many(contents),
}))

export const listMembersRelations = relations(listMembers, ({ one }) => ({
  list: one(lists, {
    fields: [listMembers.listId],
    references: [lists.id],
  }),
  user: one(users, {
    fields: [listMembers.userId],
    references: [users.id],
  }),
}))

export const contentsRelations = relations(contents, ({ one, many }) => ({
  list: one(lists, {
    fields: [contents.listId],
    references: [lists.id],
  }),
  addedByUser: one(users, {
    fields: [contents.addedBy],
    references: [users.id],
  }),
  reactions: many(reactions),
}))

export const reactionsRelations = relations(reactions, ({ one }) => ({
  content: one(contents, {
    fields: [reactions.contentId],
    references: [contents.id],
  }),
  user: one(users, {
    fields: [reactions.userId],
    references: [users.id],
  }),
}))

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type List = typeof lists.$inferSelect
export type NewList = typeof lists.$inferInsert
export type Content = typeof contents.$inferSelect
export type NewContent = typeof contents.$inferInsert
export type Reaction = typeof reactions.$inferSelect
export type NewReaction = typeof reactions.$inferInsert 