import React, { use, useEffect } from 'react';
import { Transition, TransitionChild } from '@headlessui/react';
import { useWalletBalance, useWalletBalanceErc20 } from '@/hooks/useWalletBalance';
import { useAccount } from 'wagmi';
import { useState, Fragment } from 'react';
import { useOrderEstimate } from '@/hooks/useOrderEstimate';
import { useTrade } from '@/hooks/useTrade';
import { IoCloseOutline, IoReloadOutline } from 'react-icons/io5';
import { FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { ethers } from 'ethers';
import { useMiniAppContext } from "@/hooks/use-miniapp-context";
import { sendFrameNotification } from '@/lib/notifs';
interface TokenInfo {
  name: string;
  ticker: string;
  address: string;
  imageurl: string;
  decimal?: number;
}

interface TradeModalProps {
  open: boolean;
  onClose: () => void;
  type: 'buy' | 'sell';
  marketAddress?: string;
  mainToken: TokenInfo;
  otherToken: TokenInfo;
  market?: any; // Optional market prop
}

// Status popup component
const StatusPopup = ({ 
  status, 
  onClose, 
  txHash,
}: { 
  status: 'loading' | 'success' | 'error'; 
  onClose: () => void;
  txHash?: string;
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-xl p-6 w-64 flex flex-col items-center">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 border-4 border-t-blue-500 border-r-blue-500 border-b-gray-200 border-l-gray-200 rounded-full animate-spin mb-4"></div>
            <p className="text-lg font-medium text-center">Processing...</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <FiCheckCircle className="w-16 h-16 text-green-500 mb-4" />
            <p className="text-lg font-medium text-center">Transaction Successful!</p>
            {txHash && (
              <div className="text-green-600 text-sm font-medium mt-2 text-center">
                Success! Tx:{' '}
                <a
                  href={`https://testnet.monadscan.com/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline break-all"
                >
                  {txHash.slice(0, 10)}...
                </a>
              </div>
            )}
            <button 
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Close
            </button>
          </>
        )}
        
        {status === 'error' && (
          <>
            <FiXCircle className="w-16 h-16 text-red-500 mb-4" />
            <p className="text-lg font-medium text-center">Transaction Failed</p>
            <button 
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const TradeModal: React.FC<TradeModalProps> = ({
  open,
  onClose,
  type,
  marketAddress = '',
  mainToken,
  otherToken,
  market,
}) => {
  const { address } = useAccount();
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState(1); // default 1%
  const [transactionStatus, setTransactionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const { context } = useMiniAppContext();
  const { estimatedReceive, estimatedGas, estimating, error: estimateError } = useOrderEstimate({
    type,
    marketAddress,
    amount,
    slippage,
  });

  const { trade, loading: tradeLoading, txHash, error, gasLimit, gasPrice, estimateGas } = useTrade(market);
  useEffect(() => {
    if (
      amount &&
      !isNaN(Number(amount)) &&
      Number(amount) > 0 &&
      market &&
      estimatedReceive
    ) {
      estimateGas(type, Number(amount), estimatedReceive);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, type, market, estimatedReceive]);
  let networkFee = '-';
  if (
    gasLimit &&
    gasPrice &&
    !gasLimit.isZero() &&
    !gasPrice.isZero()
  ) {
    try {
      const fee = gasLimit.mul(gasPrice);
      networkFee = `~${ethers.utils.formatUnits(fee, 18)} MON`;
    } catch {
      networkFee = '-';
    }
  }

  useEffect(() => {
    if (open) {
      setAmount('');
      setTransactionStatus('idle');
    }
  }, [open]);

  // Determine input and receive tokens based on type
  const inputToken = type === 'buy' ? otherToken : mainToken;
  const receiveToken = type === 'buy' ? mainToken : otherToken;
  
  // Use correct balance hook
  const isInputNative = inputToken.ticker === 'MON'; // adjust if your native token is not MON
  const { balance: inputBalance, refetch: refetchNative } = isInputNative
    ? useWalletBalance(address)
    : useWalletBalanceErc20(address, inputToken.address as `0x${string}`);

  const insufficientFunds =
    !!amount &&
    !isNaN(Number(amount)) &&
    Number(amount) > 0 &&
    Number(amount) > Number(inputBalance);
  
  function truncateToDecimals(value: string, decimals: number = 9) {
    if (!value.includes('.')) return value;
    const [int, frac] = value.split('.');
    // Always cut to at most 9 digits after the decimal point
    const truncated = `${int}.${frac.slice(0, 8)}`;
    return truncated;
  }
  
  const handlePercentageClick = (percentage: number) => {
    const maxAmount = parseFloat(inputBalance);
    const decimals = inputToken.decimal ?? 18;
    let calculatedAmount: string;
  
    if (percentage === 100) {
      const buffer = 1 / Math.pow(10, decimals > 10 ? 10 : decimals);
      const rawAmount = maxAmount - buffer;
      calculatedAmount = truncateToDecimals(rawAmount.toString(), decimals);
      if (parseFloat(calculatedAmount) <= 0) calculatedAmount = '0';
    } else {
      const rawAmount = maxAmount * percentage / 100;
      calculatedAmount = truncateToDecimals(rawAmount.toString(), decimals);
    }
    setAmount(calculatedAmount);
  };
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const decimals = inputToken.decimal ?? 18;
    const rawValue = e.target.value;
    setAmount(truncateToDecimals(rawValue, decimals));
  };
  
  // Slippage input handler
  const handleSlippageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = Number(e.target.value);
    if (value < 0) value = 0;
    if (value > 50) value = 50;
    setSlippage(value);
  };
  
  
  const handleTrade = async () => {
    if (
      !amount ||
      isNaN(Number(amount)) ||
      Number(amount) <= 0 ||
      insufficientFunds ||
      !market ||
      !estimatedReceive
    ) {
      console.error('Invalid trade parameters');
      return;
    }
    
    try {
      setTransactionStatus('loading');
      const txHash = await trade(type, Number(amount), estimatedReceive);
  
      // Wait for transaction confirmation
      const provider = new ethers.providers.JsonRpcProvider("https://testnet-rpc.monad.xyz");
      const receipt = await provider.waitForTransaction(txHash, 1, 60000); // 1 confirmation, 60s timeout
  
      if (receipt && receipt.status === 1) {
        if (context?.user?.fid) {
          console.log("Farcaster fid:", context.user.fid);
        }
        // Refetch balance after trade
        if (isInputNative) {
          refetchNative?.();
        } else {
          refetchNative?.();
        }
        setAmount('');
        setTransactionStatus('success');
      } else {
        setTransactionStatus('error');
      }
    } catch (e) {
      console.error('Trade error:', e);
      setTransactionStatus('error');
    }
  };

  const handleStatusPopupClose = () => {
    setTransactionStatus('idle');
  };

  return (
    <>
      {/* Transaction Status Popup */}
      {transactionStatus !== 'idle' && (
        <StatusPopup 
          status={transactionStatus === 'loading' ? 'loading' : (transactionStatus === 'success' ? 'success' : 'error')} 
          onClose={handleStatusPopupClose}
          txHash={txHash}
        />
      )}
      
      <Transition show={open} as={Fragment}>
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div
              className="fixed inset-0 bg-black/30"
              onClick={onClose}
              aria-hidden="true"
            />
          </TransitionChild>

          <div className="flex min-h-full items-center justify-center p-4">
            {/* Modal */}
            <TransitionChild
              as={Fragment}
              enter="transform transition ease-out duration-300"
              enterFrom="opacity-0 translate-y-full"
              enterTo="opacity-100 translate-y-0"
              leave="transform transition ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-full"
            >
              <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => refetchNative?.()}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                      title="Refresh Balance"
                      type="button"
                    >
                      <IoReloadOutline size={22} />
                    </button>
                  </div>
                  <h3 className="text-lg font-semibold">
                    {type === 'buy' ? 'Buy Token' : 'Sell Token'}
                  </h3>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    type="button"
                  >
                    <IoCloseOutline size={24} />
                  </button>
                </div>

                {/* Content */}
                <div className="space-y-6">
                  {/* Amount Input */}
                  <div>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        <img
                          src={inputToken.imageurl}
                          alt={inputToken.ticker}
                          className="w-6 h-6 rounded-full object-contain"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="0.0"
                        value={amount}
                        onChange={handleAmountChange}
                        className="w-full pl-10 pr-20 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                        {inputToken.ticker}
                      </div>
                    </div>
                    {insufficientFunds && (
                      <div className="text-red-600 text-sm font-medium mb-2">
                        Insufficient funds
                      </div>
                    )}
                    {/* Percentage Buttons */}
                    <div className="grid grid-cols-4 gap-2 mt-2 text-white">
                      {[25, 50, 75, 100].map((percent) => (
                        <button
                          key={percent}
                          onClick={() => handlePercentageClick(percent)}
                          className="py-1 px-2 text-sm bg-gray-600 rounded-lg hover:bg-[#4a4838] transition-colors"
                        >
                          {percent}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Slippage Adjustment */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-900">Slippage:</span>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      step={0.1}
                      value={slippage}
                      onChange={handleSlippageChange}
                      className="w-16 px-2 py-1 border rounded text-gray-900  [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-sm text-gray-900">%</span>
                  </div>

                  {/* Trade Info */}
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Available Balance:</span>
                      <span>
                        {truncateToDecimals(inputBalance, inputToken.decimal ?? 18)} {inputToken.ticker}
                      </span>                
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Network Fee:</span>
                      <span>
                        {networkFee}
                      </span>
                    </div>

                    {/* Estimated Receive */}
                    {amount && estimatedReceive && !estimating && (
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className='text-gray-900'>You will receive:</span>
                        <span className="text-lg font-medium text-gray-900">
                          ~{Number(estimatedReceive).toFixed(4)} {receiveToken.ticker}
                        </span>
                      </div>
                    )}
                    {/* Loading state */}
                    {amount && estimating && (
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className='text-gray-900'>You will receive:</span>
                        <span className="text-lg font-medium text-gray-900">Estimating...</span>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <button
                    className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors ${
                      type === 'buy'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                    onClick={handleTrade}
                    disabled={
                      !!tradeLoading ||
                      !amount ||
                      isNaN(Number(amount)) ||
                      Number(amount) <= 0 ||
                      insufficientFunds ||
                      !estimatedReceive ||
                      transactionStatus !== 'idle'
                    }
                  >
                    {tradeLoading
                      ? (type === 'buy' ? 'Buying...' : 'Selling...')
                      : (type === 'buy' ? 'Buy' : 'Sell')}
                  </button>
                  
                  {/* Show error or txHash (keeping these for reference in UI) */}
                  {error && !txHash && transactionStatus === 'idle' && (
                    <div className="text-red-600 text-sm font-medium mt-2">{error}</div>
                  )}
                  {txHash && transactionStatus === 'idle' && (
                    <div className="text-green-600 text-sm font-medium mt-2">
                      Last Tx: <a href={`https://testnet.monadscan.com/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="underline">{txHash.slice(0, 10)}...</a>
                    </div>
                  )}
                </div>
              </div>
            </TransitionChild>
          </div>
        </div>
      </Transition>
    </>
  );
};

export default TradeModal;