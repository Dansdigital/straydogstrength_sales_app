import {
  AdminAddUserToGroupCommand,
  CognitoIdentityProviderClient,
  AdminUpdateUserAttributesCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { env } from "$amplify/env/update-user";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { Schema } from "../../../data/resource";
import { Amplify } from "aws-amplify";
import { AdminRemoveUserFromGroupCommand } from "@aws-sdk/client-cognito-identity-provider";

const cognitoClient = new CognitoIdentityProviderClient();
const dynamoClient = generateClient<Schema>();

const { resourceConfig, libraryOptions } =
  await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);

type CreateUserInput = {
  userId: string;
  firstName: string;
  lastName: string;
  newGroups: string[];
};

export const handler = async (event: { arguments: CreateUserInput }) => {
  try {
    const { firstName, lastName, newGroups, userId } =
      event.arguments;

    const oldGroupsResponse = await dynamoClient.models.User.get(
      {
        userId: userId,
      },
      {
        selectionSet: ["groups"],
      },
    );
    const oldGroups = oldGroupsResponse.data?.groups;

    let groupsToRemove: string[] = [];
    let groupsToAdd: string[] = [];

    if (oldGroups && oldGroups.length > 0) {
      groupsToRemove = oldGroups.filter(
        (group): group is string =>
          group !== null && !newGroups.includes(group),
      );
      groupsToAdd = newGroups.filter(
        (group): group is string =>
          group !== null && !oldGroups.includes(group),
      );
    }

    // remove user from groups cogntio
    for (const group of groupsToRemove) {
      const command = new AdminRemoveUserFromGroupCommand({
        Username: userId,
        GroupName: group,
        UserPoolId: env.AMPLIFY_AUTH_USERPOOL_ID,
      });
      await cognitoClient.send(command);
    }
    // add user to groups cognito
    for (const group of groupsToAdd) {
      const command = new AdminAddUserToGroupCommand({
        Username: userId,
        GroupName: group,
        UserPoolId: env.AMPLIFY_AUTH_USERPOOL_ID,
      });
      await cognitoClient.send(command);
    }
    // update user in cognito
    const updateUserCommand = new AdminUpdateUserAttributesCommand({
      Username: userId,
      UserPoolId: env.AMPLIFY_AUTH_USERPOOL_ID,
      UserAttributes: [
        { Name: "given_name", Value: firstName },
        { Name: "family_name", Value: lastName },
      ],
    });
    await cognitoClient.send(updateUserCommand);
    // update user in dynamo
    await dynamoClient.models.User.update({
      userId: userId,
      firstName: firstName,
      lastName: lastName,
      groups: newGroups,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "User updated successfully",
      }),
    };
  } catch (error) {
    console.error("Error editing user:", error);
    throw error;
  }
};
