'use client';

import { useParams } from "next/navigation";
import { fetchMarketsSearch, MarketResult } from "@/components/Home/fetchMarketsSearch";
import TokenActions from "./components/TokenActions/TokenActions";
import { PriceContext } from "./components/priceChart/PriceContext";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const TokenLineChart = dynamic(() => import("./components/priceChart/TokenLineChart"), { ssr: false });

export default function TokenPage() {
  const params = useParams();
  const marketAddress = params.marketAddress as string;
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<MarketResult | null>(null);
  const [prevPrice, setPrevPrice] = useState<number | null>(null);
  const [animate, setAnimate] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isUSDCPair, setIsUSDCPair] = useState(false);

  // Initial data fetch and refresh interval
  useEffect(() => {
    const fetchInitialData = async () => {
      setError(null);
      try {
        const results = await fetchMarketsSearch(marketAddress);
        if (results && results.length > 0) {
          setToken(results[0]);
          // Check if the other token is USDC
          const isUSDC = results[0].otherToken.ticker.toUpperCase() === "USDC";
          console.log("Is USDC Pair:", isUSDC);
          setIsUSDCPair(isUSDC);
        } else {
          setToken(null);
          setError("Token not found.");
        }
      } catch (err) {
        setError("Failed to fetch market data.");
        setToken(null);
        console.error(err);
      } finally {
        setInitialLoading(false);
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [marketAddress]);

  // Price animation effect
  useEffect(() => {
    if (currentPrice !== null && prevPrice !== null && currentPrice !== prevPrice) {
      setAnimate(true);
      setTimeout(() => setAnimate(false), 500);
    }
    setPrevPrice(currentPrice);
  }, [currentPrice, prevPrice]);

  const handleBuy = () => {
    console.log("Buy token clicked");
  };

  const handleSell = () => {
    console.log("Sell token clicked");
  };

  if (initialLoading) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading token data...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen p-4">
      {loading && (
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      <div className="mx-auto max-w-7xl">
        <PriceContext.Provider value={{ currentPrice, setCurrentPrice }}>
          {error && <p className="text-red-500 mt-4">{error}</p>}
          {token && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <img 
                  src={token.image} 
                  alt={token.tokenName} 
                  className="w-12 h-12 rounded"
                  loading="lazy" 
                />
                <div className="flex justify-between items-center flex-1">
                  <div>
                    <p className="font-semibold">{token.tokenName} ({token.ticker})</p>
                  </div>
                  <p className={`text-green-600 ml-4 transition-all duration-500 ${
                    animate ? "bg-yellow-200 px-2 rounded" : ""
                  }`}>
                      ${currentPrice?.toFixed(3) || 
                        (isUSDCPair 
                          ? token.lastPrice.toFixed(3)
                          : (token.lastPrice * token.lastPriceMonUSD).toFixed(3)
                        )}                  
                  </p>
                </div>
              </div>
              <div className="h-[400px]">
                <TokenLineChart marketAddress={marketAddress} isUSDCPair={isUSDCPair}/>
              </div>
              <div>
                <TokenActions onBuy={handleBuy} onSell={handleSell} />
              </div>
            </div>
          )}
        </PriceContext.Provider>
      </div>
    </main>
  );
}