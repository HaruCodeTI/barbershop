-- Add metadata column to appointments table for tracking reminders and other flexible data
-- This is a JSONB column for storing arbitrary data like:
-- {
--   "email_reminder_sent": true,
--   "email_reminder_sent_at": "2024-01-15T10:00:00Z",
--   "sms_reminder_sent": true,
--   "sms_reminder_sent_at": "2024-01-15T23:00:00Z"
-- }

ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create index on metadata for faster queries
CREATE INDEX IF NOT EXISTS idx_appointments_metadata ON appointments USING gin(metadata);

-- Add comment for documentation
COMMENT ON COLUMN appointments.metadata IS 'Flexible JSONB storage for tracking reminders, notifications, and other appointment metadata';
