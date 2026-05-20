# API Reference

> Status: scaffold. Endpoints are stubbed in `apps/api/src/routes/`.

The endpoint catalog and response-envelope standard are defined in
[../ARCHITECTURE.md §6](../ARCHITECTURE.md). This file will hold the detailed
per-endpoint request/response schemas as routes are implemented (Phase 2+).

## Response envelope

```jsonc
// Success
{ "data": { /* ... */ }, "meta": { "page": 1, "perPage": 20, "total": 0 } }

// Error
{ "error": { "code": "QUOTA_EXCEEDED", "message": "...", "details": { } } }
```

## Implemented (Phase 1)

| Method | Path          | Notes                  |
|--------|---------------|------------------------|
| GET    | `/health`     | Service health check   |
| GET    | `/api/auth/me`| Stub — returns userId  |
| GET    | `/api/lives`  | Stub — empty list      |
| GET    | `/api/clips`  | Stub — empty list      |
