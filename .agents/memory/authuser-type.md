---
name: AuthUser type fields
description: Fields available on the AuthUser type returned by /api/auth/user
---

AuthUser (from @workspace/api-client-react / api-zod) has:
- id: string
- email: string | null
- firstName: string | null
- lastName: string | null
- profileImageUrl: string | null

No `isAdmin` field. Admin gating is done at route level (req.isAuthenticated()) or by comparing email against an allow-list.

**Why:** The OpenAPI spec defines AuthUser shape; to add isAdmin the spec + schema + DB must be updated and codegen re-run.

**How to apply:** Never reference user.isAdmin in frontend code without first adding it to the OpenAPI spec and running codegen.
