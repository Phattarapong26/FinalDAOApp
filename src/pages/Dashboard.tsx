import React, { useEffect, useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useContract } from "@/contexts/ContractContext";
import { useWeb3 } from "@/contexts/Web3Context";
import { formatBalance, formatDate, calculateProgress } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import UserBalance from "@/components/dashboard/UserBalance";
import { 
  PlusCircle, 
  ShoppingCart, 
  BarChart2, 
  Wallet, 
  FileText, 
  Activity, 
  TrendingUp, 
  CreditCard, 
  DollarSign, 
  Landmark, 
  Building2, 
  Eye, 
  ArrowRight,
  LayoutDashboard,
  Store,
  Coins,
  ChevronRight,
  Star,
  BarChart,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileBarChart,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard: React.FC = () => {
  const { 
    assets, 
    userAssets, 
    refreshAssets, 
    refreshUserData,
    usdtSymbol, 
    usdtDecimals,
    funSymbol,
    funBalance,
    funDecimals,
    usdtBalance,
    getInvestorAmount,
    loadingAssets
  } = useContract();
  const { isConnected, connectWallet, account } = useWeb3();
  const [investmentSummary, setInvestmentSummary] = useState<{[key: string]: number}>({
    pending: 0,
    funding: 0,
    closed: 0,
    canceled: 0
  });
  const [loadingInvestments, setLoadingInvestments] = useState<boolean>(false);
  const [totalInvested, setTotalInvested] = useState<number>(0);

  // Get user's assets
  const myAssets = assets.filter(asset => userAssets.includes(asset.id));

  useEffect(() => {
    if (isConnected) {
      refreshAssets();
      refreshUserData();
    }
  }, [isConnected]);
  
  useEffect(() => {
    if (isConnected && myAssets.length > 0) {
      calculateInvestmentSummary();
    }
  }, [isConnected, myAssets.length]);

  const calculateInvestmentSummary = async () => {
    if (!isConnected || myAssets.length === 0) return;
    
    setLoadingInvestments(true);
    try {
      let total = 0;
      const summary = {
        pending: 0,
        funding: 0,
        closed: 0,
        canceled: 0
      };
      
      for (const asset of myAssets) {
        const amount = await getInvestorAmount(asset.id);
        const amountInUsd = parseFloat(formatBalance(amount.mul(asset.pricePerShare), usdtDecimals));
        total += amountInUsd;
        
        // Count by status
        switch (asset.status) {
          case 0: summary.pending += amountInUsd; break;
          case 1: summary.funding += amountInUsd; break;
          case 2: summary.closed += amountInUsd; break;
          case 3: summary.canceled += amountInUsd; break;
        }
      }
      
      setTotalInvested(total);
      setInvestmentSummary(summary);
    } catch (error) {
      console.error("Error calculating investment summary:", error);
    } finally {
      setLoadingInvestments(false);
    }
  };

  // Function to get asset status badge
  const getAssetStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">เตรียมการ</Badge>;
      case 1:
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">กำลังระดมทุน</Badge>;
      case 2:
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">แอคทีฟ</Badge>;
      case 3:
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">จบแล้ว</Badge>;
      default:
        return <Badge variant="outline">ไม่ทราบสถานะ</Badge>;
    }
  };
  
  // Function to get status icon
  const getStatusIcon = (status: number) => {
    switch (status) {
      case 0: return <Clock className="h-4 w-4 text-blue-500" />;
      case 1: return <Building2 className="h-4 w-4 text-amber-500" />;
      case 2: return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 3: return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <PageLayout>
      <div className="container px-4 py-8 mx-auto bg-white shadow-sm border border-gray-200 rounded-xl  mt-[15px] mb-[20px] ">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div className="flex items-center">
            <LayoutDashboard className="h-8 w-8 mr-3 text-indigo-600" />
            <div>
              <h1 className="text-3xl font-bold">แดชบอร์ดของคุณ</h1>
              <p className="text-gray-500 text-sm mt-1">
                จัดการการลงทุนและธุรกรรมที่นี่
              </p>
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
            <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
              <Link to="/create-asset">
                <PlusCircle className="h-4 w-4 mr-2" />
                สร้างสินทรัพย์
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
              <Link to="/user-orders">
                <ShoppingCart className="h-4 w-4 mr-2" />
                คำสั่งซื้อของฉัน
              </Link>
            </Button>
          </div>
        </div>
        
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-xl shadow-sm border border-gray-100">
            <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mb-6">
              <Wallet className="h-10 w-10 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold mb-4">เชื่อมต่อกระเป๋าเงินของคุณ</h2>
            <p className="text-gray-500 max-w-md text-center mb-8">
              เชื่อมต่อกระเป๋าเงินของคุณเพื่อดูการลงทุน ยอดคงเหลือ และจัดการสินทรัพย์ของคุณ
            </p>
            <Button onClick={connectWallet} size="lg" className="bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg transition duration-200">
              <Wallet className="h-5 w-5 mr-2" />
              เชื่อมต่อกระเป๋าเงิน
            </Button>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="shadow-sm border-gray-200 hover:border-indigo-200 hover:shadow-md transition duration-200">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center text-gray-500">
                    <DollarSign className="h-4 w-4 mr-1 text-indigo-500" />
                    การลงทุนทั้งหมด
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingInvestments ? (
                    <Skeleton className="h-7 w-24" />
                  ) : (
                    <p className="text-2xl font-bold">
                      {totalInvested.toFixed(2)} {usdtSymbol}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-sm border-gray-200 hover:border-indigo-200 hover:shadow-md transition duration-200">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center text-gray-500">
                    <Building2 className="h-4 w-4 mr-1 text-indigo-500" />
                    สินทรัพย์ที่ลงทุน
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{myAssets.length}</p>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm border-gray-200 hover:border-indigo-200 hover:shadow-md transition duration-200">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center text-gray-500">
                    <TrendingUp className="h-4 w-4 mr-1 text-indigo-500" />
                    สินทรัพย์ที่แอคทีฟ
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {myAssets.filter(a => a.status === 2).length}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm border-gray-200 hover:border-indigo-200 hover:shadow-md transition duration-200">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center text-gray-500">
                    <Coins className="h-4 w-4 mr-1 text-green-500" />
                    เงินที่สามารถถอนได้
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {formatBalance(usdtBalance, usdtDecimals)} {usdtSymbol}
                  </p>
                </CardContent>
              </Card>
            </div>
          
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Investment Overview */}
                <Card className="shadow-sm border-gray-200 overflow-hidden animate-fadeIn animate-delay-100">
                  <CardHeader className="bg-white border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileBarChart className="h-5 w-5 mr-2 text-indigo-500" />
                        <div>
                          <CardTitle>การลงทุนของคุณ</CardTitle>
                          <CardDescription>
                            ภาพรวมการลงทุนในสินทรัพย์ของคุณ
                          </CardDescription>
                        </div>
                      </div>
                      {loadingAssets && (
                        <Badge variant="outline" className="bg-gray-50 text-gray-500">
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                          กำลังโหลด
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-6">
                    {loadingInvestments && !loadingAssets && (
                      <div className="flex justify-center py-8">
                        <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin" />
                      </div>
                    )}
                    
                    {!loadingInvestments && !loadingAssets && myAssets.length > 0 && (
                      <>
                        {/* Investment Distribution */}
                        <div className="mb-6 bg-gray-50 p-5 rounded-lg border border-gray-100">
                          <h3 className="text-lg font-medium mb-4 text-gray-800">การกระจายการลงทุน</h3>
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between mb-1">
                                <div className="flex items-center">
                                  <CheckCircle className="h-4 w-4 mr-1.5 text-green-500" />
                                  <span className="text-sm font-medium">แอคทีฟ</span>
                                </div>
                                <span className="text-sm font-medium">
                                  {investmentSummary.closed.toFixed(2)} {usdtSymbol}
                                </span>
                              </div>
                              <Progress 
                                value={totalInvested > 0 ? (investmentSummary.closed / totalInvested * 100) : 0} 
                                className="h-2 bg-gray-200" 
                                indicatorClassName="bg-green-500"
                              />
                            </div>
                            
                            <div>
                              <div className="flex justify-between mb-1">
                                <div className="flex items-center">
                                  <Building2 className="h-4 w-4 mr-1.5 text-amber-500" />
                                  <span className="text-sm font-medium">กำลังระดมทุน</span>
                                </div>
                                <span className="text-sm font-medium">
                                  {investmentSummary.funding.toFixed(2)} {usdtSymbol}
                                </span>
                              </div>
                              <Progress 
                                value={totalInvested > 0 ? (investmentSummary.funding / totalInvested * 100) : 0} 
                                className="h-2 bg-gray-200" 
                                indicatorClassName="bg-amber-500"
                              />
                            </div>
                            
                            <div>
                              <div className="flex justify-between mb-1">
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1.5 text-blue-500" />
                                  <span className="text-sm font-medium">เตรียมการ</span>
                                </div>
                                <span className="text-sm font-medium">
                                  {investmentSummary.pending.toFixed(2)} {usdtSymbol}
                                </span>
                              </div>
                              <Progress 
                                value={totalInvested > 0 ? (investmentSummary.pending / totalInvested * 100) : 0} 
                                className="h-2 bg-gray-200" 
                                indicatorClassName="bg-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <h3 className="text-lg font-medium mb-4 text-gray-800">รายการสินทรัพย์</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {myAssets.map(asset => (
                            <Card key={asset.id} className="overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border-gray-100">
                              <CardHeader className="p-4 bg-gray-50 border-b border-gray-100">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="flex items-center">
                                      {getStatusIcon(asset.status)}
                                      <h3 className="text-lg font-medium ml-1.5">{asset.name}</h3>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">{asset.symbol}</p>
                                  </div>
                                  {getAssetStatusBadge(asset.status)}
                                </div>
                      </CardHeader>
                              <CardContent className="p-4">
                                <div className="space-y-2">
                                  <p className="text-sm flex justify-between">
                                    <span className="text-gray-500">มูลค่ารวม:</span>
                                    <span className="font-medium">{formatBalance(asset.totalValue, usdtDecimals)} {usdtSymbol}</span>
                                  </p>
                                  <p className="text-sm flex justify-between">
                                    <span className="text-gray-500">ราคาต่อหุ้น:</span>
                                    <span className="font-medium">{formatBalance(asset.pricePerShare, usdtDecimals)} {usdtSymbol}</span>
                                  </p>
                                  {asset.status === 1 && (
                                    <>
                                      <p className="text-sm flex justify-between">
                                        <span className="text-gray-500">ความคืบหน้า:</span>
                                        <span className="font-medium">{calculateProgress(asset.fundedAmount, asset.totalValue)}%</span>
                                      </p>
                                      <p className="text-sm flex justify-between">
                                        <span className="text-gray-500">วันสิ้นสุด:</span>
                                        <span className="font-medium">{formatDate(asset.fundingDeadline)}</span>
                                      </p>
                                    </>
                                  )}
                                </div>
                              </CardContent>
                              <CardFooter className="p-3 bg-gray-50 border-t border-gray-100">
                                <div className="flex space-x-2 w-full">
                                  <Button asChild variant="outline" size="sm" className="flex-1 border-indigo-200 hover:bg-indigo-50">
                                    <Link to={`/asset/${asset.id}`} className="flex items-center justify-center">
                                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                                      รายละเอียด
                                    </Link>
                                  </Button>
                                  {asset.status === 1 && (
                                    <Button asChild variant="outline" size="sm" className="flex-1 border-indigo-200 bg-indigo-50 text-indigo-700">
                                      <Link to={`/asset/${asset.id}/invest`} className="flex items-center justify-center">
                                        <Coins className="h-3.5 w-3.5 mr-1.5" />
                                        ลงทุนเพิ่ม
                                      </Link>
                                    </Button>
                                  )}
                                  {asset.status === 2 && (
                                    <Button asChild variant="outline" size="sm" className="flex-1 border-emerald-200 bg-emerald-50 text-emerald-700">
                                      <Link to={`/trade/${asset.id}`} className="flex items-center justify-center">
                                        <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
                                        เทรด
                                      </Link>
                                    </Button>
                                  )}
                                </div>
                              </CardFooter>
                            </Card>
                          ))}
                        </div>
                      </>
                    )}
                    
                    {!loadingInvestments && !loadingAssets && myAssets.length === 0 && (
                      <div className="text-center py-10 border border-dashed border-gray-200 rounded-lg">
                        <Building2 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">ยังไม่มีการลงทุน</h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">คุณยังไม่มีการลงทุนในสินทรัพย์ใดๆ เริ่มต้นลงทุนเพื่อดูข้อมูลของคุณที่นี่</p>
                        <Button asChild className="bg-indigo-600 hover:bg-indigo-700 shadow-sm">
                          <Link to="/marketplace" className="flex items-center">
                            <Store className="h-4 w-4 mr-2" />
                            เรียกดูตลาด
                          </Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Market Analysis */}
                <Card className="shadow-sm border-gray-200 overflow-hidden animate-fadeIn animate-delay-200">
                  <CardHeader className="bg-white border-b border-gray-100">
                    <div className="flex items-center">
                      <Activity className="h-5 w-5 mr-2 text-indigo-500" />
                      <div>
                        <CardTitle>การดำเนินการล่าสุด</CardTitle>
                        <CardDescription>
                          กิจกรรมและเครื่องมือสำหรับการจัดการการลงทุน
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="shadow-sm hover:shadow-md transition-all duration-200 border-gray-100 overflow-hidden">
                        <CardHeader className="p-4 bg-gray-50 border-b border-gray-100">
                          <CardTitle className="text-base flex items-center">
                            <ShoppingCart className="h-4 w-4 mr-2 text-indigo-500" />
                            คำสั่งซื้อของคุณ
                          </CardTitle>
                          <CardDescription>จัดการคำสั่งซื้อและการเทรดสินทรัพย์</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4">
                          <Button asChild variant="outline" className="w-full border-indigo-200 hover:bg-indigo-50">
                            <Link to="/user-orders" className="flex items-center justify-between">
                              <span className="flex items-center">
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                ดูคำสั่งซื้อทั้งหมด
                              </span>
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </CardContent>
                      </Card>
                      
                      <Card className="shadow-sm hover:shadow-md transition-all duration-200 border-gray-100 overflow-hidden">
                        <CardHeader className="p-4 bg-gray-50 border-b border-gray-100">
                          <CardTitle className="text-base flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-indigo-500" />
                            การบริหาร
                          </CardTitle>
                          <CardDescription>เข้าร่วมการโหวตและสร้างข้อเสนอใหม่</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4">
                          <Button asChild variant="outline" className="w-full border-indigo-200 hover:bg-indigo-50">
                            <Link to="/governance" className="flex items-center justify-between">
                              <span className="flex items-center">
                                <Landmark className="h-4 w-4 mr-2" />
                                ดูการบริหาร
                              </span>
                              <ChevronRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                    
                      <Card className="shadow-sm hover:shadow-md transition-all duration-200 border-gray-100 overflow-hidden md:col-span-2">
                        <CardHeader className="p-4 bg-gray-50 border-b border-gray-100">
                          <CardTitle className="text-base flex items-center">
                            <Star className="h-4 w-4 mr-2 text-amber-500" />
                            สินทรัพย์แนะนำ
                          </CardTitle>
                          <CardDescription>โอกาสในการลงทุนที่น่าสนใจ</CardDescription>
                      </CardHeader>
                        <CardContent className="p-4">
                          <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700">
                            <Link to="/marketplace" className="flex items-center justify-center">
                              <Building2 className="h-4 w-4 mr-2" />
                              ไปที่ตลาดสินทรัพย์
                              <ArrowRight className="h-4 w-4 ml-2" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </div>
            
              <div className="space-y-6 animate-fadeIn animate-delay-300">
              <UserBalance />
              
                <Card className="shadow-sm border-gray-200 overflow-hidden">
                  <CardHeader className="bg-white border-b border-gray-100">
                    <div className="flex items-center">
                      <Wallet className="h-5 w-5 mr-2 text-indigo-500" />
                      <div>
                        <CardTitle>ยอดคงเหลือของคุณ</CardTitle>
                  <CardDescription>
                          ภาพรวมการถือครองโทเคนของคุณ
                  </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5">
                    <Tabs defaultValue="tokens" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="tokens" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                          <CreditCard className="h-4 w-4 mr-2" />
                          โทเคน
                        </TabsTrigger>
                        <TabsTrigger value="statistics" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                          <BarChart className="h-4 w-4 mr-2" />
                          สถิติ
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="tokens" className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                              <DollarSign className="h-4 w-4 text-indigo-600" />
                            </div>
                            <div>
                              <p className="font-medium">{usdtSymbol}</p>
                              <p className="text-xs text-gray-500">USDT Token</p>
                            </div>
                          </div>
                          <p className="font-semibold">{formatBalance(usdtBalance, usdtDecimals)}</p>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center mr-3">
                              <Coins className="h-4 w-4 text-amber-600" />
                            </div>
                            <div>
                              <p className="font-medium">{funSymbol}</p>
                              <p className="text-xs text-gray-500">DAO Governance Token</p>
                            </div>
                          </div>
                          <p className="font-semibold">{formatBalance(funBalance, funDecimals)}</p>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="statistics">
                        <div className="space-y-4 pt-2">
                          <div className="flex justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                            <span className="text-gray-600">สินทรัพย์ทั้งหมด:</span>
                            <span className="font-medium">{myAssets.length}</span>
                          </div>
                          <div className="flex justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                            <span className="text-gray-600">มูลค่าการลงทุน:</span>
                            <span className="font-medium">{totalInvested.toFixed(2)} {usdtSymbol}</span>
                          </div>
                          <div className="flex justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                            <span className="text-gray-600">สินทรัพย์ที่กำลังระดมทุน:</span>
                            <span className="font-medium">{myAssets.filter(a => a.status === 1).length}</span>
                          </div>
                          <div className="flex justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                            <span className="text-gray-600">สินทรัพย์ที่แอคทีฟ:</span>
                            <span className="font-medium">{myAssets.filter(a => a.status === 2).length}</span>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
                
                <Card className="shadow-sm border-gray-200 overflow-hidden">
                  <CardHeader className="bg-white border-b border-gray-100">
                    <div className="flex items-center">
                      <Building2 className="h-5 w-5 mr-2 text-indigo-500" />
                      <div>
                        <CardTitle>สร้างสินทรัพย์ใหม่</CardTitle>
                        <CardDescription>
                          เพิ่มสินทรัพย์ใหม่เข้าสู่แพลตฟอร์ม
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5">
                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 mb-4">
                      <p className="text-indigo-700 text-sm">
                        สร้างสินทรัพย์ใหม่เพื่อระดมทุนและให้ผู้ลงทุนได้ร่วมเป็นเจ้าของ
                      </p>
                    </div>
                    <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700">
                      <Link to="/create-asset" className="flex items-center justify-center">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        สร้างสินทรัพย์ใหม่
                      </Link>
                    </Button>
                </CardContent>
              </Card>
            </div>
          </div>
          </>
        )}
      </div>
    </PageLayout>
  );
};

export default Dashboard;
