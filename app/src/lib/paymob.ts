import "server-only";

const PAYMOB_URL = process.env.PAYMOB_API_URL || "https://accept.paymob.com/api";

export function paymobConfigured() {
  return Boolean(process.env.PAYMOB_API_KEY && process.env.PAYMOB_INTEGRATION_ID && process.env.PAYMOB_IFRAME_ID);
}

export async function createPaymobPayment(input: {
  amountCents: number;
  orderReference: string;
  name: string;
  email: string;
  phone: string;
}) {
  const apiKey = process.env.PAYMOB_API_KEY;
  const integrationId = Number(process.env.PAYMOB_INTEGRATION_ID);
  if (!apiKey || !Number.isInteger(integrationId)) throw new Error("PAYMOB_NOT_CONFIGURED");

  const authResponse = await fetch(`${PAYMOB_URL}/auth/tokens`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: apiKey }),
  });
  if (!authResponse.ok) throw new Error("PAYMOB_AUTH_FAILED");
  const auth = await authResponse.json();

  const orderResponse = await fetch(`${PAYMOB_URL}/ecommerce/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ auth_token: auth.token, delivery_needed: false, amount_cents: input.amountCents, currency: "EGP", merchant_order_id: input.orderReference, items: [] }),
  });
  if (!orderResponse.ok) throw new Error("PAYMOB_ORDER_FAILED");
  const order = await orderResponse.json();

  const nameParts = input.name.trim().split(/\s+/);
  const keyResponse = await fetch(`${PAYMOB_URL}/acceptance/payment_keys`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_token: auth.token,
      amount_cents: input.amountCents,
      expiration: 3600,
      order_id: order.id,
      billing_data: {
        apartment: "NA",
        email: input.email,
        floor: "NA",
        first_name: nameParts[0] || "Student",
        street: "NA",
        building: "NA",
        phone_number: input.phone,
        shipping_method: "NA",
        postal_code: "NA",
        city: "NA",
        state: "NA",
        country: "EGY",
        last_name: nameParts.slice(1).join(" ") || "Academy",
      },
      currency: "EGP",
      integration_id: integrationId,
    }),
  });
  if (!keyResponse.ok) throw new Error("PAYMOB_KEY_FAILED");
  const key = await keyResponse.json();
  const iframeId = process.env.PAYMOB_IFRAME_ID;
  return { orderId: String(order.id), paymentToken: String(key.token), iframeUrl: `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${encodeURIComponent(key.token)}` };
}
