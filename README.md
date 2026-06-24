# Talita Kum - Registro Inteligente de Intervenciones Terapéuticas (MVP Hackathon)

Este es el Producto Mínimo Viable (MVP) desarrollado para la Hackathon. Se trata de una PWA con enfoque **Offline-First** que permite a los terapeutas registrar intervenciones mediante grabaciones de voz estructuradas automáticamente por IA, ofreciendo contingencia local en IndexedDB y sincronización transparente con Turso DB.

---

## 🔑 Credenciales para Pruebas (Demo)

La base de datos contiene los siguientes usuarios semilla creados mediante el script de Seeding para facilitar la demostración de los roles y el dashboard de analíticas:

> [!IMPORTANT]
> **Contraseña Común de Demostración:** `PasswordDemo123!`

### 🎙️ Cuentas de Rol: Terapeuta
*Habilitados para grabar dictados por micrófono nativo, revisar la estructuración por IA y certificar las validaciones clínicas (Regla de Oro).*

1.  **Psi. Alejandro Meléndez**
    *   **Email:** `alejandro.melendez@talitakum.cl`
    *   **Contraseña:** `PasswordDemo123!`
2.  **Trabajadora Social Constanza Ruiz**
    *   **Email:** `constanza.ruiz@talitakum.cl`
    *   **Contraseña:** `PasswordDemo123!`

### 📊 Cuentas de Rol: Administrador (Directiva)
*Habilitados para acceder al Dashboard de KPIs, visualizar la distribución de sesiones, cumplimiento de validación clínica e historial de alertas críticas.*

1.  **Dr. Daniel Silva (Psiquiatra)**
    *   **Email:** `daniel.silva@talitakum.cl`
    *   **Contraseña:** `PasswordDemo123!`

---

## 🛠️ Comandos de Desarrollo y Operaciones

Este proyecto utiliza **pnpm** para la gestión de dependencias y scripts de base de datos relacional (Drizzle ORM + Turso):

### 1. Iniciar Servidor de Desarrollo Local
```bash
pnpm dev
```
Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver e interactuar con la aplicación móvil (utiliza el modo responsive de inspección móvil).

### 2. Base de Datos: Generar y Aplicar Cambios de Esquema
```bash
# Generar archivos de migración SQL en base a cambios en schema.ts
pnpm db:generate

# Aplicar las migraciones a la base de datos (local o remota)
pnpm db:migrate

# Sincronizar el esquema rápidamente sin generar migraciones en desarrollo
pnpm db:push

# Abrir el explorador visual de base de datos de Drizzle
pnpm db:studio
```

### 3. Sembrar Datos Iniciales (Seeding)
```bash
pnpm db:seed
```
*Este comando limpiará las tablas existentes y volverá a insertar los usuarios de prueba, pacientes clínicos e historial de auditoría de alertas.*
