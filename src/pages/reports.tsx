import { useState, useEffect } from "react";
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
import { Input } from "../components/ui/input";
import { Progress } from "../components/ui/progress";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { Loader2, ArrowUp, ArrowDown } from "lucide-react";
import DefaultPageTemplate from "./defaultPageTemplate";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";

// Define the Product type based on your schema
type Product = {
    product_id: string;
    sku?: string | null;
    title?: string | null;
    description?: string | null;
    main_image_url?: string | null;
    pdf?: PdfData | null;
    material_tubing?: string | null;
    height?: string | null;
    width?: string | null;
    depth?: string | null;
    weight?: string | null;
    foot_print?: string | null;
    made_in_usa?: string | null;
    status?: string | null;
    created_at?: string | null;
    product_features?: ProductFeature[];
    product_specs?: ProductSpec[];
    order?: number; // Added for ordering
};

type PdfData = {
    id: string;
    url: string;
};

type ProductFeature = {
    title?: string | null;
    image?: string | null;
};

type ProductSpec = {
    key?: string | null;
    value?: string | null;
};

export function Reports() {
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [progress, setProgress] = useState(0);
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [isProcessing, setIsProcessing] = useState(false);
    const client = generateClient<Schema>();

    useEffect(() => {
        fetchProducts();
    }, []);

    async function fetchProducts() {
        try {
            setProgress(10);
            const response = await client.models.Product.list();
            setProgress(20);
            const rawProducts = response.data || [];
            const productsWithDetails: Product[] = [];
            for (const rawProduct of rawProducts) {
                const features = await rawProduct.product_features();
                const specs = await rawProduct.product_specs();
                const product: Product = {
                    product_id: rawProduct.product_id,
                    description: rawProduct.description || null,
                    main_image_url: rawProduct.main_image_url || null,
                    pdf: rawProduct.main_pdf_link ? {
                        id: rawProduct.main_pdf_link.id || '',
                        url: rawProduct.main_pdf_link.url || ''
                    } : null,
                    sku: rawProduct.main_sku || null,
                    status: rawProduct.status || null,
                    title: rawProduct.title || null,
                    product_features: features.data || [],
                    product_specs: specs.data || [],
                    order: 0 // Initialize order
                }
                productsWithDetails.push(product);
            }

            setProgress(90);
            setProducts(productsWithDetails);
            setFilteredProducts(productsWithDetails);
            setProgress(100);
        } catch (error) {
            console.error('Error fetching products:', error);
            setError(error instanceof Error ? error.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }

    const handleSearch = (term: string) => {
        setSearchTerm(term);
        setCurrentPage(1);
        if (term) {
            const filtered = products.filter(product =>
                product.title?.toLowerCase().includes(term.toLowerCase()) ||
                product.status?.toLowerCase().includes(term.toLowerCase()) ||
                product.sku?.toLowerCase().includes(term.toLowerCase())
            );
            setFilteredProducts(filtered);
        } else {
            setFilteredProducts(products);
        }
    };

    const toggleProductSelection = (productId: string) => {
        setSelectedProducts(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(productId)) {
                newSelection.delete(productId);
                // Remove order when unselecting
                setFilteredProducts(prev =>
                    prev.map(p => p.product_id === productId ? { ...p, order: 0 } : p)
                );
            } else {
                newSelection.add(productId);
                // Assign next available order number
                const maxOrder = Math.max(...filteredProducts.map(p => p.order || 0), 0);
                setFilteredProducts(prev =>
                    prev.map(p => p.product_id === productId ? { ...p, order: maxOrder + 1 } : p)
                );
            }
            return newSelection;
        });
    };

    const toggleAllSelection = () => {
        if (selectedProducts.size === filteredProducts.length) {
            setSelectedProducts(new Set());
            setFilteredProducts(prev => prev.map(p => ({ ...p, order: 0 })));
        } else {
            setSelectedProducts(new Set(filteredProducts.map(p => p.product_id)));
            // Assign order numbers sequentially
            setFilteredProducts(prev =>
                prev.map((p, index) => ({ ...p, order: index + 1 }))
            );
        }
    };

    const moveProduct = (productId: string, direction: 'up' | 'down') => {
        setFilteredProducts(prev => {
            const products = [...prev];
            const currentIndex = products.findIndex(p => p.product_id === productId);
            if (currentIndex === -1) return prev;

            const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
            if (newIndex < 0 || newIndex >= products.length) return prev;

            // Swap orders
            const tempOrder = products[currentIndex].order;
            products[currentIndex].order = products[newIndex].order;
            products[newIndex].order = tempOrder;

            // Swap positions
            [products[currentIndex], products[newIndex]] = [products[newIndex], products[currentIndex]];

            return products;
        });
    };

    const handleGenerateReport = async () => {
        setIsProcessing(true);
        try {
            // Get selected products in order
            const orderedProducts = filteredProducts
                .filter(p => selectedProducts.has(p.product_id))
                .sort((a, b) => (a.order || 0) - (b.order || 0));

            console.log('Generating report for ordered products:', orderedProducts);
            // TODO: Implement report generation logic here
            // This could involve calling an API endpoint or generating a PDF

        } catch (error) {
            console.error('Error generating report:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    // Pagination utilities
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filteredProducts.slice(startIndex, endIndex);

    const nextPage = () => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    };

    const previousPage = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-screen">
            <Progress value={progress} className="w-[60%] [&>div]:bg-[#cc2026]" />
            <p className="mt-4 text-sm text-gray-500">Loading products...</p>
        </div>
    );

    if (error) return <div className="text-red-500">Error: {error}</div>;

    return (
        <DefaultPageTemplate
            title="Reports"
            description="Select and order products to generate reports"
        >
            <div className="flex flex-row justify-between mb-4">
                <Input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-1/4 text-[var(--color-text-primary)]"
                />
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">
                        {selectedProducts.size} selected
                    </span>
                    <Button
                        onClick={handleGenerateReport}
                        disabled={selectedProducts.size === 0}
                        className={`bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] ${selectedProducts.size === 0 ? 'cursor-not-allowed' : ''}`}
                    >
                        Generate Report
                    </Button>
                </div>
            </div>

            <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                <Table>
                    <TableHeader className="sticky top-0 bg-black z-10">
                        <TableRow className="text-[var(--color-text-primary)] border border-[var(--color-border)]">
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                                    onCheckedChange={toggleAllSelection}
                                />
                            </TableHead>
                            <TableHead className="w-[50px]">Order</TableHead>
                            <TableHead className="text-[var(--color-text-primary)]">Image</TableHead>
                            <TableHead className="text-[var(--color-text-primary)]">SKU</TableHead>
                            <TableHead className="text-[var(--color-text-primary)]">Title</TableHead>
                            <TableHead className="text-[var(--color-text-primary)]">Status</TableHead>
                            <TableHead className="text-[var(--color-text-primary)]">Features</TableHead>
                            <TableHead className="text-[var(--color-text-primary)]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="text-[var(--color-text-primary)]">
                        {currentItems.map((product) => (
                            <TableRow
                                key={product.product_id}
                                className={`hover:bg-[var(--color-bg-primary-hover)] transition-colors duration-200 ${selectedProducts.has(product.product_id) ? 'bg-[var(--color-bg-primary-hover)]' : ''}`}
                            >
                                <TableCell>
                                    <Checkbox
                                        checked={selectedProducts.has(product.product_id)}
                                        onCheckedChange={() => toggleProductSelection(product.product_id)}
                                    />
                                </TableCell>
                                <TableCell>
                                    {selectedProducts.has(product.product_id) && (
                                        <div className="flex items-center gap-1">
                                            <span className="text-sm">{product.order}</span>
                                            <div className="flex flex-col">
                                                <button
                                                    onClick={() => moveProduct(product.product_id, 'up')}
                                                    className="p-0.5 hover:bg-gray-200 rounded"
                                                    disabled={product.order === 1}
                                                >
                                                    <ArrowUp className="h-3 w-3" />
                                                </button>
                                                <button
                                                    onClick={() => moveProduct(product.product_id, 'down')}
                                                    className="p-0.5 hover:bg-gray-200 rounded"
                                                    disabled={product.order === selectedProducts.size}
                                                >
                                                    <ArrowDown className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {product.main_image_url ? (
                                        <img
                                            src={product.main_image_url}
                                            alt={product.title?.toString() || ''}
                                            className="w-16 h-16 object-contain"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 bg-gray-100 flex items-center justify-center">
                                            <span className="text-gray-400">No image</span>
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell>{product.sku}</TableCell>
                                <TableCell>{product.title}</TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded ${product.status === 'active' ? 'bg-green-100 text-green-800' :
                                        product.status === 'error' ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                        {product.status}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    {product.product_features && product.product_features.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {product.product_features.map((feature) => (
                                                <span
                                                    key={feature.title}
                                                    className="px-2 py-1 rounded text-sm"
                                                    title={feature.title || ''}
                                                >
                                                    {feature.title}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400">No features</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <button
                                        className={`text-blue-600 hover:text-blue-800 mr-2 ${!product.pdf ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        onClick={() => {
                                            if (product.pdf?.url) {
                                                window.open(product.pdf.url, '_blank');
                                            }
                                        }}
                                        disabled={!product.pdf}
                                    >
                                        {product.pdf ? 'View PDF' : 'No PDF'}
                                    </button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination controls */}
            <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-white">
                        Rows per page:
                    </span>
                    <Select
                        value={itemsPerPage.toString()}
                        onValueChange={(value) => {
                            setItemsPerPage(Number(value));
                            setCurrentPage(1);
                        }}
                    >
                        <SelectTrigger className="w-[70px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="text-[var(--color-text-primary)] bg-[var(--color-bg-primary)]">
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                        Page {currentPage} of {totalPages}
                    </span>
                    <div className="flex gap-2">
                        <Button
                            onClick={previousPage}
                            disabled={currentPage === 1}
                            variant="outline"
                            className="bg-[#cc2026] text-white border-none hover:bg-[#a51920]"
                            size="sm"
                        >
                            Previous
                        </Button>
                        <Button
                            onClick={nextPage}
                            disabled={currentPage === totalPages}
                            variant="outline"
                            className="bg-[#cc2026] text-white border-none hover:bg-[#a51920]"
                            size="sm"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>

            {/* Loading Overlay */}
            {isProcessing && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-black p-8 rounded-lg shadow-xl flex flex-col items-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-[#cc2026]" />
                        <p className="text-white text-lg font-medium">
                            Generating report...
                        </p>
                    </div>
                </div>
            )}
        </DefaultPageTemplate>
    );
} 