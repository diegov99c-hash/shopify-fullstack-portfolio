import { useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  return null;
};

export default function Privacy() {
  return (
    <s-page heading="Privacy / Data Usage">
      <s-section heading="Protected customer data">
        <s-paragraph>
          This app uses Level 1 protected customer data because Shopify orders
          relate to customers. It reads recent order IDs, order names/numbers,
          timestamps, statuses, and order totals.
        </s-paragraph>
        <s-paragraph>
          It does not request customer names, emails, phone numbers, billing
          addresses, shipping addresses, or customer profile records.
        </s-paragraph>
      </s-section>

      <s-section heading="Purpose">
        <s-unordered-list>
          <s-list-item>Display recent order sync/status data.</s-list-item>
          <s-list-item>Receive verified Shopify order and product events.</s-list-item>
          <s-list-item>Validate development-store integration behavior.</s-list-item>
        </s-unordered-list>
        <s-paragraph>
          Data is not sold, used for marketing or advertising, or used for
          automated decision-making.
        </s-paragraph>
      </s-section>

      <s-section heading="Storage and retention">
        <s-paragraph>
          Current order data is fetched from Shopify on demand. Webhook event
          metadata and app sessions are stored in PostgreSQL. Stored webhook
          metadata is limited to delivery ID, shop, topic, resource ID,
          resource name/title, event timestamp, and received timestamp.
        </s-paragraph>
        <s-paragraph>
          Webhook event data is retained no longer than 30 days, deleted earlier
          when no longer needed, and development/test data may be cleared at any
          time.
        </s-paragraph>
      </s-section>

      <s-section heading="Security">
        <s-paragraph>
          Shopify authentication and webhook verification are handled by
          Shopify&apos;s app framework. API secrets and tokens are not hardcoded.
          Data is encrypted in transit with HTTPS/TLS. PostgreSQL credentials
          come from environment variables.
        </s-paragraph>
        <s-paragraph>
          Local development PostgreSQL may not provide encryption at rest.
          Production PostgreSQL must use hosting-provider encryption at rest and
          TLS/SSL database connections where appropriate.
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
