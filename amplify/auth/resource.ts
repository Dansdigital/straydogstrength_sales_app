import { defineAuth } from "@aws-amplify/backend";

export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  groups: ["Admin", "Rep", "Customer"],
  triggers: {
  },
});
