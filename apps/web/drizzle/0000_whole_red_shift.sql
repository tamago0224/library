CREATE TYPE "public"."avatar_kind" AS ENUM('google', 'default');--> statement-breakpoint
CREATE TYPE "public"."correction_status" AS ENUM('pending', 'accepted', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."date_precision" AS ENUM('day', 'month', 'year', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."edition_format" AS ENUM('hardcover', 'paperback', 'ebook', 'other');--> statement-breakpoint
CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'redeemed', 'revoked', 'expired');--> statement-breakpoint
CREATE TYPE "public"."ownership_kind" AS ENUM('owned', 'borrowed');--> statement-breakpoint
CREATE TYPE "public"."reading_result" AS ENUM('reading', 'completed', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('open', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'pending_deletion', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."user_work_status" AS ENUM('want_to_read', 'unread', 'reading', 'completed', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."visibility" AS ENUM('public', 'private');--> statement-breakpoint
CREATE TYPE "public"."work_source" AS ENUM('external', 'manual');--> statement-breakpoint
CREATE TABLE "account" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"account_id" varchar(255) NOT NULL,
	"provider_id" varchar(64) NOT NULL,
	"issuer" varchar(255) NOT NULL,
	"userId" varchar(26) NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"id_token" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"actorId" varchar(26),
	"action" varchar(100) NOT NULL,
	"resource_type" varchar(40) NOT NULL,
	"resourceId" varchar(26),
	"metadata" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "author" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog_correction" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"requestedBy" varchar(26) NOT NULL,
	"workId" varchar(26),
	"editionId" varchar(26),
	"proposed_changes" text NOT NULL,
	"status" "correction_status" DEFAULT 'pending' NOT NULL,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "catalog_correction_target_check" CHECK (("catalog_correction"."workId" is not null) <> ("catalog_correction"."editionId" is not null))
);
--> statement-breakpoint
CREATE TABLE "edition" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"workId" varchar(26) NOT NULL,
	"isbn13" varchar(13),
	"isbn10" varchar(10),
	"format" "edition_format" NOT NULL,
	"publisher" varchar(255),
	"published_on" date,
	"published_on_precision" date_precision DEFAULT 'unknown' NOT NULL,
	"cover_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "edition_published_precision_check" CHECK (("edition"."published_on_precision" = 'unknown' and "edition"."published_on" is null) or ("edition"."published_on_precision" <> 'unknown' and "edition"."published_on" is not null))
);
--> statement-breakpoint
CREATE TABLE "handle_history" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"userId" varchar(26) NOT NULL,
	"handle" varchar(30) NOT NULL,
	"redirect_to" varchar(30) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"token_hash" varchar(128) NOT NULL,
	"issuedBy" varchar(26) NOT NULL,
	"redeemedBy" varchar(26),
	"status" "invitation_status" DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"redeemed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invitation_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "ownership" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"userWorkId" varchar(26) NOT NULL,
	"editionId" varchar(26) NOT NULL,
	"kind" "ownership_kind" NOT NULL,
	"acquired_on" date,
	"acquired_on_precision" date_precision DEFAULT 'unknown' NOT NULL,
	"disposed_on" date,
	"disposed_on_precision" date_precision DEFAULT 'unknown' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ownership_acquired_precision_check" CHECK (("ownership"."acquired_on_precision" = 'unknown' and "ownership"."acquired_on" is null) or ("ownership"."acquired_on_precision" <> 'unknown' and "ownership"."acquired_on" is not null)),
	CONSTRAINT "ownership_disposed_precision_check" CHECK (("ownership"."disposed_on_precision" = 'unknown' and "ownership"."disposed_on" is null) or ("ownership"."disposed_on_precision" <> 'unknown' and "ownership"."disposed_on" is not null))
);
--> statement-breakpoint
CREATE TABLE "profile" (
	"userId" varchar(26) PRIMARY KEY NOT NULL,
	"handle" varchar(30) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"bio" text,
	"avatar_kind" "avatar_kind" DEFAULT 'default' NOT NULL,
	"avatar_url" text,
	"visibility" "visibility" DEFAULT 'private' NOT NULL,
	"default_book_visibility" "visibility" DEFAULT 'private' NOT NULL,
	"allow_search_engine_indexing" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reading_session" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"userWorkId" varchar(26) NOT NULL,
	"editionId" varchar(26) NOT NULL,
	"sequence" integer NOT NULL,
	"result" "reading_result" NOT NULL,
	"started_on" date,
	"started_on_precision" date_precision DEFAULT 'unknown' NOT NULL,
	"ended_on" date,
	"ended_on_precision" date_precision DEFAULT 'unknown' NOT NULL,
	"rating" integer,
	"review" text,
	"contains_spoilers" boolean DEFAULT false NOT NULL,
	"review_edited_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reading_session_rating_check" CHECK ("reading_session"."rating" is null or ("reading_session"."rating" between 1 and 5)),
	CONSTRAINT "reading_session_started_precision_check" CHECK (("reading_session"."started_on_precision" = 'unknown' and "reading_session"."started_on" is null) or ("reading_session"."started_on_precision" <> 'unknown' and "reading_session"."started_on" is not null)),
	CONSTRAINT "reading_session_ended_precision_check" CHECK (("reading_session"."ended_on_precision" = 'unknown' and "reading_session"."ended_on" is null) or ("reading_session"."ended_on_precision" <> 'unknown' and "reading_session"."ended_on" is not null))
);
--> statement-breakpoint
CREATE TABLE "report" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"reporterId" varchar(26) NOT NULL,
	"resource_type" varchar(40) NOT NULL,
	"resourceId" varchar(26) NOT NULL,
	"reason" varchar(100) NOT NULL,
	"details" text,
	"status" "report_status" DEFAULT 'open' NOT NULL,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" varchar(255) NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"userId" varchar(26) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "tag" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"userId" varchar(26) NOT NULL,
	"name" varchar(50) NOT NULL,
	"normalized_name" varchar(50) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_work_tag" (
	"userWorkId" varchar(26) NOT NULL,
	"tagId" varchar(26) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_work" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"userId" varchar(26) NOT NULL,
	"workId" varchar(26) NOT NULL,
	"status" "user_work_status" DEFAULT 'want_to_read' NOT NULL,
	"visibility" "visibility" DEFAULT 'private' NOT NULL,
	"private_memo" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(320) NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"terms_accepted_at" timestamp with time zone,
	"deletion_scheduled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"identifier" varchar(255) NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_author" (
	"workId" varchar(26) NOT NULL,
	"authorId" varchar(26) NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"title" varchar(500) NOT NULL,
	"synopsis" text,
	"source" "work_source" NOT NULL,
	"createdBy" varchar(26),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actorId_user_id_fk" FOREIGN KEY ("actorId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_correction" ADD CONSTRAINT "catalog_correction_requestedBy_user_id_fk" FOREIGN KEY ("requestedBy") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_correction" ADD CONSTRAINT "catalog_correction_workId_work_id_fk" FOREIGN KEY ("workId") REFERENCES "public"."work"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_correction" ADD CONSTRAINT "catalog_correction_editionId_edition_id_fk" FOREIGN KEY ("editionId") REFERENCES "public"."edition"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edition" ADD CONSTRAINT "edition_workId_work_id_fk" FOREIGN KEY ("workId") REFERENCES "public"."work"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "handle_history" ADD CONSTRAINT "handle_history_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_issuedBy_user_id_fk" FOREIGN KEY ("issuedBy") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_redeemedBy_user_id_fk" FOREIGN KEY ("redeemedBy") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ownership" ADD CONSTRAINT "ownership_userWorkId_user_work_id_fk" FOREIGN KEY ("userWorkId") REFERENCES "public"."user_work"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ownership" ADD CONSTRAINT "ownership_editionId_edition_id_fk" FOREIGN KEY ("editionId") REFERENCES "public"."edition"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile" ADD CONSTRAINT "profile_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_session" ADD CONSTRAINT "reading_session_userWorkId_user_work_id_fk" FOREIGN KEY ("userWorkId") REFERENCES "public"."user_work"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_session" ADD CONSTRAINT "reading_session_editionId_edition_id_fk" FOREIGN KEY ("editionId") REFERENCES "public"."edition"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_reporterId_user_id_fk" FOREIGN KEY ("reporterId") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tag" ADD CONSTRAINT "tag_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_work_tag" ADD CONSTRAINT "user_work_tag_userWorkId_user_work_id_fk" FOREIGN KEY ("userWorkId") REFERENCES "public"."user_work"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_work_tag" ADD CONSTRAINT "user_work_tag_tagId_tag_id_fk" FOREIGN KEY ("tagId") REFERENCES "public"."tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_work" ADD CONSTRAINT "user_work_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_work" ADD CONSTRAINT "user_work_workId_work_id_fk" FOREIGN KEY ("workId") REFERENCES "public"."work"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_author" ADD CONSTRAINT "work_author_workId_work_id_fk" FOREIGN KEY ("workId") REFERENCES "public"."work"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_author" ADD CONSTRAINT "work_author_authorId_author_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."author"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work" ADD CONSTRAINT "work_createdBy_user_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "account_issuer_subject_idx" ON "account" USING btree ("issuer","account_id");--> statement-breakpoint
CREATE INDEX "account_user_idx" ON "account" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "audit_log_resource_idx" ON "audit_log" USING btree ("resource_type","resourceId");--> statement-breakpoint
CREATE INDEX "audit_log_actor_idx" ON "audit_log" USING btree ("actorId");--> statement-breakpoint
CREATE INDEX "catalog_correction_status_idx" ON "catalog_correction" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "edition_isbn13_idx" ON "edition" USING btree ("isbn13") WHERE "edition"."isbn13" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "edition_isbn10_idx" ON "edition" USING btree ("isbn10") WHERE "edition"."isbn10" is not null;--> statement-breakpoint
CREATE INDEX "edition_work_idx" ON "edition" USING btree ("workId");--> statement-breakpoint
CREATE UNIQUE INDEX "handle_history_handle_lower_idx" ON "handle_history" USING btree (lower("handle"));--> statement-breakpoint
CREATE INDEX "handle_history_user_idx" ON "handle_history" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "invitation_status_idx" ON "invitation" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ownership_user_work_idx" ON "ownership" USING btree ("userWorkId");--> statement-breakpoint
CREATE UNIQUE INDEX "profile_handle_lower_idx" ON "profile" USING btree (lower("handle"));--> statement-breakpoint
CREATE UNIQUE INDEX "reading_session_sequence_idx" ON "reading_session" USING btree ("userWorkId","sequence");--> statement-breakpoint
CREATE UNIQUE INDEX "reading_session_one_active_idx" ON "reading_session" USING btree ("userWorkId") WHERE "reading_session"."result" = 'reading';--> statement-breakpoint
CREATE INDEX "reading_session_user_work_idx" ON "reading_session" USING btree ("userWorkId");--> statement-breakpoint
CREATE INDEX "report_status_idx" ON "report" USING btree ("status");--> statement-breakpoint
CREATE INDEX "report_resource_idx" ON "report" USING btree ("resource_type","resourceId");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "session" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "tag_user_normalized_name_idx" ON "tag" USING btree ("userId","normalized_name");--> statement-breakpoint
CREATE UNIQUE INDEX "user_work_tag_pk" ON "user_work_tag" USING btree ("userWorkId","tagId");--> statement-breakpoint
CREATE UNIQUE INDEX "user_work_user_work_idx" ON "user_work" USING btree ("userId","workId");--> statement-breakpoint
CREATE INDEX "user_work_user_status_idx" ON "user_work" USING btree ("userId","status");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "work_author_pk" ON "work_author" USING btree ("workId","authorId");--> statement-breakpoint
CREATE INDEX "work_author_author_idx" ON "work_author" USING btree ("authorId");--> statement-breakpoint
CREATE INDEX "work_title_idx" ON "work" USING btree ("title");