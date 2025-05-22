import { useState, useEffect } from "react";
import { fetchTrendingMarkets, TrendingTokenPair } from "./fetchTrendingMarkets";
import { useRouter } from "next/navigation";

export function TrendingMarkets() {
  const [trendingPairs, setTrendingPairs] = useState<TrendingTokenPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadTrendingMarkets = async () => {
      try {
        const response = await fetchTrendingMarkets();
        setTrendingPairs(response.trendingPairs.slice(0, 10));
        setLoading(false);
      } catch (err) {
        setError("Failed to load trending markets");
        setLoading(false);
      }
    };

    loadTrendingMarkets();
    const intervalId = setInterval(loadTrendingMarkets, 20000);
    return () => clearInterval(intervalId);
  }, []);

  const handleMarketClick = (marketAddress: string) => {
    router.push(`/tokens/${marketAddress}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <h2 className="text-white text-xl font-semibold mb-4">Trending Markets</h2>
      
      <div className="flex items-center justify-between px-3 py-2 text-sm text-gray-400 border-b border-gray-800">
        <div>Market</div>
        <div>Volume (5m)</div>
      </div>

      <div className="space-y-2 mt-2">
        {trendingPairs.map((pair, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 hover:bg-gray-800 rounded-lg transition-colors duration-200 cursor-pointer"
            onClick={() => handleMarketClick(pair.marketAddress)}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700">
                <img
                  src={pair.baseToken.imageurl}
                  alt={pair.baseToken.ticker}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-white">
                {pair.baseToken.ticker} / {pair.quoteToken.ticker}
              </div>
            </div>
            <div className="text-gray-400 tabular-nums">
              ${(pair as any).volume5m?.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              }) || "0.00"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}