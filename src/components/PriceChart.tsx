import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useMemo } from 'react';

interface PriceChartProps {
  productName: string;
  history?: Array<{ date: string; price: number }>;
  projectionTargetPrice?: number;
}

interface PriceDataPoint {
  date: string;
  price: number | null;
  prediction: number | null;
}

// Generate realistic price data based on product name and estimated price range
const generatePriceData = (productName: string): PriceDataPoint[] => {
  // Estimate base price based on product category
  let basePrice = 1000; // Default fallback
  
  if (productName.toLowerCase().includes('iphone') || productName.toLowerCase().includes('samsung')) {
    basePrice = 50000; // Smartphones
  } else if (productName.toLowerCase().includes('macbook') || productName.toLowerCase().includes('laptop')) {
    basePrice = 80000; // Laptops
  } else if (productName.toLowerCase().includes('headphone') || productName.toLowerCase().includes('earbud')) {
    basePrice = 3000; // Audio devices
  } else if (productName.toLowerCase().includes('watch') || productName.toLowerCase().includes('smartwatch')) {
    basePrice = 15000; // Smartwatches
  } else if (productName.toLowerCase().includes('tablet') || productName.toLowerCase().includes('ipad')) {
    basePrice = 25000; // Tablets
  } else if (productName.toLowerCase().includes('camera')) {
    basePrice = 20000; // Cameras
  } else if (productName.toLowerCase().includes('gaming') || productName.toLowerCase().includes('console')) {
    basePrice = 35000; // Gaming devices
  } else if (productName.toLowerCase().includes('tv') || productName.toLowerCase().includes('television')) {
    basePrice = 40000; // TVs
  } else if (productName.toLowerCase().includes('book') || productName.toLowerCase().includes('novel')) {
    basePrice = 500; // Books
  } else if (productName.toLowerCase().includes('shirt') || productName.toLowerCase().includes('dress')) {
    basePrice = 1500; // Clothing
  } else if (productName.toLowerCase().includes('shoe') || productName.toLowerCase().includes('sneaker')) {
    basePrice = 2500; // Footwear
  } else if (productName.toLowerCase().includes('airpods') || productName.toLowerCase().includes('wireless')) {
    basePrice = 8000; // Wireless earbuds
  } else if (productName.toLowerCase().includes('monitor') || productName.toLowerCase().includes('display')) {
    basePrice = 12000; // Monitors
  } else if (productName.toLowerCase().includes('keyboard') || productName.toLowerCase().includes('mouse')) {
    basePrice = 2000; // Peripherals
  } else if (productName.toLowerCase().includes('speaker') || productName.toLowerCase().includes('soundbar')) {
    basePrice = 5000; // Audio systems
  } else if (productName.toLowerCase().includes('fridge') || productName.toLowerCase().includes('refrigerator')) {
    basePrice = 30000; // Appliances
  } else if (productName.toLowerCase().includes('washing') || productName.toLowerCase().includes('machine')) {
    basePrice = 25000; // Washing machines
  } else if (productName.toLowerCase().includes('microwave') || productName.toLowerCase().includes('oven')) {
    basePrice = 8000; // Kitchen appliances
  } else if (productName.toLowerCase().includes('furniture') || productName.toLowerCase().includes('sofa')) {
    basePrice = 15000; // Furniture
  } else if (productName.toLowerCase().includes('toy') || productName.toLowerCase().includes('game')) {
    basePrice = 800; // Toys and games
  } else if (productName.toLowerCase().includes('cosmetic') || productName.toLowerCase().includes('beauty')) {
    basePrice = 1200; // Beauty products
  } else if (productName.toLowerCase().includes('food') || productName.toLowerCase().includes('snack')) {
    basePrice = 200; // Food items
  }

  // Generate 8 months of historical data (Jan to Aug)
  const historicalMonths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug'];
  const historicalData: PriceDataPoint[] = [];
  
  let currentPrice = basePrice;
  
  historicalMonths.forEach((month) => {
    // Add realistic price variations (±15% max)
    const variation = (Math.random() - 0.5) * 0.3; // -15% to +15%
    const newPrice = Math.round(currentPrice * (1 + variation));
    
    historicalData.push({
      date: month,
      price: newPrice,
      prediction: null
    });
    
    currentPrice = newPrice;
  });

  // Add predictions to complete the year (Sep to Dec)
  const predictionMonths = ['Sep','Oct','Nov','Dec'];
  predictionMonths.forEach((month, index) => {
    // Predict future prices with slight downward trend
    const trend = -0.02 * (index + 1); // Gradual decrease
    const prediction = Math.round(currentPrice * (1 + trend + (Math.random() - 0.5) * 0.1));
    
    historicalData.push({
      date: month,
      price: null,
      prediction: prediction
    });
  });

  return historicalData;
};

