import { env } from '$amplify/env/upload-pdf';
import { getPdfMetafield, ProductResponse } from '../services';

const SHOPIFY_ACCESS_TOKEN = env.SHOPIFY_ACCESS_TOKEN;

interface FileDeleteResponse {
    data: {
        fileDelete: {
            deletedFileIds: string[];
            userErrors: Array<{ field: string; message: string }>;
        };
    };
}

async function deleteFile(fileId: string) {
    try {
        console.log('Attempting to delete file with ID:', fileId);
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
        console.log('File deletion response:', data);

        const result = {
            deletedIds: data?.data?.fileDelete?.deletedFileIds || [],
            errors: data?.data?.fileDelete?.userErrors || [],
        };

        if (result.errors.length > 0) {
            console.error('File deletion errors:', result.errors);
        } else if (result.deletedIds.length > 0) {
            console.log('Successfully deleted files:', result.deletedIds);
        } else {
            console.warn('No files were deleted and no errors reported');
        }

        return result;
    } catch (error) {
        console.error("Error deleting file:", error);
        throw error;
    }
}

async function uploadPdf(pdfurl: string, shopifyAccessToken: string) {
    const shopifyResponse = await fetch('https://011075-5.myshopify.com/admin/api/2024-04/graphql.json', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': shopifyAccessToken
        },
        body: JSON.stringify({
            query: "mutation fileCreate($files: [FileCreateInput!]!) { fileCreate(files: $files) { files { id } } }",
            variables: {
                files: {
                    alt: "Product PDF",
                    contentType: "FILE",
                    originalSource: pdfurl
                }
            }
        })
    });

    const shopifyData = await shopifyResponse.json();

    return {
        statusCode: 200,
        fileId: shopifyData.data.fileCreate.files[0].id,
        body: JSON.stringify({
            pdfurl,
            shopifyResponse: shopifyData,
            message: 'PDF upload successful'
        })
    };
}

async function createPdfLink(productId: string, value: string, shopifyAccessToken: string) {
    try {
        const response = await fetch(
            "https://011075-5.myshopify.com/admin/api/2024-10/graphql.json",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Shopify-Access-Token": shopifyAccessToken,
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
                                value: "${value}"
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
                        }`,
                    variables: {}
                })
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return {
            success: !data?.data?.metafieldsSet?.userErrors?.length,
            metafield: data?.data?.metafieldsSet?.metafields?.[0],
            errors: data?.data?.metafieldsSet?.userErrors || []
        };
    } catch (error) {
        console.error("Error updating PDF link metafield:", error);
        throw error;
    }
}

interface VariantPdfMetafieldResponse {
    data: {
        productVariant: {
            title: string;
            sku: string;
            pdfLink: {
                value: string;
            } | null;
        };
    };
}

async function getVariantPdfMetafield(variantId: string, shopifyAccessToken: string) {
    try {
        const response = await fetch(
            "https://011075-5.myshopify.com/admin/api/2024-07/graphql.json",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Shopify-Access-Token": shopifyAccessToken,
                },
                body: JSON.stringify({
                    query: `
                        query ProductVariantMetafield($namespace: String!, $key: String!, $ownerId: ID!) {
                            productVariant(id: $ownerId) {
                                title
                                sku
                                pdfLink: metafield(namespace: $namespace, key: $key) {
                                    value
                                }
                            }
                        }`,
                    variables: {
                        namespace: "custom",
                        key: "pdf_link",
                        ownerId: `gid://shopify/ProductVariant/${variantId}`
                    }
                })
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json() as VariantPdfMetafieldResponse;
        return {
            success: true,
            variant: data?.data?.productVariant,
            pdfLink: data?.data?.productVariant?.pdfLink?.value
        };
    } catch (error) {
        console.error("Error fetching variant PDF metafield:", error);
        throw error;
    }
}

interface VariantMetafieldUpdateResponse {
    data: {
        metafieldsSet: {
            metafields: Array<{
                id: string;
                key: string;
                value: string;
                namespace: string;
                type: string;
            }>;
            userErrors: Array<{
                field: string;
                message: string;
            }>;
        };
    };
}

async function updateVariantPdfLink(variantId: string, fileId: string, shopifyAccessToken: string) {
    try {
        const response = await fetch(
            "https://011075-5.myshopify.com/admin/api/2024-10/graphql.json",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Shopify-Access-Token": shopifyAccessToken,
                },
                body: JSON.stringify({
                    query: `
                        mutation UpdateVariantMetafield {
                            metafieldsSet(
                                metafields: [
                                    {
                                        ownerId: "${variantId}",
                                        namespace: "custom",
                                        key: "pdf_link",
                                        type: "file_reference",
                                        value: "${fileId}"
                                    }
                                ]
                            ) {
                                metafields {
                                    id
                                    key
                                    value
                                    namespace
                                    type
                                }
                                userErrors {
                                    field
                                    message
                                }
                            }
                        }`,
                    variables: {}
                })
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json() as VariantMetafieldUpdateResponse;
        return {
            success: !data?.data?.metafieldsSet?.userErrors?.length,
            metafield: data?.data?.metafieldsSet?.metafields?.[0],
            errors: data?.data?.metafieldsSet?.userErrors || []
        };
    } catch (error) {
        console.error("Error updating variant PDF link metafield:", error);
        throw error;
    }
}

export const handler = async (event: {
    arguments: {
        productId: string,
        pdfUrl: string,
        type: string
    }
}) => {
    try {
        if (!event.arguments) {
            throw new Error('No arguments provided');
        }

        const { productId, pdfUrl, type } = event.arguments;
        if (!productId || !pdfUrl || !type) {
            throw new Error('Product ID, PDF URL, and type are required');
        }

        const newPdfUrl = await uploadPdf(pdfUrl, SHOPIFY_ACCESS_TOKEN);

        if (type === 'main') {
            const pdfMetafield = await getPdfMetafield(productId, SHOPIFY_ACCESS_TOKEN);
            if (pdfMetafield) {
                await deleteFile(pdfMetafield.value);
            }
            const result = await createPdfLink(productId, newPdfUrl.fileId, SHOPIFY_ACCESS_TOKEN);
            return result;
        } else {
            const variantPdfMetafield = await getVariantPdfMetafield(productId, SHOPIFY_ACCESS_TOKEN);
            if (variantPdfMetafield.pdfLink) {
                await deleteFile(variantPdfMetafield.pdfLink);
            }
            const result = await updateVariantPdfLink(productId, newPdfUrl.fileId, SHOPIFY_ACCESS_TOKEN);
            return result;
        }

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to process product';
        console.error('Error processing raw product:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: errorMessage })
        };
    }
};