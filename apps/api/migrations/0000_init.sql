CREATE TABLE `comments` (
	`id` text PRIMARY KEY NOT NULL,
	`section` text NOT NULL,
	`x` real NOT NULL,
	`y` real NOT NULL,
	`name` text NOT NULL,
	`message` text NOT NULL,
	`hidden` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `comments_section_created` ON `comments` (`section`,`created_at`);--> statement-breakpoint
CREATE TABLE `counters` (
	`key` text PRIMARY KEY NOT NULL,
	`value` integer DEFAULT 0 NOT NULL
);
