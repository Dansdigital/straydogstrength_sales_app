import { defineFunction, secret } from "@aws-amplify/backend";

export const webhookProcess = defineFunction({
  name: "webhook-process",
  environment: {
    SHOPIFY_ACCESS_TOKEN: secret('SHOPIFY_ACCESS_TOKEN'),
  },
  timeoutSeconds: 900,
  entry: "./handler.ts",
});