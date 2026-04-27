// backend/src/services/paypal.service.ts
import { environment } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

const PAYPAL_API_URL = environment.PAYPAL_MODE === 'sandbox'
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com';

const getAccessToken = async () => {
  const auth = Buffer.from(`${environment.PAYPAL_CLIENT_ID}:${environment.PAYPAL_CLIENT_SECRET}`).toString('base64');

  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error('Failed to get PayPal access token');
  }

  const data: any = await response.json();
  return data.access_token;
};

export const crearOrdenPayPal = async (montoTotal: number, ordenInterna: string) => {
  const accessToken = await getAccessToken();

  const response = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      payer: {
        email_address: 'customer@example.com',
      },
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: montoTotal.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: 'USD',
                value: montoTotal.toFixed(2),
              },
            },
          },
          description: `Orden ${ordenInterna}`,
          custom_id: ordenInterna,
          invoice_id: ordenInterna,
        },
      ],
      application_context: {
        brand_name: 'StockFlow',
        locale: 'es-ES',
        landing_page: 'LOGIN',
        shipping_preference: 'NO_SHIPPING',
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout/paypal/success`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout/paypal/cancel`,
      },
    }),
  });

  if (!response.ok) {
    const errorData: any = await response.json().catch(() => null);
    const message = errorData?.message || errorData?.error_description || response.statusText;
    console.error('PayPal create order error body:', errorData);
    throw new AppError(`PayPal API error (${response.status}): ${message}`, 502, { paypal: errorData });
  }

  const data: any = await response.json();
  return {
    id: data.id,
    status: data.status,
    links: data.links,
  };
};

export const capturarOrdenPayPal = async (orderPayPalId: string) => {
  const accessToken = await getAccessToken();

  const response = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders/${orderPayPalId}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData: any = await response.json().catch(() => null);
    const message = errorData?.message || errorData?.error_description || response.statusText;
    console.error('PayPal capture error body:', errorData);
    throw new AppError(`PayPal API error (${response.status}): ${message}`, 502, { paypal: errorData });
  }

  const data: any = await response.json();
  return {
    id: data.id,
    status: data.status,
    payer: data.payer,
    purchase_units: data.purchase_units,
  };
};

export const obtenerDetallesOrdenPayPal = async (orderPayPalId: string) => {
  const accessToken = await getAccessToken();

  const response = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders/${orderPayPalId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData: any = await response.json().catch(() => null);
    const message = errorData?.message || errorData?.error_description || response.statusText;
    console.error('PayPal get details error body:', errorData);
    throw new AppError(`PayPal API error (${response.status}): ${message}`, 502, { paypal: errorData });
  }

  const data: any = await response.json();
  return data;
};
