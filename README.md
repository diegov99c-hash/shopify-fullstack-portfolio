# Shopify Full-Stack E-commerce Integration

Personal portfolio project demonstrating Shopify theme development, Shopify app development, GraphQL Admin API integrations, webhook architecture, PostgreSQL persistence, and analytics. V1 combines a custom Liquid storefront with an embedded Shopify admin app that reads store data, receives Shopify webhooks, persists integration metadata, and surfaces operational analytics.

## Architecture

```mermaid
flowchart TD
  Customer["Customer"]
  Storefront["Shopify Storefront"]
  Theme["Custom Liquid Theme"]
  Platform["Shopify Platform"]
  GraphQL["Admin GraphQL API"]
  Webhooks["Webhooks"]
  ProductsWebhook["PRODUCTS_UPDATE"]
  OrdersWebhook["ORDERS_CREATE"]
  Service["Integration Service"]
  ReactRouter["Shopify React Router"]
  Auth["Authentication"]
  Prisma["Prisma"]
  Handlers["Webhook handlers"]
  Analytics["Analytics"]
  Postgres["PostgreSQL"]

  Customer --> Storefront --> Theme --> Platform
  Platform --> GraphQL
  Platform --> Webhooks
  Webhooks --> ProductsWebhook --> Service
  Webhooks --> OrdersWebhook --> Service
  GraphQL --> Service

  Service --> ReactRouter
  Service --> Auth
  Service --> Prisma
  Service --> Handlers
  Service --> Analytics
  Prisma --> Postgres
  Handlers --> Prisma
```

## Features

### Storefront

- Custom Liquid sections
- Merchant configurable sections
- Responsive catalog
- Responsive product page
- AJAX add to cart
- Cart quantity updates and remove actions
- Checkout through Shopify cart flow
- Responsive header

### Shopify Integration

- Embedded Shopify app
- Shopify authentication
- Admin GraphQL API usage
- Products query
- Orders query
- `PRODUCTS_UPDATE` webhook
- `ORDERS_CREATE` webhook

### Backend

- PostgreSQL
- Prisma ORM
- `PrismaSessionStorage` for persistent Shopify sessions
- Webhook metadata persistence
- `webhookId`-based webhook idempotency
- 30-day retention cleanup command
- Shop-scoped uninstall cleanup

### Analytics

- Webhook activity dashboard
- Order analytics page
- Revenue totals
- Average order value
- Financial status breakdown
- Fulfillment status breakdown
- Recent orders table

## Tech Stack

- Shopify Liquid
- Shopify theme sections, snippets, templates, and schema settings
- Vanilla JavaScript for storefront cart interactions
- Shopify AJAX cart endpoints
- Shopify CLI
- Shopify React Router app template
- React 18
- React Router 7
- Shopify App Bridge
- Shopify Admin GraphQL API
- Shopify webhooks
- PostgreSQL
- Prisma
- `@shopify/shopify-app-session-storage-prisma`
- ESLint
- TypeScript type checking
- Vite / React Router build tooling

## Important Technical Decisions

1. **Webhooks instead of polling**  
   Product and order changes are received through Shopify webhooks so the integration service reacts to platform events instead of repeatedly polling Shopify.

2. **`webhookId`-based idempotency**  
   Webhook delivery IDs are stored as the primary key for webhook event records. Duplicate deliveries are handled safely and cannot create duplicate `WebhookEvent` rows.

3. **Minimal protected-customer-data usage**  
   The app uses `read_orders`, but GraphQL queries and webhook persistence intentionally avoid customer names, emails, phone numbers, billing addresses, and shipping addresses.

4. **PostgreSQL-backed Shopify sessions**  
   Shopify sessions are stored through `PrismaSessionStorage`, replacing temporary in-memory session storage with durable PostgreSQL-backed storage.

5. **Order analytics from GraphQL instead of extra persistence**  
   Order analytics are computed from authenticated Admin GraphQL responses. The app does not persist additional order/customer data for this milestone.

6. **Currency-aware revenue calculations**  
   Order revenue is grouped by currency so multi-currency data is not incorrectly summed into a single monetary value.

