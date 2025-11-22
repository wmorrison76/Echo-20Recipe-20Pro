import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

interface KnowledgeUpdate {
  ingredientsTaught: number;
  techniquesLearned: number;
  flavorProfilesAnalyzed: number;
  unknownTermsIdentified: string[];
  sourcesUsed?: string[];
  flavorMatrixStats?: {
    totalRecipes: number;
    totalCuisines: number;
    totalIngredients: number;
    totalTechniques: number;
  };
}

interface CrawlerState {
  isRunning: boolean;
  sessionId: string | null;
  currentUrl: string;
  currentRecipe: string;
  recipesProcessed: number;
  totalRecipes: number;
  knowledge: KnowledgeUpdate;
  messages: string[];
  error: string;
  crawlerMode: 'legacy' | 'global';
  extractFlavorData: boolean;
  autoLearn: boolean;
  sourcesUsed: string[];
  flavorMatrixStats: any;
  progress: number; // 0-100
}

interface CrawlerContextType {
  state: CrawlerState;
  startCrawler: (options: { mode: 'legacy' | 'global'; extractFlavorData?: boolean; autoLearn?: boolean }) => Promise<void>;
  stopCrawler: () => void;
  resetCrawler: () => void;
  clearMessages: () => void;
}

const CrawlerContext = createContext<CrawlerContextType | undefined>(undefined);

export function CrawlerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CrawlerState>({
    isRunning: false,
    sessionId: null,
    currentUrl: '',
    currentRecipe: '',
    recipesProcessed: 0,
    totalRecipes: 0,
    knowledge: {
      ingredientsTaught: 0,
      techniquesLearned: 0,
      flavorProfilesAnalyzed: 0,
      unknownTermsIdentified: [],
    },
    messages: [],
    error: '',
    crawlerMode: 'global',
    extractFlavorData: true,
    autoLearn: true,
    sourcesUsed: [],
    flavorMatrixStats: null,
    progress: 0,
  });

  const eventSourceRef = useRef<EventSource | null>(null);

  const startCrawler = useCallback(async (options: { mode: 'legacy' | 'global'; extractFlavorData?: boolean; autoLearn?: boolean }) => {
    try {
      const sessionId = `session-${Date.now()}`;
      
      setState(prev => ({
        ...prev,
        isRunning: true,
        sessionId,
        error: '',
        messages: [],
        recipesProcessed: 0,
        totalRecipes: 0,
        knowledge: {
          ingredientsTaught: 0,
          techniquesLearned: 0,
          flavorProfilesAnalyzed: 0,
          unknownTermsIdentified: [],
        },
        crawlerMode: options.mode,
        extractFlavorData: options.extractFlavorData ?? true,
        autoLearn: options.autoLearn ?? true,
      }));

      // Start crawler session
      const startResponse = await fetch('/api/echo/crawler/start-crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          maxRecipes: options.mode === 'global' ? 1000 : 500,
          mode: options.mode,
          extractFlavorData: options.extractFlavorData ?? true,
          autoLearn: options.autoLearn ?? true,
        }),
      });

      if (!startResponse.ok) {
        throw new Error('Failed to start crawler session');
      }

      // Connect to progress stream
      const eventSource = new EventSource(`/api/echo/crawler/progress?sessionId=${sessionId}`);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const crawlerEvent = JSON.parse(event.data);

          switch (crawlerEvent.type) {
            case 'recipe':
              setState(prev => {
                const totalRecipes = crawlerEvent.data.totalRecipes ?? prev.totalRecipes;
                const recipesProcessed = crawlerEvent.data.recipesProcessed ?? prev.recipesProcessed;
                const progress = totalRecipes > 0 ? (recipesProcessed / totalRecipes) * 100 : 0;

                return {
                  ...prev,
                  currentRecipe: crawlerEvent.data.currentRecipe || prev.currentRecipe,
                  currentUrl: crawlerEvent.data.currentUrl || prev.currentUrl,
                  recipesProcessed,
                  totalRecipes,
                  progress: Math.round(progress),
                  messages: crawlerEvent.data.message
                    ? [...prev.messages.slice(-9), crawlerEvent.data.message]
                    : prev.messages,
                };
              });
              break;

            case 'knowledge':
              if (crawlerEvent.data.knowledgeUpdates) {
                setState(prev => ({
                  ...prev,
                  knowledge: crawlerEvent.data.knowledgeUpdates,
                }));
              }
              break;

            case 'complete':
              setState(prev => ({
                ...prev,
                isRunning: false,
                knowledge: crawlerEvent.data.knowledgeUpdates || prev.knowledge,
                sourcesUsed: crawlerEvent.data.knowledgeUpdates?.sourcesUsed || prev.sourcesUsed,
                flavorMatrixStats: crawlerEvent.data.knowledgeUpdates?.flavorMatrixStats || prev.flavorMatrixStats,
                messages: [...prev.messages, '🎉 Crawler completed successfully!'],
              }));
              eventSourceRef.current?.close();
              break;

            case 'error':
              setState(prev => ({
                ...prev,
                isRunning: false,
                error: crawlerEvent.data.error || 'Unknown error',
                messages: [...prev.messages, `❌ ${crawlerEvent.data.error}`],
              }));
              eventSourceRef.current?.close();
              break;
          }
        } catch (e) {
          console.error('Failed to parse crawler event:', e);
        }
      };

      eventSource.onerror = () => {
        setState(prev => ({
          ...prev,
          isRunning: false,
          error: 'Connection to crawler lost',
        }));
        eventSourceRef.current?.close();
      };
    } catch (err) {
      setState(prev => ({
        ...prev,
        isRunning: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }));
    }
  }, []);

  const stopCrawler = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    setState(prev => ({
      ...prev,
      isRunning: false,
    }));
  }, []);

  const resetCrawler = useCallback(() => {
    stopCrawler();
    setState({
      isRunning: false,
      sessionId: null,
      currentUrl: '',
      currentRecipe: '',
      recipesProcessed: 0,
      totalRecipes: 0,
      knowledge: {
        ingredientsTaught: 0,
        techniquesLearned: 0,
        flavorProfilesAnalyzed: 0,
        unknownTermsIdentified: [],
      },
      messages: [],
      error: '',
      crawlerMode: 'global',
      extractFlavorData: true,
      autoLearn: true,
      sourcesUsed: [],
      flavorMatrixStats: null,
      progress: 0,
    });
  }, [stopCrawler]);

  const clearMessages = useCallback(() => {
    setState(prev => ({
      ...prev,
      messages: [],
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return (
    <CrawlerContext.Provider
      value={{
        state,
        startCrawler,
        stopCrawler,
        resetCrawler,
        clearMessages,
      }}
    >
      {children}
    </CrawlerContext.Provider>
  );
}

export function useCrawler() {
  const context = useContext(CrawlerContext);
  if (context === undefined) {
    throw new Error('useCrawler must be used within CrawlerProvider');
  }
  return context;
}
