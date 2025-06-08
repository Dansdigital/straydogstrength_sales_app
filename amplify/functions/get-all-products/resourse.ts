import { defineFunction, secret } from "@aws-amplify/backend";

export const GetAllProducts = defineFunction({
  name: "get-all-products",
  environment: {
    SHOPIFY_ACCESS_TOKEN: secret('SHOPIFY_ACCESS_TOKEN')
  },
  timeoutSeconds: 900,
  entry: "./handler.ts",
}); 