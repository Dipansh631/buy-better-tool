import { useState } from "react";
import { TrendingUp, TrendingDown, Minus, ExternalLink, Star, Target, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ClickUpApiService, { PriceTrackingTask } from "@/lib/clickup-api";

interface PriceCardProps {
  platform: string;
  price: number;
  originalPrice?: number;
  trend: "up" | "down" | "stable";
  trendPercent: number;
  availability: string;
  rating?: number;
  logo: string;
  productName?: string;
  productUrl?: string;
}

export const PriceCard = ({
  platform,
  price,
  originalPrice,
  trend,
  trendPercent,
  availability,
  rating,
  logo,
  productName = "Product",
  productUrl = "https://example.com"
}: PriceCardProps) => {
  const { toast } = useToast();
  const [isTracking, setIsTracking] = useState(false);
  const [targetPrice, setTargetPrice] = useState<number | null>(null);

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground";

  const handleViewOnPlatform = () => {
    // Show notification
    toast({
      title: "Opening Platform",
      description: `Redirecting to ${platform}...`,
    });
    
    // Open platform URL in new tab
    try {
      if (productUrl && productUrl !== 'https://example.com') {
        // Check if it's a search URL (contains search parameters)
        const isSearchUrl = productUrl.includes('search') || productUrl.includes('s?k=') || productUrl.includes('search?q=');
        
        window.open(productUrl, '_blank', 'noopener,noreferrer');
        
        // Show success notification after a short delay
        setTimeout(() => {
          toast({
            title: "Platform Opened",
            description: isSearchUrl 
              ? `${platform} search results opened in new tab` 
              : `${platform} product page opened in new tab`,
          });
        }, 1000);
      } else {
        // Handle case where URL is not available - provide a fallback search URL
        const fallbackUrl = `https://www.google.com/search?q=${encodeURIComponent(productName)}`;
        window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
        
        toast({
          title: "Search Results Opened",
          description: `Opened Google search for ${productName} since direct link is not available`,
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error opening platform URL:', error);
      toast({
        title: "Link Error",
        description: `Could not open ${platform}. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const handleTrackPrice = async () => {
    if (!targetPrice) {
      toast({
        title: "Set Target Price",
        description: "Please enter a target price to start tracking",
        variant: "destructive",
      });
      return;
    }

    setIsTracking(true);
    
    try {
      const clickupService = ClickUpApiService.getInstance();
      
      // Use the first available list for tracking (in a real app, you'd let users choose)
      const spaces = await clickupService.getSpaces();
      const lists = await clickupService.getLists(spaces[0]?.id || 'mock-list-1');
      
      const task = await clickupService.createPriceTrackingTask(
        lists[0]?.id || 'mock-list-1',
        productName,
        price,
        targetPrice,
        platform,
        productUrl
      );

      toast({
        title: "Price Tracking Started",
        description: `Now tracking ${productName} on ${platform}. Target: ₹${targetPrice.toLocaleString()}`,
      });

      console.log('Created tracking task:', task);
    } catch (error) {
      console.error('Error creating tracking task:', error);
      toast({
        title: "Tracking Failed",
        description: "Failed to start price tracking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTracking(false);
    }
  };

  const handleSetTargetPrice = () => {
    const input = prompt(`Enter target price for ${productName} (current: ₹${price.toLocaleString()}):`);
    if (input) {
      const target = parseFloat(input.replace(/[^\d.]/g, ''));
      if (!isNaN(target) && target > 0) {
        setTargetPrice(target);
        toast({
          title: "Target Price Set",
          description: `Target price set to ₹${target.toLocaleString()}`,
        });
      } else {
        toast({
          title: "Invalid Price",
          description: "Please enter a valid price",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="bg-card/50 backdrop-blur-md border border-border/50 rounded-xl p-6 hover:shadow-card transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary font-bold text-sm">
            {logo}
          </div>
          <div>
            <h3 className="font-semibold">{platform}</h3>
            <Badge 
              variant={availability === "In Stock" ? "default" : "secondary"}
              className="text-xs"
            >
              {availability.replace("-", " ")}
            </Badge>
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">₹{price.toLocaleString()}</span>
          {originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              ₹{originalPrice.toLocaleString()}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <TrendIcon className={`h-4 w-4 ${trendColor}`} />
          <span className={`text-sm ${trendColor}`}>
            {trend === "up" ? "+" : trend === "down" ? "-" : ""}{trendPercent}%
          </span>
          <span className="text-xs text-muted-foreground">vs last week</span>
        </div>
        
        {rating && (
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-warning fill-current" />
            <span className="text-sm">{rating}</span>
            <span className="text-xs text-muted-foreground">/5</span>
          </div>
        )}

        {targetPrice && (
          <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Target: ₹{targetPrice.toLocaleString()}</span>
            <span className={`text-xs ${price <= targetPrice ? 'text-success' : 'text-muted-foreground'}`}>
              {price <= targetPrice ? 'Target reached!' : `${((targetPrice - price) / price * 100).toFixed(1)}% to go`}
            </span>
          </div>
        )}
        
        <div className="flex gap-2">
          <Button 
            variant="glass" 
            size="sm" 
            className="flex-1"
            onClick={handleViewOnPlatform}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View on {platform}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSetTargetPrice}
          >
            <Target className="h-4 w-4" />
          </Button>
        </div>

        {targetPrice && (
          <Button 
            variant="success" 
            size="sm" 
            className="w-full"
            onClick={handleTrackPrice}
            disabled={isTracking}
          >
            {isTracking ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Setting up...
              </>
            ) : (
              <>
                <Bell className="h-4 w-4 mr-2" />
                Start Tracking
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};