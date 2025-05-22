import { useMiniAppContext } from "@/hooks/use-miniapp-context";
import { parseEther } from "viem";
import { monadTestnet } from "viem/chains";
import { db } from "@/utils/firebase";
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { useEffect } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSendTransaction,
  useSwitchChain,
} from "wagmi";
import { farcasterFrame } from "@farcaster/frame-wagmi-connector";

// ...existing code...
export function WalletActions() {
  const { isEthProviderAvailable, context } = useMiniAppContext();
  const { isConnected, address, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { connect } = useConnect();
  // Add this effect to handle wallet connect
  useEffect(() => {
    const handleWalletConnect = async () => {
      if (isConnected && address && context?.user?.fid) {
        const farcasterId = String(context.user.fid);
        const username = context.user.username || "";
        const pfpUrl = context.user.pfpUrl || "";
        const usersRef = doc(db, "farcasterIndex", farcasterId);
        const userSnap = await getDoc(usersRef);
  
        const lowerCaseAddress = address.toLowerCase();
  
        if (!userSnap.exists()) {
          const userId = uuidv4();
          await setDoc(doc(db, "users", userId), {
            farcasterId,
            wallets: [lowerCaseAddress],
            username,
            pfpUrl,
          });
          await setDoc(usersRef, { userId });
        } else {
          const { userId } = userSnap.data();
          const userDocRef = doc(db, "users", userId);
          const userDocSnap = await getDoc(userDocRef);
          let updateData: any = {
            wallets: arrayUnion(lowerCaseAddress),
          };
  
          // Only update username/pfpUrl if changed
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            if (data.username !== username) updateData.username = username;
            if (data.pfpUrl !== pfpUrl) updateData.pfpUrl = pfpUrl;
          } else {
            updateData.username = username;
            updateData.pfpUrl = pfpUrl;
          }
  
          await updateDoc(userDocRef, updateData);
        }
      }
    };
    handleWalletConnect();
  }, [isConnected, address, context?.user?.fid, context?.user?.username, context?.user?.pfpUrl]);
  return (
    <div className="space-y-4 border border-[#333] rounded-md p-4">
      <div className="flex flex-row space-x-4 justify-start items-start">
        {isConnected ? (
          <div className="flex flex-col space-y-4 justify-start">
            <p className="text-sm text-left">
              Connected to wallet:{" "}
              <span className="bg-white font-mono text-black rounded-md p-[4px]">
                {address}
              </span>
            </p>

            {chainId !== monadTestnet.id && (
              <button
                className="bg-white text-black rounded-md p-2 text-sm"
                onClick={() => switchChain({ chainId: monadTestnet.id })}
              >
                Switch to Monad Testnet
              </button>
            )}
          </div>
        ) : (
          isEthProviderAvailable ?
          (
            <button
              className="bg-white text-black w-full rounded-md p-2 text-sm"
              onClick={() => connect({ connector: farcasterFrame() })}
            >
              Connect Wallet
            </button>
          ) :
          (
            <p className="text-sm text-left">
              Wallet connection only via Warpcast
            </p>
          )
        )}
      </div>
    </div>
  );
}