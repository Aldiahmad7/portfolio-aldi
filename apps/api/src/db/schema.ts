import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const comments = sqliteTable(
  'comments',
  {
    id: text('id').primaryKey(),
    section: text('section').notNull(),
    x: real('x').notNull(),
    y: real('y').notNull(),
    name: text('name').notNull(),
    message: text('message').notNull(),
    /** Manual moderation: `UPDATE comments SET hidden = 1 WHERE id = '…'`. */
    hidden: integer('hidden', { mode: 'boolean' }).notNull().default(false),
    /** Unix time in milliseconds, kept as a number so it maps straight to the API shape. */
    createdAt: integer('created_at').notNull(),
  },
  (table) => [index('comments_section_created').on(table.section, table.createdAt)],
)

export const counters = sqliteTable('counters', {
  key: text('key').primaryKey(),
  value: integer('value').notNull().default(0),
})
