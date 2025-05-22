import { useState } from 'react';
import { ethers } from 'ethers';
import { useWalletClient, usePublicClient } from 'wagmi';
import { orderbookAbi } from './orderBookAbi';
import erc20Abi from './IERC20.json';

const READ_RPC_URL = "https://testnet-rpc.monad.xyz";
const readProvider = new ethers.providers.JsonRpcProvider(READ_RPC_URL);

async function fetchMarketParams(orderbookAddress: string) {
  const orderbook = new ethers.Contract(orderbookAddress, orderbookAbi, readProvider);
  const marketParamsData = await orderbook.getMarketParams({ from: ethers.constants.AddressZero });
  return {
    pricePrecision: ethers.BigNumber.from(marketParamsData[0]),
    sizePrecision: ethers.BigNumber.from(marketParamsData[1]),
    baseAssetAddress: marketParamsData[2],
    baseAssetDecimals: ethers.BigNumber.from(marketParamsData[3]),
    quoteAssetAddress: marketParamsData[4],
    quoteAssetDecimals: ethers.BigNumber.from(marketParamsData[5]),
    tickSize: ethers.BigNumber.from(marketParamsData[6]),
    minSize: ethers.BigNumber.from(marketParamsData[7]),
    maxSize: ethers.BigNumber.from(marketParamsData[8]),
    takerFeeBps: ethers.BigNumber.from(marketParamsData[9]),
    makerFeeBps: ethers.BigNumber.from(marketParamsData[10]),
  };
}

function log10BigNumber(bn: ethers.BigNumber): number {
  if (bn.isZero()) {
    throw new Error("Log10 of zero is undefined");
  }
  const bnString = bn.toString();
  return bnString.length - 1;
}

