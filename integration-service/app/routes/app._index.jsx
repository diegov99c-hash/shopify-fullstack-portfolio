import { useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);

  const response = await admin.graphql(
    `#graphql
      query ProductList {
        products(first: 10, sortKey: UPDATED_AT, reverse: true) {
          nodes {
            id
            title
            status
          }
        }
      }`,
  );

  const { data, errors } = await response.json();

  if (errors) {
    throw new Response("Unable to load products from Shopify.", {
      status: 502,
    });
  }

  return {
    shop: session.shop,
    products: data.products.nodes,
  };
};

export default function Index() {
  const { products, shop } = useLoaderData();

  return (
    <s-page heading="Integration Service">
      <s-section heading="Development store">
        <s-paragraph>{shop}</s-paragraph>
      </s-section>

      <s-section heading="Products from GraphQL Admin API">
        {products.length ? (
          <s-table>
            <s-table-header-row>
              <s-table-header>Product</s-table-header>
              <s-table-header>ID</s-table-header>
              <s-table-header>Status</s-table-header>
            </s-table-header-row>
            <s-table-body>
              {products.map((product) => (
                <s-table-row key={product.id}>
                  <s-table-cell>{product.title}</s-table-cell>
                  <s-table-cell>{product.id}</s-table-cell>
                  <s-table-cell>{product.status}</s-table-cell>
                </s-table-row>
              ))}
            </s-table-body>
          </s-table>
        ) : (
          <s-paragraph>No products found in this development store.</s-paragraph>
        )}
      </s-section>

      <s-section slot="aside" heading="Current milestone">
        <s-unordered-list>
          <s-list-item>Authenticated embedded Shopify app</s-list-item>
          <s-list-item>Server-side GraphQL Admin API query</s-list-item>
          <s-list-item>No PostgreSQL or custom webhooks yet</s-list-item>
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
