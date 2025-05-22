import { createChart, CandlestickData, IChartApi, ISeriesApi, CandlestickSeries } from "lightweight-charts";
import { useEffect, useRef } from "react";
import { fetchOHLCV } from "./components/priceChart/fetchOHLCV";

import { useParams } from "next/navigation";
import { useState } from "react";

export interface TokenCandleChartProps {
  marketAddress: string;
}
export default function TokenLineChart({ marketAddress }: TokenCandleChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
  
    useEffect(() => {
      let chart = chartRef.current;
      let series: any;
      let interval: NodeJS.Timeout;
  
      const fetchData = async () => {
        const toCurrent = Math.floor(Date.now() / 1000);
        // Show only the last 24 hours
        const from = toCurrent - 60 * 60 * 24;
        try {
          const d = await fetchOHLCV(marketAddress, from.toString(), toCurrent.toString());
          console.log("Fetched Data:", d);
          // d.o, d.h, d.l, d.c, d.t are arrays
          const candleData: CandlestickData[] = d.t.map((ts: number, i: number) => ({
            time: ts,
            open: d.o[i],
            high: d.h[i],
            low: d.l[i],
            close: d.c[i],
          }));
          console.log("Candle Data:", candleData);
          if (!chart && chartContainerRef.current) {
            chart = createChart(chartContainerRef.current, {
              layout: { textColor: "black", background: {color: "white" } },
              width: chartContainerRef.current.clientWidth,
              height: 350,
            });
            chartRef.current = chart;
            series = chart.addSeries(CandlestickSeries,{
              upColor: "#26a69a",
              downColor: "#ef5350",
              borderVisible: false,
              wickUpColor: "#26a69a",
              wickDownColor: "#ef5350",
            });
          } 
          if (series) {
            series.setData(candleData);
          }
        } catch (e) {
          // handle error
        }
      };
  
      fetchData();
      interval = setInterval(fetchData, 5000);
  
      return () => {
        clearInterval(interval);
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
        }
      };
    }, [marketAddress]);
  
    return (
      <div className="mt-8">
        <div ref={chartContainerRef} style={{ width: "100%", height: 350 }} />
      </div>
    );
  }