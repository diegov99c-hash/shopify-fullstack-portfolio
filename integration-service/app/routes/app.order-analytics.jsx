import { useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

const ORDER_LIMIT = 50;

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(
    `#graphql
      query OrderAnalytics($first: Int!) {
        orders(first: $first, sortKey: CREATED_AT, reverse: true) {
          nodes {
            id
            name
            createdAt
            displayFinancialStatus
            displayFulfillmentStatus
            currentTotalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
          }
        }
      }`,
    {
      variables: {
        first: ORDER_LIMIT,
      },
    },
  );

  const { data, errors } = await response.json();

  if (errors) {
    throw new Response("Unable to load order analytics from Shopify.", {
      status: 502,
    });
  }

  return buildAnalytics(data.orders.nodes);
};

function buildAnalytics(orders) {
  const revenueByCurrency = {};
  const orderCountByCurrency = {};
  const financialStatusBreakdown = {};
  const fulfillmentStatusBreakdown = {};

  for (const order of orders) {
    const money = order.currentTotalPriceSet.shopMoney;
    const amount = Number.parseFloat(money.amount);
    const financialStatus = order.displayFinancialStatus || "UNKNOWN";
    const fulfillmentStatus = order.displayFulfillmentStatus || "UNFULFILLED";

    revenueByCurrency[money.currencyCode] =
      (revenueByCurrency[money.currencyCode] || 0) + amount;
    orderCountByCurrency[money.currencyCode] =
      (orderCountByCurrency[money.currencyCode] || 0) + 1;
    financialStatusBreakdown[financialStatus] =
      (financialStatusBreakdown[financialStatus] || 0) + 1;
    fulfillmentStatusBreakdown[fulfillmentStatus] =
      (fulfillmentStatusBreakdown[fulfillmentStatus] || 0) + 1;
  }

  const revenueTotals = Object.entries(revenueByCurrency).map(
    ([currencyCode, amount]) => ({
      currencyCode,
      amount,
      averageOrderValue: amount / orderCountByCurrency[currencyCode],
    }),
  );

  return {
    orderCount: orders.length,
    revenueTotals,
    financialStatusBreakdown,
    fulfillmentStatusBreakdown,
    orders,
  };
}

function formatMoney(amount, currencyCode) {
  return `${amount.toFixed(2)} ${currencyCode}`;
}

function formatDate(value) {
  return new Date(value).toLocaleString();
}

function renderBreakdownList(breakdown) {
  const entries = Object.entries(breakdown);

  if (!entries.length) {
    return <s-paragraph>No orders found.</s-paragraph>;
  }

  return (
    <s-unordered-list>
      {entries.map(([label, count]) => (
        <s-list-item key={label}>
          {label}: {count}
        </s-list-item>
      ))}
    </s-unordered-list>
  );
}

export default function OrderAnalytics() {
  const {
    financialStatusBreakdown,
    fulfillmentStatusBreakdown,
    orderCount,
    orders,
    revenueTotals,
  } = useLoaderData();
  const hasMultipleCurrencies = revenueTotals.length > 1;
  const primaryRevenue = revenueTotals[0];
  const totalRevenueLabel = hasMultipleCurrencies ? "By currency" : "0.00";

  return (
    <s-page heading="Order Analytics">
      <s-section heading="Recent order summary">
        <div
          style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          }}
        >
          <div
            style={{
              border: "1px solid var(--p-color-border-secondary)",
              borderRadius: "8px",
              padding: "1rem",
            }}
          >
            <s-paragraph>Total recent orders</s-paragraph>
            <strong style={{ fontSize: "1.75rem" }}>{orderCount}</strong>
          </div>

          <div
            style={{
              border: "1px solid var(--p-color-border-secondary)",
              borderRadius: "8px",
              padding: "1rem",
            }}
          >
            <s-paragraph>Total revenue</s-paragraph>
            <strong style={{ fontSize: "1.75rem" }}>
              {!hasMultipleCurrencies && primaryRevenue
                ? formatMoney(primaryRevenue.amount, primaryRevenue.currencyCode)
                : totalRevenueLabel}
            </strong>
          </div>

          <div
            style={{
              border: "1px solid var(--p-color-border-secondary)",
              borderRadius: "8px",
              padding: "1rem",
            }}
          >
            <s-paragraph>Average order value</s-paragraph>
            <strong style={{ fontSize: "1.75rem" }}>
              {!hasMultipleCurrencies && primaryRevenue
                ? formatMoney(
                    primaryRevenue.averageOrderValue,
                    primaryRevenue.currencyCode,
                  )
                : totalRevenueLabel}
            </strong>
          </div>
        </div>

        {hasMultipleCurrencies ? (
          <s-paragraph>
            Multiple currencies were found. Revenue and averages are also shown
            separately below.
          </s-paragraph>
        ) : null}
      </s-section>

      <s-section heading="Revenue by currency">
        {revenueTotals.length ? (
          <s-table>
            <s-table-header-row>
              <s-table-header>Currency</s-table-header>
              <s-table-header>Total revenue</s-table-header>
              <s-table-header>Average order value</s-table-header>
            </s-table-header-row>
            <s-table-body>
              {revenueTotals.map((total) => (
                <s-table-row key={total.currencyCode}>
                  <s-table-cell>{total.currencyCode}</s-table-cell>
                  <s-table-cell>
                    {formatMoney(total.amount, total.currencyCode)}
                  </s-table-cell>
                  <s-table-cell>
                    {formatMoney(
                      total.averageOrderValue,
                      total.currencyCode,
                    )}
                  </s-table-cell>
                </s-table-row>
              ))}
            </s-table-body>
          </s-table>
        ) : (
          <s-paragraph>No revenue to show yet.</s-paragraph>
        )}
      </s-section>

      <s-section heading="Recent orders">
        {orders.length ? (
          <s-table>
            <s-table-header-row>
              <s-table-header>Order</s-table-header>
              <s-table-header>Created</s-table-header>
              <s-table-header>Payment</s-table-header>
              <s-table-header>Fulfillment</s-table-header>
              <s-table-header>Total</s-table-header>
            </s-table-header-row>
            <s-table-body>
              {orders.map((order) => {
                const money = order.currentTotalPriceSet.shopMoney;

                return (
                  <s-table-row key={order.id}>
                    <s-table-cell>{order.name}</s-table-cell>
                    <s-table-cell>{formatDate(order.createdAt)}</s-table-cell>
                    <s-table-cell>{order.displayFinancialStatus}</s-table-cell>
                    <s-table-cell>
                      {order.displayFulfillmentStatus || "UNFULFILLED"}
                    </s-table-cell>
                    <s-table-cell>
                      {money.amount} {money.currencyCode}
                    </s-table-cell>
                  </s-table-row>
                );
              })}
            </s-table-body>
          </s-table>
        ) : (
          <s-paragraph>No recent orders found in this store.</s-paragraph>
        )}
      </s-section>

      <s-section slot="aside" heading="Financial status">
        {renderBreakdownList(financialStatusBreakdown)}
      </s-section>

      <s-section slot="aside" heading="Fulfillment status">
        {renderBreakdownList(fulfillmentStatusBreakdown)}
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
