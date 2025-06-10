import { defineFunction } from "@aws-amplify/backend";

export const updateUser = defineFunction({
  name: "update-user",
  entry: "./handler.ts",
  resourceGroupName: 'auth',
});
