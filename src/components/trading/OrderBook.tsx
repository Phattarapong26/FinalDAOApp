import React, { useEffect, useState } from "react";
import { useContract } from "@/contexts/ContractContext";
import { formatBalance, shortenAddress } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Order } from "@/contexts/ContractContext";

interface OrderBookProps {
  assetId: number;
}

const OrderBook: React.FC<OrderBookProps> = ({ assetId }) => {
  const { getOrdersByAsset, getMarketPrices, usdtDecimals, usdtSymbol } = useContract();
  const [buyOrders, setBuyOrders] = useState<Order[]>([]);
  const [sellOrders, setSellOrders] = useState<Order[]>([]);
  const [marketPrices, setMarketPrices] = useState<{highestBid: string, lowestAsk: string}>({ highestBid: '0', lowestAsk: '0' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        
        // ใช้ฟังก์ชันใหม่จาก context
        const orders = await getOrdersByAsset(assetId);
        
        // แยก buy orders และ sell orders
        const activeBuyOrders = orders.filter(order => order.isActive && order.isBuyOrder);
        const activeSellOrders = orders.filter(order => order.isActive && !order.isBuyOrder);
        
        setBuyOrders(activeBuyOrders);
        setSellOrders(activeSellOrders);
        
        // ดึงราคาตลาด
        try {
          const prices = await getMarketPrices(assetId);
          setMarketPrices({
            highestBid: prices.highestBid.toString(),
            lowestAsk: prices.lowestAsk.toString()
          });
        } catch (error) {
          console.error("Error fetching market prices:", error);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [assetId, getOrdersByAsset, getMarketPrices]);

  if (loading) {
    return <div className="text-center py-4">Loading order book...</div>;
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-4">
        {/* แสดงราคาตลาด */}
        <div className="p-3 bg-blue-50 rounded-lg mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-600">Highest Bid</div>
              <div className="font-medium text-green-700">
                {formatBalance(marketPrices.highestBid, usdtDecimals)} {usdtSymbol}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Lowest Ask</div>
              <div className="font-medium text-red-700">
                {formatBalance(marketPrices.lowestAsk, usdtDecimals)} {usdtSymbol}
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-medium text-green-700 mb-2">Buy Orders</h3>
          {buyOrders.length > 0 ? (
            <div className="space-y-2">
              {buyOrders.map(order => (
                <div key={order.id} className="p-3 bg-green-50 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Price: {formatBalance(order.pricePerShare.toString(), usdtDecimals)} {usdtSymbol}</span>
                    <span>Amount: {order.shareAmount.toString()} shares</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>By: {shortenAddress(order.creator)}</span>
                    <span>Filled: {order.filledAmount.toString()}/{order.shareAmount.toString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No active buy orders</p>
          )}
        </div>

        <div>
          <h3 className="font-medium text-red-700 mb-2">Sell Orders</h3>
          {sellOrders.length > 0 ? (
            <div className="space-y-2">
              {sellOrders.map(order => (
                <div key={order.id} className="p-3 bg-red-50 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Price: {formatBalance(order.pricePerShare.toString(), usdtDecimals)} {usdtSymbol}</span>
                    <span>Amount: {order.shareAmount.toString()} shares</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>By: {shortenAddress(order.creator)}</span>
                    <span>Filled: {order.filledAmount.toString()}/{order.shareAmount.toString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No active sell orders</p>
          )}
        </div>
      </div>
    </ScrollArea>
  );
};

export default OrderBook;
