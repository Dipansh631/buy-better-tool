// app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server';

const SERP_API_KEY = process.env.SERP_API_KEY;
const SERP_BASE_URL = 'https://serpapi.com/search.json';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter is required' },
      { status: 400 }
    );
  }

  if (!SERP_API_KEY) {
    return NextResponse.json(
      { error: 'SERP_API_KEY is not configured' },
      { status: 500 }
    );
  }

  try {
    const params = new URLSearchParams({
      api_key: SERP_API_KEY,
      engine: 'google_shopping',
      q: query,
      location: 'India',
      gl: 'in',
      hl: 'en',
      num: '20'
    });

    const response = await fetch(`${SERP_BASE_URL}?${params}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    // Transform the response to match our interface
    const products = data.shopping_results?.map((item: any, index: number) => ({
      id: item.position?.toString() || index.toString(),
      title: item.title || 'Unknown Product',
      price: item.price || 'Price not available',
      original_price: item.original_price,
      rating: item.rating,
      reviews: item.reviews,
      image: item.thumbnail,
      link: item.link,
      source: item.source || 'Unknown',
      availability: item.availability || 'Unknown'
    })) || [];

    return NextResponse.json({
      products,
      total_results: data.search_information?.total_results || 0,
      search_metadata: {
        status: data.search_metadata?.status || 'Unknown',
        created_at: data.search_metadata?.created_at || new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Search API error:', error);
    
    // Return mock data as fallback
    const mockProducts = [
      {
        id: '1',
        title: `${query} - Premium Model`,
        price: '₹89,999',
        original_price: '₹99,999',
        rating: 4.5,
        reviews: 128,
        image: 'https://via.placeholder.com/150x150?text=Product',
        link: 'https://example.com/product1',
        source: 'Amazon',
        availability: 'In Stock'
      },
      {
        id: '2',
        title: `${query} - Standard Edition`,
        price: '₹79,999',
        original_price: '₹89,999',
        rating: 4.3,
        reviews: 95,
        image: 'https://via.placeholder.com/150x150?text=Product',
        link: 'https://example.com/product2',
        source: 'Flipkart',
        availability: 'In Stock'
      }
    ];

    return NextResponse.json({
      products: mockProducts,
      total_results: mockProducts.length,
      search_metadata: {
        status: 'Fallback (Mock Data)',
        created_at: new Date().toISOString()
      }
    });
  }
}
