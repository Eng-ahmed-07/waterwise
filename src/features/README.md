# features/

One folder per feature (Phase 0 architecture). Each feature will own its `api/` (Supabase calls),
`hooks/` (TanStack Query wrappers), `components/` and `schemas/` (Yup). Components never call
Supabase directly.

Present so far: `home` (placeholder page), `dev-ui` (dev-only component showcase) and `calculator` (Phase 2 domain, hooks and reset dialog; its pages arrive in Phase 3).
The others (`auth`, `household`, `dashboard`, `history`, `recommendations`,
`reports`, `settings`) are empty placeholders for later phases.

## Reserved: `meter/`
`features/meter/` is a RESERVED name for future manual water-meter readings. It is intentionally
NOT created in the MVP. See the Phase 0 plan: readings are a separate cumulative-counter table and
the only source of the `actual` basis.
