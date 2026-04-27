// backend/src/config/paypal.ts
import { Client, Environment } from '@paypal/paypal-server-sdk';
import { environment } from './env.js';

const ClientId = environment.PAYPAL_CLIENT_ID;
const ClientSecret = environment.PAYPAL_CLIENT_SECRET;

export async function client() {
  return new Client({
    timeout: 0,
    environment: environment.PAYPAL_MODE === 'sandbox' ? Environment.Sandbox : Environment.Production,
    clientCredentialsAuthCredentials: {
      oAuthClientId: ClientId,
      oAuthClientSecret: ClientSecret,
    },
  });
}
