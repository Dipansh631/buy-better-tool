// app/product/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProductData {
  id: string;
  title: string;
  price: string;
  source: string;
  link: string;
  image: string;
  rating: string;
  availability: string;
}

export default function ProductPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Extract product data from query parameters
    const productData: ProductData = {
      id: searchParams.get('id') || '',
      title: searchParams.get('title') || '',
      price: searchParams.get('price') || '',
      source: searchParams.get('source') || '',
      link: searchParams.get('link') || '',
      image: searchParams.get('image') || '',
      rating: searchParams.get('rating') || '',
      availability: searchParams.get('availability') || ''
    };

    // Validate that we have essential data
    if (!productData.id || !productData.title) {
      console.error('Missing product data:', productData);
      router.push('/'); // Redirect to home if no data
      return;
    }

    setProduct(productData);
    setLoading(false);
  }, [searchParams, router]);

  const handleBack = () => {
    router.back();
  };

  const handleBuyNow = () => {
    if (product?.link) {
      window.open(product.link, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Search
          </button>
        </div>

        {/* Product Details */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Product Image */}
            <div className="flex justify-center">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.title}
                  className="max-w-md max-h-96 object-contain rounded-lg"
                />
              ) : (
                <div className="w-64 h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500">No Image Available</span>
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {product.title}
                </h1>
                <p className="text-lg text-gray-600">Sold by {product.source}</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-4xl font-bold text-green-600">
                    {product.price}
                  </span>
                  {product.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-yellow-400 fill-current" />
                      <span className="text-lg">{product.rating}/5</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    product.availability === 'In Stock' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {product.availability}
                  </span>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleBuyNow}
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Buy Now on {product.source}
                  </button>
                  
                  <button
                    onClick={handleBack}
                    className="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Product Information</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Product ID:</span> {product.id}
            </div>
            <div>
              <span className="font-medium">Platform:</span> {product.source}
            </div>
            <div>
              <span className="font-medium">Availability:</span> {product.availability}
            </div>
            <div>
              <span className="font-medium">Rating:</span> {product.rating || 'Not available'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
