import { PDFDocument, rgb, StandardFonts, PDFPage } from "pdf-lib";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import fontkit from "@pdf-lib/fontkit";
import { getUrl, uploadData } from 'aws-amplify/storage';
import { Amplify } from 'aws-amplify';
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from '$amplify/env/generate-pdf';

const bucketName = env.SALES_APP_BUCKET_NAME;
const region = env.AWS_REGION;

interface TextOptions {
    x?: number;
    y?: number;
    size?: number;
    bold?: boolean;
    spacing?: number;
}

interface ProductSpec {
    key: string;
    value: string;
}

interface ProductFeature {
    title: string;
    imageSrc?: string;
}

interface ProductImage {
    src: string;
}

interface ProductData {
    product_id: string;
    title: string;
    image?: ProductImage;
    product_specs?: ProductSpec[];
    description?: string;
    features?: ProductFeature[];
    sku?: string;
    main_image_url?: string;
}

// Add validation function at the top level
function validateProductData(product: ProductData): string[] {
    const errors: string[] = [];

    if (!product.title) {
        errors.push('Product title is required');
    }

    if (!product.sku) {
        errors.push('Product SKU is required');
    }

    if (!product.main_image_url) {
        errors.push('Product main image URL is required');
    }

    return errors;
}

async function getFileFromS3(filePath: string, bucketName: string, region: string) {
    try {
        const result = await getUrl({
            path: filePath,
            options: {
                bucket: {
                    bucketName: bucketName,
                    region: region
                }
            }
        });
        const response = await fetch(result.url.href);
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (error) {
        console.error(`Error fetching file ${filePath} from S3:`, error);
        throw error;
    }
}

function parseHTML(html: string): string {
    return html
        .replace(/<br\s*\/?>/gi, '\n')  // Convert <br> tags to newlines
        .replace(/<p.*?>/gi, '')        // Remove opening <p> tags
        .replace(/<\/p>/gi, '\n')       // Convert closing </p> tags to newlines
        .replace(/<li.*?>/gi, '• ')     // Convert list items to bullet points
        .replace(/<\/li>/gi, '\n')      // Add newline after list items
        .replace(/<.*?>/g, '')          // Remove all other HTML tags
        .replace(/&nbsp;/g, ' ')        // Convert &nbsp; to spaces
        .replace(/&amp;/g, '&')         // Convert &amp; to &
        .replace(/&lt;/g, '<')          // Convert &lt; to <
        .replace(/&gt;/g, '>')          // Convert &gt; to >
        .replace(/[""]/g, '"')          // Replace curly quotes
        .replace(/['']/g, "'")          // Replace curly apostrophes
        .replace(/″/g, '"')             // Replace double prime
        .trim();                        // Remove extra whitespace
}

async function generateProductPDF(productData: ProductData) {
    // Validate product data first
    const validationErrors = validateProductData(productData);
    if (validationErrors.length > 0) {
        throw new Error(`Invalid product data: ${validationErrors.join(', ')}`);
    }

    try {
        // Create PDF with compression settings
        const pdfDoc = await PDFDocument.create();
        pdfDoc.registerFontkit(fontkit);

        let font;
        let boldFont;
        let logo;

        try {
            // Define font paths and validate their existence
            const fontPaths = {
                regular: 'assets/fonts/Teko-Regular.ttf',
                bold: 'assets/fonts/Teko-SemiBold.ttf',
                logo: 'assets/SD header logo.png'
            };

            // Validate all required assets exist
            for (const path of Object.values(fontPaths)) {
                try {
                    await getFileFromS3(path, bucketName, region);
                } catch (error) {
                    throw new Error(`Failed to load required asset: ${path} - ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }

            const regularFontBytes = await getFileFromS3(fontPaths.regular, bucketName, region);
            const boldFontBytes = await getFileFromS3(fontPaths.bold, bucketName, region);
            const logoBytes = await getFileFromS3(fontPaths.logo, bucketName, region);

            if (!regularFontBytes || !boldFontBytes || !logoBytes) {
                throw new Error('Failed to load one or more required assets');
            }

            font = await pdfDoc.embedFont(regularFontBytes);
            boldFont = await pdfDoc.embedFont(boldFontBytes);
            logo = await pdfDoc.embedPng(logoBytes);
        } catch (error) {
            console.error("Error loading assets:", error);
            throw new Error(`Failed to initialize PDF assets: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        const page = pdfDoc.addPage([595.28, 841.89]); // A4 size

        // Set font size and line height
        const fontSize = 16;
        const titleSize = 30;
        const lineHeight = 20;
        let currentY = page.getHeight() - 50; // Start from top with margin

        // Helper function to write text and move down
        const writeText = (text: string, options: TextOptions = {}) => {
            page.drawText(text, {
                x: options.x || 50,
                y: currentY,
                size: options.size || fontSize,
                font: options.bold ? boldFont : font,
                color: rgb(0, 0, 0),
            });
            currentY -= options.spacing || lineHeight;
        };

        // Add red bar at the top of the page
        page.drawRectangle({
            x: 0,
            y: page.getHeight() - 50,
            width: page.getWidth(),
            height: 50,
            color: rgb(0.8, 0.12549019607843137, 0.14901960784313725), // Red color
        });

        // // Add SKU and year in white text, centered in the red bar
        const currentYear = new Date().getFullYear();
        const skuText = productData.sku ? `SKU:${productData.sku} | ` : '';
        const yearText = skuText + "YEAR: " + currentYear.toString();
        const yearWidth = font.widthOfTextAtSize(yearText, 14);

        page.drawText(yearText, {
            x: page.getWidth() - yearWidth - 20, // Center horizontally from right side
            y: page.getHeight() - 32, // Center vertically in red bar
            size: 14,
            font: font,
            color: rgb(1, 1, 1), // White color
        });

        // // Add logo to the red bar
        try {
            if (!logo) {
                throw new Error("Logo image not found");
            }

            // Calculate dimensions to fit logo in the red bar
            const maxHeight = 35; // Slightly smaller than red bar
            const scaledDims = logo.scale(maxHeight / logo.height);
            const redBarHeight = 50;

            // Position logo on the left side of the red bar, vertically centered
            page.drawImage(logo, {
                x: 20, // Left padding
                y: page.getHeight() - redBarHeight / 2 - scaledDims.height / 2, // Centered vertically
                width: scaledDims.width,
                height: scaledDims.height,
            });
        } catch (error) {
            console.error("Error embedding logo:", error);
        }

        // Adjust starting Y position to account for the red bar
        currentY = page.getHeight() - 135;

        // Calculate available width for title based on image presence
        const titleMaxWidth = productData.main_image_url
            ? page.getWidth() * 0.45  // If image exists, use 45% of page width
            : page.getWidth() - 40;   // If no image, use full width minus margins

        // Split title into lines if too long
        const words = productData.title.split(' ');
        let titleLine = '';

        for (const word of words) {
            const testLine = titleLine + word + ' ';
            const textWidth = font.widthOfTextAtSize(testLine, titleSize);

            if (textWidth > titleMaxWidth) {
                writeText(titleLine.trim(), {
                    size: titleSize,
                    spacing: 45,
                    x: 20,
                });
                titleLine = word + ' ';
            } else {
                titleLine = testLine;
            }
        }

        // Write remaining title text
        if (titleLine) {
            writeText(titleLine.trim(), {
                size: titleSize,
                spacing: 45,
                x: 20,
            });
        }

        // Add product image if it exists
        if (productData.main_image_url) {
            try {
                const imageResponse = await fetch(productData.main_image_url);
                if (!imageResponse.ok) {
                    throw new Error(`Failed to fetch product image: ${imageResponse.status}`);
                }

                const imageArrayBuffer = await imageResponse.arrayBuffer();
                const imageBuffer = Buffer.from(imageArrayBuffer);

                // Embed image with compression
                const image = await pdfDoc.embedJpg(imageBuffer);

                // Calculate image dimensions (50% of page width)
                const pageWidth = page.getWidth();
                const imageWidth = pageWidth * 0.5 - 10;
                const scaledDims = image.scale(imageWidth / image.width);

                page.drawImage(image, {
                    x: pageWidth - imageWidth - 20,
                    y: page.getHeight() - 70 - scaledDims.height,
                    width: imageWidth,
                    height: scaledDims.height,
                });

                // Update currentY to be below the image
                currentY = page.getHeight() - 50 - scaledDims.height - 20; // 20 units padding below image
            } catch (error) {
                console.error("Error embedding product image:", error);
            }
        }

        // Add description and specs side by side
        const leftColumnWidth = page.getWidth() * 0.5; // 50% of page width
        const rightColumnX = leftColumnWidth - 10; // Changed from 20 to 10 for tighter spacing
        let leftColumnY = currentY + 20; // Track Y position for left column separately
        let rightColumnY = currentY + 20; // Track Y position for right column separately

        // Add Specifications Table on the left
        if (productData.product_specs && productData.product_specs.length > 0) {
            leftColumnY += 50;
            page.drawText("SPECS", {
                x: 20,
                y: leftColumnY,
                size: titleSize,
                font: font,
            });
            leftColumnY -= 50; // Added more space between title and table

            // Define table dimensions
            const tableStartX = 20;
            const columnWidth = (leftColumnWidth - 50) / 2; // Changed from 40 to 50 to make each column 5 units smaller
            const rowHeight = 25;
            const padding = 10;

            // Draw table rows
            for (const spec of productData.product_specs.slice(1)) {
                if (spec.key !== "target_product") {
                    page.drawLine({
                        start: { x: tableStartX, y: leftColumnY + rowHeight },
                        end: { x: tableStartX + columnWidth * 2, y: leftColumnY + rowHeight },
                        thickness: 1,
                        color: rgb(0.8, 0.12549019607843137, 0.14901960784313725), // Red color
                    });

                    const formattedKey = spec.key
                        .split("_")
                        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                        .join(" ");

                    // Draw cell text
                    page.drawText(formattedKey || "", {
                        x: tableStartX + padding,
                        y: leftColumnY + rowHeight / 2 - 6,
                        size: fontSize,
                        font: font,
                        maxWidth: columnWidth - padding * 2,
                    });

                    let formattedValue = spec.value;
                    if (spec.key === "made_in_usa") {
                        if (spec.value === "true") {
                            formattedValue = "Yes";
                        } else {
                            formattedValue = "No";
                        }
                    }

                    page.drawText(formattedValue || "", {
                        x: tableStartX + columnWidth + padding,
                        y: leftColumnY + rowHeight / 2 - 6,
                        size: fontSize,
                        font: font,
                        maxWidth: columnWidth - padding * 2,
                    });

                    leftColumnY -= rowHeight;
                }
                page.drawLine({
                    start: { x: tableStartX, y: leftColumnY + rowHeight },
                    end: { x: tableStartX + columnWidth * 2, y: leftColumnY + rowHeight },
                    thickness: 1,
                    color: rgb(0.8, 0.12549019607843137, 0.14901960784313725), // Red color
                });
            }
        }

        // Add description on the right if exists
        if (productData.description) {
            rightColumnY -= 50; // Add some space
            const descriptionWidth = page.getWidth() - rightColumnX - 20; // Maintain right margin

            // Parse HTML and split into paragraphs
            const parsedDescription = parseHTML(productData.description);
            const paragraphs = parsedDescription.split('\n').filter(p => p.trim());

            // Draw each paragraph
            for (const paragraph of paragraphs) {
                const words = paragraph.split(' ');
                let line = '';

                for (const word of words) {
                    const testLine = line + word + ' ';
                    const textWidth = font.widthOfTextAtSize(testLine, fontSize);

                    if (textWidth > descriptionWidth) {
                        page.drawText(line.trim(), {
                            x: rightColumnX,
                            y: rightColumnY,
                            size: fontSize,
                            font: font,
                        });
                        rightColumnY -= lineHeight;
                        line = word + ' ';
                    } else {
                        line = testLine;
                    }
                }

                // Draw remaining text in the paragraph
                if (line) {
                    page.drawText(line.trim(), {
                        x: rightColumnX,
                        y: rightColumnY,
                        size: fontSize,
                        font: font,
                    });
                    rightColumnY -= lineHeight;
                }

                // Add extra space between paragraphs
                rightColumnY -= lineHeight / 2;
            }
        }

        // Add Features section
        if (productData.features && productData.features.length > 0) {
            currentY -= 200; // Add space before features
            writeText("FEATURES", {
                size: titleSize,
                bold: false,
                spacing: 30,
                x: 20,
            });

            // Calculate dimensions for feature layout
            const imageWidth = 170;
            const featuresPerRow = 3;
            const spacing = 20;
            const startX = 20;

            for (let i = 0; i < productData.features.length; i++) {
                const feature = productData.features[i];

                // Calculate position for this feature
                const column = i % featuresPerRow;
                const x = startX + column * (imageWidth + spacing);

                // Add image if URL exists
                if (feature.imageSrc) {
                    try {
                        const imageResponse = await fetch(feature.imageSrc);
                        if (!imageResponse.ok) {
                            throw new Error(`Failed to fetch feature image: ${imageResponse.status}`);
                        }

                        const imageArrayBuffer = await imageResponse.arrayBuffer();
                        const imageBuffer = Buffer.from(imageArrayBuffer);

                        // Embed image with compression
                        const image = await pdfDoc.embedJpg(imageBuffer);
                        const scaledDims = image.scale(imageWidth / image.width);

                        page.drawImage(image, {
                            x,
                            y: currentY - scaledDims.height,
                            width: scaledDims.width,
                            height: scaledDims.height,
                        });

                        // Add feature title centered under image
                        if (feature.title) {
                            const textWidth = font.widthOfTextAtSize(feature.title, fontSize);
                            const textX = x + (imageWidth - textWidth) / 2;
                            page.drawText(feature.title, {
                                x: textX,
                                y: currentY - scaledDims.height - 20, // 20 units below image
                                size: fontSize,
                                font: font,
                            });
                        }
                    } catch (error) {
                        console.error(`Error embedding feature image:`, error);
                    }
                }
            }

            // Move cursor below the features section
            currentY -= 40;
        }

        // Add gray bar at the bottom of the page
        const websiteBarHeight = 30;
        const websiteText = "STRAYDOGSTRENGTH.COM";

        page.drawRectangle({
            x: 0,
            y: 0, // Changed to 0 to start from bottom
            width: page.getWidth(),
            height: websiteBarHeight,
            color: rgb(0.9, 0.9, 0.9), // Light gray color
        });

        // Center the website text
        const textWidth = font.widthOfTextAtSize(websiteText, fontSize);
        const centerX = (page.getWidth() - textWidth) / 2;

        page.drawText(websiteText, {
            x: centerX,
            y: 9, // Adjusted to maintain vertical centering from bottom
            size: fontSize,
            font: font,
            color: rgb(0, 0, 0), // Black color
        });

        // Enhanced PDF compression settings when saving
        const pdfBytes = await pdfDoc.save({
            useObjectStreams: true,     // Enable object streams for better compression
            addDefaultPage: false,      // Don't add empty pages
            objectsPerTick: 50,         // Process objects in batches
        });

        return pdfBytes;
    } catch (error) {
        console.error("Error generating PDF:", error);
        throw error;
    }
}

export const handler = async (event: { arguments: { Product: ProductData } }) => {
    try {
        // Validate event structure
        if (!event || typeof event !== 'object') {
            throw new Error('Invalid event object received');
        }

        if (!event.arguments || typeof event.arguments !== 'object') {
            throw new Error('Invalid arguments object in event');
        }

        // Initialize Amplify with the correct configuration
        try {
            const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
            if (!resourceConfig || !libraryOptions) {
                throw new Error('Invalid Amplify configuration received');
            }
            Amplify.configure(resourceConfig, libraryOptions);
        } catch (error) {
            throw new Error(`Failed to initialize Amplify: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        if (!event.arguments?.Product) {
            throw new Error('No product provided in arguments');
        }

        const product = event.arguments.Product;

        // Validate product object
        if (typeof product !== 'object') {
            throw new Error('Invalid product object received');
        }

        try {
            const pdfBytes = await generateProductPDF(product);
            if (!pdfBytes || pdfBytes.length === 0) {
                throw new Error('Generated PDF is empty');
            }

            const base64PDF = Buffer.from(pdfBytes).toString('base64');

            // Validate bucket configuration
            if (!bucketName || !region) {
                throw new Error('Invalid S3 bucket configuration');
            }

            const { v4: uuidv4 } = require('uuid');
            const fileName = `${product.title.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}_${uuidv4()}.pdf`;

            if (!fileName) {
                throw new Error('Failed to generate valid filename');
            }

            try {
                const filePath = `pdfs/${fileName}`;

                // Upload the file and wait for it to complete
                try {
                    await uploadData({
                        path: filePath,
                        data: pdfBytes,
                        options: {
                            bucket: {
                                bucketName: bucketName,
                                region: region
                            }
                        }
                    });

                    // Verify the file exists in S3
                    const uploadedFileUrl = await getUrl({
                        path: filePath,
                        options: {
                            bucket: {
                                bucketName: bucketName,
                                region: region
                            }
                        }
                    });

                    if (!uploadedFileUrl?.url) {
                        throw new Error('Uploaded file not found in S3');
                    }

                    return {
                        fileName: fileName,
                        base64PDF: base64PDF,
                        fileUrl: uploadedFileUrl.url.href
                    };
                } catch (uploadError) {
                    throw new Error(`Failed to upload or verify PDF: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
                }
            } catch (error) {
                console.error(`Error generating PDF for product ${product.title}:`, error);
                throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to process product';
            console.error('Error processing product:', error);
            throw new Error(`PDF generation handler failed: ${errorMessage}`);
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to process product';
        console.error('Error processing product:', error);
        throw new Error(`PDF generation handler failed: ${errorMessage}`);
    }
};
