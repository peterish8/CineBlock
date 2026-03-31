import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.cron("daily news fetch", "0 3 * * *", internal.news.fetchAndStore, {});
crons.cron("daily radar cleanup", "30 4 * * *", internal.radar.purgeExpiredRadarItems, {});
crons.cron("daily maintenance purge", "30 3 * * *", internal.maintenance.purgeOldData, {});

export default crons;
