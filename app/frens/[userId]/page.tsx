"use client";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/utils/firebase";
import { useParams } from "next/navigation";
import { UserPortfolio } from "@/components/UserData/userPortfolio";
import { fetchUserPnL, UserPnLToken } from "@/components/UserData/fetchUserPnL";
import { useRouter } from "next/navigation";

export default function FrenDetailPage() {
  const params = useParams();
  const userId = params.userId as string;
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);

 const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  //state for PnL
  const [pnl, setPnl] = useState<UserPnLToken[]>([]);
  const [pnlLoading, setPnlLoading] = useState(true);
  const [activeView, setActiveView] = useState<'portfolio' | 'pnl'>('portfolio');
  const handleTokenClick = async (marketAddress: string) => {
    setIsNavigating(true);
    router.push(`/tokens/${marketAddress}`);
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          setUser(userDoc.data());
        } else {
          setError("User not found");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        setError("Failed to fetch user data");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  // Fetch user PnL
  useEffect(() => {
    if (!userId) return;
    setPnlLoading(true);
    fetchUserPnL(userId)
      .then(setPnl)
      .finally(() => setPnlLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading fren data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  if (!user) {
    return <div className="p-8 text-center text-red-500">User not found</div>;
  }
  const renderContent = () => {
    return (
      <div className="relative">
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveView('portfolio')}
              className={`px-4 py-2 ${
                activeView === 'portfolio'
                  ? 'text-white border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white'
              } text-lg font-bold transition-colors`}
            >
              Portfolio
            </button>
            <button
              onClick={() => setActiveView('pnl')}
              className={`px-4 py-2 ${
                activeView === 'pnl'
                  ? 'text-white border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white'
              } text-lg font-bold transition-colors`}
            >
              PnL
            </button>
          </div>
        </div>
  
        {activeView === 'portfolio' ? (
          <UserPortfolio userId={userId} />
        ) : (
          <div>
            {pnlLoading ? (
              <div className="text-gray-400 text-center">Loading PnL...</div>
            ) : pnl.length === 0 ? (
              <div className="text-gray-400 text-center">No PnL data found.</div>
            ) : (
              <table className="min-w-full bg-gray-700 rounded text-sm">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left text-gray-300">Token</th>
                    <th className="px-3 py-2 text-left text-gray-300">PnL %</th>
                  </tr>
                </thead>
                <tbody>
                  {pnl.map((token) => (
                    <tr key={token.tokenAddress} className="border-t border-gray-600">
                      <td 
                        onClick={() => handleTokenClick(token.marketAddress)}
                        className="px-3 py-2 text-white flex items-center gap-2 cursor-pointer hover:bg-gray-600"
                      >
                        {token.imageUrl && (
                          <img src={token.imageUrl} alt={token.ticker} className="w-5 h-5 rounded-full" />
                        )}
                        {token.ticker || token.tokenAddress.slice(0, 6)}
                      </td>
                      <td className={`px-3 py-2 font-bold ${token.pnlPercent >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {token.pnlPercent.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      {isNavigating && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading token data...</p>
          </div>
        </div>
      )}
      <div className="w-full max-w-4xl bg-gray-800 rounded-lg p-8 shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-white text-center">Fren Details</h1>
        {user.pfpUrl && (
          <div className="flex justify-center mb-6">
            <img src={user.pfpUrl} alt="pfp" className="w-24 h-24 rounded-full" />
          </div>
        )}
        <div className="mb-4 font-medium text-white text-center text-xl">
          @{user.username || user.farcasterId || userId}
        </div>

        {renderContent()}
      </div>
    </div>
  );
}
