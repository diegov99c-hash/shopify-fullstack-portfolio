import { useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import db from "../db.server";
import { authenticate } from "../shopify.server";

const TOPICS = {
  ordersCreate: "ORDERS_CREATE",
  productsUpdate: "PRODUCTS_UPDATE",
};

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    const [
      totalEvents,
      ordersCreateCount,
      productsUpdateCount,
      last24HoursCount,
      topicGroups,
      recentEvents,
    ] = await db.$transaction([
      db.webhookEvent.count(),
      db.webhookEvent.count({ where: { topic: TOPICS.ordersCreate } }),
      db.webhookEvent.count({ where: { topic: TOPICS.productsUpdate } }),
      db.webhookEvent.count({ where: { receivedAt: { gte: last24Hours } } }),
      db.webhookEvent.groupBy({
        by: ["topic"],
        _count: {
          topic: true,
        },
        where: {
          topic: {
            in: [TOPICS.ordersCreate, TOPICS.productsUpdate],
          },
        },
      }),
      db.webhookEvent.findMany({
        orderBy: {
          receivedAt: "desc",
        },
        take: 20,
        select: {
          webhookId: true,
          topic: true,
          resourceType: true,
          resourceName: true,
          shop: true,
          resourceOccurredAt: true,
          receivedAt: true,
        },
      }),
    ]);

    const breakdown = {
      [TOPICS.ordersCreate]: 0,
      [TOPICS.productsUpdate]: 0,
    };

    for (const group of topicGroups) {
      breakdown[group.topic] = group._count.topic;
    }

    return {
      summary: {
        totalEvents,
        ordersCreateCount,
        productsUpdateCount,
        last24HoursCount,
      },
      breakdown,
      recentEvents,
    };
  } catch {
    throw new Response("Unable to load dashboard analytics.", {
      status: 500,
    });
  }
};

function formatDate(value) {
  return new Date(value).toLocaleString();
}

export default function Dashboard() {
  const { breakdown, recentEvents, summary } = useLoaderData();
  const metrics = [
    ["Total webhook events", summary.totalEvents],
    ["ORDERS_CREATE", summary.ordersCreateCount],
    ["PRODUCTS_UPDATE", summary.productsUpdateCount],
    ["Last 24 hours", summary.last24HoursCount],
  ];

  return (
    <s-page heading="Integration Dashboard">
      <s-section heading="Activity summary">
        <div
          style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          }}
        >
          {metrics.map(([label, value]) => (
            <div
              key={label}
              style={{
                border: "1px solid var(--p-color-border-secondary)",
                borderRadius: "8px",
                padding: "1rem",
              }}
            >
              <s-paragraph>{label}</s-paragraph>
              <strong style={{ fontSize: "1.75rem" }}>{value}</strong>
            </div>
          ))}
        </div>
      </s-section>

      <s-section heading="Recent events">
        {recentEvents.length ? (
          <s-table>
            <s-table-header-row>
              <s-table-header>Topic</s-table-header>
              <s-table-header>Resource type</s-table-header>
              <s-table-header>Resource name</s-table-header>
              <s-table-header>Shop</s-table-header>
              <s-table-header>Occurred</s-table-header>
              <s-table-header>Received</s-table-header>
            </s-table-header-row>
            <s-table-body>
              {recentEvents.map((event) => (
                <s-table-row key={event.webhookId}>
                  <s-table-cell>{event.topic}</s-table-cell>
                  <s-table-cell>{event.resourceType}</s-table-cell>
                  <s-table-cell>{event.resourceName || "Untitled"}</s-table-cell>
                  <s-table-cell>{event.shop}</s-table-cell>
                  <s-table-cell>
                    {formatDate(event.resourceOccurredAt)}
                  </s-table-cell>
                  <s-table-cell>{formatDate(event.receivedAt)}</s-table-cell>
                </s-table-row>
              ))}
            </s-table-body>
          </s-table>
        ) : (
          <s-paragraph>No webhook events have been stored yet.</s-paragraph>
        )}
      </s-section>

      <s-section slot="aside" heading="Topic breakdown">
        <s-unordered-list>
          <s-list-item>
            ORDERS_CREATE: {breakdown[TOPICS.ordersCreate]}
          </s-list-item>
          <s-list-item>
            PRODUCTS_UPDATE: {breakdown[TOPICS.productsUpdate]}
          </s-list-item>
        </s-unordered-list>
      </s-section>
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
