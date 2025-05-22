import { useState, useEffect, useRef } from "react";
import { fetchMarketsSearch, MarketResult } from "./fetchMarketsSearch";
import { useRouter } from "next/navigation";
export function SearchMarkets({ onMarketSelect }: { onMarketSelect: (marketAddress: string) => void }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<MarketResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement | null>(null);
    const popupInputRef = useRef<HTMLInputElement | null>(null); // Ref for popup input
    const router = useRouter();
    useEffect(() => {
        if (query.trim() === "") {
            setResults([]);
            return;
        }

        const fetchResults = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await fetchMarketsSearch(query);
                setResults(data);
            } catch (err) {
                setError("Failed to fetch market data.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        const debounceTimeout = setTimeout(fetchResults, 500);
        return () => clearTimeout(debounceTimeout);
    }, [query]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setQuery(""); // Clear the query when closing
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
            popupInputRef.current.focus(); // Automatically focus the popup input
        }
    }, [isOpen]);

    const closePopup = () => {
        setIsOpen(false);
        setQuery(""); // Clear the query when closing
    };
    const MarketItem = ({ item }: { item: MarketResult }) => {
        // Format the contract address
        const formattedContract = `${item.contractAddress.slice(0, 4)}...${item.contractAddress.slice(-4)}`;
        const formattedMarket = `${item.marketAddress.slice(0, 4)}...${item.marketAddress.slice(-4)}`;
        
        return (
            <div className="py-3 px-4 hover:bg-gray-800 transition-colors duration-200"
            onClick={() => {
                onMarketSelect(item.marketAddress); // Notify parent of selection
                setIsOpen(false); // Close the popup
                setQuery(""); // Clear the query when closing
                setLoading(true); // Set loading state
                router.push(`/tokens/${item.marketAddress}`); // Navigate to the token page
            }}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-700 rounded-full overflow-hidden mr-3">
                            {item.image && (
                                <img
                                    src={item.image}
                                    alt={item.tokenName}
                                    className="w-full h-full object-cover"
                                />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center space-x-2">
                                <span className="font-medium text-white">{item.tokenName}</span>
                                <span className="text-gray-400 text-sm">{item.ticker}</span>
                            </div>
                        </div>
                    </div>
    
                    <div className="flex items-center space-x-2">
                        <span>Txns:</span>
                        {item.buyCount1h > 0 && (
                            <span className="text-green-500">{item.buyCount1h}</span>
                        )}
                        <span>/</span>
                        {item.sellCount1h > 0 && (
                            <span className="text-red-500">{item.sellCount1h}</span>
                        )}
                    </div>
                </div>
                
                {/* Contract and Market addresses at the bottom */}
                <div className="flex justify-between text-gray-500 text-sm mt-2">
                    <div>Contract: {formattedContract}</div>
                    <div>Market: {formattedMarket}</div>
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="relative">
                <input
                    type="text"
                    placeholder="Search markets..."
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
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
                                ref={popupInputRef} // Attach the ref to the input
                                type="text"
                                placeholder="Search markets..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
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
                                <p className="mt-4 text-gray-400">Loading token data...</p>
                            </div>
                        ) : error ? (
                            <div className="p-4 text-center text-red-500">{error}</div>
                        ) : results.length === 0 && query !== "" ? (
                            <div className="p-4 text-center text-gray-400">No results found</div>
                        ) : (
                            <div className="max-h-96 overflow-y-auto">
                                {results.map((result, index) => (
                                    <MarketItem key={index} item={result} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}