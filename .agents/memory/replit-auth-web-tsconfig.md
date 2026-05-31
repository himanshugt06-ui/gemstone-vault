---
name: replit-auth-web tsconfig
description: Required tsconfig settings for lib/replit-auth-web to work as a composite project reference from blaze-in
---

When `blaze-in/tsconfig.json` references `lib/replit-auth-web`, the lib's tsconfig must have:
- `"composite": true`
- `"declaration": true`
- `"declarationMap": true`
- `"emitDeclarationOnly": true`

And `lib/replit-auth-web` must appear in the root `tsconfig.json` references array.

**Why:** TypeScript project references require composite mode in referenced projects. Without it you get TS6306: "Referenced project must have setting composite: true."

**How to apply:** Whenever adding a new React lib that gets imported by a Vite artifact, add these four fields to the lib's tsconfig.json and add it to root tsconfig.json references.
