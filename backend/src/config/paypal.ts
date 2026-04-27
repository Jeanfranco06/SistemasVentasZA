// backend/src/config/paypal.ts
import checkoutNodeJssdk from '@paypal/checkout-server-sdk';
import { environment } from './env.js';

const ClientId = environment.PAYPAL_CLIENT_ID;
const ClientSecret = environment.PAYPAL_CLIENT_SECRET;

function environment_paypal() {
  return environment.PAYPAL_MODE === 'sandbox'
    ? new checkoutNodeJssdk.core.SandboxEnvironment(ClientId, ClientSecret)
    : new checkoutNodeJssdk.core.LiveEnvironment(ClientId, ClientSecret);
}

export function client() {
  return new checkoutNodeJssdk.core.PayPalHttpClient(environment_paypal());
}
