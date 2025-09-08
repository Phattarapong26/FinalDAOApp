import React from "react";
import AssetCard from "./AssetCard";
import { Asset } from "@/contexts/ContractContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Search, Package } from "lucide-react";

interface AssetGridProps {
  assets: Asset[];
  loading: boolean;
}

const AssetGrid: React.FC<AssetGridProps> = ({ assets, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div 
            key={index} 
            className="rounded-lg overflow-hidden border border-gray-200 shadow-sm animate-pulse"
            style={{ 
              animationDelay: `${index * 150}ms`,
              animationDuration: '2s'
            }}
          >
            <div className="p-4 border-b border-gray-100 flex justify-between items-start">
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <div className="p-6">
              <div className="space-y-5">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-2 w-full" />
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-10" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                </div>
              </div>
            </div>
            <div className="px-4 py-3 border-t border-gray-100">
              <div className="flex gap-2">
                <Skeleton className="h-9 w-full rounded" />
                <Skeleton className="h-9 w-full rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-lg border border-dashed border-gray-200">
        <Search className="h-12 w-12 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold mb-2">ไม่พบสินทรัพย์</h2>
        <p className="text-gray-500 max-w-md text-center mb-3">
          ไม่พบสินทรัพย์ที่ตรงกับการค้นหาของคุณ ลองเปลี่ยนฟิลเตอร์หรือค้นหาคำที่แตกต่างกัน
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {assets.map((asset, index) => (
        <div 
          key={asset.id}
          className="animate-fadeIn"
          style={{ 
            animationDelay: `${index * 100}ms`,
            animationDuration: '400ms'
          }}
        >
          <AssetCard asset={asset} />
        </div>
      ))}
    </div>
  );
};

export default AssetGrid;

/* 
 * Add this to your global.css or tailwind.config.js
 * @keyframes fadeIn {
 *   from { opacity: 0; transform: translateY(10px); }
 *   to { opacity: 1; transform: translateY(0); }
 * }
 * .animate-fadeIn {
 *   animation: fadeIn 0.4s ease-out forwards;
 * }
 */
