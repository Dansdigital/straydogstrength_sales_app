// import { Amplify } from 'aws-amplify';
// import { generateClient } from "aws-amplify/data";
// import { type Schema } from "../../../data/resource";
// import { env } from "$amplify/env/webhook-process";

// const endpoint = env.AMPLIFY_DATA_GRAPHQL_ENDPOINT;
// const region = env.AWS_REGION;
// const apiKey = env.AMPLIFY_API_KEY;

// if (!endpoint || !region || !apiKey) {
//     throw new Error('Required environment variables are not set');
// }

// Amplify.configure({
//     API: {
//         GraphQL: {
//             endpoint,
//             region,
//             defaultAuthMode: "apiKey",
//             apiKey
//         }
//     }
// });

// const client = generateClient<Schema>({
//     authMode: 'apiKey',
//     apiKey: apiKey
// });

// export async function saveProductToDynamoDB(product: any) {
//     try {
//         // First create the product
//         const productResult = await client.models.Product.create({
//             product_id: product.id,
//             title: product.title,
//             main_sku: product.sku,
//             status: product.status,
//             description: product.description || product.body_html,
//             main_image_url: product.main_image_url,
//             main_pdf_link: {
//                 id: product.pdf.id,
//                 url: product.pdf.url
//             },
//         });

//         if (!productResult) {
//             throw new Error(`Failed to save product ${product.title} to DynamoDB`);
//         }

//         // Save variants if they exist
//         if (product.variants && product.variants.length > 0) {
//             for (const variant of product.variants) {
//                 await client.models.ProductVariant.create({
//                     variant_id: variant.id,
//                     title: variant.title,
//                     sku: variant.sku,
//                     pdfLink: variant.pdfLink || '',
//                     product_id: product.id
//                 });
//             }
//         }

//         // Save features if they exist
//         if (product.features && product.features.length > 0) {
//             for (const feature of product.features) {
//                 await client.models.ProductFeature.create({
//                     title: feature.title,
//                     image: feature.imageSrc,
//                     product_id: product.id
//                 });
//             }
//         }

//         // Save product specs if they exist
//         if (product.product_specs && product.product_specs.length > 0) {
//             for (const spec of product.product_specs) {
//                 if (spec.value !== null) {
//                     await client.models.ProductSpec.create({
//                         key: spec.key,
//                         value: spec.value,
//                         product_id: product.id
//                     });
//                 }
//             }
//         }
//     } catch (err) {
//         console.error('Error saving product to DynamoDB:', err);
//     }
// }