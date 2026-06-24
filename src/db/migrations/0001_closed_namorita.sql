CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`expires_at` integer,
	`password` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer NOT NULL,
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`role` text DEFAULT 'terapeuta' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
DROP TABLE `usuarios`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_intervenciones` (
	`id` text PRIMARY KEY NOT NULL,
	`terapeuta_id` text NOT NULL,
	`paciente_id` text NOT NULL,
	`fecha_intervencion` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`objetivo` text NOT NULL,
	`desarrollo` text NOT NULL,
	`acuerdos` text NOT NULL,
	`acciones_seguir` text NOT NULL,
	`observaciones` text NOT NULL,
	`validado_por_terapeuta` integer DEFAULT false NOT NULL,
	`audio_url` text,
	`estado_sincronizacion` text DEFAULT 'pendiente' NOT NULL,
	`fecha_creacion` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`terapeuta_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_intervenciones`("id", "terapeuta_id", "paciente_id", "fecha_intervencion", "objetivo", "desarrollo", "acuerdos", "acciones_seguir", "observaciones", "validado_por_terapeuta", "audio_url", "estado_sincronizacion", "fecha_creacion") SELECT "id", "terapeuta_id", "paciente_id", "fecha_intervencion", "objetivo", "desarrollo", "acuerdos", "acciones_seguir", "observaciones", "validado_por_terapeuta", "audio_url", "estado_sincronizacion", "fecha_creacion" FROM `intervenciones`;--> statement-breakpoint
DROP TABLE `intervenciones`;--> statement-breakpoint
ALTER TABLE `__new_intervenciones` RENAME TO `intervenciones`;--> statement-breakpoint
PRAGMA foreign_keys=ON;