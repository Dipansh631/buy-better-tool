// Gemini AI service for enhanced search features
import { config } from './config';

const GEMINI_API_KEY = config.gemini.apiKey;
const GEMINI_BASE_URL = config.gemini.baseUrl;

export interface ProductCategory {
  category: string;
  confidence: number;
  subcategory?: string;
}

export interface MarketAnalysis {
  priceRange: string;
  marketTrend: 'increasing' | 'decreasing' | 'stable';
  bestTimeToBuy: string;
  pricePrediction: string;
  marketInsights: string[];
}

export interface ProductRecommendation {
  productName: string;
  reason: string;
  category: string;
  estimatedPrice: string;
  confidence: number;
}

export interface SmartSearchResult {
  enhancedQuery: string;
  categories: ProductCategory[];
  marketAnalysis: MarketAnalysis;
  recommendations: ProductRecommendation[];
  searchTips: string[];
}

export class GeminiAiService {
  private static instance: GeminiAiService;
  private apiKey: string;
  private useMockData: boolean;

  private constructor() {
    this.apiKey = GEMINI_API_KEY;
    
    if (config.debug.enabled) {
      console.log('GeminiAiService constructor - API Key:', this.apiKey ? 'Present' : 'Missing');
      console.log('API Key length:', this.apiKey?.length || 0);
      console.log('API Key preview:', this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'Not set');
    }
    
    // Validate API key and set mock data mode accordingly
    this.useMockData = !this.validateApiKey();
    
    if (config.debug.enabled) {
      console.log('Using mock data:', this.useMockData);
    }
    
    if (this.useMockData) {
      console.warn('GEMINI_API_KEY is not properly configured. Using mock data for demonstration.');
    } else {
      // Test API connection in background
      this.testApiConnection().then(success => {
        if (!success) {
          console.warn('Gemini API connection test failed. Falling back to mock data mode.');
          this.useMockData = true;
        }
      });
    }
  }

  public static getInstance(): GeminiAiService {
    if (!GeminiAiService.instance) {
      GeminiAiService.instance = new GeminiAiService();
    }
    return GeminiAiService.instance;
  }

  public validateApiKey(): boolean {
    if (!this.apiKey || this.apiKey.length < 10) {
      console.warn('Gemini API key is invalid or missing');
      return false;
    }
    
    // Basic format validation for Google API keys
    if (!this.apiKey.startsWith('AIza')) {
      console.warn('Gemini API key format appears invalid (should start with AIza)');
      return false;
    }
    
    return true;
  }

  public async testApiConnection(): Promise<boolean> {
    if (this.useMockData) {
      console.log('API test skipped - using mock data mode');
      return false;
    }

    try {
      const testPrompt = 'Hello, this is a test message.';
      const response = await this.makeApiRequest(testPrompt);
      console.log('Gemini API test successful:', response.substring(0, 100) + '...');
      return true;
    } catch (error) {
      console.error('Gemini API test failed:', error);
      return false;
    }
  }

  public async makeApiRequest(prompt: string): Promise<any> {
    if (this.useMockData) {
      // Return a mock response instead of throwing an error
      return this.generateMockResponse(prompt);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('Gemini API request timeout reached, aborting...');
      controller.abort();
    }, 30000); // Increased to 30 seconds

