import { useState, useEffect } from "react";
import { Search, Zap, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import SerpApiService, { SerpProduct } from "@/lib/serp-api";

// Suggestions removed - no longer showing search recommendations

export const SearchBar = () => {
  const [query, setQuery] = useState("");
  // showSuggestions state removed - no longer needed
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SerpProduct[]>([]);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!query.trim()) {
      toast({
        title: "Search Error",
        description: "Please enter a product name to search",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    // setShowSuggestions removed - no longer needed
    
    try {
      const serpService = SerpApiService.getInstance();
      const results = await serpService.searchProducts(query);
      setSearchResults(results.products);
      
      toast({
        title: "Search Complete",
        description: `Found ${results.products.length} products for "${query}"`,
      });
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Failed",
        description: "Failed to search products. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // handleSuggestionClick function removed - no longer needed

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

  const handleClear = () => {
    setQuery("");
    // Results will be cleared by the useEffect above
  };

  // Watch for query changes and clear results when empty
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      // setShowSuggestions removed - no longer needed
    }
    // Removed suggestions display - no longer showing search recommendations
  }, [query]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
        <Input
          placeholder="Enter product name (e.g., iPhone 15, MacBook Air)"
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
            <Zap className="h-4 w-4 mr-2" />
          )}
          {isSearching ? "Searching..." : "Predict"}
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
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    <span>{product.source}</span>
                    {product.rating && (
                      <span>⭐ {product.rating}</span>
                    )}
                    <span className={product.availability === 'In Stock' ? 'text-success' : 'text-destructive'}>
                      {product.availability}
                    </span>
                  </div>
                  
                  {/* Visit Site Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering the parent div click
                      
                      // Show notification
                      toast({
                        title: "Opening Website",
                        description: `Redirecting to ${product.source}...`,
                      });
                      
                      // Open website in new tab
                      try {
                        if (product.link && product.link !== '#') {
                          window.open(product.link, '_blank', 'noopener,noreferrer');
                          
                          // Show success notification after a short delay
                          setTimeout(() => {
                            toast({
                              title: "Website Opened",
                              description: `${product.source} opened in new tab`,
                            });
                          }, 1000);
                        } else {
                          // Handle case where link is not available - provide fallback search
                          const fallbackUrl = `https://www.google.com/search?q=${encodeURIComponent(product.title)}`;
                          window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
                          
                          toast({
                            title: "Search Results Opened",
                            description: `Opened Google search for ${product.title} since direct link is not available`,
                            variant: "default",
                          });
                        }
                      } catch (error) {
                        console.error('Error opening link:', error);
                        toast({
                          title: "Link Error",
                          description: "Could not open product link. Please try again.",
                          variant: "destructive",
                        });
                      }
                    }}
                    className="w-full"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Visit Site
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};