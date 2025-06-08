import { defineFunction, secret } from "@aws-amplify/backend";

export const SaveProduct = defineFunction({
  name: "save-product",
  environment: {
    SHOPIFY_ACCESS_TOKEN: secret('SHOPIFY_ACCESS_TOKEN')
  },
  timeoutSeconds: 60,
  entry: "./handler.ts",
});