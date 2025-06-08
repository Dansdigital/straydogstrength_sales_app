import { defineFunction, secret } from "@aws-amplify/backend";

export const UploadPDF = defineFunction({
    name: "upload-pdf",
    timeoutSeconds: 900,
    environment: {
        SHOPIFY_ACCESS_TOKEN: secret('SHOPIFY_ACCESS_TOKEN')
    },
    entry: "./handler.ts",
});