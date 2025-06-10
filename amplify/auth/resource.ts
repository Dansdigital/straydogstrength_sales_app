import { defineAuth } from "@aws-amplify/backend";
import { updateUser } from "../functions/user-management/update-user/resource";
import { createUser } from "../functions/user-management/create-user/resource";
import { deleteUser } from "../functions/user-management/delete-user/resource";

export const auth = defineAuth({
  loginWith: {
    email: true
  },
  userAttributes: {
    email: {
      required: true,
    },
    givenName: {
      required: false,
    },
    familyName: {
      required: false,
    },
  },
  groups: ["Admin", "Rep", "Customer"],
  access: (allow) => [
    allow.resource(createUser).to(["createUser"]),
    allow.resource(deleteUser).to(["deleteUser"]),
    allow.resource(updateUser).to(["updateGroup", "updateUserAttributes"]),
  ]
});
