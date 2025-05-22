export interface Token {
    ticker: string;
    imageurl: string;
}

export interface TrendingTokenPair {
    marketAddress: string; 
    baseToken: Token;
    quoteToken: Token;
    volume5m: number; 
}

export interface TrendingTokensResponse {
    trendingPairs: TrendingTokenPair[];
}

// interface for the API response token structure
export interface APIToken {
    market: string; 
    basetoken: {
        ticker: string;
        imageurl: string;
    };
    quotetoken: {
        ticker: string;
        imageurl: string;
    };
    volume5m: number;
}

export async function fetchTrendingMarkets(): Promise<TrendingTokensResponse> {
    const apiUrl = `https://api.kuru.io/api/v2/markets/trending/5m`;

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
        const trendingTokens = responseData?.data?.data || [];
        
        const mappedTokens = trendingTokens.map((token: APIToken) => ({
            marketAddress:token.market,
            baseToken: {
                ticker: token.basetoken.ticker,
                imageurl: token.basetoken.imageurl,
            },
            quoteToken: {
                ticker: token.quotetoken.ticker,
                imageurl: token.quotetoken.imageurl,
            },
            volume5m: token.volume5m,
        }));

        return {
            trendingPairs: mappedTokens
        };

    } catch (error) {
        console.error("Error fetching markets search data:", error);
        throw error;
    }
}

