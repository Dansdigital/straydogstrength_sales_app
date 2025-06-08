import { defineFunction, secret } from "@aws-amplify/backend";
import outputs from "../../../amplify_outputs.json";

export const webhookProcess = defineFunction({
  name: "webhook-process",
  environment: {
    SHOPIFY_ACCESS_TOKEN: secret('SHOPIFY_ACCESS_TOKEN'),
    AMPLIFY_API_KEY: outputs.data.api_key,
    AMPLIFY_DATA_GRAPHQL_ENDPOINT: outputs.data.url,
  },
  timeoutSeconds: 900,
  entry: "./handler.ts",
});