import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/utils/firebase';
import { fetchUserPortfolio, FormattedTokenData } from './fetchUserPortfolio';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface UserPortfolioProps {
  userId: string;
}

export function UserPortfolio({ userId }: UserPortfolioProps) {
    const router = useRouter();

    const [portfolio, setPortfolio] = useState<FormattedTokenData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadPortfolio() {
            try {
                // Get user's wallets from Firebase
                const userDoc = await getDoc(doc(db, 'users', userId));
                if (!userDoc.exists()) {
                    setError('User not found');
                    setLoading(false);
                    return;
                }

                const wallets = userDoc.data().wallets || [];
                if (wallets.length === 0) {
                    setError('No wallets found');
                    setLoading(false);
                    return;
                }

                // Fetch portfolio for all wallets
                const portfolioData = await fetchUserPortfolio(wallets);
                setPortfolio(portfolioData);
            } catch (err) {
                setError('Error loading portfolio');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        loadPortfolio();
    }, [userId]);
    const handleTokenClick = (marketAddress: string | null) => {
        if (marketAddress) {
            router.push(`/tokens/${marketAddress}`);
        }
    };
    if (loading) {
        return <div className="text-center p-4">Loading portfolio...</div>;
    }

    if (error) {
        return <div className="text-center text-red-500 p-4">{error}</div>;
    }

    if (portfolio.length === 0) {
        return <div className="text-center p-4">No tokens found in portfolio</div>;
    }

    return (
        <div className="space-y-4">
          <h2 className="text-xl font-bold mb-4 text-white">Portfolio</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {portfolio.map((token) => (
              <div
                key={token.tokenAddress}
                className={`border border-[#333] rounded-lg p-4 flex items-center space-x-4 ${
                  token.marketAddress ? 'cursor-pointer hover:bg-gray-800 transition-colors duration-200' : ''
                }`}
                onClick={() => handleTokenClick(token.marketAddress)}
                role={token.marketAddress ? 'button' : undefined}
              >
                <div className="min-w-[48px] h-[48px] relative">
                  <Image
                    src={token.imageUrl}
                    alt={token.ticker}
                    width={48}
                    height={48}
                    className="rounded-full"
                    style={{
                      width: '48px',
                      height: '48px',
                      objectFit: 'cover',
                    }}
                    unoptimized
                    onError={(e) => {
                      const imgElement = e.target as HTMLImageElement;
                      imgElement.src = "https://raw.githubusercontent.com/feathericons/feather/master/icons/help-circle.svg";
                    }}
                  />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-white">{token.ticker}</p>
                  <p className="text-sm text-gray-300">Balance: {Number(token.balance).toLocaleString(undefined, {
                    maximumFractionDigits: 4
                  })}</p>
                  {token.marketAddress && (
                    <p className="text-xs text-blue-400">Click to view details →</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
}