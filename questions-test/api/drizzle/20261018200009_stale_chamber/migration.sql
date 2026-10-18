-- Data lama berformat skema sebelumnya (title/body); hapus agar kolom NOT NULL baru terpenuhi oleh seed.
DELETE FROM "questions";
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL UNIQUE,
	"description" text,
	"tone" text DEFAULT 'indigo' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "code" text NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "category_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "text" text NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "difficulty" text DEFAULT 'Sedang' NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "status" text DEFAULT 'Draf' NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "options" jsonb DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "answer" text NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "explanation" text;--> statement-breakpoint
ALTER TABLE "questions" DROP COLUMN "title";--> statement-breakpoint
ALTER TABLE "questions" DROP COLUMN "body";--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_code_key" UNIQUE("code");--> statement-breakpoint
CREATE INDEX "questions_category_id_idx" ON "questions" ("category_id");--> statement-breakpoint
CREATE INDEX "questions_status_idx" ON "questions" ("status");--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_category_id_categories_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT;