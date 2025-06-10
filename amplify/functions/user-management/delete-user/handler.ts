import {
  AdminDeleteUserCommand,
  CognitoIdentityProviderClient,
} from "@aws-sdk/client-cognito-identity-provider";
import { env } from "$amplify/env/delete-user";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { Schema } from "../../../data/resource";
import { Amplify } from "aws-amplify";

const cognitoClient = new CognitoIdentityProviderClient();
const dynamoClient = generateClient<Schema>();

const { resourceConfig, libraryOptions } =
  await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);

type DeleteUserInput = {
  userId: string;
};

export const handler = async (event: { arguments: DeleteUserInput }) => {
  try {
    const { userId } = event.arguments;

    // delete user in cognito
    const command = new AdminDeleteUserCommand({
      UserPoolId: env.AMPLIFY_AUTH_USERPOOL_ID,
      Username: userId,
    });

    await cognitoClient.send(command);

    // delete user in table
    await dynamoClient.models.User.delete({
      userId: userId,
    });

    return {
      statusCode: 200,
      body: {
        message: `User ${userId} successfully deleted`,
      },
    };
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};
