"use client";

import { useAccount } from "wagmi";
import { WalletActions } from "@/components/Home/WalletActions";
import { SearchMarkets } from "./SearchMarkets";
import { TrendingMarkets } from "./TrendingMarkets";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { monadTestnet } from "viem/chains";

export default function Home() {
  const { isConnected, chainId } = useAccount();
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleMarketSelect = (marketAddress: string) => {
    setSelectedMarket(marketAddress);
    setLoading(true);
    router.push(`/tokens/${marketAddress}`);
  };

  const isOnMonad = isConnected && chainId === monadTestnet.id;

  return (
    <div className="absolute top-4 flex flex-col items-stretch space-x-2 w-full max-w-2xl">
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      <WalletActions />
      {isOnMonad ? (
        <>
          <SearchMarkets onMarketSelect={handleMarketSelect} />
          <div className="mt-4">
            <TrendingMarkets />
          </div>
        </>
      ) : (
        <div className="mt-4 text-center text-sm text-gray-400">
          Please connect your wallet and switch to the Monad Testnet to search markets.
        </div>
      )}
    </div>
  );
}