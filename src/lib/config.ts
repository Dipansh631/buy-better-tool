// Configuration file for environment variables and app settings
export const config = {
  // Serp API Configuration
  serp: {
    apiKey: import.meta.env.VITE_SERP_API_KEY,
    baseUrl: 'https://serpapi.com/search.json',
    isConfigured: !!import.meta.env.VITE_SERP_API_KEY,
  },
  
  // ClickUp API Configuration
  clickup: {
    apiKey: import.meta.env.VITE_CLICKUP_API_KEY,
    baseUrl: 'https://api.clickup.com/api/v2',
    isConfigured: !!import.meta.env.VITE_CLICKUP_API_KEY,
  },

  // Gemini AI Configuration
  gemini: {
    apiKey: import.meta.env.VITE_GEMINI_API_KEY,
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    isConfigured: !!import.meta.env.VITE_GEMINI_API_KEY,
  },
  
  // App Configuration
  app: {
    name: 'PricePredict AI',
    version: '1.0.0',
    environment: import.meta.env.MODE,
  },
  
  // Debug Configuration
  debug: {
    enabled: import.meta.env.MODE === 'development',
    logEnvironment: import.meta.env.MODE === 'development',
  }
};

// Log configuration in development mode
if (config.debug.logEnvironment) {
  console.log('App Configuration:', {
    serpConfigured: config.serp.isConfigured,
    clickupConfigured: config.clickup.isConfigured,
    geminiConfigured: config.gemini.isConfigured,
    environment: config.app.environment,
    serpApiKeyPresent: !!config.serp.apiKey,
    clickupApiKeyPresent: !!config.clickup.apiKey,
    geminiApiKeyPresent: !!config.gemini.apiKey,
    geminiApiKeyLength: config.gemini.apiKey?.length || 0,
    geminiApiKeyPreview: config.gemini.apiKey ? `${config.gemini.apiKey.substring(0, 10)}...` : 'Not set',
  });
}

export default config;




