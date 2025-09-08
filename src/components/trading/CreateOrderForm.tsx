import React, { useState, useEffect } from "react";
import { useContract } from "@/contexts/ContractContext";
import { useWeb3 } from "@/contexts/Web3Context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, AlertCircle } from "lucide-react";
import { formatBalance } from "@/lib/utils";
import { ethers } from "ethers";
import { toast } from "sonner";

interface CreateOrderFormProps {
  assetId: number;
}

const CreateOrderForm: React.FC<CreateOrderFormProps> = ({ assetId }) => {
  const { 
    createOrder, 
    assets,
    usdtBalance,
    usdtSymbol,
    usdtDecimals,
    canUserTradeAsset,
    getMarketPrices,
    getInvestorAmount
  } = useContract();
  
  const { isConnected, connectWallet, account } = useWeb3();
  
  const [orderType, setOrderType] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");
  const [processing, setProcessing] = useState(false);
  const [canTrade, setCanTrade] = useState(false);
  const [marketPrices, setMarketPrices] = useState<{highestBid: string, lowestAsk: string}>({ highestBid: '0', lowestAsk: '0' });
  const [userInvestment, setUserInvestment] = useState<string>("0");
  const [loading, setLoading] = useState(true);

  const asset = assets.find(a => a.id === assetId);

  useEffect(() => {
    const checkTradePermission = async () => {
      if (!asset || !isConnected || asset.status !== 2) {
        setCanTrade(false);
        return;
      }
      
      try {
        setLoading(true);
        const canTrade = await canUserTradeAsset(assetId);
        setCanTrade(canTrade);
        
        // ดึงข้อมูลราคาตลาด
        try {
          const prices = await getMarketPrices(assetId);
          setMarketPrices({
            highestBid: prices.highestBid.toString(),
            lowestAsk: prices.lowestAsk.toString()
          });
          
          // ตั้งค่าราคาเริ่มต้นตามราคาตลาด
          if (!price) {
            if (orderType === "buy" && prices.lowestAsk.gt(0)) {
              setPrice(ethers.utils.formatUnits(prices.lowestAsk, usdtDecimals));
            } else if (orderType === "sell" && prices.highestBid.gt(0)) {
              setPrice(ethers.utils.formatUnits(prices.highestBid, usdtDecimals));
            }
          }
        } catch (error) {
          console.error("Error fetching market prices:", error);
        }
        
        // ดึงข้อมูลการลงทุนของผู้ใช้
        try {
          const investment = await getInvestorAmount(assetId);
          setUserInvestment(investment.toString());
        } catch (error) {
          console.error("Error fetching user investment:", error);
        }
      } catch (error) {
        console.error("Error checking trade permission:", error);
      } finally {
        setLoading(false);
      }
    };

    checkTradePermission();
  }, [assetId, asset, isConnected, canUserTradeAsset, getMarketPrices, getInvestorAmount, orderType]);

  const handleCreateOrder = async () => {
    if (!asset || !isConnected || !amount || !price) return;

    try {
      setProcessing(true);
      await createOrder(assetId, amount, price, orderType === "buy");
      
      // Reset form
      setAmount("");
      setPrice("");
      
      toast.success(`${orderType === "buy" ? "Buy" : "Sell"} order created successfully`);
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Failed to create order");
    } finally {
      setProcessing(false);
    }
  };

  // ฟังก์ชันใช้ราคาตลาด
  const useMarketPrice = () => {
    if (orderType === "buy" && marketPrices.lowestAsk !== '0') {
      setPrice(ethers.utils.formatUnits(marketPrices.lowestAsk, usdtDecimals));
    } else if (orderType === "sell" && marketPrices.highestBid !== '0') {
      setPrice(ethers.utils.formatUnits(marketPrices.highestBid, usdtDecimals));
    }
  };

  if (!asset) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Order</CardTitle>
        <CardDescription>Place a new buy or sell order</CardDescription>
      </CardHeader>
      <CardContent>
        {!isConnected ? (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Connect your wallet</AlertTitle>
            <AlertDescription>
              You need to connect your wallet to trade.
              <Button onClick={connectWallet} variant="outline" className="mt-2">
                Connect Wallet
              </Button>
            </AlertDescription>
          </Alert>
        ) : asset.status !== 2 ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Trading not available</AlertTitle>
            <AlertDescription>
              This asset is not available for trading yet. Only assets with CLOSED status can be traded.
            </AlertDescription>
          </Alert>
        ) : !canTrade && orderType === "sell" ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Cannot sell shares</AlertTitle>
            <AlertDescription>
              You don't own any shares of this asset and cannot place a sell order.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <Tabs value={orderType} onValueChange={(v) => setOrderType(v as "buy" | "sell")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="buy">Buy</TabsTrigger>
                <TabsTrigger value="sell">Sell</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* แสดงราคาตลาด */}
            <div className="bg-blue-50 p-3 rounded-lg text-sm">
              <div className="grid grid-cols-2 gap-4 mb-2">
                <div>
                  <span className="text-gray-600">Highest Bid:</span>{" "}
                  <span className="font-medium text-green-700">
                    {marketPrices.highestBid !== '0' ? 
                      `${formatBalance(marketPrices.highestBid, usdtDecimals)} ${usdtSymbol}` : 
                      "No bids"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Lowest Ask:</span>{" "}
                  <span className="font-medium text-red-700">
                    {marketPrices.lowestAsk !== '0' ? 
                      `${formatBalance(marketPrices.lowestAsk, usdtDecimals)} ${usdtSymbol}` : 
                      "No asks"}
                  </span>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={useMarketPrice} 
                className="w-full mt-1"
                disabled={
                  (orderType === "buy" && marketPrices.lowestAsk === '0') || 
                  (orderType === "sell" && marketPrices.highestBid === '0')
                }
              >
                Use Market Price
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Share Amount</label>
              <Input
                type="number"
                placeholder="Enter amount of shares"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={processing || (orderType === "sell" && !canTrade)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Price per Share ({usdtSymbol})</label>
              <Input
                type="number"
                placeholder={`Enter price in ${usdtSymbol}`}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={processing || (orderType === "sell" && !canTrade)}
              />
            </div>

            {orderType === "buy" ? (
              <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
                <p>Available balance: {formatBalance(usdtBalance, usdtDecimals)} {usdtSymbol}</p>
                {amount && price && (
                  <p className="mt-1">
                    Total cost: {formatBalance(
                      ethers.utils.parseUnits(amount, 0).mul(
                        ethers.utils.parseUnits(price, usdtDecimals)
                      ),
                      usdtDecimals
                    )} {usdtSymbol}
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
                <p>Your shares: {ethers.utils.formatUnits(userInvestment, 0)}</p>
                {amount && price && (
                  <p className="mt-1">
                    Total value: {formatBalance(
                      ethers.utils.parseUnits(amount, 0).mul(
                        ethers.utils.parseUnits(price, usdtDecimals)
                      ),
                      usdtDecimals
                    )} {usdtSymbol}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleCreateOrder}
          disabled={
            !isConnected || 
            !amount || 
            !price || 
            processing || 
            asset.status !== 2 ||
            (orderType === "sell" && !canTrade)
          }
          className="w-full"
        >
          {processing ? "Processing..." : `Create ${orderType} Order`}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CreateOrderForm;
