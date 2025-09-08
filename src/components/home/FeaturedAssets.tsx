import React from "react";
import { Button } from "@/components/ui/button";
import AssetGrid from "@/components/asset/AssetGrid";
import { useContract } from "@/contexts/ContractContext";
import { Link } from "react-router-dom";
import { 
  Building2, 
  Gem, 
  Star, 
  TrendingUp, 
  ArrowRight, 
  RefreshCw, 
  Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const FeaturedAssets: React.FC = () => {
  const { assets, loadingAssets, refreshAssets } = useContract();
  
  // Filter to display only the first 3 assets in FUNDING state
  const fundingAssets = assets
    .filter(asset => asset.status === 1) // FUNDING
    .slice(0, 3);

  return (
    <section className="py-24 bg-gray-50 relative">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-white to-transparent"></div>
      </div>
      
      <div className="container px-4 mx-auto relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12">
          <div className="animate-fadeIn">
            <div className="inline-flex items-center px-3 py-1 mb-6 text-xs font-medium text-amber-600 bg-amber-100 rounded-full">
              <Star className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
              สินทรัพย์ที่แนะนำ
              <Sparkles className="h-3.5 w-3.5 ml-1.5 text-amber-500" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">โอกาสในการลงทุนที่โดดเด่น</h2>
            <p className="text-gray-600">
              ค้นพบสินทรัพย์พรีเมียมที่เปิดให้ลงทุนในปัจจุบัน
            </p>
          </div>
          <div className="mt-6 md:mt-0 flex space-x-3 animate-fadeIn animate-delay-200">
            <Button 
              onClick={() => refreshAssets()} 
              variant="outline" 
              size="sm" 
              className="border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              รีเฟรช
            </Button>
            <Button asChild variant="outline" className="border-indigo-200 hover:border-indigo-300">
              <Link to="/marketplace" className="flex items-center">
                <Building2 className="h-4 w-4 mr-2" />
                ดูสินทรัพย์ทั้งหมด
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
        
        {fundingAssets.length > 0 ? (
          <AssetGrid assets={fundingAssets} loading={loadingAssets} />
        ) : (
          <div className="bg-white rounded-lg border border-dashed border-gray-200 p-12 text-center animate-fadeIn shadow-sm">
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
              <Gem className="h-8 w-8 text-amber-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">กำลังเตรียมสินทรัพย์ใหม่</h3>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              ขณะนี้เรากำลังทำการคัดสรรสินทรัพย์พรีเมียมคุณภาพสูงสำหรับการลงทุนครั้งต่อไปของคุณ
            </p>
            <Button asChild variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
              <Link to="/marketplace">
                ไปที่ตลาดสินทรัพย์
              </Link>
            </Button>
          </div>
        )}
        
        <div className="mt-16 flex flex-col md:flex-row items-center justify-between bg-indigo-100 rounded-xl p-8 shadow-sm animate-fadeIn">
          <div className="md:max-w-xl mb-6 md:mb-0 md:mr-8">
            <Badge className="mb-2 bg-indigo-200 text-indigo-700 hover:bg-indigo-300">เริ่มต้นวันนี้</Badge>
            <h3 className="text-2xl font-bold text-indigo-900 mb-3">เริ่มต้นลงทุนในสินทรัพย์คุณภาพสูง</h3>
            <p className="text-indigo-700">
              เปิดประตูสู่โอกาสการลงทุนในสินทรัพย์คุณภาพระดับพรีเมียม จากอสังหาริมทรัพย์ไปจนถึงงานศิลปะและอื่นๆ
            </p>
          </div>
          <Button asChild size="lg" className="px-8 bg-indigo-600 hover:bg-indigo-700 shadow-md">
            <Link to="/connect" className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              เริ่มต้นลงทุน
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedAssets;
