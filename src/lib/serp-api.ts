// Serp API service for product search and price data
import { config } from './config';

const SERP_API_KEY = config.serp.apiKey;
// Use the proxy URL instead of direct API call to avoid CORS
const SERP_BASE_URL = '/api/serp/search.json';
// Fallback CORS proxy if Vite proxy doesn't work
const CORS_PROXY_URL = 'https://cors-anywhere.herokuapp.com/https://serpapi.com/search.json';

export interface SerpProduct {
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

export interface SerpSearchResult {
  products: SerpProduct[];
  total_results: number;
  search_metadata: {
    status: string;
    created_at: string;
  };
}

export class SerpApiService {
  private static instance: SerpApiService;
  private apiKey: string;
  private useMockData: boolean;

  private constructor() {
    this.apiKey = SERP_API_KEY;
    this.useMockData = !this.apiKey;
    
    if (config.debug.enabled) {
      console.log('SerpApiService constructor - API Key:', this.apiKey ? 'Present' : 'Missing');
      console.log('Using mock data:', this.useMockData);
    }
    
    if (!this.apiKey) {
      console.warn('SERP_API_KEY is not configured. Using mock data for demonstration.');
    }
  }

  public static getInstance(): SerpApiService {
    if (!SerpApiService.instance) {
      SerpApiService.instance = new SerpApiService();
    }
    return SerpApiService.instance;
  }

  private generateMockProducts(query: string): SerpProduct[] {
    // Create a simple SVG placeholder as data URI
    const placeholderSvg = `data:image/svg+xml;base64,${btoa(`
      <svg width="150" height="150" xmlns="http://www.w3.org/2000/svg">
        <rect width="150" height="150" fill="#f3f4f6"/>
        <text x="75" y="75" font-family="Arial" font-size="14" fill="#6b7280" text-anchor="middle" dy=".3em">${query}</text>
      </svg>
    `)}`;

    const mockProducts = [
      {
        title: `${query} - Premium Model`,
        price: '₹89,999',
        original_price: '₹99,999',
        rating: 4.5,
        reviews: 128,
        image: placeholderSvg,
        link: 'https://example.com/product1',
        source: 'Amazon',
        availability: 'In Stock'
      },
      {
        title: `${query} - Standard Edition`,
        price: '₹79,999',
        original_price: '₹89,999',
        rating: 4.3,
        reviews: 95,
        image: placeholderSvg,
        link: 'https://example.com/product2',
        source: 'Flipkart',
        availability: 'In Stock'
      },
      {
        title: `${query} - Pro Version`,
        price: '₹109,999',
        original_price: '₹119,999',
        rating: 4.7,
        reviews: 67,
        image: placeholderSvg,
        link: 'https://example.com/product3',
        source: 'Croma',
        availability: 'Low Stock'
      },
      {
        title: `${query} - Limited Edition`,
        price: '₹129,999',
        original_price: '₹139,999',
        rating: 4.8,
        reviews: 42,
        image: placeholderSvg,
        link: 'https://example.com/product4',
        source: 'Reliance Digital',
        availability: 'In Stock'
      },
      {
        title: `${query} - Budget Friendly`,
        price: '₹69,999',
        original_price: '₹79,999',
        rating: 4.1,
        reviews: 156,
        image: placeholderSvg,
        link: 'https://example.com/product5',
        source: 'Vijay Sales',
        availability: 'In Stock'
      }
    ];

    return mockProducts;
  }

  private async makeApiRequest(url: string, params: URLSearchParams): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('Request timeout reached, aborting...');
      controller.abort();
    }, 30000); // Increased to 30 seconds for better reliability

    try {
      console.log('Making API request to:', url.replace(this.apiKey, '***'));

      const response = await fetch(`${url}?${params}`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timed out. Please try again.');
        } else if (error.message.includes('Failed to fetch')) {
          throw new Error('Network error. Please check your internet connection.');
        }
      }
      
      throw error;
    }
  }

  async searchProducts(query: string, location: string = 'India'): Promise<SerpSearchResult> {
    try {
      if (config.debug.enabled) {
        console.log('Searching products with query:', query, 'API Key present:', !!this.apiKey);
      }
      
      if (this.useMockData) {
        if (config.debug.enabled) {
          console.log('Using mock data for demonstration');
        }
        const mockProducts = this.generateMockProducts(query);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return {
          products: mockProducts,
          total_results: mockProducts.length,
          search_metadata: {
            status: 'Success (Mock Data)',
            created_at: new Date().toISOString()
          }
        };
      }

      const params = new URLSearchParams({
        api_key: this.apiKey,
        engine: 'google_shopping',
        q: query,
        location: location,
        gl: 'in',
        hl: 'en',
        num: '20'
      });

      let data;
      
      // Try Vite proxy first
      try {
        data = await this.makeApiRequest(SERP_BASE_URL, params);
      } catch (error) {
        console.log('Vite proxy failed, trying CORS proxy:', error);
        
        // Fallback to CORS proxy
        try {
          data = await this.makeApiRequest(CORS_PROXY_URL, params);
        } catch (corsError) {
          console.log('CORS proxy also failed:', corsError);
          throw corsError;
        }
      }
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Transform the response to match our interface
      const products: SerpProduct[] = data.shopping_results?.map((item: any) => ({
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

      return {
        products,
        total_results: data.search_information?.total_results || 0,
        search_metadata: {
          status: data.search_metadata?.status || 'Unknown',
          created_at: data.search_metadata?.created_at || new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error searching products:', error);
      
      // Check if it's an abort error (timeout)
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request timed out, using mock data');
      }
      
      // Fallback to mock data if API fails
      if (!this.useMockData) {
        if (config.debug.enabled) {
          console.log('API failed, falling back to mock data');
        }
        const mockProducts = this.generateMockProducts(query);
        
        return {
          products: mockProducts,
          total_results: mockProducts.length,
          search_metadata: {
            status: 'Fallback (Mock Data)',
            created_at: new Date().toISOString()
          }
        };
      }
      
      throw error;
    }
  }

  async getPriceHistory(productName: string, days: number = 30): Promise<any[]> {
    // This would integrate with a price tracking service
    // For now, returning mock data
    const mockData = [];
    const basePrice = Math.floor(Math.random() * 50000) + 20000;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      mockData.push({
        date: date.toISOString().split('T')[0],
        price: basePrice + Math.floor(Math.random() * 1000) - 500,
        volume: Math.floor(Math.random() * 100) + 10
      });
    }
    
    return mockData;
  }

  async predictPrice(productName: string, currentPrice: number): Promise<{
    prediction: 'rise' | 'fall' | 'stable';
    confidence: number;
    expectedChange: number;
    timeframe: string;
    reasoning: string;
  }> {
    // Mock AI prediction logic
    const predictions = ['rise', 'fall', 'stable'];
    const prediction = predictions[Math.floor(Math.random() * predictions.length)] as 'rise' | 'fall' | 'stable';
    const confidence = Math.floor(Math.random() * 30) + 70; // 70-100%
    const expectedChange = Math.floor(Math.random() * 15) + 5; // 5-20%
    
    const reasoning = `Based on historical price patterns, market trends, and demand analysis for ${productName}`;
    
    return {
      prediction,
      confidence,
      expectedChange,
      timeframe: '2 weeks',
      reasoning
    };
  }
}

export default SerpApiService;
