// backend/src/services/paypal.service.ts
import checkoutNodeJssdk from '@paypal/checkout-server-sdk';
import { client } from '../config/paypal.js';
import { AppError } from '../utils/AppError.js';

export const crearOrdenPayPal = async (montoTotal: number, ordenInterna: string) => {
  const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
  request.prefer('return=representation');
  
  request.body = {
    intent: 'CAPTURE',
    payer: {
      email_address: 'customer@example.com',
    },
    purchase_units: [
      {
        amount: {
          currency_code: 'USD',
          value: montoTotal.toString(),
          breakdown: {
            item_total: {
              currency_code: 'USD',
              value: montoTotal.toString(),
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
  };

  try {
    const response = await client().execute(request);
    return {
      id: response.result.id,
      status: response.result.status,
      links: response.result.links,
    };
  } catch (error: any) {
    console.error('Error creating PayPal order:', error);
    throw new AppError('Error creando orden en PayPal', 500);
  }
};

export const capturarOrdenPayPal = async (orderPayPalId: string) => {
  const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderPayPalId);
  request.requestBody({});

  try {
    const response = await client().execute(request);
    return {
      id: response.result.id,
      status: response.result.status,
      payer: response.result.payer,
      purchase_units: response.result.purchase_units,
    };
  } catch (error: any) {
    console.error('Error capturing PayPal order:', error);
    throw new AppError('Error capturando pago en PayPal', 500);
  }
};

export const obtenerDetallesOrdenPayPal = async (orderPayPalId: string) => {
  const request = new checkoutNodeJssdk.orders.OrdersGetRequest(orderPayPalId);

  try {
    const response = await client().execute(request);
    return response.result;
  } catch (error: any) {
    console.error('Error getting PayPal order details:', error);
    throw new AppError('Error obteniendo detalles de PayPal', 500);
  }
};
