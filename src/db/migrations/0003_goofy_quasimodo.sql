ALTER TABLE `user` ADD `can_record` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `can_view_dashboard` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `is_banned` integer DEFAULT false NOT NULL;