    try {
      // Add error handling for network issues
      if (!navigator.onLine) {
        throw new Error('No internet connection');
      }

      // Try multiple endpoints in order of preference
      const endpoints = [
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent'
      ];

      let response: Response | null = null;
      let lastError: string = '';

      for (const endpoint of endpoints) {
        try {
          // Check if request was already aborted
          if (controller.signal.aborted) {
            throw new Error('Request was aborted');
          }

          response = await fetch(`${endpoint}?key=${this.apiKey}`, {
            method: 'POST',
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: prompt
                }]
              }]
            })
          });

          if (response.ok) {
            break; // Success, exit the loop
          } else {
            lastError = `Endpoint ${endpoint}: ${response.status} ${response.statusText}`;
            console.warn(`Failed to use endpoint ${endpoint}:`, response.status, response.statusText);
          }
        } catch (fetchError) {
          // Check if it's an abort error
          if (fetchError instanceof Error && fetchError.name === 'AbortError') {
            throw new Error('Request timed out. Please try again.');
          }
          
          lastError = `Endpoint ${endpoint}: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`;
          console.warn(`Error with endpoint ${endpoint}:`, fetchError);
        }
      }

      if (!response || !response.ok) {
        throw new Error(`All Gemini API endpoints failed. Last error: ${lastError}`);
      }

      clearTimeout(timeoutId);

      const data = await response.json();
      
      // Validate response structure
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response structure from Gemini API');
      }
      
      return data.candidates[0].content.parts[0].text || '';
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.name === 'AbortError' || error.message.includes('timed out')) {
          throw new Error('Request timed out. Please try again.');
        } else if (error.message.includes('Failed to fetch')) {
          throw new Error('Network error. Please check your internet connection.');
        } else if (error.message.includes('No internet connection')) {
          throw new Error('No internet connection. Please check your network.');
        }
      }
      
      // Log specific error details
      if (config.debug.enabled) {
        console.error('Gemini API request failed:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          type: error instanceof Error ? error.constructor.name : typeof error,
          timestamp: new Date().toISOString()
        });
      }
      
      throw error;
    }
  }

  private cleanGeminiResponse(response: string): string {
    // Remove markdown code blocks and extract JSON content
    let cleaned = response.trim();
    
    // Remove ```json and ``` markers
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.substring(3);
    }
    
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }
    
    // Remove any leading/trailing whitespace and newlines
    cleaned = cleaned.trim();
    
    // Try to find JSON content between curly braces
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }
    
    // Try to find array content between square brackets
    const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      cleaned = arrayMatch[0];
    }
    
    return cleaned;
  }

  private safeJsonParse(response: string): any {
    try {
      // First try: direct parsing
      return JSON.parse(response);
    } catch (error1) {
      try {
        // Second try: clean the response and parse
        const cleaned = this.cleanGeminiResponse(response);
        return JSON.parse(cleaned);
      } catch (error2) {
        try {
          // Third try: find any JSON-like content and parse
          const jsonPattern = /(\{[\s\S]*\}|\[[\s\S]*\])/;
          const match = response.match(jsonPattern);
          if (match) {
            return JSON.parse(match[1]);
          }
        } catch (error3) {
          // All parsing attempts failed
          console.error('All JSON parsing attempts failed:');
          console.error('Original response:', response);
          console.error('Error 1 (direct):', error1);
          console.error('Error 2 (cleaned):', error2);
          console.error('Error 3 (pattern):', error3);
        }
      }
    }
    
    // If all parsing attempts fail, return null
    return null;
  }

  async enhanceSearchQuery(query: string): Promise<SmartSearchResult> {
    try {
      if (this.useMockData) {
        return this.generateMockSmartSearchResult(query);
      }

      const prompt = `
        Analyze this search query: "${query}"
        
        You must return ONLY valid JSON with this exact structure, no markdown, no explanations, no additional text:
        {
          "enhancedQuery": "enhanced search query",
          "categories": [
            {
              "category": "main category",
              "confidence": 0.95,
              "subcategory": "subcategory"
            }
          ],
          "marketAnalysis": {
            "priceRange": "price range",
            "marketTrend": "increasing/decreasing/stable",
            "bestTimeToBuy": "recommendation",
            "pricePrediction": "prediction",
            "marketInsights": ["insight1", "insight2"]
          },
          "recommendations": [
            {
              "productName": "product name",
              "reason": "why recommend",
              "category": "category",
              "estimatedPrice": "price",
              "confidence": 0.85
            }
          ],
          "searchTips": ["tip1", "tip2", "tip3"]
        }
        
        Focus on electronics, gadgets, and consumer products. Be specific and actionable.
        CRITICAL: Return ONLY the JSON object above, nothing else.
      `;

      const response = await this.makeApiRequest(prompt);
      
      try {
        const result = this.safeJsonParse(response);
        if (result) {
          return result;
        } else {
          console.error('Failed to parse Gemini response after all attempts');
          console.error('Raw response:', response);
          return this.generateMockSmartSearchResult(query);
        }
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', parseError);
        console.error('Raw response:', response);
        return this.generateMockSmartSearchResult(query);
      }
    } catch (error) {
      console.error('Error enhancing search query:', error);
      return this.generateMockSmartSearchResult(query);
    }
  }

  async categorizeProducts(products: any[]): Promise<ProductCategory[]> {
    try {
      if (this.useMockData) {
        return this.generateMockCategories();
      }

      const productTitles = products.map(p => p.title).join(', ');
      const prompt = `
        Categorize these products: ${productTitles}
        
        You must return ONLY valid JSON array with this exact structure, no markdown, no explanations:
        [
          {
            "category": "main category",
            "confidence": 0.95,
            "subcategory": "subcategory"
          }
        ]
        
        CRITICAL: Return ONLY the JSON array above, nothing else.
      `;

      const response = await this.makeApiRequest(prompt);
      
      try {
        const categories = this.safeJsonParse(response);
        if (categories) {
          return categories;
        } else {
          console.error('Failed to parse categories after all attempts');
          console.error('Raw response:', response);
          return this.generateMockCategories();
        }
      } catch (parseError) {
        console.error('Failed to parse categories:', parseError);
        console.error('Raw response:', response);
        return this.generateMockCategories();
      }
    } catch (error) {
      console.error('Error categorizing products:', error);
      return this.generateMockCategories();
    }
  }

  async analyzeMarketTrends(query: string, products: any[]): Promise<MarketAnalysis> {
    try {
      if (this.useMockData) {
        return this.generateMockMarketAnalysis();
      }

      const prices = products.map(p => p.price).join(', ');
      const prompt = `
        Analyze market trends for "${query}" with prices: ${prices}
        
        You must return ONLY valid JSON with this exact structure, no markdown, no explanations:
        {
          "priceRange": "price range",
          "marketTrend": "increasing/decreasing/stable",
          "bestTimeToBuy": "recommendation",
          "pricePrediction": "prediction",
          "marketInsights": ["insight1", "insight2"]
        }
        
        CRITICAL: Return ONLY the JSON object above, nothing else.
      `;

      const response = await this.makeApiRequest(prompt);
      
      try {
        const analysis = this.safeJsonParse(response);
        if (analysis) {
          return analysis;
        } else {
          console.error('Failed to parse market analysis after all attempts');
          console.error('Raw response:', response);
          return this.generateMockMarketAnalysis();
        }
      } catch (parseError) {
        console.error('Failed to parse market analysis:', parseError);
        console.error('Raw response:', response);
        return this.generateMockMarketAnalysis();
      }
    } catch (error) {
      console.error('Error analyzing market trends:', error);
      return this.generateMockMarketAnalysis();
    }
  }

  async getPersonalizedRecommendations(userQuery: string, searchHistory: string[] = []): Promise<ProductRecommendation[]> {
    try {
      if (this.useMockData) {
        return this.generateMockRecommendations();
      }

      const history = searchHistory.join(', ');
      const prompt = `
        Based on user query: "${userQuery}" and search history: [${history}]
        
        You must return ONLY valid JSON array with this exact structure, no markdown, no explanations:
        [
          {
            "productName": "product name",
            "reason": "why recommended",
            "category": "category",
            "estimatedPrice": "price",
            "confidence": 0.85
          }
        ]
        
        CRITICAL: Return ONLY the JSON array above, nothing else.
      `;

      const response = await this.makeApiRequest(prompt);
      
      try {
        const recommendations = this.safeJsonParse(response);
        if (recommendations) {
          return recommendations;
        } else {
          console.error('Failed to parse recommendations after all attempts');
          console.error('Raw response:', response);
          return this.generateMockRecommendations();
        }
      } catch (parseError) {
        console.error('Failed to parse recommendations:', parseError);
        console.error('Raw response:', response);
        return this.generateMockRecommendations();
      }
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return this.generateMockRecommendations();
    }
  }

  private generateMockSmartSearchResult(query: string): SmartSearchResult {
    return {
      enhancedQuery: `${query} best deals 2024`,
      categories: [
        { category: 'Electronics', confidence: 0.95, subcategory: 'Smartphones' },
        { category: 'Technology', confidence: 0.88, subcategory: 'Mobile Devices' }
      ],
      marketAnalysis: {
        priceRange: '₹50,000 - ₹1,50,000',
        marketTrend: 'decreasing',
        bestTimeToBuy: 'During festive sales (October-December)',
        pricePrediction: 'Prices expected to drop 10-15% in next 3 months',
        marketInsights: [
          'New models launching soon may cause price drops',
          'Festive season offers best discounts',
          'Consider refurbished options for better value'
        ]
      },
      recommendations: [
        {
          productName: `${query} Pro Max`,
          reason: 'Premium variant with better features',
          category: 'Electronics',
          estimatedPrice: '₹1,20,000',
          confidence: 0.85
        },
        {
          productName: `${query} Lite`,
          reason: 'Budget-friendly alternative',
          category: 'Electronics',
          estimatedPrice: '₹60,000',
          confidence: 0.78
        }
      ],
      searchTips: [
        'Compare prices across multiple platforms',
        'Check for student discounts',
        'Look for cashback offers',
        'Consider exchange offers for old devices'
      ]
    };
  }

  private generateMockCategories(): ProductCategory[] {
    return [
      { category: 'Electronics', confidence: 0.95, subcategory: 'Smartphones' },
      { category: 'Technology', confidence: 0.88, subcategory: 'Mobile Devices' },
      { category: 'Consumer Electronics', confidence: 0.82, subcategory: 'Gadgets' }
    ];
  }

  private generateMockMarketAnalysis(): MarketAnalysis {
    return {
      priceRange: '₹50,000 - ₹1,50,000',
      marketTrend: 'decreasing',
      bestTimeToBuy: 'During festive sales',
      pricePrediction: 'Prices expected to drop 10-15%',
      marketInsights: [
        'New models launching soon',
        'Festive season offers best discounts',
        'Consider refurbished options'
      ]
    };
  }

  private generateMockRecommendations(): ProductRecommendation[] {
    return [
      {
        productName: 'iPhone 15 Pro Max',
        reason: 'Premium flagship with advanced features',
        category: 'Electronics',
        estimatedPrice: '₹1,50,000',
        confidence: 0.85
      },
      {
        productName: 'Samsung Galaxy S24 Ultra',
        reason: 'Best Android alternative with S Pen',
        category: 'Electronics',
        estimatedPrice: '₹1,30,000',
        confidence: 0.78
      },
      {
        productName: 'Google Pixel 8 Pro',
        reason: 'Excellent camera and AI features',
        category: 'Electronics',
        estimatedPrice: '₹1,10,000',
        confidence: 0.72
      }
    ];
  }

  private generateMockResponse(prompt: string): string {
    // Generate contextual mock responses based on the prompt
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('chat') || lowerPrompt.includes('assistant')) {
      return "Hello! I'm your AI shopping assistant. I can help you with product recommendations, price analysis, market trends, and shopping advice. What would you like to know about today?";
    }
    
    if (lowerPrompt.includes('iphone') || lowerPrompt.includes('smartphone')) {
      return "Based on current market trends, iPhones typically see price drops during festive seasons (October-December) and when new models are announced. The iPhone 15 series offers excellent value with advanced features. Consider checking for student discounts and exchange offers for better deals.";
    }
    
    if (lowerPrompt.includes('laptop') || lowerPrompt.includes('macbook')) {
      return "Laptops often have the best deals during back-to-school seasons and Black Friday sales. MacBooks are premium devices with excellent build quality and performance. Consider refurbished options for significant savings while maintaining warranty coverage.";
    }
    
    if (lowerPrompt.includes('price') || lowerPrompt.includes('deal')) {
      return "For the best deals, I recommend comparing prices across multiple platforms like Amazon, Flipkart, and official brand stores. Look for cashback offers, student discounts, and exchange programs. Prices typically drop during festive seasons and when new models are launched.";
    }
    
    if (lowerPrompt.includes('recommend') || lowerPrompt.includes('suggestion')) {
      return "Here are some great product recommendations: 1) For smartphones: Consider the latest iPhone or Samsung Galaxy series for premium features, 2) For laptops: MacBook Air for portability or Dell XPS for Windows users, 3) For headphones: Sony WH-1000XM4 for excellent noise cancellation.";
    }
    
    // Default response
    return "I'm here to help you with your shopping needs! I can provide product recommendations, price analysis, market trends, and shopping tips. Feel free to ask me about specific products or general shopping advice.";
  }
}

export default GeminiAiService;
