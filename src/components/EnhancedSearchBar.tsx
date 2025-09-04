import { useState, useEffect, useRef } from "react";
import { Search, Zap, Loader2, X, Brain, BarChart3, Lightbulb, Target, MessageCircle, CheckCircle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import SerpApiService, { SerpProduct } from "@/lib/serp-api";
import GeminiAiService, { SmartSearchResult, ProductCategory, MarketAnalysis, ProductRecommendation } from "@/lib/gemini-ai";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AiChatAssistant } from "./AiChatAssistant";
import { useProductContext } from "@/lib/product-context";

// Suggestions removed - no longer showing search recommendations

export const EnhancedSearchBar = () => {
  const [query, setQuery] = useState("");
  // showSuggestions state removed - no longer needed
  const [isSearching, setIsSearching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchResults, setSearchResults] = useState<SerpProduct[]>([]);
  const [smartAnalysis, setSmartAnalysis] = useState<SmartSearchResult | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { selectedProduct, setSelectedProduct, clearSelectedProduct, isProductSelected, startTracking } = useProductContext();
  const { toast } = useToast();
  const searchAbortController = useRef<AbortController | null>(null);

  // Watch for query changes and clear results when empty
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      setSmartAnalysis(null);
      // setShowSuggestions removed - no longer needed
    }
    // Removed suggestions display - no longer showing search recommendations
  }, [query]);

  // Update query when selectedProduct changes
  useEffect(() => {
    if (selectedProduct && !query) {
      setQuery(selectedProduct);
    }
  }, [selectedProduct, query]);

  // Cleanup function for abort controller
  useEffect(() => {
    return () => {
      if (searchAbortController.current) {
        searchAbortController.current.abort();
      }
    };
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) {
      toast({
        title: "Search Error",
        description: "Please enter a product name to search",
        variant: "destructive",
      });
      return;
    }

    // Cancel any ongoing search
    if (searchAbortController.current) {
      searchAbortController.current.abort();
    }

    // Create new abort controller for this search
    searchAbortController.current = new AbortController();
    const abortSignal = searchAbortController.current.signal;

    setIsSearching(true);
    setIsAnalyzing(true);
    // setShowSuggestions removed - no longer needed
    
    try {
      // Check if search was aborted
      if (abortSignal.aborted) {
        return;
      }

      // Add to search history
      setSearchHistory(prev => [query, ...prev.slice(0, 4)]);

      // Get basic search results first with better error handling
      let results;
      try {
        const serpService = SerpApiService.getInstance();
        results = await serpService.searchProducts(query);
        
        // Check if search was aborted
        if (abortSignal.aborted) {
          return;
        }
        
        setSearchResults(results.products);

        // Persist latest platform offers globally for dashboard cards
        try {
          const offers = results.products.slice(0, 6).map(p => {
            const parseNum = (s?: string) => {
              if (!s) return 0;
              const n = parseFloat(s.replace(/[^0-9.]/g, ''));
              return isNaN(n) ? 0 : Math.round(n);
            };
            return {
              platform: p.source,
              price: parseNum(p.price),
              originalPrice: parseNum(p.original_price) || undefined,
              trend: 'stable' as const,
              trendPercent: 0,
              availability: p.availability || 'In Stock',
              rating: p.rating,
              logo: (p.source || '?').substring(0, 1).toUpperCase(),
              productName: p.title,
              productUrl: p.link || 'https://example.com'
            };
          });
          (window as any).__platformOffers = offers;
        } catch {}
      } catch (serpError) {
        // Check if search was aborted
        if (abortSignal.aborted) {
          return;
        }
        
        console.warn('Serp API failed, using mock data:', serpError);
        // Generate mock search results as fallback
        results = {
          products: [
            {
              title: `${query} - Sample Product`,
              price: '₹999',
              original_price: '₹1,199',
              rating: 4.2,
              reviews: 156,
              image: '',
              link: `https://www.amazon.in/s?k=${encodeURIComponent(query)}`,
              source: 'Amazon',
              availability: 'In Stock'
            },
            {
              title: `${query} - Premium Version`,
              price: '₹1,499',
              original_price: '₹1,799',
              rating: 4.5,
              reviews: 89,
              image: '',
              link: `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`,
              source: 'Flipkart',
              availability: 'In Stock'
            },
            {
              title: `${query} - Best Value`,
              price: '₹799',
              original_price: '₹999',
              rating: 4.0,
              reviews: 234,
              image: '',
              link: `https://www.croma.com/search?q=${encodeURIComponent(query)}`,
              source: 'Croma',
              availability: 'In Stock'
            }
          ],
          total_results: 3,
          search_metadata: {
            status: 'Success (Demo Mode)',
            created_at: new Date().toISOString()
          }
        };
        setSearchResults(results.products);
      }
      
      // Try to get AI-enhanced analysis (with improved fallback)
      try {
        const geminiService = GeminiAiService.getInstance();
        const analysis = await geminiService.enhanceSearchQuery(query);
        
        // Check if search was aborted
        if (abortSignal.aborted) {
          return;
        }
        
        setSmartAnalysis(analysis);
        
        toast({
          title: "Smart Search Complete",
          description: `Found ${results.products.length} products with AI insights`,
        });
      } catch (aiError) {
        // Check if search was aborted
        if (abortSignal.aborted) {
          return;
        }
        
        console.warn('AI analysis failed, showing basic results:', aiError);
        
        // Generate basic mock analysis as fallback
        const mockAnalysis = {
          enhancedQuery: query,
          categories: [
            { category: 'Electronics', confidence: 0.8 },
            { category: 'Consumer Goods', confidence: 0.6 }
          ],
          marketAnalysis: {
            priceRange: '₹500 - ₹5,000',
            marketTrend: 'stable' as const,
            bestTimeToBuy: 'Current month',
            pricePrediction: 'Prices expected to remain stable',
            marketInsights: ['Good time to buy', 'Prices are competitive']
          },
          recommendations: [
            {
              productName: `${query} Pro`,
              reason: 'Better value for money',
              category: 'Premium',
              estimatedPrice: '₹1,500',
              confidence: 0.7
            }
          ],
          searchTips: [
            'Compare prices across platforms',
            'Check for seasonal discounts',
            'Read customer reviews'
          ]
        };
        
        setSmartAnalysis(mockAnalysis);
        
        // Show appropriate toast based on error type
        if (aiError instanceof Error) {
          if (aiError.message.includes('Failed to parse')) {
            toast({
              title: "Search Complete",
              description: `Found ${results.products.length} products (AI analysis unavailable, using enhanced demo mode)`,
              variant: "default"
            });
          } else if (aiError.message.includes('timeout') || aiError.message.includes('timed out')) {
            toast({
              title: "Search Complete",
              description: `Found ${results.products.length} products (AI analysis timed out, using demo mode)`,
              variant: "default"
            });
          } else {
            toast({
              title: "Search Complete",
              description: `Found ${results.products.length} products (using enhanced demo mode)`,
            });
          }
        } else {
          toast({
            title: "Search Complete",
            description: `Found ${results.products.length} products (using enhanced demo mode)`,
          });
        }
      }
    } catch (error) {
      // Don't show error if search was aborted
      if (abortSignal.aborted) {
        return;
      }
      
      console.error('Search error:', error);
      
      // Provide more specific error messages
      let errorMessage = "Failed to search products. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes('No internet connection')) {
          errorMessage = "No internet connection. Please check your network.";
        } else if (error.message.includes('timeout') || error.message.includes('timed out')) {
          errorMessage = "Request timed out. Please try again.";
        } else if (error.message.includes('API')) {
          errorMessage = "API service temporarily unavailable.";
        } else if (error.message.includes('aborted')) {
          errorMessage = "Search was cancelled. Please try again.";
        }
      }
      
      toast({
        title: "Search Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      // Only update state if search wasn't aborted
      if (!abortSignal.aborted) {
        setIsSearching(false);
        setIsAnalyzing(false);
      }
    }
  };

  // handleSuggestionClick function removed - no longer needed

  const handleProductSelect = async (product: SerpProduct) => {
    setSelectedProduct(product.title);
    setQuery(product.title);
    try {
      await startTracking(product);
    } catch (e) {
      // tracking is best-effort; UI already updates selection
    }
    
    toast({
      title: "Product Selected",
      description: `${product.title} is now selected for tracking`,
    });
  };

  const handleClear = () => {
    setQuery("");
    clearSelectedProduct();
    setSearchResults([]);
    setSmartAnalysis(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleInputFocus = () => {
    // Suggestions removed - no longer showing search recommendations
  };

  const handleInputBlur = () => {
    // Suggestions removed - no longer needed
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    // Clear selected product if user types something different
    if (value !== selectedProduct) {
      clearSelectedProduct();
    }
  };

  const handleChatAboutProduct = (productName: string) => {
    setSelectedProduct(productName);
    setIsChatOpen(true);
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing': return 'text-red-600';
      case 'decreasing': return 'text-green-600';
      default: return 'text-blue-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return '📈';
      case 'decreasing': return '📉';
      default: return '➡️';
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Product Selection Status */}
      {isProductSelected && (
        <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            <span className="font-medium">Tracking: <span className="text-primary">{selectedProduct}</span></span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSelectedProduct}
            className="text-muted-foreground hover:text-foreground"
          >
            Change Product
          </Button>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
        <Input
          placeholder="Enter product name for smart search (e.g., iPhone 15, MacBook Air)"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyPress={handleKeyPress}
          className="pl-12 pr-20 h-14 text-lg bg-card/50 backdrop-blur-md border-border/50 focus:border-primary transition-all duration-300"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-28 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-accent/50"
            title="Clear search"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <Button 
          variant="hero" 
          size="lg" 
          className="absolute right-2 top-1/2 transform -translate-y-1/2"
          onClick={handleSearch}
          disabled={isSearching}
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Brain className="h-4 w-4 mr-2" />
          )}
          {isSearching ? "Analyzing..." : "Smart Search"}
        </Button>
      </div>
      
      {/* Suggestions removed - no longer showing search recommendations */}

      {/* Search Results */}
      {searchResults.length > 0 && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-4 bg-card/95 backdrop-blur-md border border-border/50 rounded-lg shadow-card z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-border/50">
            <h3 className="font-semibold text-lg">Search Results for "{query}"</h3>
            <p className="text-sm text-muted-foreground">{searchResults.length} products found</p>
          </div>
          {searchResults.map((product, index) => (
            <div
              key={index}
              className="p-4 hover:bg-accent/50 border-b border-border/30 last:border-b-0 transition-colors duration-200"
            >
              <div className="flex items-start gap-3">
                {product.image && (
                  <img 
                    src={product.image} 
                    alt={product.title}
                    className="w-16 h-16 object-cover rounded-md"
                    onError={(e) => {
                      // Fallback for broken images
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm line-clamp-2 mb-1">{product.title}</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <span className="font-semibold text-primary">{product.price}</span>
                    {product.original_price && (
                      <span className="line-through">{product.original_price}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{product.source}</span>
                    {product.rating && (
                      <span>⭐ {product.rating}</span>
                    )}
                    <span className={product.availability === 'In Stock' ? 'text-success' : 'text-destructive'}>
                      {product.availability}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleProductSelect(product)}
                    className="text-xs"
                  >
                    Select for Tracking
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      const openLink = (url: string, description: string) => {
                        try {
                          // Method 1: Try creating a temporary link element
                          const link = document.createElement('a');
                          link.href = url;
                          link.target = '_blank';
                          link.rel = 'noopener noreferrer';
                          link.style.display = 'none';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          
                          toast({
                            title: "Link Opened",
                            description: description,
                          });
                        } catch (error) {
                          console.error('Link element method failed:', error);
                          
                          // Method 2: Fallback to window.location
                          try {
                            window.location.assign(url);
                          } catch (fallbackError) {
                            console.error('All link opening methods failed:', fallbackError);
                            toast({
                              title: "Link Error",
                              description: "Could not open link. Please copy the URL manually.",
                              variant: "destructive",
                            });
                          }
                        }
                      };

                      if (product.link && product.link !== '#') {
                        openLink(product.link, `${product.source} opened`);
                      } else {
                        const fallbackUrl = `https://www.google.com/search?q=${encodeURIComponent(product.title)}`;
                        openLink(fallbackUrl, `Google search opened for ${product.title}`);
                      }
                    }}
                    className="text-xs"
                  >
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Visit Site
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleChatAboutProduct(product.title)}
                    className="text-xs"
                  >
                    <MessageCircle className="h-3 w-3 mr-1" />
                    Chat
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Smart Analysis Results */}
      {smartAnalysis && (
        <div className="mt-6 bg-card/50 backdrop-blur-md border border-border/50 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">AI-Powered Market Analysis</h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Market Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Market Trends
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Price Range:</span>
                  <Badge variant="secondary">{smartAnalysis.marketAnalysis.priceRange}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Trend:</span>
                  <Badge 
                    variant={smartAnalysis.marketAnalysis.marketTrend === 'decreasing' ? 'default' : 'destructive'}
                    className="flex items-center gap-1"
                  >
                    {getTrendIcon(smartAnalysis.marketAnalysis.marketTrend)}
                    {smartAnalysis.marketAnalysis.marketTrend}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Best Time:</span>
                  <Badge variant="outline">{smartAnalysis.marketAnalysis.bestTimeToBuy}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Product Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {smartAnalysis.categories.map((category, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{category.category}</span>
                      <Progress value={category.confidence} className="w-20" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          {smartAnalysis.recommendations.length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Smart Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {smartAnalysis.recommendations.map((rec, index) => (
                    <div key={index} className="p-3 bg-muted/50 rounded-lg">
                      <h4 className="font-medium text-sm mb-1">{rec.productName}</h4>
                      <p className="text-xs text-muted-foreground mb-2">{rec.reason}</p>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-primary font-medium">{rec.estimatedPrice}</span>
                        <Badge variant="outline">{rec.category}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search Tips */}
          {smartAnalysis.searchTips.length > 0 && (
            <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                Search Tips
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {smartAnalysis.searchTips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Loading State for AI Analysis */}
      {isAnalyzing && !smartAnalysis && (
        <div className="mt-6 bg-card/50 backdrop-blur-md border border-border/50 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
            <div>
              <h3 className="text-lg font-semibold">AI Analysis in Progress</h3>
              <p className="text-sm text-muted-foreground">Analyzing market trends and generating insights...</p>
            </div>
          </div>
        </div>
      )}

      {/* AI Chat Assistant */}
      {isChatOpen && (
        <AiChatAssistant
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          productContext={selectedProduct || query}
        />
      )}
    </div>
  );
};
