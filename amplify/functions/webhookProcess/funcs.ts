import { generateProductPDF } from "./generatePdfs";
import {
  existsSync,
  unlink,
} from "fs";
import fetch from "node-fetch";

const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN as string;

interface MetaObjectResponse {
  data: {
    metaobject: {
      fields: Array<{ key: string; type: string; value: string }>;
    };
  };
}


interface ProductResponse {
  data: {
    product: {
      metafield: {
        id: string;
        value: string;
        type: string;
      };
    };
  };
}


interface Feature {
  name?: string;
  imageSrc?: string;
}


interface FileResponse {
  data: {
    node: {
      image?: {
        url: string;
      };
      url?: string;
    };
  };
}


interface FileCreateResponse {
  data: {
    fileCreate: {
      files: Array<{ id: string }>;
      userErrors: Array<{ field: string; message: string }>;
    };
  };
}


interface MetafieldsSetResponse {
  data: {
    metafieldsSet: {
      metafields: Array<{ id: string; namespace: string; key: string; value: string }>;
      userErrors: Array<{ field: string; message: string }>;
    };
  };
}

interface FileDeleteResponse {
  data: {
    fileDelete: {
      deletedFileIds: string[];
      userErrors: Array<{ field: string; message: string }>;
    };
  };
}

interface ProductUpdateResponse {
  data: {
    productUpdate: {
      product: {
        metafields: {
          edges: Array<{ node: { id: string; namespace: string; key: string; value: string } }>;
        };
      };
      userErrors: Array<{ message: string; field: string }>;
    };
  };
}

