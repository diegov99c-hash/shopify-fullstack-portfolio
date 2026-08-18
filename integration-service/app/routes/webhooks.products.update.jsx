import { authenticate } from "../shopify.server";
import { recordProductUpdatedWebhook } from "../webhook-events.server";

export const action = async ({ request }) => {
  const { payload, shop, topic, webhookId } =
    await authenticate.webhook(request);
  const result = await recordProductUpdatedWebhook({
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
      productId: payload.admin_graphql_api_id || payload.id,
      productTitle: payload.title,
      updatedAt: payload.updated_at,
    }),
  );

  return new Response();
};
