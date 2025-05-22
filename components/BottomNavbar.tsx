"use client";
import { useMiniAppContext } from "@/hooks/use-miniapp-context";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { useState, useRef } from "react";
import { FaHome,FaUserFriends } from "react-icons/fa";
import { BsPersonCircle } from "react-icons/bs";
import { useEffect } from "react";
import { useDisconnect, useAccount, useBalance,useConnect, useSwitchChain} from "wagmi";

import { formatEther } from "viem";
import { monadTestnet } from "viem/chains";
import { farcasterFrame } from "@farcaster/frame-wagmi-connector";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/utils/firebase";

export function BottomNavbar() {
  const { context } = useMiniAppContext();
  const router = useRouter();
  const pathname = usePathname();

  const [showProfile, setShowProfile] = useState(false);
  const { isConnected, address,chainId } = useAccount();
  const [loading, setLoading] = useState(false); // Add loading state

  const { disconnect } = useDisconnect();
  const { connect } = useConnect();
  const { switchChain } = useSwitchChain();
  const { data: balance, refetch: refetchBalance } = useBalance({
    address
  });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Clear interval when modal closes
    if (!showProfile && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    // When profile modal opens, fetch balance and start interval
    if (showProfile && address) {
      refetchBalance();
      intervalRef.current = setInterval(() => {
        refetchBalance();
      }, 30000); // 30 seconds
    }
    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [showProfile, address, refetchBalance]);

  useEffect(() => {
    setLoading(false);
  }, [pathname]);

  const handleHome = () => {
    if (window.location.pathname === "/") {
      setLoading(true);
      window.location.reload();
    } else {
      setLoading(true);
      router.push("/");
    }
  };
  const handleProfile = () => {
    setShowProfile(true);
  };

  const closeProfile = () => {
    setShowProfile(false);
  };
  const handleViewProfile = async () => {
    if (!address || !context?.user?.fid) return;
  
    setLoading(true); // Show loading overlay
  
    try {
      // First try to find user by Farcaster ID
      let userId: string | undefined;

      const farcasterRef = doc(db, "farcasterIndex", String(context.user.fid));
      const farcasterSnap = await getDoc(farcasterRef);
  
      if (farcasterSnap.exists()) {
        userId = farcasterSnap.data().userId;
      } else {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("wallets", "array-contains", address.toLowerCase()));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          userId = querySnapshot.docs[0].id;
        }
      }
      if (userId) {
        // If already on your profile page, just close modal and stop loading
        if (pathname === `/frens/${userId}`) {
          closeProfile();
          setLoading(false);
          return;
        }
        closeProfile();
        router.push(`/frens/${userId}`);
        return;
      }
  
      // If not found by Farcaster ID, try to find by wallet address
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("wallets", "array-contains", address.toLowerCase()));
      const querySnapshot = await getDocs(q);
  
      if (!querySnapshot.empty) {
        const userId = querySnapshot.docs[0].id;
        closeProfile();
        router.push(`/frens/${userId}`);
        return;
      }
  
      console.error("User profile not found");
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const handleFrens = () => {
    setLoading(true);
    router.push("/frens");
  };

  return (
    <>
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[100]">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 flex justify-around items-center h-16 z-50">
        <button
          className="flex flex-col items-center text-black"
          onClick={handleHome}
        >
            <FaHome size={24} />
          <span className="text-xs">Home</span>
        </button>
        <button
          className="flex flex-col items-center text-black"
          onClick={handleFrens}
        >
          <FaUserFriends size={24} />
          <span className="text-xs">Frens</span>
        </button>
        <button
          className="flex flex-col items-center text-black"
          onClick={handleProfile}
        >
            <BsPersonCircle size={24} />
          <span className="text-xs">Profile</span>
        </button>
      </nav>
      {showProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex flex-col items-center relative min-w-[220px]">
          <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl"
              onClick={closeProfile}
              aria-label="Close"
            >
              ×
            </button>
            {context?.user?.pfpUrl && (
              <Image
                src={context.user.pfpUrl}
                alt="Profile"
                className="w-20 h-20 rounded-full"
                width={80}
                height={80}
              />
            )}
            <div className="text-center mt-2">
              {context?.user?.username && (
                <p className="text-sm text-muted-foreground">
                  @{context.user?.username}
                </p>
              )}
              {/* If not connected, show connect wallet */}
              {!isConnected && (
                <button
                  className="mt-4 bg-black text-white rounded-md px-4 py-2 text-sm"
                  onClick={() => connect({ connector: farcasterFrame() })}
                >
                  Connect Wallet
                </button>
              )}
              {/* If connected, show address and balance */}
              {isConnected && address && (
                <>
                  <p className="text-xs text-gray-500 mt-1">
                    {`${address.slice(0, 4)}...${address.slice(-4)}`}
                  </p>
                  <button
                    onClick={handleViewProfile}
                    className="mt-2 text-sm text-gray-900 hover:text-blue-700 underline"
                  >
                    View Profile →
                  </button>
                  {balance && (
                    <p className="text-sm mt-2 text-gray-900">
                      Balance: {parseFloat(formatEther(balance.value)).toFixed(3)} {balance.symbol}
                    </p>
                  )}
                  {/* Chain switch button */}
                  {chainId !== monadTestnet.id && (
                    <button
                      className="mt-2 bg-white text-black border border-black rounded-md px-4 py-2 text-sm"
                      onClick={() => switchChain({ chainId: monadTestnet.id })}
                    >
                      Switch to Monad Testnet
                    </button>
                  )}
                  <button
                    className="mt-4 bg-red-500 text-white rounded-md px-4 py-2 text-sm"
                    onClick={() => {
                      disconnect();
                      closeProfile();
                    }}
                  >
                    Disconnect Wallet
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}