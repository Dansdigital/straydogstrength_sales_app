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
// import { GetAllProducts } from "./functions/get-all-products/resourse";
// import { SaveProduct } from "./functions/save-product/resource";
// import { UploadPDF } from "./functions/upload-pdf/resource";
// import { GetProducts } from "./functions/get-products/resource";
// import { DeleteProduct } from "./functions/delete-product/resource";
// import { defineFunction } from '@aws-amplify/backend';

const backend = defineBackend({
  auth,
  data,
  storage,
  webhookProcess,
  GeneratePDF,
  // GetAllProducts,
  // SaveProduct,
  // UploadPDF,
  // GetProducts,
  // DeleteProduct,
});

// create a new API stack
const apiStack = backend.createStack("api-stack");

// create a new REST API
const myRestApi = new RestApi(apiStack, "RestApi", {
  restApiName: "myRestApi",
  deploy: true,
  deployOptions: {
    stageName: "dev",
  },
  defaultCorsPreflightOptions: {
    allowOrigins: Cors.ALL_ORIGINS, // Restrict this to domains you trust
    allowMethods: Cors.ALL_METHODS, // Specify only the methods you need to allow
    allowHeaders: Cors.DEFAULT_HEADERS, // Specify only the headers you need to allow
  },
});

// create a new Lambda integration
const lambdaIntegration = new LambdaIntegration(
  backend.webhookProcess.resources.lambda
);

// create a new public resource path with NO authorization
const publicPath = myRestApi.root.addResource("public", {
  defaultMethodOptions: {
    authorizationType: AuthorizationType.NONE,
  },
});

// add methods to the public path
publicPath.addMethod("GET", lambdaIntegration);
publicPath.addMethod("POST", lambdaIntegration);

// // Add DynamoDB permissions for the webhook Lambda
// const dynamodbPolicy = new PolicyStatement({
//   actions: [
//     "dynamodb:GetItem",
//     "dynamodb:PutItem",
//     "dynamodb:UpdateItem",
//     "dynamodb:DeleteItem",
//     "dynamodb:Query",
//     "dynamodb:Scan",
//     "dynamodb:BatchGetItem",
//     "dynamodb:BatchWriteItem"
//   ],
//   resources: ["*"] // In production, restrict this to specific table ARNs
// });

// // Grant DynamoDB permissions to the webhook Lambda
// backend.webhookProcess.resources.lambda.addToRolePolicy(dynamodbPolicy);

// create a new IAM policy to allow Invoke access to the API
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

// attach the policy to the authenticated and unauthenticated IAM roles
backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(
  apiRestPolicy
);
backend.auth.resources.unauthenticatedUserIamRole.attachInlinePolicy(
  apiRestPolicy
);

// add outputs to the configuration file
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