export async function getMetaObject(specId: string) {
  try {
    const response = await fetch(
      "https://011075-5.myshopify.com/admin/api/2024-07/graphql.json",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        },
        body: JSON.stringify({
          query: `
              query {
                metaobject(id: "${specId}") {
                  displayName,
                  fields {
                    key
                    type
                    value
                  }
                }
              }
            `,
          variables: {},
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Then type the response
    const data = await response.json() as MetaObjectResponse;
    return data;
  } catch (error) {
    console.error("Test failed:", error);
    throw error;
  }
}

export async function getSpecs(productId: string) {
  try {
    const response = await fetch(
      "https://011075-5.myshopify.com/admin/api/2024-07/graphql.json",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        },
        body: JSON.stringify({
          query: `
          query {
            product(id: "gid://shopify/Product/${productId}") {
              metafield(namespace: "custom", key: "specs") {
                id
                value
                type
              }
            }
          }
        `,
          variables: {},
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as ProductResponse;
    console.log("data: ", data);
    // Check if there's a value and return just the value if it exists
    if (data?.data?.product?.metafield?.value) {
      // return data.data.product.metafield.value;
      const rawSpec = await getMetaObject(data.data.product.metafield.value);
      return rawSpec.data.metaobject.fields;
    }

    return null; // Return null if no value exists
  } catch (error) {
    console.error("Error fetching product metafields:", error);
    throw error;
  }
}

export async function getFeatures(productId: string) {
  try {
    const response = await fetch(
      "https://011075-5.myshopify.com/admin/api/2024-07/graphql.json",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        },
        body: JSON.stringify({
          query: `
          query {
            product(id: "gid://shopify/Product/${productId}") {
              metafield(namespace: "custom", key: "product_features") {
                id
                value
                type
              }
            }
          }
        `,
          variables: {},
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as ProductResponse;
    // Parse the string value into an array if it exists
    if (data?.data?.product?.metafield?.value) {
      const featuresIds = JSON.parse(data.data.product.metafield.value);
      let features = [];
      for (const featureId of featuresIds.slice(0, 3)) {
        let newFeature: Feature = {};
        const feature = await getMetaObject(featureId);
        for (const field of feature.data.metaobject.fields) {
          if (field.key === "feature_title") {
            newFeature.name = field.value;
          }
          if (field.key === "feature_image") {
            newFeature.imageSrc = await getMediaImageUrl(field.value);
          }
        }
        features.push(newFeature);
      }
      return features;
    }

    return []; // Return empty array if no value exists
  } catch (error) {
    console.error("Error fetching product metafields:", error);
    throw error;
  }
}

export async function editData(productData: any) {
  try {

    productData.specs = await getSpecs(productData.id);
    // productData.features = await getFeatures(productData.id);
    // const test = await getPdfMetafield(productData.id);
    // console.log(test);
    // productData.pdf_link = await getPdfMetafield(productData.id);
    // console.log(productData);

    return productData;
  } catch (error) {
    console.error("Error editing data:", error);
    throw error;
  }
}

export async function getMediaImageUrl(mediaImageId: string) {
  try {
    const response = await fetch(
      "https://011075-5.myshopify.com/admin/api/2024-07/graphql.json",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        },
        body: JSON.stringify({
          query: `
          query {
            node(id: "${mediaImageId}") {
              id
              ... on MediaImage {
                image {
                  url
                }
              }
            }
          }
        `,
          variables: {},
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as FileResponse;

    // Check if data exists and has the expected structure
    if (!data?.data?.node?.image?.url) {
      console.error("Invalid response structure:", data);
      throw new Error("Media image URL not found in response");
    }

    // Log the URL for debugging
    // console.log('Retrieved media image URL:', data.data.node.image.url);

    return data.data.node.image.url;
  } catch (error) {
    console.error("Error fetching media image URL:", error);
    throw error;
  }
}

export async function createFileFromPdfUrl(pdfUrl: string, altText = "test") {
  try {
    const response = await fetch(
      "https://011075-5.myshopify.com/admin/api/2024-04/graphql.json",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        },
        body: JSON.stringify({
          query: `
          mutation fileCreate($files: [FileCreateInput!]!) {
            fileCreate(files: $files) {
              files {
                id
              }
              userErrors {
                field
                message
              }
            }
          }
        `,
          variables: {
            files: {
              alt: altText,
              contentType: "FILE",
              originalSource: pdfUrl,
            },
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as FileCreateResponse;
    // console.log(data);
    return data.data.fileCreate.files[0].id;
  } catch (error) {
    console.error("Error creating file from PDF URL:", error);
    throw error;
  }
}

export async function getPdfMetafield(productId: string) {
  try {
    const response = await fetch(
      "https://011075-5.myshopify.com/admin/api/2024-07/graphql.json",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        },
        body: JSON.stringify({
          query: `
          query getProductPdfLink($productId: ID!) {
            product(id: $productId) {
              metafield(namespace: "custom", key: "pdf_link") {
                id
                value
                type
              }
            }
          }
        `,
          variables: {
            productId: `gid://shopify/Product/${productId}`,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as ProductResponse;
    // console.log(`product data get metafield: ${data.data.product.metafield}`);
    if (data?.data?.product?.metafield?.value) {
      return {
        id: data?.data?.product?.metafield?.id,
        value: data?.data?.product?.metafield?.value,
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching PDF metafield:", error);
    throw error;
  }
}

export async function deleteFile(fileId: string) {
  try {
    const response = await fetch(
      "https://011075-5.myshopify.com/admin/api/2024-07/graphql.json",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        },
        body: JSON.stringify({
          query: `
          mutation fileDelete($input: [ID!]!) {
            fileDelete(fileIds: $input) {
              deletedFileIds
              userErrors {
                field
                message
              }
            }
          }
        `,
          variables: {
            input: [fileId],
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as FileDeleteResponse;
    return {
      deletedIds: data?.data?.fileDelete?.deletedFileIds || [],
      errors: data?.data?.fileDelete?.userErrors || [],
    };
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
}

export async function updateProductMetafield(productId: string, metafieldId: string, newValue: string) {
  try {
    const response = await fetch(
      "https://011075-5.myshopify.com/admin/api/2024-07/graphql.json",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        },
        body: JSON.stringify({
          query: `
          mutation updateProductMetafields($input: ProductInput!) {
            productUpdate(input: $input) {
              product {
                id
                metafields(first: 50) {
                  edges {
                    node {
                      id
                      namespace
                      key
                      value
                    }
                  }
                }
              }
              userErrors {
                message
                field
              }
            }
          }
        `,
          variables: {
            input: {
              metafields: [
                {
                  id: metafieldId,
                  value: newValue,
                },
              ],
              id: `gid://shopify/Product/${productId}`,
            },
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as ProductUpdateResponse;
    // console.log(`update product metafield: ${data}`);
    return {
      success: !data?.data?.productUpdate?.userErrors?.length,
      metafields:
        data?.data?.productUpdate?.product?.metafields?.edges?.map(
          (edge) => edge.node
        ) || [],
      errors: data?.data?.productUpdate?.userErrors || [],
    };
  } catch (error) {
    console.error("Error updating product metafield:", error);
    throw error;
  }
}

export async function deleteFileFromPath(filePath: string) {
  try {
    // Check if file exists
    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Delete the file
    await unlink(filePath, (error) => {
      if (error) {
        console.error('Error deleting file:', error);
        return;
      }
    });

    return {
      success: true,
      message: `File deleted: ${filePath}`,
    };
  } catch (error: unknown) {
    console.error("Error deleting file:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function processWebhook(productData: any) {
  try {
    // console.log("Product data fetched:", productData.id);

    if (productData.pdf_link !== null) {
      // console.log("Deleting existing PDF file...");
      await deleteFile(productData.pdf_link);
      // console.log("Existing PDF deleted successfully");
    }

    // console.log("Generating new PDF...");
    const fileName = await generateProductPDF(productData);
    let pdfUrl = `${process.env.NGROK_URL}/pdfs/${fileName}`;
    // console.log("PDF generated:", pdfUrl);

    const altText = productData.title + " PDF";
    // console.log("Creating file in Shopify...");
    const mediaImageId = await createFileFromPdfUrl(pdfUrl, altText);
    // console.log("File created in Shopify:", mediaImageId);

    // console.log("Updating product metafield...");
    const setPdfLink = await setProductPdfLink(productData.id, mediaImageId);
    // console.log("setPdfLink response:", setPdfLink);

    if (!setPdfLink?.metafields?.[0]?.value) {
      throw new Error('Failed to get valid fileId from setProductPdfLink');
    }

    // Wait for fileId to be available
    const fileId = setPdfLink.metafields[0].value;
    // console.log("FileID received:", fileId);

    // Add delay to ensure file is processed
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get file URL with retries
    let retries = 3;

    while (retries > 0) {
      try {
        pdfUrl = await getFileUrl(fileId);
        if (pdfUrl) break;
      } catch (error) {
        console.log(`Attempt ${4 - retries} failed:`, error);
        retries--;
        if (retries === 0) throw error;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    if (!pdfUrl) {
      throw new Error('Failed to get PDF URL after multiple attempts');
    }

    await deleteFileFromPath(`pdfs/${fileName}`);

    return {
      success: true,
      pdfUrl,
      mediaImageId,
    };
  } catch (error) {
    console.error("Error in processWebhook:", error);
    throw error; // Re-throw to be caught by the main handler
  }
}

export async function setProductPdfLink(productId: string, fileId: string) {
  try {
    const response = await fetch(
      "https://011075-5.myshopify.com/admin/api/2024-10/graphql.json",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        },
        body: JSON.stringify({
          query: `
          mutation SetProductMetafield {
            metafieldsSet(
              metafields: [
                {
                  ownerId: "gid://shopify/Product/${productId}",
                  namespace: "custom",
                  key: "pdf_link",
                  type: "file_reference",
                  value: "${fileId}"
                }
              ]
            ) {
              metafields {
                id
                namespace
                key
                value
              }
              userErrors {
                field
                message
              }
            }
          }
        `,
          variables: {},
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as MetafieldsSetResponse;

    if (data.data?.metafieldsSet?.userErrors?.length > 0) {
      throw new Error(
        `GraphQL Error: ${data.data.metafieldsSet.userErrors[0].message}`
      );
    }

    return {
      success: true,
      metafields: data.data?.metafieldsSet?.metafields || [],
      errors: [],
    };
  } catch (error: unknown) {
    console.error("Error setting product metafield:", error);
    return {
      success: false,
      metafields: [],
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

export async function getFileUrl(fileId: string) {
  try {
    const response = await fetch(
      "https://011075-5.myshopify.com/admin/api/2024-07/graphql.json",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        },
        body: JSON.stringify({
          query: `
          query {
            node(id: "${fileId}") {
              id
              ... on GenericFile {
                  url
              }
            }
          }
        `,
          variables: {},
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as FileResponse;
    if (!data?.data?.node?.url) {
      throw new Error("File URL not found in response");
    }
    return data.data.node.url;
  } catch (error) {
    console.error("Error fetching media image URL:", error);
    throw error;
  }
}

export async function getShopifyProducts() {
  try {
    const response = await fetch(
      `https://011075-5.myshopify.com/admin/products.json?limit=250`,
      {
        method: 'GET',
        headers: {
          // 'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN
          'X-Shopify-Access-Token': "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"
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching Shopify products:', error);
    throw error;
  }
}

