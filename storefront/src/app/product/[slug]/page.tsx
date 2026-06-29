import { Metadata } from 'next';
import ProductClient from './ProductClient';

// Enable Incremental Static Regeneration (ISR) - cache page for up to 30 seconds
export const revalidate = 30;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    // Direct connection to core backend API over Docker shared network
    const res = await fetch(`http://api:8000/api/v1/storefront/products/${slug}`, { next: { revalidate: 30 } });
    if (!res.ok) throw new Error('API Disconnected');
    
    const product = await res.json();
    
    return {
      title: product.meta_title || `${product.name} | Kozmocart`,
      description: product.meta_description || product.short_description || `Unlock the details for ${product.name} on Kozmocart.`,
      openGraph: {
        title: product.meta_title || product.name,
        description: product.meta_description || product.short_description,
        type: 'article', // Optimal graph metadata for distinct product artifacts
      }
    };
  } catch (err) {
    return {
      title: "Discover Fragrance | Kozmocart",
      description: "Premium authentic scents curated worldwide."
    };
  }
}

export default async function ProductServerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let initialProduct: any = null;
  let initialOffers: any[] = [];

  try {
    const prodRes = await fetch(`http://api:8000/api/v1/storefront/products/${slug}`, { next: { revalidate: 30 } });
    if (prodRes.ok) {
      initialProduct = await prodRes.json();

      try {
        const offersRes = await fetch(`http://api:8000/api/v1/storefront/offers`, { next: { revalidate: 30 } });
        if (offersRes.ok) {
          const allOffers = await offersRes.json();
          const productSkus = initialProduct.variants?.map((v: any) => v.sku) || [];
          initialOffers = allOffers.filter((off: any) => {
            const inProductsList = off.products?.some((p: any) => p.id === initialProduct.id);
            if (inProductsList) return true;

            const combinedSkus = [...(off.buy_skus || []), ...(off.get_skus || []), ...(off.target_skus || [])];
            return combinedSkus.some((sku: string) => productSkus.includes(sku));
          });
        }
      } catch (oErr) {
        console.warn('Failed to fetch storefront offers on server', oErr);
      }
    }
  } catch (err) {
    console.error('Failed to fetch product on server', err);
  }

  return <ProductClient slug={slug} initialProduct={initialProduct} initialOffers={initialOffers} />;
}
