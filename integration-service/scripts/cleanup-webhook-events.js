import process from "node:process";
import db from "../app/db.server.js";
import {
  cleanupOldWebhookEvents,
  WEBHOOK_RETENTION_DAYS,
} from "../app/webhook-events.server.js";

try {
  const result = await cleanupOldWebhookEvents();

  console.log(
    `Deleted ${result.count} webhook event records older than ${WEBHOOK_RETENTION_DAYS} days.`,
  );
} catch (error) {
  console.error(`Failed to clean up webhook events: ${error.message}`);
  process.exitCode = 1;
}

await db.$disconnect();
