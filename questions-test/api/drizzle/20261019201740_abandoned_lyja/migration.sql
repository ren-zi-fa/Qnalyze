CREATE TABLE "attempts" (
	"id" serial PRIMARY KEY,
	"user_id" integer,
	"category_id" integer NOT NULL,
	"title" text NOT NULL,
	"package_label" text,
	"duration_limit_minutes" integer DEFAULT 20 NOT NULL,
	"status" text DEFAULT 'Berlangsung' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp,
	"score" integer,
	"correct" integer,
	"total" integer DEFAULT 0 NOT NULL,
	"duration_minutes" real,
	"question_ids" jsonb DEFAULT '[]' NOT NULL,
	"answers" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_category_id_categories_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT;