import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.cron("daily news fetch", "0 3 * * *", internal.news.fetchAndStore, {});

export default crons;
