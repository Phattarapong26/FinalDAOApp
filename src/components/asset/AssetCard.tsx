import React, { useMemo } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Asset } from "@/contexts/ContractContext";
import { formatBalance, formatDate, getStatusBadgeColor, getStatusName, calculateProgress } from "@/lib/utils";
import { useContract } from "@/contexts/ContractContext";
import { Link } from "react-router-dom";
import { 
  Building2, 
  Coins, 
  DollarSign, 
  Clock, 
  TrendingUp, 
  PieChart, 
  CalendarClock, 
  Eye, 
  Landmark,
  ArrowRight 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// รูปภาพแนวทีมทำงานหรือสำนักงาน
const officeImages = [
  "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1552581234-26160f608093?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1556761175-4b46a572b786?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1622675363311-3e1904dc1885?q=80&w=800&auto=format&fit=crop"
];

interface AssetCardProps {
  asset: Asset;
}

const AssetCard: React.FC<AssetCardProps> = ({ asset }) => {
  const { usdtDecimals, usdtSymbol } = useContract();
  
  // สุ่มเลือกรูปภาพจากอาร์เรย์
  const randomImage = useMemo(() => {
    // ใช้ ID ของ asset เป็นเกณฑ์ในการเลือกรูปภาพเพื่อให้ asset เดียวกันได้รูปเดิมเสมอ
    const index = asset.id % officeImages.length;
    return officeImages[index];
  }, [asset.id]);
  
  const progress = calculateProgress(asset.fundedAmount, asset.totalValue);
  const statusClass = getStatusBadgeColor(asset.status);
  const statusName = getStatusName(asset.status);

  // Function to get status icon
  const getStatusIcon = (status: number) => {
    switch (status) {
      case 0: // PENDING
        return <Clock className="h-4 w-4 mr-1" />;
      case 1: // FUNDING
        return <Building2 className="h-4 w-4 mr-1" />;
      case 2: // CLOSED/ACTIVE
        return <Landmark className="h-4 w-4 mr-1" />;
      case 3: // CANCELED
        return <Coins className="h-4 w-4 mr-1" />;
      default:
        return <Building2 className="h-4 w-4 mr-1" />;
    }
  };
  
  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md border-gray-200 hover:border-indigo-200">
      {/* รูปภาพด้านบนของ Card */}
      <div className="w-full h-48 overflow-hidden">
        <img 
          src={randomImage} 
          alt={asset.name} 
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">{asset.name}</h3>
            <p className="text-sm text-gray-500 flex items-center">
              <Coins className="h-3.5 w-3.5 mr-1 text-indigo-500" />
              {asset.symbol}
            </p>
          </div>
          <div className={`px-2.5 py-1 text-xs font-medium rounded-full flex items-center ${statusClass}`}>
            {getStatusIcon(asset.status)}
            {statusName}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-md p-3">
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-gray-500 flex items-center">
                <Building2 className="h-3.5 w-3.5 mr-1 text-amber-500" />
                การระดมทุน
              </span>
              <span className="font-medium">
                {formatBalance(asset.fundedAmount, usdtDecimals)} {usdtSymbol}
              </span>
            </div>
            <Progress value={progress} className="h-2 bg-gray-200" />
            <div className="flex justify-between text-sm mt-1.5">
              <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">
                {progress}%
              </span>
              <span className="text-xs text-gray-500">
                เป้าหมาย: {formatBalance(asset.totalValue, usdtDecimals)} {usdtSymbol}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 bg-gray-50 rounded-md p-3">
            <div>
              <p className="text-xs text-gray-500 flex items-center">
                <DollarSign className="h-3.5 w-3.5 mr-1 text-green-500" />
                ราคาต่อหุ้น
              </p>
              <p className="text-sm font-medium">
                {formatBalance(asset.pricePerShare, usdtDecimals)} {usdtSymbol}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 flex items-center">
                <TrendingUp className="h-3.5 w-3.5 mr-1 text-indigo-500" />
                APY
              </p>
              <p className="text-sm font-medium text-green-600">{asset.apy.toString()}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 flex items-center">
                <PieChart className="h-3.5 w-3.5 mr-1 text-blue-500" />
                ลงทุนขั้นต่ำ
              </p>
              <p className="text-sm font-medium">
                {formatBalance(asset.minInvestment, usdtDecimals)} {usdtSymbol}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 flex items-center">
                <CalendarClock className="h-3.5 w-3.5 mr-1 text-amber-500" />
                วันที่สิ้นสุด
              </p>
              <p className="text-sm font-medium">{formatDate(asset.fundingDeadline)}</p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <div className="w-full flex space-x-2">
          <Button 
            asChild 
            variant="outline" 
            className="w-full border-indigo-100 hover:bg-indigo-50 hover:text-indigo-700"
          >
            <Link to={`/asset/${asset.id}`} className="flex items-center justify-center">
              <Eye className="h-4 w-4 mr-1.5" />
              ดูรายละเอียด
            </Link>
          </Button>
          {asset.status === 1 && ( // FUNDING
            <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700">
              <Link to={`/asset/${asset.id}/invest`} className="flex items-center justify-center">
                <Coins className="h-4 w-4 mr-1.5" />
                ลงทุน
              </Link>
            </Button>
          )}
          {asset.status === 2 && ( // ACTIVE/CLOSED
            <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700">
              <Link to={`/trade/${asset.id}`} className="flex items-center justify-center">
                <TrendingUp className="h-4 w-4 mr-1.5" />
                เทรด
              </Link>
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default AssetCard;
