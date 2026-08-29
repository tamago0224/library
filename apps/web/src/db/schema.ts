import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core'

const id = () => varchar({ length: 26 })
const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}

export const userStatus = pgEnum('user_status', ['active', 'pending_deletion', 'suspended'])
export const visibility = pgEnum('visibility', ['public', 'private'])
export const avatarKind = pgEnum('avatar_kind', ['google', 'default'])
export const workSource = pgEnum('work_source', ['external', 'manual'])
export const editionFormat = pgEnum('edition_format', ['hardcover', 'paperback', 'ebook', 'other'])
export const userWorkStatus = pgEnum('user_work_status', ['want_to_read', 'unread', 'reading', 'completed', 'abandoned'])
export const ownershipKind = pgEnum('ownership_kind', ['owned', 'borrowed'])
export const datePrecision = pgEnum('date_precision', ['day', 'month', 'year', 'unknown'])
export const readingResult = pgEnum('reading_result', ['reading', 'completed', 'abandoned'])
export const invitationStatus = pgEnum('invitation_status', ['pending', 'redeemed', 'revoked', 'expired'])
export const correctionStatus = pgEnum('correction_status', ['pending', 'accepted', 'rejected'])
export const reportStatus = pgEnum('report_status', ['open', 'resolved', 'dismissed'])

// Better Auth core tables. Keep these names/fields aligned with its Drizzle adapter.
export const users = pgTable('user', {
  id: id().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 320 }).notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text(),
  status: userStatus().default('active').notNull(),
  termsAcceptedAt: timestamp('terms_accepted_at', { withTimezone: true }),
  deletionScheduledAt: timestamp('deletion_scheduled_at', { withTimezone: true }),
  ...timestamps,
})

