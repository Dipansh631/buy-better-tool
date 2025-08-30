// components/SearchComponent.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  price: string;
  original_price?: string;
  rating?: number;
  reviews?: number;
  image?: string;
  link: string;
  source: string;
  availability: string;
}

export default function SearchComponent() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setResults(data.products || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleProductClick = (product: SearchResult) => {
    // Method 1: Using query parameters
    const params = new URLSearchParams({
      id: product.id,
      title: product.title,
      price: product.price,
      source: product.source,
      link: product.link,
      image: product.image || '',
      rating: product.rating?.toString() || '',
      availability: product.availability
    });
    
    router.push(`/product?${params.toString()}`);
    
    // Method 2: Using dynamic routes (alternative)
    // router.push(`/product/${encodeURIComponent(product.id)}`);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for products..."
            className="flex-1 px-4 py-2 border rounded-lg"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            {isSearching ? <Loader2 className="animate-spin" /> : <Search />}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="grid gap-4">
          <h2 className="text-xl font-bold">Search Results</h2>
          {results.map((product) => (
            <div
              key={product.id}
              onClick={() => handleProductClick(product)}
              className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="flex gap-4">
                {product.image && (
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-20 h-20 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold">{product.title}</h3>
                  <p className="text-lg font-bold text-green-600">{product.price}</p>
                  <p className="text-sm text-gray-600">{product.source}</p>
                  {product.rating && (
                    <p className="text-sm">⭐ {product.rating}/5</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
