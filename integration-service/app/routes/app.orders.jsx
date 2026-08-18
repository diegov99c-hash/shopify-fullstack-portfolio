import { useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(
    `#graphql
      query RecentOrders {
        orders(first: 10, sortKey: CREATED_AT, reverse: true) {
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
  );

  const { data, errors } = await response.json();

  if (errors) {
    throw new Response("Unable to load orders from Shopify.", {
      status: 502,
    });
  }

  return {
    orders: data.orders.nodes,
  };
};

export default function Orders() {
  const { orders } = useLoaderData();

  return (
    <s-page heading="Recent Orders">
      <s-section heading="Orders from GraphQL Admin API">
        {orders.length ? (
          <s-table>
            <s-table-header-row>
              <s-table-header>Order</s-table-header>
              <s-table-header>ID</s-table-header>
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
                    <s-table-cell>{order.id}</s-table-cell>
                    <s-table-cell>
                      {new Date(order.createdAt).toLocaleString()}
                    </s-table-cell>
                    <s-table-cell>{order.displayFinancialStatus}</s-table-cell>
                    <s-table-cell>{order.displayFulfillmentStatus}</s-table-cell>
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

      <s-section slot="aside" heading="Privacy note">
        <s-paragraph>
          This query reads order status and totals only. It does not request
          customer personal data.
        </s-paragraph>
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
