-- ============================================================
-- ProfitPulse: Clean up ALL demo user data
-- Run this BEFORE re-running seed.sql if previous run failed
-- ============================================================

-- First delete organization (cascades to all business data)
DELETE FROM organizations WHERE user_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

-- Then delete auth records
DELETE FROM auth.identities WHERE user_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
DELETE FROM auth.sessions WHERE user_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
DELETE FROM auth.refresh_tokens WHERE (session_id IN (SELECT id FROM auth.sessions WHERE user_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'));
DELETE FROM auth.mfa_factors WHERE user_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
DELETE FROM auth.users WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

-- Verify cleanup
SELECT 'Users remaining:' AS check, COUNT(*) FROM auth.users WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
UNION ALL
SELECT 'Orgs remaining:', COUNT(*) FROM organizations WHERE user_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

-- ============================================================
-- DONE! Now run seed.sql again.
-- ============================================================
