import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.cron("daily news fetch", "0 3 * * *", internal.news.fetchAndStore, {});
crons.cron("daily radar cleanup", "30 4 * * *", internal.radar.purgeExpiredRadarItems, {});
crons.cron("daily maintenance purge", "30 3 * * *", internal.maintenance.purgeOldData, {});
// Cheap hourly tick: seeds an empty catalog once, then re-checks (and health-checks) only the
// franchises that are due — each one sets its own cadence (daily / 3 days / weekly) from release dates
crons.cron("franchise vault sync", "15 * * * *", internal.franchises.syncDue, {});
// Weekly: add franchises behind what's trending, popular, upcoming and in cinemas
crons.cron("franchise vault discovery", "0 5 * * 1", internal.franchises.discoverNew, {});

export default crons;
