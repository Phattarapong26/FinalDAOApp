import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import PageLayout from "@/components/layout/PageLayout";
import { useContract } from "@/contexts/ContractContext";
import { useWeb3 } from "@/contexts/Web3Context";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Skeleton 
} from "@/components/ui/skeleton";
import { formatBalance, formatDate, getStatusBadgeColor, getStatusName, calculateProgress, shortenAddress } from "@/lib/utils";
import { 
  CalendarIcon, 
  Users, 
  BarChart3, 
  PieChart, 
  Share2, 
  Clock, 
  MoreHorizontal, 
  AlertTriangle, 
  UserPlus, 
  Building2, 
  ArrowLeft, 
  Coins, 
  ScrollText, 
  FileText, 
  TrendingUp,
  CircleDollarSign,
  BadgePercent,
  CalendarRange,
  CheckCircle,
  XCircle,
  Landmark,
  RefreshCw,
  ChevronLeft,
  Eye,
  CheckCircle2,
  Calendar,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const AssetDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const assetId = parseInt(id || "0");
  
  const { 
    assets, 
    loadingAssets, 
    refreshAssets,
    updateAssetStatus,
    usdtDecimals, 
    usdtSymbol,
    hasPaidFee,
    getAssetInvestors
  } = useContract();
  
  const { isConnected, account } = useWeb3();
  
  const [asset, setAsset] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [investorsCount, setInvestorsCount] = useState<number>(0);
  const [loadingInvestors, setLoadingInvestors] = useState<boolean>(false);
  
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
    refreshAssets();
  }, []);

  const fetchInvestorsCount = async (id: number) => {
    try {
      setLoadingInvestors(true);
      const investors = await getAssetInvestors(id);
      setInvestorsCount(investors.length);
    } catch (error) {
      console.error("Error fetching investors count:", error);
      setInvestorsCount(0);
    } finally {
      setLoadingInvestors(false);
    }
  };

  const handleUpdateStatus = async (status: number) => {
    if (!asset || !hasPaidFee) return;
    
    try {
      setProcessing(true);
      await updateAssetStatus(asset.id, status);
      toast.success(`สถานะสินทรัพย์ถูกอัปเดตเป็น ${getStatusName(status)}`);
      await refreshAssets();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("การอัปเดตสถานะล้มเหลว");
    } finally {
      setProcessing(false);
    }
  };
  
  const isCreatorOrOwner = account && asset && (asset.creator.toLowerCase() === account.toLowerCase());
  const isDeadlinePassed = asset && Math.floor(Date.now() / 1000) > asset.fundingDeadline.toNumber();
  
  if (loadingAssets) {
    return (
      <PageLayout>
        <div className="container px-4 py-8 mx-auto bg-white shadow-sm border border-gray-200 rounded-xl  mt-[15px] mb-[20px]">
          <div className="flex flex-col justify-center items-center min-h-[500px] animate-pulse">
            <Building2 className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-xl">กำลังโหลดรายละเอียดสินทรัพย์...</p>
            <div className="mt-6 w-40">
              <Skeleton className="h-2 w-full rounded bg-gray-200" />
              <Skeleton className="h-2 w-3/4 rounded mt-2 bg-gray-200" />
              <Skeleton className="h-2 w-1/2 rounded mt-2 bg-gray-200" />
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }
  
  if (!asset) {
    return (
      <PageLayout>
        <div className="container px-4 py-8 mx-auto">
          <div className="flex flex-col items-center justify-center min-h-[500px]">
            <Info className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-xl mb-4">ไม่พบสินทรัพย์</p>
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
  
  const progress = calculateProgress(asset.fundedAmount, asset.totalValue);
  const statusClass = getStatusBadgeColor(asset.status);
  const statusName = getStatusName(asset.status);
  
  // แปลคำตามสถานะ
  const getStatusIconAndName = (status: number) => {
    switch (status) {
      case 0: // PENDING
        return {
          icon: <Clock className="h-4 w-4 mr-1" />,
          name: "รอดำเนินการ",
          description: "สินทรัพย์นี้อยู่ระหว่างการตรวจสอบและรอการเปิดระดมทุน"
        };
      case 1: // FUNDING
        return {
          icon: <Building2 className="h-4 w-4 mr-1" />,
          name: "กำลังระดมทุน",
          description: "สินทรัพย์นี้กำลังเปิดให้ระดมทุน ผู้ใช้สามารถลงทุนได้"
        };
      case 2: // CLOSED/ACTIVE
        return {
          icon: <CheckCircle2 className="h-4 w-4 mr-1" />,
          name: "แอคทีฟ",
          description: "การระดมทุนปิดลงแล้ว สามารถซื้อขายสินทรัพย์นี้ในตลาดรองได้"
        };
      case 3: // CANCELED
        return {
          icon: <XCircle className="h-4 w-4 mr-1" />,
          name: "ยกเลิก",
          description: "สินทรัพย์นี้ถูกยกเลิก ไม่สามารถลงทุนหรือซื้อขายได้"
        };
      default:
        return {
          icon: <Info className="h-4 w-4 mr-1" />,
          name: "ไม่ทราบสถานะ",
          description: "ไม่สามารถระบุสถานะของสินทรัพย์นี้ได้"
        };
    }
  };
  
  const statusInfo = getStatusIconAndName(asset.status);
  
  return (
    <PageLayout>
      <div className="container px-4 py-8 mx-auto bg-white shadow-sm border border-gray-200 rounded-xl  mt-[15px] mb-[20px]">
        <div className="mb-6 animate-fadeIn">
          <Link to="/marketplace" className="text-indigo-600 hover:text-indigo-700 transition-colors flex items-center mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" /> กลับไปที่ตลาด
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center">
                <Building2 className="h-8 w-8 mr-3 text-indigo-600" />
                <h1 className="text-3xl font-bold">{asset.name}</h1>
              </div>
              <div className="flex items-center mt-3 space-x-4">
                <div className="flex items-center bg-gray-100 px-3 py-1 rounded-full">
                  <Coins className="h-4 w-4 mr-1.5 text-indigo-500" />
                  <span className="text-sm font-medium">{asset.symbol}</span>
                </div>
                <div className={`px-3 py-1 flex items-center rounded-full ${statusClass}`}>
                  {statusInfo.icon}
                  <span className="text-sm font-medium">{statusInfo.name}</span>
                </div>
              </div>
              <p className="mt-3 text-gray-600 max-w-2xl">{statusInfo.description}</p>
            </div>
            <div className="mt-6 md:mt-0 flex flex-wrap gap-2 md:justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                className="border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                onClick={() => refreshAssets()}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                รีเฟรช
              </Button>
              
              {asset.status === 1 && ( // FUNDING
                <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                  <Link to={`/asset/${asset.id}/invest`} className="flex items-center">
                    <Coins className="h-3.5 w-3.5 mr-1.5" />
                    ลงทุนเลย
                  </Link>
                </Button>
              )}
              {asset.status === 2 && ( // CLOSED
                <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                  <Link to={`/trade/${asset.id}`} className="flex items-center">
                    <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
                    ซื้อขายหุ้น
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline" size="sm">
                <Link to={`/proposals/create/${asset.id}`} className="flex items-center">
                  <ScrollText className="h-3.5 w-3.5 mr-1.5" />
                  สร้างข้อเสนอ
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to={`/asset/investors/${asset.id}`} className="flex items-center">
                  <Users className="h-3.5 w-3.5 mr-1.5" />
                  ดูผู้ลงทุน
                </Link>
              </Button>
              
              {isCreatorOrOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="w-9 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-xs font-medium text-gray-500">ตัวเลือกผู้สร้าง</p>
                    </div>
                    {!hasPaidFee && (
                      <DropdownMenuItem disabled>
                        <Info className="h-4 w-4 mr-2" />
                        ต้องจ่ายค่าธรรมเนียมก่อนอัปเดตสถานะ
                      </DropdownMenuItem>
                    )}
                    {hasPaidFee && asset.status === 0 && ( // PENDING
                      <DropdownMenuItem 
                        onClick={() => handleUpdateStatus(1)}
                        disabled={processing}
                        className="flex items-center cursor-pointer"
                      >
                        <Building2 className="h-4 w-4 mr-2 text-amber-500" />
                        เปลี่ยนเป็นกำลังระดมทุน
                      </DropdownMenuItem>
                    )}
                    {hasPaidFee && asset.status === 1 && ( // FUNDING
                      <>
                        <DropdownMenuItem 
                          onClick={() => handleUpdateStatus(2)}
                          disabled={processing}
                          className="flex items-center cursor-pointer"
                        >
                          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                          ปิดการระดมทุน
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleUpdateStatus(3)}
                          disabled={processing}
                          className="flex items-center cursor-pointer"
                        >
                          <XCircle className="h-4 w-4 mr-2 text-red-500" />
                          ยกเลิกสินทรัพย์
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
        
        {asset.status === 1 && isDeadlinePassed && (
          <Alert variant="destructive" className="mb-6 animate-fadeIn animate-delay-100">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>วันที่สิ้นสุดการระดมทุนผ่านไปแล้ว</AlertTitle>
            <AlertDescription>
              วันที่สิ้นสุดการระดมทุนสำหรับสินทรัพย์นี้ผ่านไปแล้ว แต่ยังอยู่ในสถานะกำลังระดมทุน
              {isCreatorOrOwner && hasPaidFee && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => handleUpdateStatus(2)}
                  disabled={processing}
                >
                  <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                  ปิดการระดมทุน
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6 animate-fadeIn animate-delay-200">
            <Card className="overflow-hidden border-gray-200 shadow-sm">
              <CardHeader className="bg-white border-b border-gray-100">
                <div className="flex items-center">
                  <Eye className="h-5 w-5 mr-2 text-indigo-500" />
                  <div>
                    <CardTitle>ภาพรวมของสินทรัพย์</CardTitle>
                    <CardDescription>
                      ข้อมูลโดยละเอียดเกี่ยวกับโอกาสในการลงทุนนี้
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <h3 className="text-lg font-medium mb-3 flex items-center text-indigo-700">
                      <Building2 className="h-5 w-5 mr-2 text-indigo-500" />
                      ความคืบหน้าการระดมทุน
                    </h3>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600 flex items-center">
                        <Coins className="h-4 w-4 mr-1.5 text-indigo-500" />
                        จำนวนเงินที่ระดมได้
                      </span>
                      <span className="font-medium">
                        {formatBalance(asset.fundedAmount, usdtDecimals)} {usdtSymbol} จาก {formatBalance(asset.totalValue, usdtDecimals)} {usdtSymbol}
                      </span>
                    </div>
                    <Progress value={progress} className="h-3 bg-gray-200" />
                    <div className="flex justify-between text-sm mt-2">
                      <span className="text-indigo-700 font-medium bg-indigo-50 px-2 py-0.5 rounded-full">
                        {progress}% เสร็จสิ้น
                      </span>
                      <span className="text-gray-600">
                        คงเหลือ {formatBalance(asset.totalValue.sub(asset.fundedAmount), usdtDecimals)} {usdtSymbol}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-indigo-100 hover:shadow-sm transition-all duration-200">
                      <div className="flex items-center mb-2">
                        <PieChart className="h-5 w-5 mr-2 text-blue-500" />
                        <span className="text-sm font-medium text-gray-700">จำนวนหุ้นทั้งหมด</span>
                      </div>
                      <p className="text-lg font-medium">{asset.totalShares.toString()}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-indigo-100 hover:shadow-sm transition-all duration-200">
                      <div className="flex items-center mb-2">
                        <BarChart3 className="h-5 w-5 mr-2 text-green-500" />
                        <span className="text-sm font-medium text-gray-700">ราคาต่อหุ้น</span>
                      </div>
                      <p className="text-lg font-medium">{formatBalance(asset.pricePerShare, usdtDecimals)} {usdtSymbol}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-indigo-100 hover:shadow-sm transition-all duration-200">
                      <div className="flex items-center mb-2">
                        <Share2 className="h-5 w-5 mr-2 text-yellow-500" />
                        <span className="text-sm font-medium text-gray-700">หุ้นที่เหลือ</span>
                      </div>
                      <p className="text-lg font-medium">{asset.availableShares.toString()}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-indigo-100 hover:shadow-sm transition-all duration-200">
                      <div className="flex items-center mb-2">
                        <CalendarIcon className="h-5 w-5 mr-2 text-red-500" />
                        <span className="text-sm font-medium text-gray-700">วันสิ้นสุดการระดมทุน</span>
                      </div>
                      <p className="text-lg font-medium">{formatDate(asset.fundingDeadline)}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-indigo-100 hover:shadow-sm transition-all duration-200">
                      <div className="flex items-center mb-2">
                        <Users className="h-5 w-5 mr-2 text-purple-500" />
                        <span className="text-sm font-medium text-gray-700">ผู้สร้าง</span>
                      </div>
                      <p className="text-lg font-medium">{shortenAddress(asset.creator)}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-indigo-100 hover:shadow-sm transition-all duration-200">
                      <div className="flex items-center mb-2">
                        <UserPlus className="h-5 w-5 mr-2 text-teal-500" />
                        <span className="text-sm font-medium text-gray-700">จำนวนผู้ลงทุน</span>
                      </div>
                      <p className="text-lg font-medium">
                        {loadingInvestors ? (
                          <span className="text-xs text-gray-500">กำลังโหลด...</span>
                        ) : (
                          investorsCount
                        )}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-indigo-100 hover:shadow-sm transition-all duration-200">
                      <div className="flex items-center mb-2">
                        <BadgePercent className="h-5 w-5 mr-2 text-pink-500" />
                        <span className="text-sm font-medium text-gray-700">อัตราผลตอบแทนต่อปี</span>
                      </div>
                      <p className="text-lg font-medium">{asset.apy.toString()}%</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2 flex items-center text-indigo-700">
                      <CircleDollarSign className="h-5 w-5 mr-2 text-indigo-500" />
                      ข้อกำหนดการลงทุน
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-indigo-100 hover:shadow-sm transition-all duration-200">
                        <span className="text-sm text-gray-500">การลงทุนขั้นต่ำ</span>
                        <p className="text-lg font-medium">
                          {formatBalance(asset.minInvestment, usdtDecimals)} {usdtSymbol}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-indigo-100 hover:shadow-sm transition-all duration-200">
                        <span className="text-sm text-gray-500">การลงทุนสูงสุด</span>
                        <p className="text-lg font-medium">
                          {formatBalance(asset.maxInvestment, usdtDecimals)} {usdtSymbol}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2 flex items-center text-indigo-700">
                      <FileText className="h-5 w-5 mr-2 text-indigo-500" />
                      ข้อมูลเมตาดาต้า
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 hover:border-indigo-100 hover:shadow-sm transition-all duration-200">
                      <p className="text-sm break-words">{asset.ipfsMetadata}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Manage your investments in this asset
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {!isConnected ? (
                    <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm mb-4">
                      Connect your wallet to invest in this asset and participate in governance.
                    </div>
                  ) : null}
                  
                  <div className="space-y-2">
                    {asset.status === 1 && ( // FUNDING
                      <Button asChild className="w-full">
                        <Link to={`/asset/${asset.id}/invest`} className="flex items-center justify-center">
                          <Coins className="h-4 w-4 mr-2" />
                          ลงทุนในสินทรัพย์นี้
                        </Link>
                      </Button>
                    )}
                    
                    {asset.status === 2 && ( // CLOSED
                      <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700">
                        <Link to={`/trade/${asset.id}`} className="flex items-center justify-center">
                          <TrendingUp className="h-4 w-4 mr-2" />
                          ซื้อขายหุ้นในตลาดรอง
                        </Link>
                      </Button>
                    )}
                    
                    <Button asChild variant="outline" className="w-full">
                      <Link to={`/proposals/create/${asset.id}`} className="flex items-center justify-center">
                        <ScrollText className="h-4 w-4 mr-2" />
                        สร้างข้อเสนอใหม่
                      </Link>
                    </Button>
                    
                    <Button asChild variant="outline" className="w-full">
                      <Link to={`/proposals?assetId=${asset.id}`} className="flex items-center justify-center">
                        <Eye className="h-4 w-4 mr-2" />
                        ดูข้อเสนอทั้งหมด
                      </Link>
                    </Button>
                    
                    <Button 
                      asChild 
                      variant="outline" 
                      className="w-full"
                    >
                      <Link to={`/asset/investors/${asset.id}`} className="flex items-center justify-center">
                        <Users className="h-4 w-4 mr-2" />
                        ดูรายชื่อผู้ลงทุน
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-gray-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-white border-b border-gray-100">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-indigo-500" />
                  <div>
                    <CardTitle>เวลาสำคัญ</CardTitle>
                    <CardDescription>
                      กำหนดการสำคัญของสินทรัพย์
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CalendarRange className="h-5 w-5 text-indigo-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">วันที่สร้าง</p>
                      <p className="text-sm text-gray-500">{formatDate(asset.createdAt)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">วันสิ้นสุดการระดมทุน</p>
                      <p className="text-sm text-gray-500">{formatDate(asset.fundingDeadline)}</p>
                      {isDeadlinePassed && (
                        <Badge variant="outline" className="mt-1 border-amber-200 bg-amber-50 text-amber-700">
                          หมดเวลาแล้ว
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CalendarRange className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">รอบการจ่ายผลตอบแทน</p>
                      <p className="text-sm text-gray-500">ทุก 30 วัน</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default AssetDetail;