## Repository Structure

```text
shopify-fullstack-portfolio/
├── shopify-theme/          # Custom Shopify theme: Liquid sections, templates, snippets, CSS, JS
└── integration-service/    # Embedded Shopify app: React Router, Prisma, PostgreSQL, webhooks, analytics
```

`shopify-theme/` contains the storefront experience: configurable homepage sections, responsive collection/product/cart pages, AJAX add-to-cart behavior, cart updates, and checkout flow.

`integration-service/` contains the embedded Shopify app: authentication, Admin GraphQL queries, webhook handlers, Prisma schema, PostgreSQL session/event persistence, cleanup scripts, and analytics pages.

## Local Development

### Prerequisites

- Node.js compatible with the integration service engine range
- npm
- Shopify CLI
- A Shopify development store
- PostgreSQL, locally or via Docker

### PostgreSQL With Docker

Example local database:

```bash
docker run --name shopify-portfolio-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=integration_service_dev \
  -p 5432:5432 \
  -d postgres:17
```

### Integration Service Environment

Create a local environment file from the example:

```bash
cd integration-service
cp .env.example .env
```

Example database variable:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/integration_service_dev?schema=public"
```

Shopify app credentials and URLs are managed by Shopify CLI during local app development. Do not commit real secrets.

### Prisma Setup

```bash
cd integration-service
npm install
npm run setup
```

Useful database commands:

```bash
npm exec prisma validate
npm exec prisma migrate status
npm run cleanup:webhooks
```

### Shopify App Dev

```bash
cd integration-service
npm run dev
```

The app uses the Shopify CLI development flow for authentication, tunneling, app URLs, and webhook subscription syncing.

### Shopify Theme Dev

```bash
cd shopify-theme
shopify theme dev
```

Run Theme Check from the theme directory:

```bash
shopify theme check
```

## Security & Privacy

- No customer email, customer name, phone number, billing address, or shipping address is persisted by the integration service.
- Shopify webhook authenticity is verified through Shopify's app framework with `authenticate.webhook(request)`.
- Secrets and database credentials are environment-managed and must not be hardcoded.
- Webhook persistence stores minimal metadata: delivery ID, shop, topic, resource type, resource ID, resource name/title, event timestamp, and received timestamp.
- Stored webhook metadata has a 30-day retention policy and can be cleaned with `npm run cleanup:webhooks`.
- App uninstall cleanup deletes sessions and webhook metadata only for the uninstalling shop.
- Production PostgreSQL should use provider-managed encryption at rest and TLS/SSL database connections where appropriate.

## Testing / Validation

Validated during V1 development:

- Shopify Theme Check
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm exec prisma validate`
- `npm exec prisma migrate status`
- `shopify app config validate --no-color`
- Manually validated `PRODUCTS_UPDATE` webhook persistence
- Manually validated `ORDERS_CREATE` webhook persistence
- Manually validated webhook idempotency
- Manually validated 30-day retention cleanup
- Manually validated product and order GraphQL pages
- Manually validated integration dashboard and order analytics

## Screenshots

### Storefront

Screenshots to be added.

### Product Page

Screenshots to be added.

### Integration Dashboard

Screenshots to be added.

### Order Analytics

Screenshots to be added.

## V1 Status

V1 is functionally complete.

Completed V1 scope:

- Custom Shopify storefront theme
- Responsive product, collection, cart, and header UX
- AJAX add-to-cart and cart updates
- Embedded Shopify app
- Authenticated Admin GraphQL product and order reads
- Shopify webhook handling for products and orders
- PostgreSQL persistence with Prisma
- Persistent Shopify sessions
- Webhook idempotency
- Retention cleanup
- Shop-scoped uninstall cleanup
- Webhook activity dashboard
- Order analytics

## Future Improvements / V2

- Production deployment
- Scheduled retention cleanup
- Richer analytics
- Automated integration tests
- Multi-store testing

## Author

Juan Diego Vinasco Castañeda  
Full-Stack Software Engineer
