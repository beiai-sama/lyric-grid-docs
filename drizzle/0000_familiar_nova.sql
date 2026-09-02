CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`draft` text NOT NULL,
	`published` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL,
	`published_at` text,
	`updated_by` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `images` (
	`id` text PRIMARY KEY NOT NULL,
	`object_key` text NOT NULL,
	`name` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`owner_id` text NOT NULL,
	`published` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
