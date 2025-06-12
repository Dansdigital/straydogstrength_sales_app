import { generateClient } from "aws-amplify/data";
import { type Schema } from "amplify/data/resource.ts";
import { useEffect } from "react";

const client = generateClient<Schema>();

const Test = () => {
    useEffect(() => {
        const fetchProducts = async () => {
            const response = await client.queries.GetAllProducts();
            if (!response.data) {
                console.log("No data received");
                return;
            }

            // Get the first product from the string data
            const productsData = JSON.parse(response.data as string);
            let targetProduct = null;
            for (const product of productsData) {
                if (product.title === "Alpha Bench") {
                    targetProduct = product;
                }
            }
            // const targetProduct = productsData[0];
            console.log("targetProduct:", targetProduct);

            // Use the original string data directly
            const saveProduct = await client.mutations.SaveProduct({
                RawProduct: JSON.stringify(targetProduct)
            });

            console.log("saveProduct response:", JSON.parse(saveProduct.data as string));
        }
        fetchProducts();
    }, []);

    return (
        <div>test</div>
    )
}

export default Test