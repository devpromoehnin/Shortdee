# Deployment

> Status: scaffold. Filled in during the deployment phase.

## Targets

| Component | Platform |
|-----------|----------|
| `apps/web` | Vercel |
| `apps/api` | Coolify (VPS) |
| `apps/ai` | Coolify + GPU |
| `workers/*` | Coolify / RunPod (GPU) |
| Database | Supabase (managed) |
| Storage | Cloudflare R2 |
| Queue | Upstash Redis |

## Database migrations

```bash
pnpm db:migrate:deploy   # apply migrations (CI / prod)
```

Migrations are applied manually — safety first. See CLAUDE.md §Deployment.
