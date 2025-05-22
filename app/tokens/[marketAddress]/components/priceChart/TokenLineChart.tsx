import { createChart, CrosshairMode, LineData, LineSeries, Time, IChartApi } from "lightweight-charts";
import { io, Socket } from "socket.io-client";
import { useEffect, useRef, useState } from "react";
import { fetchOHLCV } from "./fetchOHLCV";
import { usePriceContext } from "./PriceContext";

export interface TokenCandleChartProps {
  marketAddress: string;
  isUSDCPair?: boolean;
}

export default function TokenLineChart({ marketAddress, isUSDCPair }: TokenCandleChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chart = useRef<IChartApi | null>(null);
    const socket = useRef<Socket | null>(null);
    const resizeObserver = useRef<ResizeObserver | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { setCurrentPrice } = usePriceContext();

    // Separate effect for chart initialization
    useEffect(() => {
        if (!chartContainerRef.current || chart.current) return;

        chart.current = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 350,
            layout: {
                background: { color: "#253248" },
                textColor: "rgba(255, 255, 255, 0.9)"
            },
            grid: {
                vertLines: { color: "#334158" },
                horzLines: { color: "#334158" }
            },
            crosshair: {
                mode: CrosshairMode.Normal
            },
            overlayPriceScales: {
                borderColor: "#485c7b"
            },
            timeScale: {
                borderColor: "#485c7b",
                timeVisible: true,
                secondsVisible: false
            }
        });

        const handleResize = () => {
            if (chart.current && chartContainerRef.current) {
                chart.current.applyOptions({
                    width: chartContainerRef.current.clientWidth
                });
            }
        };

        resizeObserver.current = new ResizeObserver(handleResize);
        resizeObserver.current.observe(chartContainerRef.current);

        return () => {
            if (resizeObserver.current && chartContainerRef.current) {
                resizeObserver.current.unobserve(chartContainerRef.current);
                resizeObserver.current = null;
            }
            if (chart.current) {
                chart.current.remove();
                chart.current = null;
            }
        };
    }, []);

    // Separate effect for data fetching and socket connection
    useEffect(() => {
        if (!chart.current) return;

        const fetchData = async () => {
            setIsLoading(true);
            
            socket.current = io('wss://ws.testnet.kuru.io', {
                path: "/socket.io",
                transports: ["websocket"],
                query: { marketAddress },
            });

            const toCurrent = Math.floor(Date.now() / 1000);
            const from = Math.floor(new Date().setFullYear(new Date().getFullYear() - 1) / 1000);

            try {
                const d = await fetchOHLCV(marketAddress, from.toString(), toCurrent.toString(),"5m", isUSDCPair);
                
                if (!chart.current) return; // Safety check

                const lineData: LineData[] = d.data.t.map((ts: number, i: number) => ({
                    time: ts as Time,
                    value: (d.data.h[i] + d.data.c[i]) / 2,
                }));

                const lineSeries = chart.current.addSeries(LineSeries, {
                    priceFormat: {
                        type: 'price',
                        precision: 3,
                        minMove: 0.001,
                    }
                });

                lineSeries.setData(lineData);

                socket.current.onAny((event, data) => {
                    if (event === "Trade" && chart.current) {
                        const tradeTime = data.triggerTime;
                        const unixTime = Math.floor(new Date(tradeTime).getTime() / 1000);
                        const tokenPriceinMon = data.price/1e18;
                        const latestMonPrice = data.monUsdPrice/1e18;
                        const value = isUSDCPair ? tokenPriceinMon : tokenPriceinMon * latestMonPrice;
                        if (value) {
                            const pointData = {
                                time: unixTime as Time,
                                value: value,
                            };
                            lineSeries.update(pointData);
                            setCurrentPrice(value);
                        }
                    }
                });

                if (chart.current) {
                    chart.current.timeScale().fitContent();
                }
                setIsLoading(false);
            } catch (e) {
                console.error("Error fetching data:", e);
                setIsLoading(false);
            }
        };

        fetchData();

        return () => {
            if (socket.current) {
                socket.current.disconnect();
                socket.current = null;
            }
        };
    }, [marketAddress, setCurrentPrice, isUSDCPair]);

    return (
        <div className="mt-8 relative">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-opacity-75 bg-gray-800 rounded z-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            )}
            <div 
                ref={chartContainerRef}
                className="w-full h-[350px] rounded overflow-visible"
            />
        </div>
    );
}