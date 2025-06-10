import { defineFunction } from "@aws-amplify/backend";

export const GeneratePDF = defineFunction({
  name: "generate-pdf",
  timeoutSeconds: 900,
  entry: "./handler.ts",
  resourceGroupName: 'storage',
});