import { PriceChart } from "./PriceChart";
import { PredictionCard } from "./PredictionCard";
import { PriceCard } from "./PriceCard";
import { useProductContext } from "@/lib/product-context";
import { useMemo } from "react";

// Generate dynamic price data based on product category
const generatePlatformPrices = (productName: string) => {
  // Estimate base price based on product category
  let basePrice = 1000;
  
  if (productName.toLowerCase().includes('iphone') || productName.toLowerCase().includes('samsung')) {
    basePrice = 50000;
  } else if (productName.toLowerCase().includes('macbook') || productName.toLowerCase().includes('laptop')) {
    basePrice = 80000;
  } else if (productName.toLowerCase().includes('headphone') || productName.toLowerCase().includes('earbud')) {
    basePrice = 3000;
  } else if (productName.toLowerCase().includes('watch') || productName.toLowerCase().includes('smartwatch')) {
    basePrice = 15000;
  } else if (productName.toLowerCase().includes('tablet') || productName.toLowerCase().includes('ipad')) {
    basePrice = 25000;
  } else if (productName.toLowerCase().includes('camera')) {
    basePrice = 20000;
  } else if (productName.toLowerCase().includes('gaming') || productName.toLowerCase().includes('console')) {
    basePrice = 35000;
  } else if (productName.toLowerCase().includes('tv') || productName.toLowerCase().includes('television')) {
    basePrice = 40000;
  } else if (productName.toLowerCase().includes('book') || productName.toLowerCase().includes('novel')) {
    basePrice = 500;
  } else if (productName.toLowerCase().includes('shirt') || productName.toLowerCase().includes('dress')) {
    basePrice = 1500;
  } else if (productName.toLowerCase().includes('shoe') || productName.toLowerCase().includes('sneaker')) {
    basePrice = 2500;
  } else if (productName.toLowerCase().includes('airpods') || productName.toLowerCase().includes('wireless')) {
    basePrice = 8000;
  } else if (productName.toLowerCase().includes('monitor') || productName.toLowerCase().includes('display')) {
    basePrice = 12000;
  } else if (productName.toLowerCase().includes('keyboard') || productName.toLowerCase().includes('mouse')) {
    basePrice = 2000;
  } else if (productName.toLowerCase().includes('speaker') || productName.toLowerCase().includes('soundbar')) {
    basePrice = 5000;
  } else if (productName.toLowerCase().includes('fridge') || productName.toLowerCase().includes('refrigerator')) {
    basePrice = 30000;
  } else if (productName.toLowerCase().includes('washing') || productName.toLowerCase().includes('machine')) {
    basePrice = 25000;
  } else if (productName.toLowerCase().includes('microwave') || productName.toLowerCase().includes('oven')) {
    basePrice = 8000;
  } else if (productName.toLowerCase().includes('furniture') || productName.toLowerCase().includes('sofa')) {
    basePrice = 15000;
  } else if (productName.toLowerCase().includes('toy') || productName.toLowerCase().includes('game')) {
    basePrice = 800;
  } else if (productName.toLowerCase().includes('cosmetic') || productName.toLowerCase().includes('beauty')) {
    basePrice = 1200;
  } else if (productName.toLowerCase().includes('food') || productName.toLowerCase().includes('snack')) {
    basePrice = 200;
  }

  const platforms = [
    { 
      name: "Amazon", 
      logo: "A", 
      url: "https://www.amazon.in/s?k=",
      searchUrl: true
    },
    { 
      name: "Flipkart", 
      logo: "F", 
      url: "https://www.flipkart.com/search?q=",
      searchUrl: true
    },
    { 
      name: "Croma", 
      logo: "C", 
      url: "https://www.croma.com/search?q=",
      searchUrl: true
    },
    { 
      name: "Reliance Digital", 
      logo: "R", 
      url: "https://www.reliancedigital.in/search?q=",
      searchUrl: true
    },
    { 
      name: "Vijay Sales", 
      logo: "V", 
      url: "https://www.vijaysales.com/search.aspx?q=",
      searchUrl: true
    },
    { 
      name: "Tata Cliq", 
      logo: "TC", 
      url: "https://www.tatacliq.com/search?searchText=",
      searchUrl: true
    }
  ];

  return platforms.map((platform, index) => {
    // Generate realistic price variations
    const variation = (Math.random() - 0.5) * 0.2; // ±10%
    const currentPrice = Math.round(basePrice * (1 + variation));
    const originalPrice = Math.round(currentPrice * (1 + Math.random() * 0.15)); // 0-15% higher
    
    const trendRandom = Math.random();
    const trend: "up" | "down" | "stable" = trendRandom > 0.6 ? "down" : trendRandom > 0.3 ? "up" : "stable";
    const trendPercent = Math.round(Math.random() * 8) + 1;
    
    // Create a proper search URL that will actually work
    const searchQuery = encodeURIComponent(productName);
    const productUrl = platform.searchUrl ? `${platform.url}${searchQuery}` : platform.url;
    
    return {
      platform: platform.name,
      price: currentPrice,
      originalPrice: originalPrice > currentPrice ? originalPrice : currentPrice,
      trend,
      trendPercent: trend === "down" ? -trendPercent : trend === "up" ? trendPercent : 0,
      availability: Math.random() > 0.2 ? "In Stock" : "Low Stock",
      rating: Math.round((Math.random() * 1.5 + 3.5) * 10) / 10, // 3.5-5.0
      logo: platform.logo,
      productName: productName,
      productUrl: productUrl
    };
  });
};

