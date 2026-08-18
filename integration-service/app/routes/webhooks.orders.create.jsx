import { authenticate } from "../shopify.server";
import { recordOrderCreatedWebhook } from "../webhook-events.server";

export const action = async ({ request }) => {
  const { payload, shop, topic, webhookId } =
    await authenticate.webhook(request);
  const result = await recordOrderCreatedWebhook({
    payload,
    shop,
    topic,
    webhookId,
  });

  console.log(
    JSON.stringify({
      topic,
      shop,
      webhookId,
      stored: result.created,
      orderId: payload.admin_graphql_api_id || payload.id,
      orderName: payload.name,
      createdAt: payload.created_at,
    }),
  );

  return new Response();
};
