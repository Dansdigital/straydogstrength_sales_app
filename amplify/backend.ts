import { defineBackend } from "@aws-amplify/backend";
import { Stack } from "aws-cdk-lib";
import {
  AuthorizationType,
  Cors,
  LambdaIntegration,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { Policy, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { storage } from './storage/resource';
import { webhookProcess } from "./functions/webhookProcess/resource";
import { GeneratePDF } from "./functions/generate-pdf/resource";
import { createUser } from "./functions/user-management/create-user/resource";
import { updateUser } from "./functions/user-management/update-user/resource";
import { deleteUser } from "./functions/user-management/delete-user/resource";
import * as iam from "aws-cdk-lib/aws-iam";

const backend = defineBackend({
  auth,
  data,
  storage,
  webhookProcess,
  GeneratePDF,
  createUser,
  updateUser,
  deleteUser,
});

const apiStack = backend.createStack("api-stack");

const myRestApi = new RestApi(apiStack, "RestApi", {
  restApiName: "StrayDogStrengthSalesApp",
  deploy: true,
  deployOptions: {
    stageName: "dev",
  },
  defaultCorsPreflightOptions: {
    allowOrigins: Cors.ALL_ORIGINS,
    allowMethods: Cors.ALL_METHODS,
    allowHeaders: Cors.DEFAULT_HEADERS,
  },
});

const lambdaIntegration = new LambdaIntegration(
  backend.webhookProcess.resources.lambda
);

const publicPath = myRestApi.root.addResource("public", {
  defaultMethodOptions: {
    authorizationType: AuthorizationType.NONE,
  },
});

publicPath.addMethod("GET", lambdaIntegration);
publicPath.addMethod("POST", lambdaIntegration);

const apiRestPolicy = new Policy(apiStack, "RestApiPolicy", {
  statements: [
    new PolicyStatement({
      actions: ["execute-api:Invoke"],
      resources: [
        `${myRestApi.arnForExecuteApi("*", "/public", "dev")}`,
      ],
    }),
  ],
});

backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(
  apiRestPolicy
);
backend.auth.resources.unauthenticatedUserIamRole.attachInlinePolicy(
  apiRestPolicy
);

backend.addOutput({
  custom: {
    API: {
      [myRestApi.restApiName]: {
        endpoint: myRestApi.url,
        region: Stack.of(myRestApi).region,
        apiName: myRestApi.restApiName,
      },
    },
  },
});

export const bucketName = backend.storage.resources.bucket.bucketName;

const s3Policy = new PolicyStatement({
  actions: [
    "s3:GetObject",
    "s3:PutObject",
    "s3:DeleteObject",
    "s3:ListBucket"
  ],
  resources: ["arn:aws:s3:::" + bucketName, "arn:aws:s3:::" + bucketName + "/*"],
});

backend.GeneratePDF.resources.lambda.addToRolePolicy(s3Policy);

backend.createUser.resources.lambda.role?.addToPrincipalPolicy(
  new iam.PolicyStatement({
    sid: "AdminAddUserToGroup",
    actions: ["cognito-idp:AdminAddUserToGroup"],
    resources: ["*"],
  }),
);

backend.updateUser.resources.lambda.role?.addToPrincipalPolicy(
  new iam.PolicyStatement({
    sid: "AdminAddUserToGroup",
    actions: [
      "cognito-idp:AdminAddUserToGroup",
      "cognito-idp:AdminRemoveUserFromGroup",
    ],
    resources: ["*"],
  }),
);
