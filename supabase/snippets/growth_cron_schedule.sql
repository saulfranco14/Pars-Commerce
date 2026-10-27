-- Run ONCE in the SQL Editor when the growth engine should start working on its own.
-- Replace both values first. GROWTH_CRON_SECRET in Vercel must match the secret here.
-- To stop: select cron.unschedule('growth-tick');
select vault.create_secret('https://tlaco.app/api/growth/cron/tick', 'growth_cron_url');
select vault.create_secret('REEMPLAZA_CON_GROWTH_CRON_SECRET', 'growth_cron_secret');
select cron.schedule('growth-tick', '*/10 * * * *', $$select public.growth_cron_tick()$$);
