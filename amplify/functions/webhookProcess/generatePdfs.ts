import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import fontkit from "@pdf-lib/fontkit";

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
    name: string;
    imageSrc?: string;
}

interface ProductVariant {
    sku: string;
}

interface ProductImage {
    src: string;
}

interface ProductData {
    title: string;
    variants: ProductVariant[];
    image?: ProductImage;
    specs?: ProductSpec[];
    body_html?: string;
    features?: ProductFeature[];
}

export async function generateProductPDF(productData: ProductData) {
    try {
        // Create pdfs directory if it doesn't exist
        const pdfDir = "pdfs";
        if (!existsSync(pdfDir)) {
            mkdirSync(pdfDir);
        }

        // Create a new PDF document
        const pdfDoc = await PDFDocument.create();

        // Add this line to register fontkit
        pdfDoc.registerFontkit(fontkit);

        // Declare font variables in the outer scope
        let font;
        let boldFont;

        // Load and embed custom fonts
        try {
            const fontPath = join(
                process.cwd(),
                "assets",
                "font",
                "Teko-Regular.ttf"
            );
            const boldFontPath = join(
                process.cwd(),
                "assets",
                "font",
                "Teko-SemiBold.ttf"
            );

            if (!existsSync(fontPath) || !existsSync(boldFontPath)) {
                throw new Error("Font files not found");
            }

            const fontBytes = readFileSync(fontPath);
            const boldFontBytes = readFileSync(boldFontPath);

            font = await pdfDoc.embedFont(fontBytes);
            boldFont = await pdfDoc.embedFont(boldFontBytes);
        } catch (error) {
            console.error("Error loading custom font:", error);
            // Fallback to standard fonts if custom font fails
            font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
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

        // Add SKU and year in white text, centered in the red bar
        const currentYear = new Date().getFullYear();
        const skuText = productData.variants[0]?.sku ? `SKU:${productData.variants[0].sku} | ` : '';
        const yearText = skuText + "YEAR: " + currentYear.toString();
        const yearWidth = font.widthOfTextAtSize(yearText, 14);

        page.drawText(yearText, {
            x: page.getWidth() - yearWidth - 20, // Center horizontally from right side
            y: page.getHeight() - 32, // Center vertically in red bar
            size: 14,
            font: font,
            color: rgb(1, 1, 1), // White color
        });

        // Add logo to the red bar
        try {
            const logoPath = join(process.cwd(), "assets", "./SD header logo.png");
            const logoBytes = readFileSync(logoPath);
            const logo = await pdfDoc.embedPng(logoBytes);

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

        // Write product title
        writeText(productData.title, {
            size: 40,
            spacing: 20,
            x: 20,
        });

        // Add product image if it exists
        if (productData.image?.src) {
            try {
                const imageResponse = await fetch(productData.image.src);
                const imageArrayBuffer = await imageResponse.arrayBuffer();
                const image = await pdfDoc.embedJpg(imageArrayBuffer);

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
        if (productData.specs && productData.specs.length > 0) {
            leftColumnY += 100; // Added 20 to move everything up
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
            for (const spec of productData.specs.slice(1)) {
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

        // Add description on the right if exists
        if (productData.body_html) {
            rightColumnY -= 50; // Add some space
            const descriptionWidth = page.getWidth() - rightColumnX - 20; // Maintain right margin

            // Split description into lines that fit the width
            const descriptionText = productData.body_html
                .replace(/<[^>]*>/g, "")
                .replace(/[""]/g, '"')  // Replace curly quotes with straight quotes
                .replace(/['']/g, "'")  // Replace curly apostrophes with straight apostrophes
                .replace(/″/g, '"');    // Replace double prime character with straight quote
            const words = descriptionText.split(" ");
            let line = "";

            for (const word of words) {
                const testLine = line + word + " ";
                const textWidth = font.widthOfTextAtSize(testLine, fontSize);

                if (textWidth > descriptionWidth) {
                    page.drawText(line, {
                        x: rightColumnX,
                        y: rightColumnY,
                        size: fontSize,
                        font: font,
                    });
                    rightColumnY -= lineHeight;
                    line = word + " ";
                } else {
                    line = testLine;
                }
            }

            // Draw remaining text
            if (line) {
                page.drawText(line, {
                    x: rightColumnX,
                    y: rightColumnY,
                    size: fontSize,
                    font: font,
                });
                rightColumnY -= lineHeight;
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
                        const imageArrayBuffer = await imageResponse.arrayBuffer();
                        const image = await pdfDoc.embedJpg(imageArrayBuffer);
                        const scaledDims = image.scale(imageWidth / image.width);

                        page.drawImage(image, {
                            x,
                            y: currentY - scaledDims.height,
                            width: scaledDims.width,
                            height: scaledDims.height,
                        });

                        // Add feature title centered under image
                        if (feature.name) {
                            const textWidth = font.widthOfTextAtSize(feature.name, fontSize);
                            const textX = x + (imageWidth - textWidth) / 2;
                            page.drawText(feature.name, {
                                x: textX,
                                y: currentY - scaledDims.height - 20, // 20 units below image
                                size: fontSize,
                                font: font,
                            });
                        }
                    } catch (error) {
                        console.error(
                            `Error embedding image for feature ${feature.name}:`,
                            error
                        );
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

        // Save the PDF with a unique filename
        const pdfBytes = await pdfDoc.save();
        const fileName = `${productData.title
            .toLowerCase()
            .replace(/\s+/g, "_")}.pdf`;
        const filePath = join(pdfDir, fileName);
        writeFileSync(filePath, pdfBytes);

        return fileName;
        // return `${process.env.NGROK_URL}/pdfs/${fileName}`;
    } catch (error) {
        console.error("Error generating PDF:", error);
        throw error;
    }
}
