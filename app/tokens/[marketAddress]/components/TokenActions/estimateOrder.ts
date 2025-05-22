import { BigNumber, ethers } from "ethers";
import * as KuruSdk from '@kuru-labs/kuru-sdk'
export async function estimateOrder(buyCondition:boolean, marketAddress:string, amount:number, slippage = 1) {
    const rpcUrl = 'https://testnet-rpc.monad.xyz'
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const marketParams = await KuruSdk.ParamFetcher.getMarketParams(provider, marketAddress);

    try {
        let estimate;
        if (buyCondition) {
            estimate = await KuruSdk.CostEstimator.estimateMarketBuy(
                provider,
                marketAddress,
                marketParams,
                amount
            );
        } else {
            estimate = await KuruSdk.CostEstimator.estimateMarketSell(
                provider,
                marketAddress,
                marketParams,
                amount
            );
        }

        if (!estimate || !estimate.output) {
            return null;
        }

        // Calculate minAmountOut with slippage
        const outputStr = estimate.output.toString();
        const minAmountOut = (parseFloat(outputStr) * (1 - slippage / 100)).toString();

        return {
            ...estimate,
            minAmountOut,
            slippage
        };
    } catch (error) {
        console.error("Error estimating market order:", error);
        return null;
    }
}
