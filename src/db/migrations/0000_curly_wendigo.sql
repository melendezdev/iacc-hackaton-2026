CREATE TABLE `intervenciones` (
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
	FOREIGN KEY (`terapeuta_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `pacientes` (
	`id` text PRIMARY KEY NOT NULL,
	`nombre` text NOT NULL,
	`rut` text,
	`fecha_nacimiento` text,
	`estado` text DEFAULT 'activo' NOT NULL,
	`fecha_creacion` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pacientes_rut_unique` ON `pacientes` (`rut`);--> statement-breakpoint
CREATE TABLE `usuarios` (
	`id` text PRIMARY KEY NOT NULL,
	`nombre` text NOT NULL,
	`email` text NOT NULL,
	`rol` text DEFAULT 'terapeuta' NOT NULL,
	`fecha_creacion` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `usuarios_email_unique` ON `usuarios` (`email`);