"use client";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/utils/firebase";
import { useParams } from "next/navigation";
import { UserPortfolio } from "@/components/UserData/userPortfolio";

export default function FrenDetailPage() {
  const params = useParams();
  const userId = params.userId as string;
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
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
        
        {/* Replace the wallet addresses display with UserPortfolio */}
        <UserPortfolio userId={userId} />
      </div>
    </div>
  );
}