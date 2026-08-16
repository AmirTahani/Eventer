-- Partial unique index: one active (non-terminal) registration per user per event.
-- See 04-database.md / D6 and the comment on EventRegistration in schema.prisma.
CREATE UNIQUE INDEX uq_active_registration_per_user_event
ON "event_registrations" (event_id, primary_user_id)
WHERE status IN (
  'PENDING_APPROVAL',
  'PENDING_PAYMENT',
  'APPROVED',
  'CONFIRMED',
  'WAITLISTED'
);
