export interface MarketResult {
    tokenName: string;
    ticker: string;
    contractAddress: string;
    marketAddress: string;
    lastPrice: number;
    lastPriceMonUSD: number;
    buyCount1h: number;
    sellCount1h: number;
    volume1h: number;
    image: string;
    otherToken: {
        name: string;
        ticker: string;
        address: string;
        imageurl: string;
    };
}
export async function fetchMarketsSearch(query:string) {
    const apiUrl = `https://api.kuru.io/api/v2/markets/search?limit=100&q=${query}`;

    try {
        const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const responseData = await response.json();
        const markets = responseData?.data?.data || [];

        // Normalize the query for case-insensitive comparison
        const normalizedQuery = query.trim().toLowerCase();

        // Filter results based on the query
        const filteredResults = markets.filter((market: any) => {
            const baseToken = market.basetoken;
            const quoteToken = market.quotetoken;

            return (
                baseToken.address.toLowerCase() === normalizedQuery ||
                quoteToken.address.toLowerCase() === normalizedQuery ||
                baseToken.name.toLowerCase().includes(normalizedQuery) ||
                quoteToken.name.toLowerCase().includes(normalizedQuery) ||
                baseToken.ticker.toLowerCase().includes(normalizedQuery) ||
                quoteToken.ticker.toLowerCase().includes(normalizedQuery) ||
                market.market.toLowerCase() === normalizedQuery // Check for market address match
            );
        });

        // Map the filtered results to return the required fields
        const results = filteredResults.map((market: any) => {
            const baseToken = market.basetoken;
            const quoteToken = market.quotetoken;

            // Find which token matches the query
            const normalizedQuery = query.trim().toLowerCase();
            let mainToken = baseToken;
            let otherToken = quoteToken;

            if (
                quoteToken.address.toLowerCase() === normalizedQuery ||
                quoteToken.name.toLowerCase().includes(normalizedQuery) ||
                quoteToken.ticker.toLowerCase().includes(normalizedQuery)
            ) {
                mainToken = quoteToken;
                otherToken = baseToken;
            }

            return {
                tokenName: mainToken.name,
                ticker: mainToken.ticker,
                contractAddress: mainToken.address,
                marketAddress: market.market,
                image: mainToken.imageurl,
                lastPrice: market.lastPrice,
                lastPriceMonUSD: market.lastPriceMonUSD,
                buyCount1h: market.buyCount1h,
                sellCount1h: market.sellCount1h,
                volume1h: market.volume1h,
                decimal: mainToken.decimal,
                otherToken: {
                    name: otherToken.name,
                    ticker: otherToken.ticker,
                    address: otherToken.address,
                    imageurl: otherToken.imageurl,
                    decimal: otherToken.decimal,
                },
            };
        });
        console.log("Filtered results:", results);
        return results;
    } catch (error) {
        console.error("Error fetching markets search data:", error);
        throw error;
    }
}
