# OpenImpact content hash scheme

Canonical UTF-8 → SHA-256 hex → store as `sha256:<hex>` on-chain.

Helpers: `frontend/src/lib/openimpact/content-hash.ts`.

## Proof of use

```
v1|donation|{donationId}|{photoUrl}|{description}|{testimonial}
```

Whitespace in each field is collapsed to a single space and trimmed before joining.

## Publication

```
v1|publication|{donationId}|{url}|{type}|{caption}
```

## Rules

- Never put names, testimonials, or raw media on-chain — only this hash string.
- Hash **before** calling `submitRecipientProof` / `submitPublication`.
- Supabase keeps the full content; the hash must be reproducible from those fields.
