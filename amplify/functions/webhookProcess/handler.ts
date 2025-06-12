import type { APIGatewayProxyHandler } from "aws-lambda";
import { getProductData } from '../getProductData';
import { hasProductDataChanged } from './compareProductData';
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/webhook-process";
import { Amplify } from 'aws-amplify';
import { generateClient } from "aws-amplify/data";
import { type Schema } from "../../data/resource";
import { type ProductData, createProductDynamoDB } from '../services';

const SHOPIFY_ACCESS_TOKEN = env.SHOPIFY_ACCESS_TOKEN;
export const client = generateClient<Schema>();

async function callGeneratePDFs(productData: any) {
  try {
    const result = await client.mutations.GeneratePDF({
      Product: JSON.stringify(productData)
    });
    return result;
  } catch (error) {
    console.error('Error calling generate-pdfs Lambda:', error);
    throw error;
  }
}

async function makeVariantsForPDF(productData: any) {
  let output = [];

  if (productData.variants.length > 0) {
    for (const variant of productData.variants) {
      output.push({
        sku: variant.sku,
        title: productData.title,
        product_specs: productData.product_specs,
        description: productData.description,
        product_features: productData.product_features,
        main_image_url: productData.main_image_url,
      });
    }
  }

  return output;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  const { resourceConfig, libraryOptions } =
    await getAmplifyDataClientConfig(env);
  Amplify.configure(resourceConfig, libraryOptions);
  // Parse the webhook data
  let webhookData;
  try {
    const hmac = event.headers['X-Shopify-Hmac-Sha256'];

    if (!hmac || !event.body) {
      console.log("Invalid Shopify webhook signature");
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Invalid Shopify webhook signature' })
      };
    }

    webhookData = JSON.parse(event.body);

    if (!SHOPIFY_ACCESS_TOKEN) {
      throw new Error('SHOPIFY_ACCESS_TOKEN is not defined in environment variables');
    }

    const productData: ProductData = await getProductData(webhookData, SHOPIFY_ACCESS_TOKEN);
    // console.log("Product data:\n", productData);

    if (event.headers['X-Shopify-Topic'] === 'products/update') {
      console.log("Product update");
      const test = await client.models.Product.get({ product_id: productData.product_id });
      console.log("test: ", test);
      // verify that the product data has changed
      // const hasChanged = await hasProductDataChanged(productData);
      const hasChanged = true;
      if (hasChanged) {

        console.log("Product data has changed");
        // delete product record
        await client.mutations.DeleteProductLambda({
          productId: productData.product_id,
        });

        // create product record
        await createProductDynamoDB(productData);

        // create pdfs
        // let variantResults = [];
        const mainPDFResult = await callGeneratePDFs(productData);
        // const variantsForPDF = await makeVariantsForPDF(productData);
        // for (const variant of variantsForPDF) {
        //   const variantPDFResult = await callGeneratePDFs(variant);
        //   variantResults.push(variantPDFResult);
        // }
        // console.log("PDF result:", mainPDFResult);
        // console.log("Variant PDF results:", variantResults);
      } else {
        console.log("Product data has not changed");
      }
      // send pdfs to s3
      // update product record with pdf url
    }

    if (event.headers['X-Shopify-Topic'] === 'products/create') {
      console.log("Product create");
    }

    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'No body found in event' })
      };
    }



    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*.myshopify.com",
        "Access-Control-Allow-Headers": "x-shopify-hmac-sha256",
      },
      body: JSON.stringify({
        message: "Webhook processed successfully",
        // productId: product.data?.product_id || productData.product_id
      }),
    };

  } catch (error) {
    console.error("Error processing webhook:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error processing webhook',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};