import { useState } from 'react';
import { ethers } from 'ethers';
import { useWalletClient } from 'wagmi';
import { orderbookAbi } from './orderBookAbi';
import * as KuruSdk from '@kuru-labs/kuru-sdk';
// import { publicClient, walletClient } from '@/components/frame-wallet-provider';


export function useTradeSDK(market: any) {
  const [loading, setLoading] = useState<'buy' | 'sell' | false>(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  const { data: walletClient } = useWalletClient();

  const trade = async (
    action: 'buy' | 'sell',
    amount: number,
    estimatedReceive: string,
  ) => {
    setLoading(action);
    setError('');
    setTxHash('');
    try {
      if (!walletClient) throw new Error('Wallet not connected');
      if (!market) throw new Error('Market not loaded');

      const provider = new ethers.providers.Web3Provider(walletClient.transport);
      const signer = provider.getSigner();

      const isBuy = action === 'buy';
      const size = amount.toString();

      const minAmountOut = estimatedReceive.toString();
      const marketParams = await KuruSdk.ParamFetcher.getMarketParams(
        provider,
        market.marketAddress
      );
      
      console.log('marketParams', marketParams);

      const parsedSize = ethers.utils.parseUnits(
        size,
        isBuy ? KuruSdk.log10BigNumber(marketParams.quoteAssetDecimals) : KuruSdk.log10BigNumber(marketParams.baseAssetDecimals)
      );
      const parsedMinAmountOut = ethers.utils.parseUnits(
        minAmountOut,
        isBuy ? marketParams.baseAssetDecimals : marketParams.quoteAssetDecimals
      );
      console.log('Parsed params:', {
        parsedSize: parsedSize,
        parsedMinAmountOut: parsedMinAmountOut.toString(),
      });
      const receipt = await KuruSdk.IOC.placeMarket(signer, market.marketAddress, marketParams, {
        approveTokens: true,
        size,
        isBuy,
        minAmountOut,
        isMargin: false,
        fillOrKill: true,
      });
      console.log('receipt', receipt);
      setTxHash(receipt.transactionHash);
      return receipt.transactionHash;
    } catch (err: any) {
      setError(err.message || String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { trade, loading, txHash, error };
}