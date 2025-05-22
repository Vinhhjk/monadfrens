import { useState, useEffect } from 'react';
import { estimateOrder } from '@/app/tokens/[marketAddress]/components/TokenActions/estimateOrder';

export function useOrderEstimate({
  type,
  marketAddress,
  amount,
  slippage,
}: {
  type: 'buy' | 'sell';
  marketAddress?: string;
  amount: string;
  slippage: number;
}) {
  const [estimatedReceive, setEstimatedReceive] = useState<string | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [estimatedGas, setEstimatedGas] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    const fetchEstimate = async () => {
      setError(null);
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0 || !marketAddress) {
        setEstimatedReceive(null);
        setEstimatedGas(null);
        return;
      }
      setEstimating(true);
      try {
        const estimate = await estimateOrder(
          type === 'buy',
          marketAddress,
          Number(amount),
          slippage
        );
        if (!ignore) {
            setEstimatedReceive(estimate?.minAmountOut ?? null);
            setEstimatedGas(
              estimate?.estimatedGas ? estimate.estimatedGas.toString() : null
            );
          }
      } catch (e: any) {
        if (!ignore) setError(e.message || String(e));
      } finally {
        if (!ignore) setEstimating(false);
      }
    };
    fetchEstimate();
    return () => {
      ignore = true;
    };
  }, [amount, slippage, type, marketAddress]);

  return { estimatedReceive, estimatedGas, estimating, error };
}