export const sessions = pgTable('session', {
  id: id().primaryKey(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  token: varchar({ length: 255 }).notNull().unique(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  userId: id().notNull().references(() => users.id, { onDelete: 'cascade' }),
  ...timestamps,
}, (table) => [index('session_user_idx').on(table.userId)])

export const accounts = pgTable('account', {
  id: id().primaryKey(),
  accountId: varchar('account_id', { length: 255 }).notNull(),
  providerId: varchar('provider_id', { length: 64 }).notNull(),
  issuer: varchar({ length: 255 }).notNull(),
  userId: id().notNull().references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
  scope: text(),
  idToken: text('id_token'),
  password: text(),
  ...timestamps,
}, (table) => [
  uniqueIndex('account_issuer_subject_idx').on(table.issuer, table.accountId),
  index('account_user_idx').on(table.userId),
])

export const verifications = pgTable('verification', {
  id: id().primaryKey(),
  identifier: varchar({ length: 255 }).notNull(),
  value: text().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  ...timestamps,
}, (table) => [index('verification_identifier_idx').on(table.identifier)])

export const profiles = pgTable('profile', {
  userId: id().primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  handle: varchar({ length: 30 }).notNull(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  bio: text(),
  avatarKind: avatarKind('avatar_kind').default('default').notNull(),
  avatarUrl: text('avatar_url'),
  visibility: visibility().default('private').notNull(),
  defaultBookVisibility: visibility('default_book_visibility').default('private').notNull(),
  allowSearchEngineIndexing: boolean('allow_search_engine_indexing').default(false).notNull(),
  ...timestamps,
}, (table) => [uniqueIndex('profile_handle_lower_idx').on(sql`lower(${table.handle})`),])

// Historical handles reserve names too. Cross-table current/history reservation
// and reassignment must be serialized in an application transaction.
export const handleHistories = pgTable('handle_history', {
  id: id().primaryKey(),
  userId: id().notNull().references(() => users.id, { onDelete: 'cascade' }),
  handle: varchar({ length: 30 }).notNull(),
  redirectTo: varchar('redirect_to', { length: 30 }).notNull(),
  ...timestamps,
}, (table) => [
  uniqueIndex('handle_history_handle_lower_idx').on(sql`lower(${table.handle})`),
  index('handle_history_user_idx').on(table.userId),
])

export const works = pgTable('work', {
  id: id().primaryKey(),
  title: varchar({ length: 500 }).notNull(),
  synopsis: text(),
  source: workSource().notNull(),
  createdBy: id().references(() => users.id, { onDelete: 'set null' }),
  ...timestamps,
}, (table) => [index('work_title_idx').on(table.title)])

export const authors = pgTable('author', {
  id: id().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  ...timestamps,
}, (table) => [index('author_name_idx').on(table.name)])

export const workAuthors = pgTable('work_author', {
  workId: id().notNull().references(() => works.id, { onDelete: 'cascade' }),
  authorId: id().notNull().references(() => authors.id, { onDelete: 'cascade' }),
  position: integer().default(0).notNull(),
}, (table) => [
  uniqueIndex('work_author_pk').on(table.workId, table.authorId),
  index('work_author_author_idx').on(table.authorId),
])

export const editions = pgTable('edition', {
  id: id().primaryKey(),
  workId: id().notNull().references(() => works.id, { onDelete: 'cascade' }),
  isbn13: varchar({ length: 13 }),
  isbn10: varchar({ length: 10 }),
  format: editionFormat().notNull(),
  publisher: varchar({ length: 255 }),
  publishedOn: date('published_on'),
  publishedOnPrecision: datePrecision('published_on_precision').default('unknown').notNull(),
  coverUrl: text('cover_url'),
  ...timestamps,
}, (table) => [
  uniqueIndex('edition_isbn13_idx').on(table.isbn13).where(sql`${table.isbn13} is not null`),
  uniqueIndex('edition_isbn10_idx').on(table.isbn10).where(sql`${table.isbn10} is not null`),
  check('edition_published_precision_check', sql`(${table.publishedOnPrecision} = 'unknown' and ${table.publishedOn} is null) or (${table.publishedOnPrecision} <> 'unknown' and ${table.publishedOn} is not null)`),
  index('edition_work_idx').on(table.workId),
])

export const userWorks = pgTable('user_work', {
  id: id().primaryKey(),
  userId: id().notNull().references(() => users.id, { onDelete: 'cascade' }),
  workId: id().notNull().references(() => works.id, { onDelete: 'cascade' }),
  status: userWorkStatus().default('want_to_read').notNull(),
  visibility: visibility().default('private').notNull(),
  privateMemo: text('private_memo'),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  ...timestamps,
}, (table) => [
  uniqueIndex('user_work_user_work_idx').on(table.userId, table.workId),
  index('user_work_user_status_idx').on(table.userId, table.status),
])

export const ownerships = pgTable('ownership', {
  id: id().primaryKey(),
  userWorkId: id().notNull().references(() => userWorks.id, { onDelete: 'cascade' }),
  editionId: id().notNull().references(() => editions.id, { onDelete: 'restrict' }),
  kind: ownershipKind().notNull(),
  acquiredOn: date('acquired_on'),
  acquiredOnPrecision: datePrecision('acquired_on_precision').default('unknown').notNull(),
  disposedOn: date('disposed_on'),
  disposedOnPrecision: datePrecision('disposed_on_precision').default('unknown').notNull(),
  ...timestamps,
}, (table) => [
  check('ownership_acquired_precision_check', sql`(${table.acquiredOnPrecision} = 'unknown' and ${table.acquiredOn} is null) or (${table.acquiredOnPrecision} <> 'unknown' and ${table.acquiredOn} is not null)`),
  check('ownership_disposed_precision_check', sql`(${table.disposedOnPrecision} = 'unknown' and ${table.disposedOn} is null) or (${table.disposedOnPrecision} <> 'unknown' and ${table.disposedOn} is not null)`),
  index('ownership_user_work_idx').on(table.userWorkId),
])

export const readingSessions = pgTable('reading_session', {
  id: id().primaryKey(),
  userWorkId: id().notNull().references(() => userWorks.id, { onDelete: 'cascade' }),
  editionId: id().notNull().references(() => editions.id, { onDelete: 'restrict' }),
  sequence: integer().notNull(),
  result: readingResult().notNull(),
  startedOn: date('started_on'),
  startedOnPrecision: datePrecision('started_on_precision').default('unknown').notNull(),
  endedOn: date('ended_on'),
  endedOnPrecision: datePrecision('ended_on_precision').default('unknown').notNull(),
  rating: integer(),
  review: text(),
  containsSpoilers: boolean('contains_spoilers').default(false).notNull(),
  reviewEditedAt: timestamp('review_edited_at', { withTimezone: true }),
  ...timestamps,
}, (table) => [
  uniqueIndex('reading_session_sequence_idx').on(table.userWorkId, table.sequence),
  uniqueIndex('reading_session_one_active_idx').on(table.userWorkId).where(sql`${table.result} = 'reading'`),
  check('reading_session_rating_check', sql`${table.rating} is null or (${table.rating} between 1 and 5)`),
  check('reading_session_started_precision_check', sql`(${table.startedOnPrecision} = 'unknown' and ${table.startedOn} is null) or (${table.startedOnPrecision} <> 'unknown' and ${table.startedOn} is not null)`),
  check('reading_session_ended_precision_check', sql`(${table.endedOnPrecision} = 'unknown' and ${table.endedOn} is null) or (${table.endedOnPrecision} <> 'unknown' and ${table.endedOn} is not null)`),
  index('reading_session_user_work_idx').on(table.userWorkId),
])

export const tags = pgTable('tag', {
  id: id().primaryKey(),
  userId: id().notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar({ length: 50 }).notNull(),
  normalizedName: varchar('normalized_name', { length: 50 }).notNull(),
  ...timestamps,
}, (table) => [uniqueIndex('tag_user_normalized_name_idx').on(table.userId, table.normalizedName)])

export const userWorkTags = pgTable('user_work_tag', {
  userWorkId: id().notNull().references(() => userWorks.id, { onDelete: 'cascade' }),
  tagId: id().notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => [uniqueIndex('user_work_tag_pk').on(table.userWorkId, table.tagId)])

export const invitations = pgTable('invitation', {
  id: id().primaryKey(),
  tokenHash: varchar('token_hash', { length: 128 }).notNull().unique(),
  issuedBy: id().notNull().references(() => users.id, { onDelete: 'restrict' }),
  redeemedBy: id().references(() => users.id, { onDelete: 'set null' }),
  status: invitationStatus().default('pending').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  redeemedAt: timestamp('redeemed_at', { withTimezone: true }),
  ...timestamps,
}, (table) => [index('invitation_status_idx').on(table.status)])

export const catalogCorrections = pgTable('catalog_correction', {
  id: id().primaryKey(),
  requestedBy: id().notNull().references(() => users.id, { onDelete: 'restrict' }),
  workId: id().references(() => works.id, { onDelete: 'cascade' }),
  editionId: id().references(() => editions.id, { onDelete: 'cascade' }),
  proposedChanges: text('proposed_changes').notNull(),
  status: correctionStatus().default('pending').notNull(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  ...timestamps,
}, (table) => [
  check('catalog_correction_target_check', sql`(${table.workId} is not null) <> (${table.editionId} is not null)`),
  index('catalog_correction_status_idx').on(table.status),
])

export const reports = pgTable('report', {
  id: id().primaryKey(),
  reporterId: id().notNull().references(() => users.id, { onDelete: 'restrict' }),
  resourceType: varchar('resource_type', { length: 40 }).notNull(),
  resourceId: id().notNull(),
  reason: varchar({ length: 100 }).notNull(),
  details: text(),
  status: reportStatus().default('open').notNull(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  ...timestamps,
}, (table) => [index('report_status_idx').on(table.status), index('report_resource_idx').on(table.resourceType, table.resourceId)])

export const auditLogs = pgTable('audit_log', {
  id: id().primaryKey(),
  actorId: id().references(() => users.id, { onDelete: 'set null' }),
  action: varchar({ length: 100 }).notNull(),
  resourceType: varchar('resource_type', { length: 40 }).notNull(),
  resourceId: id(),
  metadata: text(),
  ...timestamps,
}, (table) => [index('audit_log_resource_idx').on(table.resourceType, table.resourceId), index('audit_log_actor_idx').on(table.actorId)])

export const schema = {
  user: users,
  session: sessions,
  account: accounts,
  verification: verifications,
  profile: profiles,
  handleHistory: handleHistories,
  work: works,
  author: authors,
  workAuthor: workAuthors,
  edition: editions,
  userWork: userWorks,
  ownership: ownerships,
  readingSession: readingSessions,
  tag: tags,
  userWorkTag: userWorkTags,
  invitation: invitations,
  catalogCorrection: catalogCorrections,
  report: reports,
  auditLog: auditLogs,
}
