"use client";
import { useEffect, useState } from "react";
import { fetchUserPnL, UserPnLToken } from "./fetchUserPnL";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function UserPnL() {
    const [data, setData] = useState<UserPnLToken[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
      fetchUserPnL().then(setData).finally(() => setLoading(false));
    }, []);
  
    if (loading) return <div className="text-gray-400">Loading PnL data...</div>;
    if (!data.length) return <div className="text-gray-400">No PnL data found.</div>;
  
    // Correct aggregation: sum all tokens' PnL for each user
    const userTotals: Record<string, {
      username?: string;
      pfpUrl?: string;
      totalInvested: number;
      totalSold: number;
      totalPnl: number;
      pnlPercent: number;
    }> = {};
  
    data.forEach(row => {
      if (!userTotals[row.userId]) {
        userTotals[row.userId] = {
          username: row.username,
          pfpUrl: row.pfpUrl,
          totalInvested: 0,
          totalSold: 0,
          totalPnl: 0,
          pnlPercent: 0,
        };
      }
      userTotals[row.userId].totalInvested += row.totalInvested;
      userTotals[row.userId].totalSold += row.totalSold;
      userTotals[row.userId].totalPnl += (row.totalSold - row.totalInvested); // sum PnL across all tokens
    });
  
    Object.values(userTotals).forEach(user => {
      user.pnlPercent = user.totalInvested > 0
        ? (user.totalPnl / user.totalInvested) * 100
        : 0;
    });

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4 text-white">User PnL</h2>
      {/* User total PnL summary */}
      <div className="mb-6">
  <table className="min-w-full bg-gray-800 rounded">
    <thead>
      <tr>
        <th className="px-4 py-2 text-left text-gray-300">User</th>
        <th className="px-4 py-2 text-left text-gray-300">Total PnL %</th>
      </tr>
    </thead>
    <tbody>
      {Object.entries(userTotals)
        .sort(([, a], [, b]) => b.pnlPercent - a.pnlPercent)
        .map(([userId, user]) => (
          <tr
            key={userId}
            className="border-t border-gray-700 cursor-pointer hover:bg-gray-700 transition-colors"
            onClick={() => router.push(`/frens/${userId}`)}
          >
            <td className="px-4 py-2 text-white flex items-center gap-2">
              {user.pfpUrl && (
                <Image
                  src={user.pfpUrl}
                  alt="pfp"
                  width={24}
                  height={24}
                  className="rounded-full object-cover"
                />
              )}
              @{user.username || userId}
            </td>
            <td
              className={`px-4 py-2 font-bold ${
                user.pnlPercent >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {user.pnlPercent.toFixed(2)}%
            </td>
          </tr>
        ))}
    </tbody>
  </table>
</div>
    </div>
  );
}