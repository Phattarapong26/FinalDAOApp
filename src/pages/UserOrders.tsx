import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PageLayout from "@/components/layout/PageLayout";
import { useContract } from "@/contexts/ContractContext";
import { useWeb3 } from "@/contexts/Web3Context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatBalance, formatDate, shortenAddress } from "@/lib/utils";
import { ArrowLeft, ShoppingCart, ReceiptIcon, ShoppingBag, ExternalLink, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { ethers } from "ethers";
import { Order, Trade } from "@/contexts/ContractContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ExtendedOrder extends Order {
  assetName?: string;
  timestamp: ethers.BigNumber;
}

interface ExtendedTrade extends Trade {
  assetName?: string;
}

const UserOrders: React.FC = () => {
  const [searchParams] = useSearchParams();
  const assetIdParam = searchParams.get('assetId');
  const assetId = assetIdParam ? parseInt(assetIdParam) : undefined;
  
  const { 
    assets,
    refreshAssets,
    cancelOrder,
    getUserOrders,
    getUserTrades,
    getOrder,
    getTrade,
    matchOrder,
    usdtDecimals, 
    usdtSymbol,
    hasPaidFee 
  } = useContract();
  const { isConnected, connectWallet, account } = useWeb3();
  
  const [userOrders, setUserOrders] = useState<ExtendedOrder[]>([]);
  const [userTrades, setUserTrades] = useState<ExtendedTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<{[key: string]: number}>({});
  
  useEffect(() => {
    const init = async () => {
      if (isConnected && account) {
        await refreshAssets();
        await fetchUserOrdersAndTrades();
      } else {
        setLoading(false);
      }
    };
    
    init();
  }, [isConnected, account]);
  
  const fetchUserOrdersAndTrades = async () => {
    try {
      setLoading(true);
      
      // ใช้ฟังก์ชันใหม่จาก context
      const orderIds = await getUserOrders();
      
      const ordersData = await Promise.all(
        orderIds.map(async (orderId: number) => {
          try {
            const order = await getOrder(orderId);
            return order as ExtendedOrder;
          } catch (error) {
            console.error(`Error fetching order ${orderId}:`, error);
            return null;
          }
        })
      );
      
      const tradeIds = await getUserTrades();
      
      const tradesData = await Promise.all(
        tradeIds.map(async (tradeId: number) => {
          try {
            const trade = await getTrade(tradeId);
            return trade as ExtendedTrade;
          } catch (error) {
            console.error(`Error fetching trade ${tradeId}:`, error);
            return null;
          }
        })
      );
      
      // กรองเอาเฉพาะข้อมูลที่ไม่เป็น null
      const filteredOrders = ordersData.filter(Boolean) as ExtendedOrder[];
      const filteredTrades = tradesData.filter(Boolean) as ExtendedTrade[];
      
      // เพิ่มชื่อ asset
      const ordersWithNames = filteredOrders.map(order => {
        const asset = assets.find(a => a.id === order.assetId);
        return {
          ...order,
          assetName: asset ? asset.name : `สินทรัพย์ #${order.assetId}`
        };
      });
      
      const tradesWithNames = filteredTrades.map(trade => {
        const asset = assets.find(a => a.id === trade.assetId);
        return {
          ...trade,
          assetName: asset ? asset.name : `สินทรัพย์ #${trade.assetId}`
        };
      });
      
      // กรองตาม assetId ถ้ามีการระบุ
      const filteredOrdersByAsset = assetId 
        ? ordersWithNames.filter(order => order.assetId === assetId)
        : ordersWithNames;
        
      const filteredTradesByAsset = assetId
        ? tradesWithNames.filter(trade => trade.assetId === assetId)
        : tradesWithNames;
      
      // เรียงลำดับจากใหม่ไปเก่า
      const sortedOrders = filteredOrdersByAsset.sort((a, b) => 
        b.timestamp.gt(a.timestamp) ? 1 : -1
      );
      
      const sortedTrades = filteredTradesByAsset.sort((a, b) => 
        b.timestamp.gt(a.timestamp) ? 1 : -1
      );
      
      setUserOrders(sortedOrders);
      setUserTrades(sortedTrades);
    } catch (error) {
      console.error("Error fetching user orders:", error);
      toast.error("ไม่สามารถโหลดคำสั่งซื้อได้");
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancelOrder = async (orderId: number) => {
    if (!isConnected) return;
    
    try {
      setProcessingIds(prev => ({...prev, [`cancel-${orderId}`]: orderId}));
      await cancelOrder(orderId);
      toast.success("ยกเลิกคำสั่งซื้อสำเร็จ");
      
      // อัปเดตรายการ order ในสถานะ
      setUserOrders(prev => 
        prev.map(order => 
          order.id === orderId ? { ...order, isActive: false } : order
        )
      );
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error("ไม่สามารถยกเลิกคำสั่งซื้อได้");
    } finally {
      setProcessingIds(prev => {
        const newState = {...prev};
        delete newState[`cancel-${orderId}`];
        return newState;
      });
    }
  };

  const handleMatchOrder = async (orderId: number) => {
    if (!isConnected) return;
    
    try {
      setProcessingIds(prev => ({...prev, [`match-${orderId}`]: orderId}));
      
      await matchOrder(orderId);
      toast.success("จับคู่คำสั่งซื้อสำเร็จ");
      
      // รีเฟรชหลังจาก match
      await fetchUserOrdersAndTrades();
    } catch (error) {
      console.error("Error matching order:", error);
      toast.error("ไม่สามารถจับคู่คำสั่งซื้อได้");
    } finally {
      setProcessingIds(prev => {
        const newState = {...prev};
        delete newState[`match-${orderId}`];
        return newState;
      });
    }
  };
  
  const calculateTradingFee = (totalPrice: ethers.BigNumber): string => {
    // คำนวณค่าธรรมเนียม 1%
    const fee = totalPrice.mul(1).div(100);
    return formatBalance(fee, usdtDecimals);
  };
  
  if (loading) {
    return (
      <PageLayout>
        <div className="container px-4 py-8 mx-auto">
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">กำลังโหลดคำสั่งซื้อและประวัติการซื้อขาย...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container px-4 py-8 mx-auto bg-white shadow-sm border border-gray-200 rounded-xl  mt-[15px] mb-[20px]">
        <div className="mb-6">
          {assetId ? (
            <Link to={`/trade/${assetId}`} className="inline-flex items-center text-blue-600 hover:underline">
              <ArrowLeft className="h-4 w-4 mr-1" />
              กลับไปหน้าซื้อขาย
            </Link>
          ) : (
            <Link to="/dashboard" className="inline-flex items-center text-blue-600 hover:underline">
              <ArrowLeft className="h-4 w-4 mr-1" />
              กลับไปหน้าแดชบอร์ด
            </Link>
          )}
          <h1 className="text-3xl font-bold mt-4">
            {assetId ? `คำสั่งซื้อและประวัติการซื้อขายสำหรับสินทรัพย์ #${assetId}` : 'คำสั่งซื้อและประวัติการซื้อขายของคุณ'}
          </h1>
        </div>
        
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-gray-500 mb-4">เชื่อมต่อกระเป๋าเงินของคุณเพื่อดูคำสั่งซื้อและประวัติการซื้อขาย</p>
            <Button onClick={connectWallet}>เชื่อมต่อกระเป๋าเงิน</Button>
          </div>
        ) : (
          <>
            <Alert className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>ข้อมูลค่าธรรมเนียมการซื้อขาย</AlertTitle>
              <AlertDescription>
                มีการเก็บค่าธรรมเนียม 1% สำหรับทุกการซื้อขาย โดยค่าธรรมเนียมนี้จะถูกหักจากผลตอบแทนของผู้ขาย
              </AlertDescription>
            </Alert>
            
            <Tabs defaultValue="active-orders">
              <TabsList className="mb-6">
                <TabsTrigger value="active-orders">คำสั่งซื้อที่กำลังใช้งาน</TabsTrigger>
                <TabsTrigger value="all-orders">คำสั่งซื้อทั้งหมด</TabsTrigger>
                <TabsTrigger value="trades">ประวัติการซื้อขาย</TabsTrigger>
              </TabsList>
              
              <TabsContent value="active-orders">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      คำสั่งซื้อที่กำลังใช้งาน
                    </CardTitle>
                    <CardDescription>
                      คำสั่งซื้อและขายที่ยังคงใช้งานอยู่ในปัจจุบัน
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {userOrders.filter(order => order.isActive).length > 0 ? (
                      <div className="space-y-4">
                        {userOrders
                          .filter(order => order.isActive)
                          .map(order => (
                            <div key={order.id} className={`p-4 rounded-lg ${order.isBuyOrder ? 'bg-green-50' : 'bg-red-50'}`}>
                              <div className="flex justify-between mb-2">
                                <span className="font-medium">
                                  {order.isBuyOrder ? 'คำสั่งซื้อ' : 'คำสั่งขาย'}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {formatDate(order.timestamp)}
                                </span>
                              </div>
                              <p className="mb-1">
                                <span className="text-gray-600">สินทรัพย์: </span>
                                <Link to={`/asset/${order.assetId}`} className="text-blue-600 hover:underline">
                                  {order.assetName}
                                </Link>
                              </p>
                              <div className="grid grid-cols-2 gap-2 mb-2">
                                <div>
                                  <p className="text-sm text-gray-500">ราคาต่อหุ้น</p>
                                  <p className="font-medium">{formatBalance(order.pricePerShare.toString(), usdtDecimals)} {usdtSymbol}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">จำนวน</p>
                                  <p className="font-medium">
                                    {order.shareAmount.toString()} หุ้น 
                                    ({formatBalance(order.totalPrice.toString(), usdtDecimals)} {usdtSymbol})
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">จำนวนที่จับคู่แล้ว</p>
                                  <p className="font-medium">
                                    {order.filledAmount.toString()} / {order.shareAmount.toString()} หุ้น
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">สถานะ</p>
                                  <p className="font-medium">
                                    {order.filledAmount.eq(0) ? "ยังไม่มีการจับคู่" : 
                                      order.filledAmount.eq(order.shareAmount) ? "จับคู่แล้วทั้งหมด" : "จับคู่แล้วบางส่วน"}
                                  </p>
                                </div>
                                {order.isBuyOrder ? (
                                  <div>
                                    <p className="text-sm text-gray-500">ต้นทุนทั้งหมด</p>
                                    <p className="font-medium">{formatBalance(order.totalPrice.toString(), usdtDecimals)} {usdtSymbol}</p>
                                  </div>
                                ) : (
                                  <div>
                                    <p className="text-sm text-gray-500">รายรับสุทธิ (หลังหักค่าธรรมเนียม 1%)</p>
                                    <p className="font-medium">
                                      {formatBalance(
                                        order.totalPrice.mul(99).div(100).toString(), 
                                        usdtDecimals
                                      )} {usdtSymbol}
                                    </p>
                                  </div>
                                )}
                                <div>
                                  <p className="text-sm text-gray-500">{order.isBuyOrder ? 'จะจ่าย' : 'ค่าธรรมเนียม (1%)'}</p>
                                  <p className="font-medium">
                                    {order.isBuyOrder
                                      ? `${formatBalance(order.pricePerShare.toString(), usdtDecimals)} / หุ้น`
                                      : `${calculateTradingFee(order.totalPrice)} ${usdtSymbol}`
                                    }
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2 mt-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleCancelOrder(order.id)}
                                  disabled={processingIds[`cancel-${order.id}`] !== undefined}
                                  className="flex-1"
                                >
                                  {processingIds[`cancel-${order.id}`] !== undefined ? "กำลังยกเลิก..." : "ยกเลิกคำสั่งซื้อ"}
                                </Button>
                                <Button 
                                  variant="default" 
                                  size="sm"
                                  onClick={() => handleMatchOrder(order.id)}
                                  disabled={processingIds[`match-${order.id}`] !== undefined}
                                  className="flex-1"
                                >
                                  {processingIds[`match-${order.id}`] !== undefined ? "กำลังจับคู่..." : "ลองจับคู่คำสั่งซื้อ"}
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">คุณไม่มีคำสั่งซื้อที่กำลังใช้งานอยู่</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="all-orders">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingBag className="h-5 w-5" />
                      คำสั่งซื้อทั้งหมด
                    </CardTitle>
                    <CardDescription>
                      ประวัติคำสั่งซื้อและขายทั้งหมดของคุณ
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {userOrders.length > 0 ? (
                      <div className="space-y-4">
                        {userOrders.map(order => (
                          <div 
                            key={order.id} 
                            className={`p-4 rounded-lg ${order.isBuyOrder ? 'bg-green-50' : 'bg-red-50'} ${!order.isActive ? 'opacity-70' : ''}`}
                          >
                            <div className="flex justify-between mb-2">
                              <span className="font-medium">
                                {order.isBuyOrder ? 'คำสั่งซื้อ' : 'คำสั่งขาย'}
                                {!order.isActive && order.filledAmount.lt(order.shareAmount) && ' (ยกเลิกแล้ว)'}
                              </span>
                              <span className="text-sm text-gray-500">
                                {formatDate(order.timestamp)}
                              </span>
                            </div>
                            <p className="mb-1">
                              <span className="text-gray-600">สินทรัพย์: </span>
                              <Link to={`/asset/${order.assetId}`} className="text-blue-600 hover:underline">
                                {order.assetName}
                              </Link>
                              <Link to={`/trade/${order.assetId}`} className="ml-2 inline-flex items-center text-blue-600 hover:underline text-xs">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                ซื้อขาย
                              </Link>
                            </p>
                            <div className="grid grid-cols-2 gap-2 mb-2">
                              <div>
                                <p className="text-sm text-gray-500">ราคาต่อหุ้น</p>
                                <p className="font-medium">{formatBalance(order.pricePerShare.toString(), usdtDecimals)} {usdtSymbol}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">จำนวน</p>
                                <p className="font-medium">
                                  {order.shareAmount.toString()} หุ้น 
                                  ({formatBalance(order.totalPrice.toString(), usdtDecimals)} {usdtSymbol})
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">จำนวนที่จับคู่แล้ว</p>
                                <p className="font-medium">
                                  {order.filledAmount.toString()} / {order.shareAmount.toString()} หุ้น
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">สถานะ</p>
                                <p className="font-medium">
                                  {!order.isActive && order.filledAmount.lt(order.shareAmount) ? "ยกเลิกแล้ว" :
                                    order.filledAmount.eq(0) ? "ยังไม่มีการจับคู่" : 
                                    order.filledAmount.eq(order.shareAmount) ? "จับคู่แล้วทั้งหมด" : "จับคู่แล้วบางส่วน"}
                                </p>
                              </div>
                              {!order.isBuyOrder && (
                                <div>
                                  <p className="text-sm text-gray-500">ค่าธรรมเนียม (1%)</p>
                                  <p className="font-medium">
                                    {calculateTradingFee(order.totalPrice)} {usdtSymbol}
                                  </p>
                                </div>
                              )}
                            </div>
                            {order.isActive && order.filledAmount.lt(order.shareAmount) && (
                              <div className="flex gap-2 mt-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleCancelOrder(order.id)}
                                  disabled={processingIds[`cancel-${order.id}`] !== undefined}
                                  className="flex-1"
                                >
                                  {processingIds[`cancel-${order.id}`] !== undefined ? "กำลังยกเลิก..." : "ยกเลิกคำสั่งซื้อ"}
                                </Button>
                                <Button 
                                  variant="default" 
                                  size="sm"
                                  onClick={() => handleMatchOrder(order.id)}
                                  disabled={processingIds[`match-${order.id}`] !== undefined}
                                  className="flex-1"
                                >
                                  {processingIds[`match-${order.id}`] !== undefined ? "กำลังจับคู่..." : "ลองจับคู่คำสั่งซื้อ"}
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">คุณยังไม่มีคำสั่งซื้อ</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="trades">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ReceiptIcon className="h-5 w-5" />
                      ประวัติการซื้อขาย
                    </CardTitle>
                    <CardDescription>
                      ประวัติการซื้อขายที่เสร็จสิ้นแล้ว
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {userTrades.length > 0 ? (
                      <div className="space-y-4">
                        {userTrades.map(trade => {
                          const isBuyer = trade.buyer === account;
                          const tradingFee = isBuyer ? 0 : trade.totalPrice.mul(1).div(100);
                          const netAmount = isBuyer ? trade.totalPrice : trade.totalPrice.sub(tradingFee);
                          
                          return (
                            <div 
                              key={trade.id} 
                              className={`p-4 rounded-lg ${isBuyer ? 'bg-green-50' : 'bg-red-50'}`}
                            >
                              <div className="flex justify-between mb-2">
                                <span className="font-medium">
                                  {isBuyer ? 'การซื้อ' : 'การขาย'}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {formatDate(trade.timestamp)}
                                </span>
                              </div>
                              <p className="mb-1">
                                <span className="text-gray-600">สินทรัพย์: </span>
                                <Link to={`/asset/${trade.assetId}`} className="text-blue-600 hover:underline">
                                  {trade.assetName}
                                </Link>
                                <Link to={`/trade/${trade.assetId}`} className="ml-2 inline-flex items-center text-blue-600 hover:underline text-xs">
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  ซื้อขาย
                                </Link>
                              </p>
                              <div className="grid grid-cols-2 gap-2 mb-2">
                                <div>
                                  <p className="text-sm text-gray-500">ราคาต่อหุ้น</p>
                                  <p className="font-medium">{formatBalance(trade.pricePerShare.toString(), usdtDecimals)} {usdtSymbol}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">จำนวน</p>
                                  <p className="font-medium">
                                    {trade.shareAmount.toString()} หุ้น 
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">มูลค่ารวม</p>
                                  <p className="font-medium">
                                    {formatBalance(trade.totalPrice.toString(), usdtDecimals)} {usdtSymbol}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">{isBuyer ? 'ผู้ขาย' : 'ผู้ซื้อ'}</p>
                                  <p className="font-medium">{shortenAddress(isBuyer ? trade.seller : trade.buyer)}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">{isBuyer ? 'จ่ายไป' : 'ค่าธรรมเนียม (1%)'}</p>
                                  <p className="font-medium">
                                    {isBuyer 
                                      ? `${formatBalance(trade.totalPrice.toString(), usdtDecimals)} ${usdtSymbol}`
                                      : `${formatBalance(tradingFee.toString(), usdtDecimals)} ${usdtSymbol}`
                                    }
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">{isBuyer ? 'บทบาท' : 'รับสุทธิ'}</p>
                                  <p className="font-medium">
                                    {isBuyer 
                                      ? 'ผู้ซื้อ'
                                      : `${formatBalance(netAmount.toString(), usdtDecimals)} ${usdtSymbol}`
                                    }
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">คุณยังไม่มีประวัติการซื้อขาย</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </PageLayout>
  );
};

export default UserOrders;
