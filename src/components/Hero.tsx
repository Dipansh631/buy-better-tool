import { useState } from "react";
import { TrendingUp, Bot, Zap, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnhancedSearchBar } from "./EnhancedSearchBar";
import { AiChatAssistant } from "./AiChatAssistant";
import { useToast } from "@/hooks/use-toast";
import { useProductContext } from "@/lib/product-context";

export const Hero = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { selectedProduct, isProductSelected } = useProductContext();
  const { toast } = useToast();

  const handleStartTracking = () => {
    if (!isProductSelected) {
      // Scroll to search bar and focus it
      const searchBar = document.querySelector('input[placeholder*="product name"]') as HTMLInputElement;
      if (searchBar) {
        searchBar.scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => searchBar.focus(), 500);
      }
      
      toast({
        title: "No Product Selected",
        description: "Please search for and select a product to start tracking!",
        variant: "destructive",
      });
      return;
    }

    // Scroll to dashboard section
    const dashboard = document.querySelector('[data-section="dashboard"]');
    if (dashboard) {
      dashboard.scrollIntoView({ behavior: 'smooth' });
    }
    
    toast({
      title: "Start Tracking",
      description: `Now tracking ${selectedProduct}! View price history and predictions below.`,
    });
  };

  const handleTryAI = () => {
    setIsChatOpen(true);
    toast({
      title: "AI Assistant",
      description: "Chat with our AI assistant about products, prices, and recommendations!",
    });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-hero">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.3),transparent_50%)]"></div>
      <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(120,119,198,0.3),transparent_50%)]"></div>
      
      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-card/30 backdrop-blur-md px-4 py-2 rounded-full border border-border/50 mb-6">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">AI-Powered Price Intelligence</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent leading-tight">
            Predict Product Prices
            <br />
            <span className="text-primary">Before You Buy</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Track prices across platforms, get AI predictions, and never overpay again. 
            Smart shopping powered by machine learning.
          </p>
        </div>
        
        <div className="mb-12">
          <EnhancedSearchBar />
        </div>
        
        <div className="flex flex-wrap justify-center gap-4 mb-16">
          <Button 
            variant="hero" 
            size="xl" 
            onClick={handleStartTracking}
            className={isProductSelected ? "bg-success hover:bg-success/90" : ""}
          >
            {isProductSelected ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <TrendingUp className="h-5 w-5 mr-2" />
            )}
            {isProductSelected ? `Track ${selectedProduct}` : "Start Tracking"}
          </Button>
          <Button variant="glass" size="xl" onClick={handleTryAI}>
            <Bot className="h-5 w-5 mr-2" />
            Try AI Assistant
          </Button>
        </div>
        
        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-card/30 backdrop-blur-md p-6 rounded-xl border border-border/50 hover:bg-card/50 transition-all duration-300">
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Price Tracking</h3>
            <p className="text-muted-foreground">Monitor prices across multiple e-commerce platforms in real-time</p>
          </div>
          
          <div className="bg-card/30 backdrop-blur-md p-6 rounded-xl border border-border/50 hover:bg-card/50 transition-all duration-300">
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">AI Predictions</h3>
            <p className="text-muted-foreground">Get intelligent price forecasts using machine learning algorithms</p>
          </div>
          
          <div className="bg-card/30 backdrop-blur-md p-6 rounded-xl border border-border/50 hover:bg-card/50 transition-all duration-300">
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Smart Alerts</h3>
            <p className="text-muted-foreground">Receive notifications when prices drop to your target range</p>
          </div>
        </div>
      </div>
      
      {/* AI Chat Assistant */}
      <AiChatAssistant 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </section>
  );
};