// Merge real history with short-term forecast generated from last points
const projectFromHistory = (
  history: Array<{ date: string; price: number }>,
  projectionTargetPrice?: number
): PriceDataPoint[] => {
  if (!history || history.length === 0) return [];

  // Use last 8 points to compute slope
  const recent = history.slice(-8);
  const prices = recent.map(p => p.price);
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const diffs = prices.map((p, i) => (i === 0 ? 0 : p - prices[i - 1])).slice(1);
  const avgStep = diffs.length ? diffs.reduce((a, b) => a + b, 0) / diffs.length : 0;

  // Label historical data from Jan onward
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const historical: PriceDataPoint[] = [];
  for (let i = 0; i < recent.length; i++) {
    const monthIndex = i; // Start at Jan
    if (monthIndex >= months.length) break; // cap at Dec
    historical.push({
      date: months[monthIndex],
      price: recent[i].price,
      prediction: null
    });
  }

  // Forecast next months, but never go past Dec
  const last = prices[prices.length - 1] ?? avg;
  let currentLabelIndex = historical.length - 1; // last used month index
  const preds: PriceDataPoint[] = [];
  let current = last;
  for (let i = 1; i <= 3 && currentLabelIndex + i < months.length; i++) {
    if (typeof projectionTargetPrice === 'number' && projectionTargetPrice >= 0) {
      // Move smoothly towards target over 3 steps
      const remaining = projectionTargetPrice - current;
      const step = remaining / (4 - i); // 3 -> 1 steps
      current = Math.max(0, Math.round(current + step));
    } else {
      // Conservative drift based on recent avgStep
      current = Math.max(0, Math.round(current + avgStep * 0.8 + (Math.random() - 0.5) * Math.abs(avg) * 0.02));
    }
    const nextLabelIndex = currentLabelIndex + i;
    preds.push({ date: months[nextLabelIndex], price: null, prediction: current });
  }

  return [...historical, ...preds];
};

// Format price based on the actual value range
const formatPrice = (value: number): string => {
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`;
  } else if (value >= 1000) {
    return `₹${(value / 1000).toFixed(0)}k`;
  } else {
    return `₹${value}`;
  }
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/90 backdrop-blur-md border border-border/50 p-3 rounded-lg shadow-lg">
        <p className="text-sm font-medium">{label} 2024</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.dataKey === 'price' ? 'Actual' : 'Predicted'}: {formatPrice(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const PriceChart = ({ productName, history, projectionTargetPrice }: PriceChartProps) => {
  // Prefer real history if provided, else generate synthetic
  const priceData = useMemo(() => {
    if (history && history.length > 0) {
      return projectFromHistory(history, projectionTargetPrice);
    }
    return generatePriceData(productName);
  }, [productName, history, projectionTargetPrice]);
  
  // Calculate Y-axis domain based on actual data
  const allPrices = priceData
    .map(item => [item.price, item.prediction])
    .flat()
    .filter(price => price !== null) as number[];
  
  const hasData = allPrices.length > 0;
  const minPrice = hasData ? Math.min(...allPrices) : 0;
  const maxPrice = hasData ? Math.max(...allPrices) : 1;
  const priceRange = hasData ? maxPrice - minPrice : 1;
  
  // Set Y-axis domain with proper padding
  const yDomain = [
    Math.max(0, minPrice - priceRange * 0.1),
    Math.max(1, maxPrice + priceRange * 0.1)
  ];

  // If no product is selected, show empty state
  if (!productName || productName.trim() === '') {
    return (
      <div className="bg-gradient-card backdrop-blur-md border border-border/50 rounded-lg p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Price History & Prediction</h3>
          <p className="text-sm text-muted-foreground">No product selected</p>
        </div>
        
        <div className="h-80 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p className="text-lg">Select a product to view price history</p>
            <p className="text-sm">Search and select a product above to start tracking</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-card backdrop-blur-md border border-border/50 rounded-lg p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Price History & Prediction</h3>
        <p className="text-sm text-muted-foreground">{productName} - Last 6 months + 3 month forecast</p>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={priceData}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="predictionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              domain={yDomain}
              tickFormatter={formatPrice}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="price"
              stroke="hsl(var(--primary))"
              fillOpacity={1}
              fill="url(#priceGradient)"
              strokeWidth={2}
              connectNulls={false}
            />
            <Area
              type="monotone"
              dataKey="prediction"
              stroke="hsl(var(--success))"
              strokeDasharray="5 5"
              fillOpacity={1}
              fill="url(#predictionGradient)"
              strokeWidth={2}
              connectNulls={true}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-primary rounded-full"></div>
          <span>Actual Price</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-success rounded-full"></div>
          <span>AI Prediction</span>
        </div>
      </div>
    </div>
  );
};