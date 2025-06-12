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
// import { GeneratePDF } from "@/graphql/mutations";
// import { generateClient as generateApiClient } from "aws-amplify/api";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";
// import { uploadData, getUrl, remove } from 'aws-amplify/storage';
import { Loader2 } from "lucide-react";
import DefaultPageTemplate from "./defaultPageTemplate";
// import { GraphQLResult } from '@aws-amplify/api';

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
};

// Add a type for the parsed PDF data
type PdfData = {
    id: string;
    url: string;
};

// Update the response type from the lambda function
type PDFResponse = {
    title: string;
    pdfBase64: string;
    s3Url?: string;
    error?: string;
};

type ProductFeature = {
    title?: string | null;
    image?: string | null;
};

type ProductSpec = {
    key?: string | null;
    value?: string | null;
};

// Add this type before the RealProducts component
// type ProductListResponse = {
//     data?: {
//         listProducts?: {
//             items: Array<{
//                 product_id: string;
//                 description?: string | null;
//                 main_image_url?: string | null;
//                 main_pdf_link?: { id?: string; url?: string } | null;
//                 main_sku?: string | null;
//                 status?: string | null;
//                 title?: string | null;
//                 product_features: { items: ProductFeature[] };
//                 product_specs: { items: ProductSpec[] };
//             }>;
//         };
//     };
// };

