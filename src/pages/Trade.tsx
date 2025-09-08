import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import PageLayout from "@/components/layout/PageLayout";
import { useContract } from "@/contexts/ContractContext";
import { useWeb3 } from "@/contexts/Web3Context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Building2,
  RefreshCw,
  LineChart,
  ChevronRight,
  Wallet,
  History,
  BookOpen,
  ArrowRightLeft,
  ChevronLeft,
  ChevronDown,
  ShoppingCart,
  Tag,
  BarChart,
  CreditCard,
  Coins,
  BadgePercent,
  Users
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatBalance } from "@/lib/utils";
import { ethers } from "ethers";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import OrderBook from "@/components/trading/OrderBook";
import TradeHistory from "@/components/trading/TradeHistory";
import CreateOrderForm from "@/components/trading/CreateOrderForm";

const Trade: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const assetId = parseInt(id || "0");
  
  const { 
    assets,
    loadingAssets,
    refreshAssets,
    getMarketPrices,
    usdtDecimals,
    usdtSymbol,
    getAssetInvestors,
    getInvestorAmount,
    canUserTradeAsset
  } = useContract();
  
  const { isConnected, account } = useWeb3();
  
  const [asset, setAsset] = useState<any>(null);
  const [marketPrices, setMarketPrices] = useState<{ highestBid: ethers.BigNumber; lowestAsk: ethers.BigNumber }>({
    highestBid: ethers.BigNumber.from(0),
    lowestAsk: ethers.BigNumber.from(0)
  });
  const [loading, setLoading] = useState(true);
  const [investorsCount, setInvestorsCount] = useState<number>(0);
  const [userShares, setUserShares] = useState<ethers.BigNumber>(ethers.BigNumber.from(0));
  const [canTrade, setCanTrade] = useState<boolean>(false);
  const [refreshingPrices, setRefreshingPrices] = useState<boolean>(false);
  
  useEffect(() => {
    if (!loadingAssets) {
      const foundAsset = assets.find(a => a.id === assetId);
      if (foundAsset) {
        setAsset(foundAsset);
        fetchInvestorsCount(foundAsset.id);
      }
    }
  }, [assetId, assets, loadingAssets]);
  
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        await refreshAssets();
        await fetchMarketPrices();
        if (isConnected && account) {
          await checkUserCanTrade();
          await fetchUserShares();
        }
      } catch (error) {
        console.error("Error initializing trade page:", error);
      } finally {
        setLoading(false);
      }
    };
    
    init();
    
    // Set up refresh interval
    const interval = setInterval(() => {
      fetchMarketPrices();
    }, 30000); // refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [isConnected, account]);

  const fetchMarketPrices = async () => {
    if (!assetId) return;
    
    try {
      setRefreshingPrices(true);
      const prices = await getMarketPrices(assetId);
      setMarketPrices(prices);
    } catch (error) {
      console.error("Error fetching market prices:", error);
    } finally {
      setRefreshingPrices(false);
    }
  };
  
  const fetchInvestorsCount = async (id: number) => {
    try {
      const investors = await getAssetInvestors(id);
      setInvestorsCount(investors.length);
    } catch (error) {
      console.error("Error fetching investors count:", error);
    }
  };
  
  const fetchUserShares = async () => {
    if (!isConnected || !account) return;
    
    try {
      const shares = await getInvestorAmount(assetId);
      setUserShares(shares);
    } catch (error) {
      console.error("Error fetching user shares:", error);
    }
  };
  
  const checkUserCanTrade = async () => {
    if (!isConnected || !account) return;
    
    try {
      const result = await canUserTradeAsset(assetId);
      setCanTrade(result);
    } catch (error) {
      console.error("Error checking trade permission:", error);
      setCanTrade(false);
    }
  };

  if (loadingAssets || loading) {
    return (
      <PageLayout>
        <div className="container px-4 py-8 mx-auto">
          <div className="flex justify-center items-center h-64 animate-pulse">
            <LineChart className="h-16 w-16 text-gray-300 mb-4" />
            <div className="text-center">
              <p className="text-gray-500 text-xl mb-4">กำลังโหลดข้อมูลการเทรด...</p>
              <div className="w-48 mx-auto">
                <Skeleton className="h-2 w-full rounded bg-gray-200" />
                <Skeleton className="h-2 w-3/4 rounded mt-2 bg-gray-200" />
                <Skeleton className="h-2 w-1/2 rounded mt-2 bg-gray-200" />
              </div>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!asset) {
    return (
      <PageLayout>
        <div className="container px-4 py-8 mx-auto animate-fadeIn">
          <div className="flex flex-col items-center justify-center h-64">
            <AlertTriangle className="h-16 w-16 text-amber-500 mb-4" />
            <p className="text-gray-700 text-xl font-medium mb-4">ไม่พบสินทรัพย์</p>
            <p className="text-gray-500 mb-6">ไม่พบสินทรัพย์ที่ระบุในระบบ</p>
            <Button asChild variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
              <Link to="/marketplace" className="flex items-center">
                <ChevronLeft className="h-4 w-4 mr-2" />
                กลับไปที่ตลาด
              </Link>
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (asset.status !== 2) { // Not in CLOSED state
    return (
      <PageLayout>
        <div className="container px-4 py-8 mx-auto animate-fadeIn">
          <Link to={`/asset/${asset.id}`} className="text-indigo-600 hover:text-indigo-700 transition-colors flex items-center mb-6">
            <ChevronLeft className="h-4 w-4 mr-1" />
            กลับไปที่รายละเอียดสินทรัพย์
          </Link>
          
          <div className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-16 w-16 text-amber-500 mb-4" />
            <h2 className="text-2xl font-bold mb-4">สินทรัพย์ไม่พร้อมสำหรับการซื้อขาย</h2>
            <Alert variant="destructive" className="mb-6 max-w-md">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>ไม่สามารถทำการซื้อขายได้</AlertTitle>
              <AlertDescription>
                เฉพาะสินทรัพย์ที่อยู่ในสถานะ "ปิดแล้ว" เท่านั้นที่สามารถซื้อขายในตลาดรองได้
                <div className="mt-2">
                  สถานะปัจจุบัน: <Badge variant="destructive">{["รอดำเนินการ", "ระดมทุน", "ปิดแล้ว", "ยกเลิก"][asset.status]}</Badge>
                </div>
              </AlertDescription>
            </Alert>
            <Button asChild variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
              <Link to={`/asset/${asset.id}`} className="flex items-center">
                <Building2 className="h-4 w-4 mr-2" />
                ดูรายละเอียดสินทรัพย์
              </Link>
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container px-4 py-8 mx-auto bg-white shadow-sm border border-gray-200 rounded-xl  mt-[15px] mb-[20px]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 animate-fadeIn">
          <div>
            <Link to={`/asset/${asset.id}`} className="text-indigo-600 hover:text-indigo-700 transition-colors flex items-center mb-2">
              <ChevronLeft className="h-4 w-4 mr-1" />
              กลับไปที่รายละเอียดสินทรัพย์
            </Link>
            <div className="flex items-center">
              <ArrowRightLeft className="h-8 w-8 mr-3 text-indigo-600" />
              <div>
                <h1 className="text-3xl font-bold flex items-center">
                  {asset.name}
                  <Badge className="ml-2 text-xs bg-green-100 text-green-800 border border-green-200">
                    แอคทีฟ
                  </Badge>
                </h1>
                <p className="text-gray-600 mt-1 flex items-center">
                  <Coins className="h-4 w-4 mr-1.5 text-gray-500" />
                  {asset.symbol} • {investorsCount} ผู้ลงทุน
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchMarketPrices}
              disabled={refreshingPrices}
              className="border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshingPrices ? 'animate-spin' : ''}`} />
              รีเฟรชราคา
            </Button>
            <Button asChild size="sm" variant="outline" className="border-indigo-200 hover:border-indigo-300">
              <Link to={`/user-orders?assetId=${assetId}`} className="flex items-center">
                <ShoppingCart className="h-4 w-4 mr-2" />
                คำสั่งซื้อของฉัน
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Price Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-fadeIn animate-delay-100">
          <Card className="shadow-sm border-gray-200 hover:border-indigo-200 hover:shadow-md transition duration-200">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center text-gray-500">
                <Tag className="h-4 w-4 mr-1 text-indigo-500" />
                ราคาเริ่มต้น
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">{formatBalance(asset.pricePerShare, usdtDecimals)} {usdtSymbol}</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border-gray-200 hover:border-indigo-200 hover:shadow-md transition duration-200 bg-gradient-to-r from-green-50 to-white">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center text-gray-700">
                <TrendingUp className="h-4 w-4 mr-1 text-green-600" />
                ราคาเสนอซื้อที่ดีที่สุด
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-green-700">
                {marketPrices.highestBid.eq(0) ? 
                  "ยังไม่มีคำสั่งซื้อ" : 
                  `${formatBalance(marketPrices.highestBid, usdtDecimals)} ${usdtSymbol}`
                }
              </p>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border-gray-200 hover:border-indigo-200 hover:shadow-md transition duration-200 bg-gradient-to-r from-red-50 to-white">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center text-gray-700">
                <TrendingDown className="h-4 w-4 mr-1 text-red-600" />
                ราคาเสนอขายที่ดีที่สุด
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-red-700">
                {marketPrices.lowestAsk.eq(0) ? 
                  "ยังไม่มีคำสั่งขาย" : 
                  `${formatBalance(marketPrices.lowestAsk, usdtDecimals)} ${usdtSymbol}`
                }
              </p>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border-gray-200 hover:border-indigo-200 hover:shadow-md transition duration-200">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center text-gray-500">
                <BadgePercent className="h-4 w-4 mr-1 text-amber-500" />
                APY
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-amber-600">{asset.apy.toString()}%</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn animate-delay-200">
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-indigo-500" />
                  <div>
                    <CardTitle>ข้อมูลตลาด</CardTitle>
                    <CardDescription>
                      ราคาและประวัติการซื้อขายล่าสุด
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">หุ้นที่มีอยู่</p>
                    <p className="text-lg font-medium">{asset.availableShares.toString()}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">หุ้นทั้งหมด</p>
                    <p className="text-lg font-medium">{asset.totalShares.toString()}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">ส่วนต่างราคา</p>
                    <p className="text-lg font-medium">
                      {marketPrices.highestBid.eq(0) || marketPrices.lowestAsk.eq(0) ? 
                        "ไม่มีข้อมูล" : 
                        `${formatBalance(marketPrices.lowestAsk.sub(marketPrices.highestBid), usdtDecimals)} ${usdtSymbol}`
                      }
                    </p>
                  </div>
                </div>

                {isConnected && (
                  <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-medium text-indigo-800 flex items-center">
                        <Wallet className="h-4 w-4 mr-1.5" />
                        หุ้นที่คุณถือ
                      </h3>
                      <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200">{userShares.toString()} หุ้น</Badge>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-indigo-700">การถือครอง</span>
                        <span className="font-medium text-indigo-800">
                          {asset.totalShares.gt(0) ? 
                            (userShares.mul(100).div(asset.totalShares)).toString() : 
                            '0'
                          }%
                        </span>
                      </div>
                      <Progress 
                        value={asset.totalShares.gt(0) ? 
                          parseFloat(userShares.mul(100).div(asset.totalShares).toString()) : 
                          0
                        } 
                        className="h-1.5 bg-indigo-200" 
                      />
                    </div>
                    <p className="text-xs text-indigo-600 mt-2">
                      มูลค่าประมาณการ: {formatBalance(userShares.mul(asset.pricePerShare), usdtDecimals)} {usdtSymbol}
                    </p>
                  </div>
                )}

                <Tabs defaultValue="order-book" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4 bg-gray-100">
                    <TabsTrigger value="order-book" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                      <BookOpen className="h-4 w-4 mr-2" />
                      สมุดคำสั่งซื้อขาย
                    </TabsTrigger>
                    <TabsTrigger value="trade-history" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                      <History className="h-4 w-4 mr-2" />
                      ประวัติการซื้อขาย
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="order-book" className="mt-0 border-0 p-0">
                    <OrderBook assetId={assetId} />
                  </TabsContent>
                  <TabsContent value="trade-history" className="mt-0 border-0 p-0">
                    <TradeHistory assetId={assetId} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4 animate-fadeIn animate-delay-300">
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center">
                  <BarChart className="h-5 w-5 mr-2 text-indigo-500" />
                  <div>
                    <CardTitle>ทำการซื้อขาย</CardTitle>
                    <CardDescription>
                      สร้างคำสั่งซื้อหรือขายสำหรับสินทรัพย์นี้
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {!isConnected ? (
                  <div className="p-6 text-center bg-blue-50">
                    <Wallet className="h-12 w-12 mx-auto text-blue-500 mb-3" />
                    <h3 className="font-semibold mb-1">เชื่อมต่อกระเป๋าของคุณ</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      คุณต้องเชื่อมต่อกระเป๋าเงินก่อนจึงจะสามารถซื้อขายได้
                    </p>
                  </div>
                ) : !canTrade ? (
                  <div className="p-6 text-center bg-yellow-50">
                    <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-3" />
                    <h3 className="font-semibold mb-1">ไม่สามารถทำการซื้อขายได้</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      คุณอาจจำเป็นต้องซื้อหุ้นก่อนจึงจะสามารถซื้อขายได้
                    </p>
                    <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                      <Link to={`/asset/${asset.id}/invest`}>
                        <Coins className="h-4 w-4 mr-2" />
                        ซื้อหุ้น
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <CreateOrderForm assetId={assetId} />
                )}
              </CardContent>
            </Card>
            
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2 text-indigo-500" />
                  <div>
                    <CardTitle>ตัวเลือกเพิ่มเติม</CardTitle>
                    <CardDescription>
                      ดูคำสั่งซื้อและตัวเลือกเพิ่มเติม
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <Button asChild variant="outline" className="w-full border-indigo-200 hover:bg-indigo-50">
                    <Link to={`/user-orders?assetId=${assetId}`} className="flex items-center justify-between">
                      <span className="flex items-center">
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        คำสั่งซื้อของฉัน
                      </span>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  
                  <Button asChild variant="outline" className="w-full border-indigo-200 hover:bg-indigo-50">
                    <Link to={`/asset/${asset.id}`} className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Building2 className="h-4 w-4 mr-2" />
                        รายละเอียดสินทรัพย์
                      </span>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  
                  <Button asChild variant="outline" className="w-full border-indigo-200 hover:bg-indigo-50">
                    <Link to={`/asset/investors/${asset.id}`} className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        ผู้ลงทุนทั้งหมด
                      </span>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm border-gray-200 p-4 bg-gray-50">
              <div className="text-xs text-gray-500">
                <p className="mb-2">ข้อควรรู้:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>คำสั่งซื้อขายจะถูกจับคู่โดยอัตโนมัติหากราคาตรงกัน</li>
                  <li>คุณสามารถยกเลิกคำสั่งซื้อขายที่ยังไม่ถูกจับคู่ได้</li>
                  <li>หุ้นที่ซื้อขายอาจมีเวลาล็อคก่อนขายต่อได้</li>
                </ul>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Trade;