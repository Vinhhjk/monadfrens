interface TokenData {
  tokenaddress: string;
  balance: string;
  decimal: number;
  ticker: string;
  imageurl: string;
  market_address: string | null;
}

interface PortfolioResponse {
  success: boolean;
  data: {
    data: TokenData[];
  };
}

export interface FormattedTokenData {
  tokenAddress: string;
  balance: string;
  ticker: string;
  imageUrl: string;
  marketAddress: string | null;
}

export async function fetchUserPortfolio(userAddresses: string[]): Promise<FormattedTokenData[]> {
  try {
    
    const portfolioPromises = userAddresses.map(address =>
      fetch(`https://api.kuru.io/api/v2/${address}/user/tokens`).then(res => res.json())
    );

    const responses: PortfolioResponse[] = await Promise.all(portfolioPromises);
    const combinedTokens = new Map<string, FormattedTokenData>();

    responses.forEach(response => {
      if (response.success && response.data.data) {
        response.data.data.forEach(token => {
          const formattedBalance = (Number(token.balance) / Math.pow(10, token.decimal)).toString();
          const numericBalance = Number(formattedBalance);
          
          // Skip tokens with zero or very small balances (less than 0.0001)
          if (numericBalance <= 0.0001) return;
          
          if (combinedTokens.has(token.tokenaddress)) {
            // Add balances for existing tokens
            const existing = combinedTokens.get(token.tokenaddress)!;
            const newBalance = (Number(existing.balance) + numericBalance).toString();
            combinedTokens.set(token.tokenaddress, {
              ...existing,
              balance: newBalance
            });
          } else {
            // Add new token
            combinedTokens.set(token.tokenaddress, {
              tokenAddress: token.tokenaddress,
              balance: formattedBalance,
              ticker: token.ticker,
              imageUrl: token.imageurl,
              marketAddress: token.market_address
            });
          }
        });
      }
    });

    // Filter out any remaining tokens with small combined balances and sort by balance
    return Array.from(combinedTokens.values())
      .filter(token => Number(token.balance) > 0.0001)
      .sort((a, b) => Number(b.balance) - Number(a.balance));
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return [];
  }
}