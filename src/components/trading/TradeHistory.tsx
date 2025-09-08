import React, { useEffect, useState } from "react";
import { useContract } from "@/contexts/ContractContext";
import { formatBalance, shortenAddress, formatDate } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trade } from "@/contexts/ContractContext";

interface TradeHistoryProps {
  assetId: number;
}

const TradeHistory: React.FC<TradeHistoryProps> = ({ assetId }) => {
  const { getRecentTrades, getTrade, usdtDecimals, usdtSymbol } = useContract();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        setLoading(true);
        
        // ใช้ฟังก์ชันใหม่จาก context
        const tradeIds = await getRecentTrades(assetId);

        const tradesData = await Promise.all(
          tradeIds.map(async (tradeId: number) => {
            try {
              return await getTrade(tradeId);
            } catch (error) {
              console.error(`Error fetching trade ${tradeId}:`, error);
              return null;
            }
          })
        );

        // กรองเอาเฉพาะ trades ที่ไม่เป็น null
        setTrades(tradesData.filter(Boolean) as Trade[]);
      } catch (error) {
        console.error("Error fetching trades:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrades();
  }, [assetId, getRecentTrades, getTrade]);

  if (loading) {
    return <div className="text-center py-4">Loading trade history...</div>;
  }

  return (
    <ScrollArea className="h-[400px]">
      {trades.length > 0 ? (
        <div className="space-y-2">
          {trades.map(trade => (
            <div key={trade.id} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Price: {formatBalance(trade.pricePerShare.toString(), usdtDecimals)} {usdtSymbol}</span>
                <span>Amount: {trade.shareAmount.toString()} shares</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>
                  {shortenAddress(trade.seller)} → {shortenAddress(trade.buyer)}
                </span>
                <span>{formatDate(trade.timestamp)}</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Total: {formatBalance(trade.totalPrice.toString(), usdtDecimals)} {usdtSymbol}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No trade history available</p>
      )}
    </ScrollArea>
  );
};

export default TradeHistory;
