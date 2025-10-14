# Automated Appointment Reminders

This system automatically sends reminders to customers before their appointments.

## How It Works

The reminder system sends two types of notifications:

1. **24-Hour Email Reminders** - Sent via Resend 24 hours before the appointment
2. **1-Hour SMS Reminders** - Sent via Twilio 1 hour before the appointment

## Setup

### 1. Environment Variables

Make sure you have the following environment variables configured:

```bash
# Email (Resend)
RESEND_API_KEY=your_resend_api_key

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Cron Security (optional but recommended)
CRON_SECRET=your_random_secret_key
```

### 2. Choose a Cron Provider

You have several options for triggering the reminder endpoint:

#### Option A: Vercel Cron (Recommended for Vercel deployments)

Create or update `vercel.json` in your project root:

```json
{
  "crons": [
    {
      "path": "/api/cron/send-reminders?type=email",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/send-reminders?type=sms",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

Add the cron secret to your Vercel environment variables:
- `CRON_SECRET` = (generate a random secret)

#### Option B: External Cron Service (cron-job.org, EasyCron, etc.)

1. Sign up for a cron service like [cron-job.org](https://cron-job.org)
2. Create two cron jobs:

**24-Hour Email Reminder:**
- URL: `https://your-domain.com/api/cron/send-reminders?type=email`
- Schedule: Every hour (`0 * * * *`)
- Method: GET or POST
- Headers: `Authorization: Bearer YOUR_CRON_SECRET`

**1-Hour SMS Reminder:**
- URL: `https://your-domain.com/api/cron/send-reminders?type=sms`
- Schedule: Every 15 minutes (`*/15 * * * *`)
- Method: GET or POST
- Headers: `Authorization: Bearer YOUR_CRON_SECRET`

#### Option C: GitHub Actions

Create `.github/workflows/reminders.yml`:

```yaml
name: Send Appointment Reminders

on:
  schedule:
    # Email reminders every hour
    - cron: '0 * * * *'
    # SMS reminders every 15 minutes
    - cron: '*/15 * * * *'
  workflow_dispatch:

jobs:
  send-email-reminders:
    runs-on: ubuntu-latest
    if: github.event.schedule == '0 * * * *'
    steps:
      - name: Send email reminders
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://your-domain.com/api/cron/send-reminders?type=email

  send-sms-reminders:
    runs-on: ubuntu-latest
    if: github.event.schedule == '*/15 * * * *'
    steps:
      - name: Send SMS reminders
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://your-domain.com/api/cron/send-reminders?type=sms
```

### 3. Security

The cron endpoint is protected by a secret token. To make requests:

1. Set `CRON_SECRET` in your environment variables
2. Include the secret in the Authorization header:
   ```
   Authorization: Bearer YOUR_CRON_SECRET
   ```

In development mode (when `NODE_ENV=development` and `CRON_SECRET` is not set), the endpoint allows unauthenticated requests for testing.

## Testing

### Local Testing

Start your development server:

```bash
npm run dev
```

Test email reminders (24h window):

```bash
curl http://localhost:3000/api/cron/send-reminders?type=email
```

Test SMS reminders (1h window):

```bash
curl http://localhost:3000/api/cron/send-reminders?type=sms
```

### Production Testing

With authentication:

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-domain.com/api/cron/send-reminders?type=email
```

## Response Format

The endpoint returns a JSON response:

```json
{
  "success": true,
  "type": "email",
  "hoursBeforeAppointment": 24,
  "processed": 5,
  "sent": 4,
  "failed": 1,
  "errors": [
    {
      "appointmentId": "uuid",
      "error": "Missing customer email"
    }
  ]
}
```

## Monitoring

Check your application logs for reminder activity:

- `[sendAppointmentReminders]` - Main reminder processing logs
- `[send-reminders]` - Cron endpoint logs

The system tracks which reminders have been sent in the `appointments.metadata` JSONB column to prevent duplicates.

## Troubleshooting

### No reminders being sent

1. Check that appointments exist with status `pending` or `confirmed`
2. Verify appointment times are in the correct window (24h for email, 1h for SMS)
3. Check that `RESEND_API_KEY` and Twilio credentials are set correctly
4. Look for errors in application logs

### Duplicate reminders

The system tracks sent reminders in `appointments.metadata`:
- `email_reminder_sent`: true/false
- `sms_reminder_sent`: true/false

If duplicates occur, check that the cron jobs aren't running too frequently.

### Authentication errors

Ensure `CRON_SECRET` is set identically in:
1. Your environment variables
2. Your cron service configuration

## Cost Considerations

- **Resend**: Free tier includes 100 emails/day, then $0.0001 per email
- **Twilio**: ~$0.0075 per SMS (varies by country)

For 100 appointments/day:
- 100 email reminders/day ≈ Free (within free tier)
- 100 SMS reminders/day ≈ $0.75/day ≈ $22.50/month

## Database Migration

The reminder system requires a `metadata` JSONB column on the appointments table. This has been added via migration `004_add_appointment_metadata.sql`.

To verify the column exists:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'appointments' AND column_name = 'metadata';
```
