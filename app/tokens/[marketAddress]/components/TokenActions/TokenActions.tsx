import React, { useState, useEffect } from 'react';
import { Button, Stack } from '@mui/material';
import TradeModal from './TradeModal';
import { useParams } from 'next/navigation';
import { fetchMarketsSearch, MarketResult } from '@/components/Home/fetchMarketsSearch';
interface TokenActionsProps {
  onBuy?: () => void;
  onSell?: () => void;
  marketAddress?: string; // Optional market address prop
}

const TokenActions: React.FC<TokenActionsProps> = ({ onBuy, onSell }) => {
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [market, setMarket] = useState<MarketResult | null>(null);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const marketAddress = params.marketAddress as string;

  useEffect(() => {
    const fetchMarket = async () => {
      setLoading(true);
      try {
        const results = await fetchMarketsSearch(marketAddress);
        if (results && results.length > 0) {
          setMarket(results[0]);
        } else {
          setMarket(null);
        }
      } catch (err) {
        setMarket(null);
      } finally {
        setLoading(false);
      }
    };
    fetchMarket();
  }, [marketAddress]);

  if (loading || !market) return null;
  return (
    <>
      <Stack direction="row" spacing={2} justifyContent="center">
        <Button
          variant="contained"
          color="primary"
          onClick={() => setIsBuyModalOpen(true)}
          sx={{ minWidth: 120 }}
        >
          Buy Token
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => setIsSellModalOpen(true)}
          sx={{ minWidth: 120 }}
        >
          Sell Token
        </Button>
      </Stack>

      <TradeModal
        open={isBuyModalOpen}
        onClose={() => setIsBuyModalOpen(false)}
        type="buy"
        mainToken={{
          name: market.tokenName,
          ticker: market.ticker,
          address: market.contractAddress,
          imageurl: market.image,
        }}
        marketAddress={marketAddress} // Pass the market address to TradeModal
        otherToken={market.otherToken}
        market={market}
        
      />

      <TradeModal
        open={isSellModalOpen}
        onClose={() => setIsSellModalOpen(false)}
        type="sell"
        marketAddress={marketAddress}
        mainToken={{
          name: market.tokenName,
          ticker: market.ticker,
          address: market.contractAddress,
          imageurl: market.image,
        }}
        otherToken={market.otherToken}
        market={market}
      />
</>
  );
};

export default TokenActions;