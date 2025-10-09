Supabase export helper

Objetivo

Proveer pasos y un script para exportar la base de datos y (opcionalmente) storage desde un proyecto Supabase para usar localmente con esta app.

Archivos creados

- `.env.local.template` — plantilla con las variables que la app espera.
- `scripts/export_supabase.ps1` — script PowerShell para exportar DB (usa `supabase` CLI si está disponible o `pg_dump` si proporcionas `DATABASE_URL`).

Preparar variables de entorno

1. Desde tu proyecto Supabase en app.supabase.com -> Settings -> API obtén:
   - URL pública del proyecto (ejemplo: https://abcd1234.supabase.co)
   - Anon public key (ANON KEY)
   - Service role key (SERVICE ROLE) — solo si quieres permitir exportaciones/operaciones de administración.

2. Crea un archivo `.env.local` en la raíz del proyecto (puedes copiar `.env.local.template`) y rellena:

NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<public-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
DATABASE_URL=postgresql://user:password@db.host:5432/postgres

Exportar la base de datos

- Usando Supabase CLI (recomendado si la tienes instalada):
  1. Instala supabase CLI: https://supabase.com/docs/guides/cli
  2. Ejecuta: `.	ools\export_supabase.ps1` o desde la raíz: `.\
amespace\scripts\export_supabase.ps1` (o `pwsh ./scripts/export_supabase.ps1`)
  3. Por defecto crea `./supabase-export` con el dump.

- Si no usas la CLI y tienes `pg_dump` (del cliente PostgreSQL): rellena `DATABASE_URL` en `.env.local` y ejecuta el script; hará `pg_dump` a `./supabase-export`.

Exportar storage

- Si quieres exportar buckets, ejecuta el script con el parámetro `-ExportStorage`. Necesitas la supabase CLI y la `SUPABASE_SERVICE_ROLE_KEY`.

Advertencias

- Guarda la `SUPABASE_SERVICE_ROLE_KEY` con cuidado: es sensible y permite operaciones privilegiadas.
- Los dumps pueden ser grandes; asegúrate de tener espacio en disco.

Soporte

Si quieres, puedo:
- Crear `.env.local` automáticamente si me das las variables.
- Ejecutar la exportación aquí si me proporcionas las credenciales (o puedes ejecutarla en tu máquina).