export function RealProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [progress, setProgress] = useState(0);
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
    const [generatedPDFs, setGeneratedPDFs] = useState<PDFResponse[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [hasMore, setHasMore] = useState(true);
    const [nextToken, setNextToken] = useState<string | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const client = generateClient<Schema>();

    useEffect(() => {
        setGeneratedPDFs([]);
        fetchProducts();
    }, []);

    async function fetchProducts(token?: string | null) {
        try {
            setProgress(10);
            const response = await client.models.Product.list();
            setProgress(20);
            const rawProducts = response.data || [];
            const productsWithDetails: Product[] = [];
            for (const rawProduct of rawProducts) {
                const features = await rawProduct.product_features();
                const specs = await rawProduct.product_specs();
                console.log("features: ", features);
                console.log("specs: ", specs);
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
                    product_specs: specs.data || []
                }
                productsWithDetails.push(product);
            }

            setProgress(50);

            setProgress(90);

            if (token) {
                setProducts(prev => [...prev, ...productsWithDetails]);
                setFilteredProducts(prev => [...prev, ...productsWithDetails]);
            } else {
                setProducts(productsWithDetails);
                setFilteredProducts(productsWithDetails);
            }

            setNextToken(null); // Since this query doesn't support pagination
            setHasMore(false); // Since this query doesn't support pagination

            setProgress(100);
        } catch (error) {
            console.error('Error fetching products:', error);
            setError(error instanceof Error ? error.message : 'Unknown error');
        } finally {
            setLoading(false);
            setIsLoadingMore(false);
        }
    }

    // Add load more function
    const loadMore = async () => {
        if (isLoadingMore || !hasMore) return;
        setIsLoadingMore(true);
        await fetchProducts(nextToken);
    };

    // Update search to work with all products
    const handleSearch = (term: string) => {
        setSearchTerm(term);
        setCurrentPage(1); // Reset to first page when searching
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

    // Add a function to parse the PDF JSON string
    const getPdfUrl = (pdfJson: string | null): string | null => {
        if (!pdfJson) return null;
        try {
            const pdfData: PdfData = JSON.parse(pdfJson);
            return pdfData.url;
        } catch (error) {
            console.error('Error parsing PDF JSON:', error);
            return null;
        }
    };

    // Add selection handlers
    const toggleProductSelection = (productId: string) => {
        setSelectedProducts(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(productId)) {
                newSelection.delete(productId);
            } else {
                newSelection.add(productId);
            }
            // Log the selected product with its features
            const selectedProduct = products.find(p => p.product_id === productId);
            console.log('Selected product:', selectedProduct);
            // console.log('Product features:', selectedProduct?.product_features);
            return newSelection;
        });
    };

    const toggleAllSelection = () => {
        if (selectedProducts.size === filteredProducts.length) {
            setSelectedProducts(new Set());
        } else {
            setSelectedProducts(new Set(filteredProducts.map(p => p.product_id)));
        }
    };

    const handleProcessSelected = async () => {
        setIsProcessing(true);
        const selectedItems = filteredProducts.filter(p => selectedProducts.has(p.product_id));
        console.log('Processing selected products:', selectedItems);

        try {
            // for (const item of selectedItems) {
            //     const response = await client.graphql({
            //         query: GeneratePDF,
            //         variables: {
            //             Product: JSON.stringify(item)
            //         }
            //     });
            //     console.log('Generated PDF:', response);
            // }
            // const response = await client.graphql({
            //     query: GeneratePDFs,
            //     variables: {
            //         Product: JSON.stringify(selectedItems)
            //     }
            // });

            // console.log('Generated PDFs:', response);
            // const pdfs = JSON.parse(response.data.GeneratePDFs);

            // // Create an array to store PDFs with their S3 URLs
            // const pdfWithUrls = await Promise.all(pdfs.map(async (pdf: PDFResponse) => {
            //     if (pdf.pdfBase64 && !pdf.error) {
            //         try {
            //             const pdfBlob = base64ToBlob(pdf.pdfBase64, 'application/pdf');
            //             const timestamp = new Date().getTime();
            //             const sanitizedTitle = pdf.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            //             const filename = `pdfs/${sanitizedTitle}_${timestamp}.pdf`;

            //             const result = await uploadData({
            //                 key: filename,
            //                 data: pdfBlob,
            //                 options: {
            //                     contentType: 'application/pdf'
            //                 }
            //             }).result;

            //             const { url } = await getUrl({ key: result.key });

            //             try {
            //                 const uploadResponse = await client.graphql({
            //                     query: UploadPDF,
            //                     variables: {
            //                         productId: selectedItems[0].product_id,
            //                         pdfUrl: url.toString()
            //                     }
            //                 });
            //                 if (uploadResponse?.data?.UploadPDF) {
            //                     await remove({ key: result.key });
            //                     console.log('Successfully deleted file from S3:', result.key);
            //                 }
            //             } catch (error) {
            //                 console.error('Error in upload process:', error);
            //             }

            //             return {
            //                 ...pdf,
            //                 s3Url: url
            //             };
            //         } catch (error) {
            //             console.error('Error uploading PDF:', error);
            //             return {
            //                 ...pdf,
            //                 error: 'Failed to upload PDF'
            //             };
            //         }
            //     }
            //     return pdf;
            // }));

            // setGeneratedPDFs(pdfWithUrls);

            // // Open first PDF in new tab if available
            // if (pdfWithUrls.length > 0 && pdfWithUrls[0].s3Url) {
            //     window.open(pdfWithUrls[0].s3Url, '_blank');
            // }

        } catch (error) {
            console.error('Error generating PDFs:', error);
        } finally {
            setIsProcessing(false);
        }
        setIsProcessing(false);
    };

    // Add helper function to convert base64 to Blob
    // const base64ToBlob = (base64: string, type: string) => {
    //     const binaryString = window.atob(base64);
    //     const bytes = new Uint8Array(binaryString.length);
    //     for (let i = 0; i < binaryString.length; i++) {
    //         bytes[i] = binaryString.charCodeAt(i);
    //     }
    //     return new Blob([bytes], { type: type });
    // };

    // Add a function to view a specific PDF
    // const viewPDF = (pdfBase64: string) => {
    //     const pdfBlob = base64ToBlob(pdfBase64, 'application/pdf');
    //     const pdfUrl = URL.createObjectURL(pdfBlob);
    //     window.open(pdfUrl, '_blank');
    // };

    // Add these pagination utility functions
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
            title="Products"
            description="View Product Spec Sheets and Generate Reports"
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
                        onClick={handleProcessSelected}
                        disabled={selectedProducts.size === 0}
                        className={`bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] ${selectedProducts.size === 0 ? 'cursor-not-allowed' : ''}`}
                    >
                        Create Report
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
                            <TableHead className="text-[var(--color-text-primary)]">Image</TableHead>
                            <TableHead className="text-[var(--color-text-primary)]">SKU</TableHead>
                            <TableHead className="text-[var(--color-text-primary)]">Title</TableHead>
                            <TableHead className="text-[var(--color-text-primary)]">Status</TableHead>
                            <TableHead className="text-[var(--color-text-primary)]">Features</TableHead>
                            <TableHead className="text-[var(--color-text-primary)]">Specs</TableHead>
                            <TableHead className="text-[var(--color-text-primary)]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="text-[var(--color-text-primary)]">
                        {currentItems.map((product) => (
                            <TableRow
                                key={product.product_id}
                                className={`hover:bg-[var(--color-bg-primary-hover)] transition-colors duration-200 cursor-pointer ${selectedProducts.has(product.product_id) ? 'bg-[var(--color-bg-primary-hover)]' : ''
                                    }`}
                                onClick={() => toggleProductSelection(product.product_id)}
                            >
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                        checked={selectedProducts.has(product.product_id)}
                                        onCheckedChange={() => toggleProductSelection(product.product_id)}
                                    />
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
                                <TableCell onClick={(e) => e.stopPropagation()}>
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
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                    {product.product_specs && product.product_specs.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {product.product_specs.map((spec) => (
                                                <span
                                                    key={spec.key}
                                                    className="px-2 py-1 rounded text-sm"
                                                    title={`${spec.value}`}
                                                >
                                                    {spec.key}: {spec.value}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400">No specs</span>
                                    )}
                                </TableCell>
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                    <button
                                        className={`text-blue-600 hover:text-blue-800 mr-2 ${!product.pdf ? 'opacity-50 cursor-not-allowed' : ''
                                            }`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const pdfUrl = getPdfUrl(product.pdf?.url || null);
                                            if (pdfUrl) {
                                                window.open(pdfUrl, '_blank');
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

                {/* Add load more button */}
                {hasMore && (
                    <div className="mt-4 text-center">
                        <Button
                            onClick={loadMore}
                            disabled={isLoadingMore}
                            variant="outline"
                        >
                            {isLoadingMore ? 'Loading...' : 'Load More Products'}
                        </Button>
                    </div>
                )}
            </div>

            {/* Add pagination controls */}
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

            {/* Add PDF preview section if PDFs are generated */}
            {generatedPDFs.length > 0 && (
                <div className="mt-4">
                    <h2 className="text-xl font-bold mb-2">Generated PDFs</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {generatedPDFs.map((pdf, index) => (
                            <div
                                key={index}
                                className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow"
                            >
                                <h3 className="font-medium mb-2">{pdf.title}</h3>
                                {pdf.error ? (
                                    <p className="text-red-500">{pdf.error}</p>
                                ) : (
                                    <button
                                        onClick={() => pdf.s3Url && window.open(pdf.s3Url, '_blank')}
                                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                                        disabled={!pdf.s3Url}
                                    >
                                        View PDF
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Loading Overlay */}
            {isProcessing && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-black p-8 rounded-lg shadow-xl flex flex-col items-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-[#cc2026]" />
                        <p className="text-white text-lg font-medium">
                            Generating and uploading PDFs...
                        </p>
                    </div>
                </div>
            )}
        </DefaultPageTemplate >
    );
}