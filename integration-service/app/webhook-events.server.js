import { Prisma } from "@prisma/client";
import db from "./db.server.js";

export const WEBHOOK_RETENTION_DAYS = 30;

function parseShopifyDate(value) {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? new Date() : date;
}

async function createWebhookEvent(data) {
  try {
    await db.webhookEvent.create({ data });
    return { created: true };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { created: false };
    }

    throw error;
  }
}

export async function recordOrderCreatedWebhook({
  payload,
  shop,
  topic,
  webhookId,
}) {
  return createWebhookEvent({
    webhookId,
    shop,
    topic,
    resourceType: "ORDER",
    resourceId: String(payload.admin_graphql_api_id || payload.id),
    resourceName: payload.name || null,
    resourceOccurredAt: parseShopifyDate(payload.created_at),
  });
}

export async function recordProductUpdatedWebhook({
  payload,
  shop,
  topic,
  webhookId,
}) {
  return createWebhookEvent({
    webhookId,
    shop,
    topic,
    resourceType: "PRODUCT",
    resourceId: String(payload.admin_graphql_api_id || payload.id),
    resourceName: payload.title || null,
    resourceOccurredAt: parseShopifyDate(payload.updated_at),
  });
}

export async function cleanupOldWebhookEvents(now = new Date()) {
  const cutoff = new Date(
    now.getTime() - WEBHOOK_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  );

  return db.webhookEvent.deleteMany({
    where: {
      receivedAt: {
        lt: cutoff,
      },
    },
  });
}

export async function deleteShopData(shop) {
  const [sessions, webhookEvents] = await db.$transaction([
    db.session.deleteMany({ where: { shop } }),
    db.webhookEvent.deleteMany({ where: { shop } }),
  ]);

  return {
    sessionsDeleted: sessions.count,
    webhookEventsDeleted: webhookEvents.count,
  };
}
