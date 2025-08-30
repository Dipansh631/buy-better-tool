import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Hero } from "@/components/Hero";
import { Dashboard } from "@/components/Dashboard";
import NotFound from "./pages/NotFound";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { FloatingChatButton } from "@/components/FloatingChatButton";
import { ProductProvider } from "@/lib/product-context";

const queryClient = new QueryClient();

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <Hero />
      <Dashboard />
    </div>
  );
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <Index />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ProductProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <RouterProvider router={router} />
          <FloatingChatButton />
        </TooltipProvider>
      </ProductProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