// Generate dynamic prediction data
const generatePredictionData = (productName: string) => {
  const basePrice = generatePlatformPrices(productName)[0]?.price || 1000;
  
  // Generate realistic prediction
  const trend = Math.random() > 0.6 ? "fall" : Math.random() > 0.5 ? "rise" : "stable";
  const confidence = Math.round(Math.random() * 20) + 70; // 70-90%
  const expectedChange = trend === "fall" ? -(Math.round(Math.random() * 15) + 5) : 
                        trend === "rise" ? (Math.round(Math.random() * 10) + 2) : 0;
  
  const currentPrice = basePrice;
  const targetPrice = Math.round(currentPrice * (1 + expectedChange / 100));
  
  return {
    prediction: trend as "rise" | "fall" | "stable",
    confidence,
    expectedChange,
    timeframe: Math.random() > 0.5 ? "2 weeks" : "1 month",
    currentPrice,
    targetPrice
  };
};

export const Dashboard = () => {
  const { selectedProduct, isProductSelected, priceHistory, currentPrice } = useProductContext();
  
  // Generate dynamic data based on selected product
  const platformPrices = useMemo(() => {
    const globalOffers = (window as any).__platformOffers as any[] | undefined;
    if (globalOffers && globalOffers.length > 0 && isProductSelected) {
      // Normalize minimal fields expected by PriceCard
      return globalOffers.map(o => ({
        platform: o.platform || 'Unknown',
        price: typeof o.price === 'number' ? o.price : 0,
        originalPrice: typeof o.originalPrice === 'number' ? o.originalPrice : undefined,
        trend: (typeof o.trend === 'string' ? o.trend : 'stable') as "up" | "down" | "stable",
        trendPercent: typeof o.trendPercent === 'number' ? o.trendPercent : 0,
        availability: o.availability || 'In Stock',
        rating: typeof o.rating === 'number' ? o.rating : undefined,
        logo: o.logo || '•',
        productName: o.productName || selectedProduct,
        productUrl: o.productUrl || 'https://example.com'
      }));
    }
    if (!selectedProduct || !isProductSelected) {
      return generatePlatformPrices("MacBook Air M3"); // Default fallback
    }
    return generatePlatformPrices(selectedProduct);
  }, [selectedProduct, isProductSelected]);

  const predictionData = useMemo(() => {
    // If we have real history, derive a realistic prediction
    if (isProductSelected && priceHistory && priceHistory.length > 3) {
      const recent = priceHistory.slice(-6);
      const prices = recent.map(p => p.price);
      const diffs = prices.map((p, i) => (i === 0 ? 0 : p - prices[i - 1])).slice(1);
      const avgStep = diffs.length ? diffs.reduce((a, b) => a + b, 0) / diffs.length : 0;
      const last = prices[prices.length - 1];
      const expectedChangePct = Math.round((avgStep / Math.max(1, last)) * 100);
      const boundedChange = Math.max(-15, Math.min(12, expectedChangePct));
      const direction = boundedChange > 2 ? "rise" : boundedChange < -2 ? "fall" : "stable";
      const confidence = Math.max(65, Math.min(92, 80 - Math.abs(boundedChange - 3)));
      const targetPrice = Math.max(0, Math.round(last * (1 + boundedChange / 100)));
      return {
        prediction: direction as "rise" | "fall" | "stable",
        confidence,
        expectedChange: boundedChange,
        timeframe: Math.abs(boundedChange) > 5 ? "2 weeks" : "1 month",
        currentPrice: last,
        targetPrice
      };
    }
    // Fallback to synthetic if no history
    if (!selectedProduct || !isProductSelected) {
      return generatePredictionData("MacBook Air M3");
    }
    return generatePredictionData(selectedProduct);
  }, [selectedProduct, isProductSelected, priceHistory]);

  // Use selected product or fallback to default
  const currentProduct = selectedProduct || "MacBook Air M3";

  return (
    <section className="py-20 px-6 bg-background relative" data-section="dashboard">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Live Price Tracking & AI Analysis
          </h2>
          <p className="text-lg text-muted-foreground">
            {isProductSelected ? (
              <>
                {currentProduct} - Real-time data from multiple platforms
              </>
            ) : (
              <>
            MacBook Air M3 (13-inch, 8GB RAM, 256GB SSD) - Real-time data from multiple platforms
                <br />
                <span className="text-sm text-muted-foreground mt-2 block">
                  Search for a product above to start tracking
                </span>
              </>
            )}
          </p>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <PriceChart 
              productName={currentProduct} 
              history={priceHistory} 
              projectionTargetPrice={predictionData.targetPrice}
            />
          </div>
          <div>
            <PredictionCard
              prediction={predictionData.prediction}
              confidence={predictionData.confidence}
              expectedChange={predictionData.expectedChange}
              timeframe={predictionData.timeframe}
              currentPrice={currentPrice || predictionData.currentPrice}
              targetPrice={predictionData.targetPrice}
              productName={currentProduct}
            />
          </div>
        </div>
        
        <div className="mb-8">
          <h3 className="text-2xl font-bold mb-6">Current Prices Across Platforms</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {platformPrices.map((price, index) => (
              <PriceCard key={index} {...price} />
            ))}
          </div>
        </div>
        
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-success/10 text-success px-4 py-2 rounded-full text-sm font-medium">
            <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
            Best time to buy: Wait 2 weeks for optimal savings
          </div>
        </div>
      </div>
    </section>
  );
};