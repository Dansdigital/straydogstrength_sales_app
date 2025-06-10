import {
  AdminCreateUserCommand,
  AdminAddUserToGroupCommand,
  CognitoIdentityProviderClient,
} from "@aws-sdk/client-cognito-identity-provider";
import { env } from "$amplify/env/create-user";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { Schema } from "../../../data/resource";
import { Amplify } from "aws-amplify";

const cognitoClient = new CognitoIdentityProviderClient();
const dynamoClient = generateClient<Schema>();

const { resourceConfig, libraryOptions } =
  await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);

type CreateUserInput = {
  email: string;
  firstName: string;
  lastName: string;
  tempPassword: string;
  groups: string[];
};

export const handler = async (event: { arguments: CreateUserInput }) => {
  try {
    const { email, firstName, lastName, groups, tempPassword } =
      event.arguments;

    // create user in cognito
    const command = new AdminCreateUserCommand({
      UserPoolId: env.AMPLIFY_AUTH_USERPOOL_ID,
      Username: email,
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "email_verified", Value: "true" },
        { Name: "given_name", Value: firstName },
        { Name: "family_name", Value: lastName },
      ],
      TemporaryPassword: tempPassword,
      MessageAction: "SUPPRESS",
      DesiredDeliveryMediums: ["EMAIL"],
    });

    const createUserResponse = await cognitoClient.send(command);
    const cognitoUserId = createUserResponse.User?.Username;

    if (!cognitoUserId) {
      throw new Error("Failed to create user - no user ID returned");
    }

    // Add user to specified groups
    if (groups && groups.length > 0) {
      for (const groupName of groups) {
        const addToGroupCommand = new AdminAddUserToGroupCommand({
          Username: email,
          GroupName: groupName,
          UserPoolId: env.AMPLIFY_AUTH_USERPOOL_ID,
        });
        await cognitoClient.send(addToGroupCommand);
      }
    }

    // create user in db model
    await dynamoClient.models.User.create({
      userId: cognitoUserId,
      firstName,
      lastName,
      email,
      groups: groups,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "User created successfully",
      }),
    };
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};
