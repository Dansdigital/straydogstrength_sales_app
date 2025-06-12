import { useState, useMemo } from "react";
import { generateClient } from "aws-amplify/data";
import { type Schema } from "amplify/data/resource.ts";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "../components/ui/table";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Loader2, Search } from "lucide-react";
import DefaultPageTemplate from "./defaultPageTemplate";
import LoadingMessage from "../components/global/LoadingMessage";

// Define the Shopify Product type
type ShopifyProduct = {
    id: number;
    title: string;
    body_html: string;
    vendor: string;
    product_type: string;
    handle: string;
    status: string;
    variants: Array<{
        id: number;
        sku: string;
        price: string;
        inventory_quantity: number;
    }>;
    images: Array<{
        id: number;
        src: string;
        alt: string;
    }>;
};

export function SyncProducts() {
    const [products, setProducts] = useState<ShopifyProduct[]>([]);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const client = generateClient<Schema>();

    // Filter products based on search query
    const filteredProducts = useMemo(() => {
        if (!searchQuery.trim()) return products;

        const query = searchQuery.toLowerCase();
        return products.filter(product =>
            product.title.toLowerCase().includes(query) ||
            product.variants.some(variant =>
                variant.sku?.toLowerCase().includes(query)
            )
        );
    }, [products, searchQuery]);

    const fetchShopifyProducts = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await client.queries.GetAllProducts();

            if (!response.data) {
                throw new Error('No data received from the sync function');
            }
            const productsArray = JSON.parse(response.data as string);
            // console.log('Products array:', productsArray);
            setProducts(productsArray);
        } catch (error) {
            console.error('Error fetching Shopify products:', error);
            setError(error instanceof Error ? error.message : 'Unknown error occurred');
        } finally {
            setLoading(false);
        }
    };
    const handleSyncAllProducts = async () => {
        setSyncing(true);
        for (const product of products) {
            try {
                await handleSyncProduct(product);
                await client.models.ProductSyncStatus.create({
                    product_id: product.id.toString(),
                    sync_status: 'SYNCED'
                });
            } catch (error) {
                console.error('Error syncing product:', error);
            }
        }
        setSyncing(false);
    }
    const handleSyncProduct = async (product: ShopifyProduct) => {
        setSyncing(true);
        console.log('Syncing product:', product);
        if (product.variants[0]?.sku === '') {
            setSyncing(false);
            return;
        }
        const response = await client.mutations.SaveProduct({
            RawProduct: JSON.stringify(product)
        });
        const productData = JSON.parse(response.data as string);
        console.log('Product data:', productData);
        // generate main product data
        const main_product_data = {
            product_id: productData.id,
            title: productData.title,
            sku: productData.variants[0].sku,
            main_image_url: productData.main_image_url,
            description: productData.body_html,
            product_specs: productData.product_specs,
            features: productData.features,
        }
        console.log('Main product data:', main_product_data);

        // generate pdf
        const pdfResponse = await client.mutations.GeneratePDF({
            Product: JSON.stringify(main_product_data)
        });
        const pdfData = JSON.parse(pdfResponse.data as string);
        console.log('PDF response:', pdfData);

        // upload pdf
        const uploadResponse = await client.mutations.UploadPDF({
            productId: productData.id,
            pdfUrl: pdfData.fileUrl,
            type: 'main'
        });
        console.log('main upload response:', uploadResponse);

        // generate variant data
        if (productData.variants.length > 1) {
            for (const variant of productData.variants) {
                const variant_data = {
                    ...main_product_data,
                    product_id: variant.id,
                    sku: variant.sku
                };
                console.log('Variant data:', variant_data);
                // generate pdf
                const pdfResponse = await client.mutations.GeneratePDF({
                    Product: JSON.stringify(variant_data)
                });
                const pdfData = JSON.parse(pdfResponse.data as string);
                console.log('PDF response:', pdfData);
                // upload pdf
                const uploadResponse = await client.mutations.UploadPDF({
                    productId: variant.id,
                    pdfUrl: pdfData.fileUrl,
                    type: 'variant'
                });
                console.log('variant upload response:', uploadResponse);
            }
        }

        setSyncing(false);
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-screen">
            <LoadingMessage message="Syncing products from Shopify..." />
        </div>
    );

    return (
        <DefaultPageTemplate
            title="Sync Products"
            description="Sync and view products from Shopify"
        >
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-4 items-center flex-1">
                        <Button
                            onClick={fetchShopifyProducts}
                            disabled={loading}
                            className="bg-[#cc2026] text-white hover:bg-[#a51920]"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Syncing...
                                </>
                            ) : (
                                'Get Products from Shopify'
                            )}
                        </Button>
                        <Button
                            onClick={handleSyncAllProducts}
                            disabled={loading}
                            className="bg-[#cc2026] text-white hover:bg-[#a51920]"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Syncing...
                                </>
                            ) : (
                                'Sync All Products'
                            )}
                        </Button>
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search products by title or SKU..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </div>
                    {products.length > 0 && (
                        <span className="text-sm text-gray-500">
                            {filteredProducts.length} of {products.length} products
                        </span>
                    )}
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                {filteredProducts.length > 0 && (
                    <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                        <Table>
                            <TableHeader className="sticky top-0 bg-black z-10">
                                <TableRow className="text-[var(--color-text-primary)] border border-[var(--color-border)]">
                                    <TableHead className="text-[var(--color-text-primary)]">Image</TableHead>
                                    <TableHead className="text-[var(--color-text-primary)]">Title</TableHead>
                                    <TableHead className="text-[var(--color-text-primary)]">SKU</TableHead>
                                    <TableHead className="text-[var(--color-text-primary)]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="text-[var(--color-text-primary)]">
                                {filteredProducts.map((product) => (
                                    <TableRow
                                        key={product.id}
                                        className="hover:bg-[var(--color-bg-primary-hover)] transition-colors duration-200"
                                    >
                                        <TableCell>
                                            {product.images && product.images[0] ? (
                                                <img
                                                    src={product.images[0].src}
                                                    alt={product.images[0].alt || product.title}
                                                    className="w-16 h-16 object-contain"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 bg-gray-100 flex items-center justify-center">
                                                    <span className="text-gray-400">No image</span>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>{product.title}</TableCell>
                                        <TableCell>{product.variants[0]?.sku || 'N/A'}</TableCell>
                                        <TableCell><Button variant="submit" onClick={() => handleSyncProduct(product)} className={`${syncing && (product.variants[0]?.sku === '') ? 'bg-gray-400 cursor-not-allowed' : ''}`} disabled={(syncing && (product.variants[0]?.sku === ''))}>{syncing ? 'Syncing...' : 'Sync'}</Button></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {!loading && !error && filteredProducts.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        {products.length === 0
                            ? "Click the sync button above to fetch products from Shopify"
                            : "No products match your search"}
                    </div>
                )}
            </div>
        </DefaultPageTemplate>
    );
} 