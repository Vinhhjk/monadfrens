import { collection, getDocs } from "firebase/firestore";
import { db } from "@/utils/firebase";

const IGNORED_ADDRESSES = [
  "0x0000000000000000000000000000000000000000",
  "0xf817257fed379853cde0fa4f97ab987181b1e5ea"
];

export interface UserPnLToken {
  userId: string;
  username?: string;
  pfpUrl?: string;
  tokenAddress: string;
  ticker: string;
  imageUrl: string;
  marketAddress: string;
  totalInvested: number;
  totalSold: number;
  pnlPercent: number;
}

export async function fetchUserPnL(userId?: string): Promise<UserPnLToken[]> {
  // 1. Get all users and their wallets, or just one user if userId is provided
  let users: { id: string; username?: string; pfpUrl?: string; wallets: string[] }[] = [];
  if (userId) {
    const userDoc = await getDocs(collection(db, "users"));
    userDoc.forEach(doc => {
      if (doc.id === userId) {
        const data = doc.data();
        if (data.wallets && Array.isArray(data.wallets)) {
          users.push({ id: doc.id, username: data.username, pfpUrl: data.pfpUrl, wallets: data.wallets });
        }
      }
    });
  } else {
    const usersSnap = await getDocs(collection(db, "users"));
    usersSnap.forEach(doc => {
      const data = doc.data();
      if (data.wallets && Array.isArray(data.wallets)) {
        users.push({ id: doc.id, username: data.username, pfpUrl: data.pfpUrl, wallets: data.wallets });
      }
    });
  }
  // 2. Fetch PnL for each wallet and aggregate per user/token
  const userTokenMap = new Map<
    string, // userId + tokenAddress
    {
      userId: string;
      username?: string;
      pfpUrl: string | undefined;
      tokenAddress: string;
      ticker: string;
      imageUrl: string;
      marketAddress: string;
      totalInvested: number;
      totalSold: number;
    }
  >();

  await Promise.all(users.map(async user => {
    await Promise.all(user.wallets.map(async address => {
      const res = await fetch(`https://api.kuru.io/api/v2/${address}/user/pnl`);
      const json = await res.json();
      if (json.success && json.data && Array.isArray(json.data.data)) {
        json.data.data.forEach((item: any) => {
          // Determine which token to use
          const baseIgnored = IGNORED_ADDRESSES.includes(item.baseasset?.toLowerCase());
          const quoteIgnored = IGNORED_ADDRESSES.includes(item.quoteasset?.toLowerCase());
          if (baseIgnored && quoteIgnored) return;

          let token, marketAddress;
          if (baseIgnored) {
            token = item.quotetoken;
            marketAddress = item.market;
          } else if (quoteIgnored) {
            token = item.basetoken;
            marketAddress = item.market;
          } else {
            token = item.basetoken;
            marketAddress = item.market;
          }

          // Skip if totalSold is 0
          const invested = Number(item.totalInvested);
          const sold = Number(item.totalSold);
          if (sold === 0) return;
        //   console.log({
        //     userId: user.id,
        //     username: user.username,
        //     pfpUrl: user.pfpUrl,
        //     token: token,
        //     investedRaw: item.totalInvested,
        //     soldRaw: item.totalSold,
        //     decimals: token?.decimal,
        //     tokenAddress: token?.address,
        //     ticker: token?.ticker,
        //   });
          const decimals = token?.decimal ?? 18;
          const formattedInvested = invested / Math.pow(10, 8);
          const formattedSold = sold / Math.pow(10, 8);

          // Aggregate by userId + tokenAddress
          const key = `${user.id}_${token?.address}`;
          if (userTokenMap.has(key)) {
            const prev = userTokenMap.get(key)!;
            userTokenMap.set(key, {
              ...prev,
              totalInvested: prev.totalInvested + formattedInvested,
              totalSold: prev.totalSold + formattedSold,
            });
          } else {
            userTokenMap.set(key, {
              userId: user.id,
              username: user.username,
              pfpUrl: user.pfpUrl,
              tokenAddress: token?.address,
              ticker: token?.ticker,
              imageUrl: token?.imageurl,
              marketAddress,
              totalInvested: formattedInvested,
              totalSold: formattedSold,
            });
          }
        });
      }
    }));
  }));

  // Calculate pnlPercent for each aggregated entry
  return Array.from(userTokenMap.values()).map(entry => ({
    ...entry,
    pnlPercent: entry.totalInvested > 0
      ? ((entry.totalSold - entry.totalInvested) / entry.totalInvested) * 100
      : 0,
  }));
}