import type { APIGatewayProxyHandler } from "aws-lambda";
import { getProductData } from './helper/getProductData';
import { hasProductDataChanged } from './helper/compareProductData';
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/webhook-process";
import { Amplify } from 'aws-amplify';
import { generateClient } from "aws-amplify/data";
import { type Schema } from "../../data/resource";
import { type ProductData } from '../services';

const SHOPIFY_ACCESS_TOKEN = env.SHOPIFY_ACCESS_TOKEN;
export const client = generateClient<Schema>();

// Initialize Lambda client
const lambdaClient = new LambdaClient({
  region: env.AWS_REGION || 'us-east-2'
});

// Function to call generate-pdfs Lambda
async function callGeneratePDFs(productData: any) {
  try {
    const command = new InvokeCommand({
      FunctionName: process.env.GENERATE_PDFS_FUNCTION_NAME || 'generate-pdfs',
      Payload: JSON.stringify({
        arguments: {
          ProductArray: [productData]
        }
      })
    });

    const response = await lambdaClient.send(command);
    if (!response.Payload) {
      throw new Error('No payload received from generate-pdfs Lambda');
    }

    const result = JSON.parse(Buffer.from(response.Payload).toString());
    return result;
  } catch (error) {
    console.error('Error calling generate-pdfs Lambda:', error);
    throw error;
  }
}

async function createProduct(productData: ProductData) {
  try {
    const product = await client.models.Product.create({
      product_id: productData.product_id,
      main_sku: productData.sku,
      title: productData.title,
      description: productData.description,
      main_image_url: productData.main_image_url,
      main_pdf_link: {
        id: productData.pdf.id,
        url: productData.pdf.url,
      },
      status: productData.status,
    });
    for (const variant of productData.variants) {
      await client.models.ProductVariant.create({
        product_id: productData.product_id,
        variant_id: variant.id,
        sku: variant.sku,
        title: variant.title,
        pdfLink: variant.pdfLink,
      });
    }
    for (const feature of productData.features || []) {
      await client.models.ProductFeature.create({
        product_id: productData.product_id,
        title: feature.title,
        image: feature.imageSrc,
      });
    }
    for (const spec of productData.product_specs || []) {
      await client.models.ProductSpec.create({
        product_id: productData.product_id,
        key: spec.key,
        value: spec.value,
      });
    }
    return product;
  } catch (error) {
    console.error('Error creating product:', error);
  }
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

    const productData: ProductData = await getProductData(webhookData, SHOPIFY_ACCESS_TOKEN);
    console.log("Product data:\n", productData);

    if (event.headers['X-Shopify-Topic'] === 'products/update') {
      console.log("Product update");

      // verify that the product data has changed
      const hasChanged = await hasProductDataChanged(productData);
      if (hasChanged) {
        console.log("Product data has changed");
        // delete product record
        const deleteProduct = await client.mutations.DeleteProductLambda({
          productId: productData.product_id,
        });
        console.log("Deleted product record:", deleteProduct);

        // create product record
        const product = await createProduct(productData);
        console.log("Created product record:", product);
      } else {
        console.log("Product data has not changed");
      }
      // create pdfs
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

    // const url = await getMediaImageUrl("gid://shopify/ProductImage/42900839006458");
    // console.log("URL: ", url);

    if (!SHOPIFY_ACCESS_TOKEN) {
      throw new Error('SHOPIFY_ACCESS_TOKEN is not defined in environment variables');
    }



    // Check if data has changed
    // const hasChanged = await hasProductDataChanged(productData);
    // console.log("Has changed:", hasChanged);

    // if (!hasChanged) {
    //   return {
    //     statusCode: 200,
    //     body: JSON.stringify({ 
    //       message: "No changes detected",
    //       productId: productData.product_id
    //     })
    //   };
    // }

    // // Initialize the Amplify Data client
    // const client = generateClient<Schema>();

    // // Create/Update the product record
    // const product = await client.models.Product.create({
    //   product_id: productData.product_id,
    //   sku: productData.sku,
    //   title: productData.title,
    //   description: productData.description,
    //   main_image_url: productData.main_image_url,
    //   pdf: productData.pdf.url,
    //   status: productData.status,
    //   error: productData.error,
    // });

    // // If there are features, create them
    // if (productData.features) {
    //   for (const feature of productData.features) {
    //     await client.models.ProductFeature.create({
    //       title: feature.title,
    //       image: feature.imageSrc,
    //       product_id: productData.product_id,
    //     });
    //   }
    // }

    // If there are specs, create them

    // console.log("Created product record:", product);

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