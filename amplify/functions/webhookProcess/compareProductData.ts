import { type ProductData } from '../services';
import { client } from './handler';

export async function hasProductDataChanged(productData: ProductData): Promise<boolean> {
  try {
    const existingProducts = await client.models.Product.list({
      filter: {
        product_id: {
          eq: productData.product_id
        }
      }
    });

    if (!existingProducts.data || existingProducts.data.length === 0) {
      console.log("No existing product found, so it's considered changed");
      return true; // No existing product found, so it's considered changed
    }

    const existingProduct = existingProducts.data[0];

    // Get existing features
    const existingFeatures = await client.models.ProductFeature.listProductFeatureByProduct_id({
      product_id: productData.product_id
    });

    // Get existing specs
    const existingSpecs = await client.models.ProductSpec.listProductSpecByProduct_id({
      product_id: productData.product_id
    });

    // Compare basic product data
    const productChanged =
      existingProduct.main_sku !== productData.sku ||
      existingProduct.title !== productData.title ||
      existingProduct.description !== productData.description ||
      existingProduct.main_image_url !== productData.main_image_url ||
      //   existingProduct.data.pdf !== productData.pdf.url ||
      existingProduct.status !== productData.status;

    if (productChanged) return true;

    // check if variants have changed
    if (productData.variants.length > 0) {
      const existingVariants = await client.models.ProductVariant.listProductVariantByProduct_id({
        product_id: productData.product_id
      });

      const newVariants = productData.variants;

      if (existingVariants.data.length !== newVariants.length) {
        console.log("Variant length has changed");
        return true;
      }
      // check the sku of each variant
      for (const variant of newVariants) {
        const existingVariant = existingVariants.data.find(v => v.variant_id === variant.id);
        if (existingVariant?.sku !== variant.sku) {
          console.log("Variant sku has changed");
          return true;
        }
      }
    }

    // Compare features
    const existingFeatureSet = new Set(
      existingFeatures.data.map(f => `${f.title || ''}:${f.image || ''}`)
    );
    const newFeatureSet = new Set(
      productData.features?.map(f => `${f.title}:${f.imageSrc}`) || []
    );
    if (existingFeatureSet.size !== newFeatureSet.size) {
      console.log("Feature length has changed");
      return true;
    };

    // Compare specs
    const existingSpecSet = new Set(
      existingSpecs.data.map(s => `${s.key || ''}:${s.value || ''}`)
    );
    const newSpecSet = new Set(
      productData.product_specs?.map(s => `${s.key}:${s.value}`) || []
    );
    if (existingSpecSet.size !== newSpecSet.size) {
      console.log("Spec length has changed");
      return true;
    };

    // Check if all new features exist in existing features
    for (const feature of newFeatureSet) {
      if (!existingFeatureSet.has(feature)) {
        console.log("Feature does not exist in existing features");
        return true;
      }
    }

    // Check if all new specs exist in existing specs
    for (const spec of newSpecSet) {
      if (!existingSpecSet.has(spec)) {
        console.log("Spec does not exist in existing specs");
        return true;
      }
    }

    return false;

  } catch (error) {
    console.error('Error comparing product data:', error);
    throw error;
  }
} 