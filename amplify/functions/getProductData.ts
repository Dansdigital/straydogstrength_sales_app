import {
    RawProductInput,
    ProductData,
    getPdfMetafield,
    getPdfUrl,
    getProductImageUrl,
    getMetaObject,
    getMediaImageUrl
} from './services';

const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

interface Feature {
    title: string;
    imageSrc: string;
}

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

interface PdfFileResponse {
    data: {
        node: {
            url: string;
            id: string;
        };
    };
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

interface feature {
    title: string;
    imageSrc: string;
}

async function getProductVariant(variantId: string, SHOPIFY_ACCESS_TOKEN: string) {
    try {
        const response = await fetch(
            'https://011075-5.myshopify.com/admin/api/2024-07/graphql.json',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN
                },
                body: JSON.stringify({
                    query: `query ProductVariantMetafield($namespace: String!, $key: String!, $ownerId: ID!) {
                        productVariant(id: $ownerId) {
                            id
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

        const data = await response.json();
        return {
            id: data.data.productVariant.id || "",
            title: data.data.productVariant.title || "",
            sku: data.data.productVariant.sku || "",
            pdfLink: (data.data.productVariant.pdfLink) ? await getPdfUrl(data.data.productVariant.pdfLink.value, SHOPIFY_ACCESS_TOKEN) : null
        }
    } catch (error) {
        console.error('Error fetching Shopify variant:', error);
        throw error;
    }
};

async function getSpecs(productId: string, SHOPIFY_ACCESS_TOKEN: string) {
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

        const data = await response.json();
        if (data?.data?.product?.metafield?.value) {
            const rawSpec = await getMetaObject(data.data.product.metafield.value, SHOPIFY_ACCESS_TOKEN);
            return rawSpec.data.metaobject.fields;
        }

        return null;
    } catch (error) {
        console.error("Error fetching product metafields:", error);
        throw error;
    }
}

async function getFeatures(productId: string, SHOPIFY_ACCESS_TOKEN: string) {
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

        const data = await response.json();
        if (data?.data?.product?.metafield?.value) {
            const featuresIds = JSON.parse(data.data.product.metafield.value);
            let features = [];
            for (const featureId of featuresIds.slice(0, 3)) {
                let newFeature = { title: "", imageSrc: "" };
                const feature = await getMetaObject(featureId, SHOPIFY_ACCESS_TOKEN);
                for (const field of feature.data.metaobject.fields) {
                    if (field.key === "feature_title") {
                        newFeature.title = field.value;
                    }
                    if (field.key === "feature_image") {
                        newFeature.imageSrc = await getMediaImageUrl(field.value, SHOPIFY_ACCESS_TOKEN);
                    }
                }
                features.push(newFeature);
            }
            return features;
        }

        return [];
    } catch (error) {
        console.error("Error fetching product metafields:", error);
        throw error;
    }
}

export async function getProductData(RawProduct: RawProductInput, SHOPIFY_ACCESS_TOKEN: string) {
    try {
        if (!SHOPIFY_ACCESS_TOKEN) {
            throw new Error('SHOPIFY_ACCESS_TOKEN is not defined in environment variables');
        }

        let productData: ProductData = {
            id: RawProduct.id,
            product_id: RawProduct.id,
            title: RawProduct.title,
            sku: RawProduct?.variants?.[0]?.sku || "",
            handle: RawProduct.handle,
            description: RawProduct.body_html,
            status: RawProduct.status,
            main_image_url: "error getting main image",
            variants: [],
            pdf: {
                id: "",
                url: "",
            },
        };

        try {
            if (RawProduct.variants) {
                for (const variant of RawProduct.variants) {
                    productData.variants.push(await getProductVariant(variant.id, SHOPIFY_ACCESS_TOKEN));
                }
            }
        } catch (error) {
            console.error('Error fetching product variant:', error);
            productData.error = `Error fetching product variant: ${error instanceof Error ? error.message : String(error)}`;
        }

        try {
            if (RawProduct.admin_graphql_api_id) {
                productData.main_image_url = await getProductImageUrl(RawProduct.admin_graphql_api_id, SHOPIFY_ACCESS_TOKEN);
            }
        } catch (error) {
            console.error('Error fetching main image:', error);
            productData.error = `Error fetching main image: ${error instanceof Error ? error.message : String(error)}`;
        }

        try {
            if (RawProduct.id) {
                const specs = await getSpecs(RawProduct.id, SHOPIFY_ACCESS_TOKEN);
                if (specs) {
                    productData.product_specs = specs.map((spec: { key: string; value: string }) => ({
                        key: spec.key,
                        value: spec.value,
                        product_id: RawProduct.id
                    }));
                }
            }
        } catch (error) {
            console.error('Error fetching specs:', error);
            productData.error = (productData.error || '') + ` Error fetching specs: ${error instanceof Error ? error.message : String(error)}`;
        }

        try {
            if (RawProduct.admin_graphql_api_id) {
                const features = await getFeatures(RawProduct.id, SHOPIFY_ACCESS_TOKEN);
                if (features) {
                    productData.features = features;
                }
            }
        } catch (error) {
            console.error('Error fetching features:', error);
            productData.error = (productData.error || '') + ` Error fetching features: ${error instanceof Error ? error.message : String(error)}`;
        }

        try {
            if (RawProduct.id) {
                let pdf = {
                    id: "",
                    url: "",
                }
                const pdf_url = await getPdfMetafield(RawProduct.id, SHOPIFY_ACCESS_TOKEN);
                if (pdf_url) {
                    pdf.id = pdf_url.id;
                    pdf.url = await getPdfUrl(pdf_url.value, SHOPIFY_ACCESS_TOKEN) || "Not found";
                }
                productData.pdf = pdf;
            }
        } catch (error) {
            console.error('Error fetching pdf_url:', error);
            productData.error = (productData.error || '') + ` Error fetching pdf_url: ${error instanceof Error ? error.message : String(error)}`;
        }

        return productData;
    } catch (error) {
        console.error("Error editing data:", error);
        throw error;
    }
}