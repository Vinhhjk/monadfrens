import { useBalance } from 'wagmi';
import { formatEther } from 'viem';

export function useWalletBalance(address: `0x${string}` | undefined) {
  const { data: balance, isLoading, refetch } = useBalance({
    address,
  });

  return {
    balance: balance ? formatEther(balance.value) : '0',
    symbol: balance?.symbol,
    isLoading,
    refetch,
    rawBalance: balance?.value
  };
}

export function useWalletBalanceErc20(address: `0x${string}` | undefined, tokenAddress: `0x${string}` | undefined) {
  const { data: balance, isLoading, refetch } = useBalance({
    address,
    token: tokenAddress,
  });

  return {
    balance: balance ? formatEther(balance.value) : '0',
    symbol: balance?.symbol,
    isLoading,
    refetch,
    rawBalance: balance?.value
  };
}