# Privacy and Data Protection

This document describes the current development-store data handling practices for
the `integration-service` Shopify app.

## Scope

This app requests:

- `read_products`
- `read_orders`

The app uses Level 1 protected customer data because Shopify order resources can
relate to a customer. The app does not request Level 2 protected customer fields.

## Protected Customer Data Processed

The app currently processes the minimum order data needed to demonstrate the
integration service milestone:

- GraphQL order ID
- Order name/number
- Order creation timestamp
- Financial status
- Fulfillment status
- Order total amount
- Order total currency
- Concise `orders/create` webhook metadata: topic, shop, order ID, order name,
  and created timestamp

The app does not request customer names, emails, phone numbers, billing
addresses, shipping addresses, or customer profile records.

## Purpose

Order data is processed only to provide app functionality to merchants:

- Display recent order sync/status data in the embedded Shopify Admin app
- Receive Shopify order and product events for future integration workflows
- Validate development-store webhook handling with minimal persistent metadata

The app does not use protected customer data for marketing, advertising,
profiling, sale of data, cross-context sharing, or automated decision-making.

## Current Storage

Persistent storage is implemented with PostgreSQL through Prisma.

- Recent orders are still fetched from Shopify on demand through the
  server-side Shopify GraphQL Admin API.
- Webhook event metadata is verified by Shopify's app framework and stored in
  PostgreSQL for idempotency and development auditability.
- Shopify app sessions are stored in PostgreSQL using Shopify's Prisma session
  storage adapter.

Stored webhook event metadata is limited to:

- Webhook delivery ID
- Shop domain
- Webhook topic
- Resource type
- Resource ID
- Resource name/title when already used by the app
- Resource event timestamp
- Received timestamp

Customer names, emails, phone numbers, billing addresses, shipping addresses,
and customer profile records are not stored.

## Retention

The current development retention policy is:

- Webhook event logs and related development event data are retained no longer
  than 30 days.
- Development/test data may be cleared at any time.
- Data is deleted earlier when it is no longer needed for development or
  debugging.
- If a merchant uninstalls the app, stored Shopify sessions and webhook event
  metadata for that shop are deleted.

## Deletion

Stored webhook event metadata older than 30 days is deleted by running:

```shell
npm run cleanup:webhooks
```

This cleanup command is safe to run manually or from a scheduler. On app
uninstall, the app deletes Shopify sessions and stored webhook event metadata
for the uninstalling shop only.

## Security Controls

Current controls:

- Shopify app authentication is handled by Shopify's React Router app framework.
- Shopify webhook authenticity is verified with `authenticate.webhook(request)`;
  the app does not implement custom HMAC verification.
- Shopify API secrets and tokens are not hardcoded.
- Environment files and Shopify local runtime files are ignored by Git.
- PostgreSQL credentials are provided with `DATABASE_URL` and are not hardcoded.
- GraphQL queries request only the fields needed for the current app UI.
- Webhook logs avoid customer names, email addresses, phone numbers, and
  addresses.

## Encryption

- Data in transit is protected by HTTPS/TLS between Shopify, the app tunnel, and
  the local application during development.
- Local development PostgreSQL may not provide encryption at rest.
- Production PostgreSQL must use the hosting/database provider's encryption at
  rest before storing production-like protected customer data.
- Production database connections should require TLS/SSL, for example with a
  provider-supported `sslmode=require` connection string option where
  appropriate.

## Merchant Transparency

Merchants can review this policy in the app under the Privacy / Data Usage page.
This document should be updated before requesting additional scopes, protected
fields, persistent storage, or production distribution.
