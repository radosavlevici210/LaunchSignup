CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_login" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "waitlist_signups" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"verification_token" text,
	"verification_expiry" timestamp,
	"referral_source" text,
	"interests" text[],
	"ip_address" varchar(45),
	"user_agent" text,
	"notes" text,
	"priority" integer DEFAULT 0 NOT NULL,
	"invited_at" timestamp,
	"declined_at" timestamp,
	CONSTRAINT "waitlist_signups_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE INDEX "waitlist_email_idx" ON "waitlist_signups" USING btree ("email");--> statement-breakpoint
CREATE INDEX "waitlist_status_idx" ON "waitlist_signups" USING btree ("status");--> statement-breakpoint
CREATE INDEX "waitlist_timestamp_idx" ON "waitlist_signups" USING btree ("timestamp");