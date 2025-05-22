"use client";
import { useState, useRef, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/utils/firebase";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";

export default function FrensPage() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const popupInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const [navigating, setNavigating] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setNavigating(false);
  }, [pathname]);

  useEffect(() => {
    if (search.trim() === "") {
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        let users: any[] = [];
        const usersCol = collection(db, "users");
        
        // Search by username
        let q = query(usersCol, where("username", "==", search));
        let snap = await getDocs(q);
        snap.forEach(doc => users.push({ id: doc.id, ...doc.data() }));
        
        // Additional searches if no results found
        if (users.length === 0) {
          q = query(usersCol, where("farcasterId", "==", search));
          snap = await getDocs(q);
          snap.forEach(doc => users.push({ id: doc.id, ...doc.data() }));
        }

        if (users.length === 0) {
          q = query(usersCol, where("wallets", "array-contains", search.toLowerCase()));
          snap = await getDocs(q);
          snap.forEach(doc => users.push({ id: doc.id, ...doc.data() }));
        }

        setResults(users);
      } catch (err) {
        setError("Failed to fetch users.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimeout = setTimeout(fetchResults, 500);
    return () => clearTimeout(debounceTimeout);
  }, [search]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && popupInputRef.current) {
      popupInputRef.current.focus();
    }
  }, [isOpen]);

  const closePopup = () => {
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
            {navigating && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[100]">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      <div className="w-full max-w-2xl">
        <div className="relative">
          <input
            type="text"
            placeholder="Search frens..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setIsOpen(true);
            }}
            onClick={() => setIsOpen(true)}
            className="w-full py-2 pl-10 pr-4 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {isOpen && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center">
            <div
              ref={searchRef}
              className="relative w-full max-w-2xl bg-gray-900 border border-gray-700 rounded-md shadow-lg p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <input
                  ref={popupInputRef}
                  type="text"
                  placeholder="Search frens..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full py-3 px-4 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                />
                <button
                  onClick={closePopup}
                  className="ml-4 text-gray-400 hover:text-white"
                >
                  Close
                </button>
              </div>

              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-4 text-gray-400">Searching users...</p>
                </div>
              ) : error ? (
                <div className="p-4 text-center text-red-500">{error}</div>
              ) : results.length === 0 && search !== "" ? (
                <div className="p-4 text-center text-gray-400">No users found</div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {results.map((user) => (
                    <div
                      key={user.id}
                      className="py-3 px-4 hover:bg-gray-800 transition-colors duration-200 cursor-pointer"
                      onClick={() => {
                        setIsOpen(false);
                        setSearch("");
                        setNavigating(true); // Show overlay

                        router.push(`/frens/${user.id}`);
                      }}
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-700 rounded-full overflow-hidden mr-3">
                          {user.pfpUrl && (
                            <Image
                              src={user.pfpUrl}
                              alt="profile"
                              width={32}
                              height={32}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-white">
                              @{user.username || user.farcasterId || user.id}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}