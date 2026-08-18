import { authenticate } from "../shopify.server";
import { deleteShopData } from "../webhook-events.server";

export const action = async ({ request }) => {
  const { shop, topic } = await authenticate.webhook(request);
  const result = await deleteShopData(shop);

  console.log(
    JSON.stringify({
      topic,
      shop,
      sessionsDeleted: result.sessionsDeleted,
      webhookEventsDeleted: result.webhookEventsDeleted,
    }),
  );

  return new Response();
};
