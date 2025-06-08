import { defineFunction, secret } from "@aws-amplify/backend";

export const DeleteProduct = defineFunction({
    name: "delete-product",
    entry: "./handler.ts",
    environment: {
        SHOPIFY_ACCESS_TOKEN: secret('SHOPIFY_ACCESS_TOKEN')
    },
});