export function useTrade(market: any) {
  const [loading, setLoading] = useState<'buy' | 'sell' | false>(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const [gasLimit, setGasLimit] = useState<ethers.BigNumber | null>(null);
  const [gasPrice, setGasPrice] = useState<ethers.BigNumber | null>(null);

  // New: Estimate gas function
  const estimateGas = async (
    action: 'buy' | 'sell',
    amount: number,
    estimatedReceive: string
  ) => {
    try {
      if (!market) return;
      // Fetch marketParams from contract (read-only provider)
      const marketParams = await fetchMarketParams(market.marketAddress);
      const isMargin = false;
      const isFillOrKill = true;

      let size: ethers.BigNumber;
      let minAmountOut: ethers.BigNumber;
      let value: ethers.BigNumber | undefined;

      if (action === 'buy') {
        size = ethers.utils.parseUnits(
          amount.toString(),
          log10BigNumber(marketParams.pricePrecision)
        );
        minAmountOut = ethers.utils.parseUnits(
          estimatedReceive.toString(),
          marketParams.baseAssetDecimals
        );
        value =
          !isMargin && marketParams.quoteAssetAddress === ethers.constants.AddressZero
            ? ethers.utils.parseUnits(
                amount.toString(),
                marketParams.quoteAssetDecimals
              )
            : undefined;
      } else {
        size = ethers.utils.parseUnits(
          amount.toString(),
          log10BigNumber(marketParams.sizePrecision)
        );
        minAmountOut = ethers.utils.parseUnits(
          estimatedReceive.toString(),
          marketParams.quoteAssetDecimals
        );
        value =
          !isMargin && marketParams.baseAssetAddress === ethers.constants.AddressZero
            ? ethers.utils.parseUnits(
                amount.toString(),
                marketParams.baseAssetDecimals
              )
            : undefined;
      }

      const iface = new ethers.utils.Interface(orderbookAbi);
      const data = iface.encodeFunctionData(
        action === 'buy' ? 'placeAndExecuteMarketBuy' : 'placeAndExecuteMarketSell',
        [size, minAmountOut, isMargin, isFillOrKill]
      );

      // Use a dummy address for estimation if wallet not connected
      const address = walletClient
        ? await (new ethers.providers.Web3Provider(walletClient.transport)).getSigner().getAddress()
        : ethers.constants.AddressZero;

      // Estimate gas limit efficiently
      let gasLimitValue: ethers.BigNumber;
      const GAS_LIMIT_CAP = ethers.BigNumber.from(2800000);
      try {
        gasLimitValue = await readProvider.estimateGas({
          to: market.marketAddress,
          from: address,
          data,
          value,
        });
        gasLimitValue = gasLimitValue.mul(120).div(100); // add 20% buffer
        if (gasLimitValue.gt(GAS_LIMIT_CAP)) {
          gasLimitValue = GAS_LIMIT_CAP;
        }
      } catch (err) {
        gasLimitValue = GAS_LIMIT_CAP; // fallback
      }
      console.log('Estimated gas limit:', gasLimitValue.toString());
      setGasLimit(gasLimitValue);

      // EIP-1559 fee logic
      const feeData = await readProvider.getFeeData();
      let gasPriceValue = feeData.gasPrice ?? ethers.BigNumber.from(0);
      setGasPrice(gasPriceValue);
    } catch (err) {
      // ignore estimation errors for now
    }
  };

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
      if (!publicClient) throw new Error('Public client not connected');
      const provider = new ethers.providers.Web3Provider(walletClient.transport);
      const signer = provider.getSigner();

      // Fetch marketParams from contract (read-only provider)
      const marketParams = await fetchMarketParams(market.marketAddress);
      const isMargin = false;
      const isFillOrKill = true;

      let size: ethers.BigNumber;
      let minAmountOut: ethers.BigNumber;
      let value: ethers.BigNumber | undefined;

      if (action === 'buy') {
        size = ethers.utils.parseUnits(
          amount.toString(),
          log10BigNumber(marketParams.pricePrecision)
        );
        minAmountOut = ethers.utils.parseUnits(
          estimatedReceive.toString(),
          marketParams.baseAssetDecimals
        );
        value =
          !isMargin && marketParams.quoteAssetAddress === ethers.constants.AddressZero
            ? ethers.utils.parseUnits(
                amount.toString(),
                marketParams.quoteAssetDecimals
              )
            : undefined;
      } else {
        size = ethers.utils.parseUnits(
          amount.toString(),
          log10BigNumber(marketParams.sizePrecision)
        );
        minAmountOut = ethers.utils.parseUnits(
          estimatedReceive.toString(),
          marketParams.quoteAssetDecimals
        );
        value =
          !isMargin && marketParams.baseAssetAddress === ethers.constants.AddressZero
            ? ethers.utils.parseUnits(
                amount.toString(),
                marketParams.baseAssetDecimals
              )
            : undefined;
        // ERC20 Approval logic for SELL (unchanged)
        if (
          !isMargin &&
          marketParams.baseAssetAddress !== ethers.constants.AddressZero
        ) {
          const baseToken = new ethers.Contract(
            marketParams.baseAssetAddress,
            erc20Abi.abi,
            signer
          );
          const approveAmount = ethers.utils.parseUnits(
            amount.toString(),
            marketParams.baseAssetDecimals
          );
          const approveData = baseToken.interface.encodeFunctionData(
            "approve",
            [market.marketAddress, approveAmount]
          );
          const APPROVE_GAS_LIMIT = ethers.BigNumber.from(50000);
          await signer.sendTransaction({
            to: marketParams.baseAssetAddress,
            data: approveData,
            gasLimit: APPROVE_GAS_LIMIT,
          });
        }
      }

      const iface = new ethers.utils.Interface(orderbookAbi);
      const data = iface.encodeFunctionData(
        action === 'buy' ? 'placeAndExecuteMarketBuy' : 'placeAndExecuteMarketSell',
        [size, minAmountOut, isMargin, isFillOrKill]
      );

      const address = await signer.getAddress();

      // Estimate gas limit efficiently
      let gasLimitValue: ethers.BigNumber;
      const GAS_LIMIT_CAP = ethers.BigNumber.from(2800000);
      try {
        gasLimitValue = await readProvider.estimateGas({
          to: market.marketAddress,
          from: address,
          data,
          value,
        });
        gasLimitValue = gasLimitValue.mul(120).div(100); // add 20% buffer
        if (gasLimitValue.gt(GAS_LIMIT_CAP)) {
          gasLimitValue = GAS_LIMIT_CAP;
        }
      } catch (err) {
        gasLimitValue = GAS_LIMIT_CAP; // fallback
      }
      setGasLimit(gasLimitValue);

      // EIP-1559 fee logic
      const feeData = await readProvider.getFeeData();
      let gasPriceValue = feeData.gasPrice ?? ethers.BigNumber.from(0);
      setGasPrice(gasPriceValue);

      // Nonce
      const nonce = await readProvider.getTransactionCount(address);

      const txRequest: ethers.providers.TransactionRequest = {
        to: market.marketAddress,
        from: address,
        data,
        value,
        gasLimit: gasLimitValue,
        nonce,
        ...(feeData.maxFeePerGas && feeData.maxPriorityFeePerGas
          ? { maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas }
          : gasPriceValue
          ? { gasPrice: gasPriceValue }
          : {}),
      };

      const tx = await signer.sendTransaction(txRequest);
      setTxHash(tx.hash);
      return tx.hash;

    } catch (err: any) {
      setError(err.message || String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { trade, loading, txHash, error, gasLimit, gasPrice, estimateGas };
}