-- Neon pg_cron jobs for database maintenance
-- Run this SQL in your Neon database (via Neon SQL Editor or psql)

-- Enable pg_cron extension (run once)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net; -- For http_post() to call API endpoints

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
SELECT cron.schedule(
    'process-subscription-renewals',
    '0 * * * *',  -- Every hour at minute 0
    $$
    -- Call the API endpoint to process subscription renewals
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
    -- Update table statistics for query planner
    ANALYZE;
    $$
);

-- ============================================
-- JOB MONITORING
-- ============================================

-- View scheduled jobs
-- SELECT * FROM cron.job;

-- View job run history
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 50;

-- Unschedule a job if needed
-- SELECT cron.unschedule('job-name');

-- ============================================
-- NOTES
-- ============================================
-- 1. Run these SQL commands in Neon SQL Editor or via psql
-- 2. pg_cron runs on the database server (UTC timezone)
-- 3. For API calls from pg_cron, enable pg_net extension and use http_post()
--    Replace YOUR_CRON_SECRET_HERE with your actual CRON_SECRET from Render
-- 4. Monitor job runs: SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
-- 5. Neon free tier supports pg_cron - check your plan limits
-- 6. The http_post calls will fail if pg_net is not enabled or secret is wrong