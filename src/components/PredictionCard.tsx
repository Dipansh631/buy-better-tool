import { Brain, TrendingDown, TrendingUp, Calendar, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface PredictionCardProps {
  prediction: "rise" | "fall" | "stable";
  confidence: number;
  expectedChange: number;
  timeframe: string;
  currentPrice: number;
  targetPrice: number;
  productName: string;
}

export const PredictionCard = ({
  prediction,
  confidence,
  expectedChange,
  timeframe,
  currentPrice,
  targetPrice,
  productName
}: PredictionCardProps) => {
  const predictionColor = prediction === "fall" ? "success" : prediction === "rise" ? "destructive" : "warning";
  const PredictionIcon = prediction === "fall" ? TrendingDown : prediction === "rise" ? TrendingUp : Target;
  
  return (
    <div className="bg-gradient-card backdrop-blur-md border border-border/50 rounded-lg p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/20 rounded-lg">
          <Brain className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">AI Price Prediction</h3>
          <p className="text-sm text-muted-foreground">{productName} • Machine Learning Analysis</p>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PredictionIcon className={`h-5 w-5 text-${predictionColor}`} />
            <span className="font-medium capitalize">{prediction}</span>
          </div>
          <Badge variant={predictionColor === "success" ? "default" : "destructive"}
                className={predictionColor === "success" ? "bg-success text-success-foreground" : ""}>
            {expectedChange > 0 ? "+" : ""}{expectedChange}%
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Confidence Score</span>
            <span className="font-medium">{confidence}%</span>
          </div>
          <Progress value={confidence} className="h-2" />
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Target className="h-3 w-3" />
              Current Price
            </div>
            <p className="font-semibold">₹{currentPrice.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              Target ({timeframe})
            </div>
            <p className="font-semibold">₹{targetPrice.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};