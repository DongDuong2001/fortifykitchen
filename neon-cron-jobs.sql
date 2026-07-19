-- Neon pg_cron jobs for database maintenance
-- IMPORTANT: Run this in Neon SQL Editor connected to 'postgres' database, NOT 'neondb'
-- See: https://neon.tech/docs/extensions/pg_cron

-- ============================================
-- STEP 1: Enable pg_cron on 'postgres' database (run once)
-- ============================================
-- In Neon SQL Editor:
-- 1. Switch to 'postgres' database (top-left dropdown)
-- 2. Run:
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================
-- STEP 2: Configure pg_cron to work on 'neondb'
-- ============================================
-- Still in 'postgres' database, run:
-- This allows pg_cron to schedule jobs on 'neondb'
ALTER DATABASE neondb SET cron.database_name = 'neondb';

-- ============================================
-- STEP 3: Switch to 'neondb' and schedule jobs
-- ============================================
-- Now switch to 'neondb' database (top-left dropdown)
-- Run the following:

-- ============================================
-- DAILY MAINTENANCE JOBS (Run daily at 2-4 AM UTC)
-- ============================================

-- Clean up old expired sessions (keep last 30 days)
SELECT cron.schedule(
    'cleanup-expired-sessions',
    '0 2 * * *',  -- Daily at 2 AM UTC
    $$
    DELETE FROM "Session"
    WHERE "expiresAt" < NOW() - INTERVAL '30 days'
    AND "expiresAt" IS NOT NULL;
    $$
);

-- Clean up old completed/cancelled orders (keep 2 years)
SELECT cron.schedule(
    'cleanup-old-orders',
    '0 3 * * 0',  -- Weekly on Sunday at 3 AM UTC
    $$
    DELETE FROM "Order"
    WHERE "status" IN ('COMPLETED', 'CANCELLED')
    AND "createdAt" < NOW() - INTERVAL '2 years';
    $$
);

-- Clean up old subscription orders (completed/cancelled, keep 1 year)
SELECT cron.schedule(
    'cleanup-old-subscription-orders',
    '0 4 * * 0',  -- Weekly on Sunday at 4 AM UTC
    $$
    DELETE FROM "Order"
    WHERE "source" = 'SUBSCRIPTION'
    AND "status" IN ('COMPLETED', 'CANCELLED')
    AND "createdAt" < NOW() - INTERVAL '1 year';
    $$
);

-- ============================================
-- HOURLY JOBS
-- ============================================

-- Process pending subscription renewals (every hour)
-- Calls the API endpoint to sync upcoming orders
-- Replace YOUR_CRON_SECRET with actual CRON_SECRET from Render
SELECT cron.schedule(
    'process-subscription-renewals',
    '0 * * * *',  -- Every hour at minute 0
    $$
    SELECT http_post(
      'https://fortifykitchen-api.onrender.com/api/cron/subscriptions/renew',
      '{}',
      '{"Authorization": "Bearer YOUR_CRON_SECRET_HERE"}'
    );
    $$
);

-- Weekly database vacuum and analyze (Sunday 3 AM UTC)
SELECT cron.schedule(
    'weekly-vacuum-analyze',
    '0 3 * * 0',  -- Sunday at 3 AM UTC
    $$
    VACUUM ANALYZE;
    $$
);

-- ============================================
-- MONTHLY JOBS
-- ============================================

-- Monthly database statistics update (1st of month at 2 AM UTC)
SELECT cron.schedule(
    'monthly-db-stats',
    '0 2 1 * *',  -- 1st of month at 2 AM UTC
    $$
    ANALYZE;
    $$
);

-- ============================================
-- JOB MONITORING
-- ============================================

-- View scheduled jobs (run in 'neondb')
-- SELECT * FROM cron.job;

-- View job run history (run in 'neondb')
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 50;

-- Unschedule a job if needed (run in 'neondb')
-- SELECT cron.unschedule('job-name');

-- ============================================
-- NOTES
-- ============================================
-- 1. Run Step 1-2 in 'postgres' database, Step 3 in 'neondb'
-- 2. pg_cron runs on the database server (UTC timezone)
-- 3. For API calls, enable pg_net and replace YOUR_CRON_SECRET_HERE
-- 4. Monitor job runs: SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
-- 5. Neon free tier supports pg_cron - check your plan limits
-- 6. The http_post calls will fail if pg_net is not enabled or secret is wrong