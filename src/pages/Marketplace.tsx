import React, { useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import AssetGrid from "@/components/asset/AssetGrid";
import { useContract } from "@/contexts/ContractContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AssetStatus } from "@/contexts/ContractContext";
import { 
  Search, 
  Store, 
  Filter, 
  RefreshCw, 
  Building2, 
  Clock, 
  CheckCircle2, 
  XCircle 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Marketplace: React.FC = () => {
  const { assets, loadingAssets, refreshAssets } = useContract();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = 
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.symbol.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === "all" || 
      parseInt(statusFilter) === asset.status;
    
    return matchesSearch && matchesStatus;
  });

  // Get asset counts by status
  const pendingCount = assets.filter(a => a.status === AssetStatus.PENDING).length;
  const fundingCount = assets.filter(a => a.status === AssetStatus.FUNDING).length;
  const closedCount = assets.filter(a => a.status === AssetStatus.CLOSED).length;
  const canceledCount = assets.filter(a => a.status === AssetStatus.CANCELED).length;

  return (
    <PageLayout>
      <div className="container px-8 py-8 mx-auto bg-white shadow-sm border border-gray-200 rounded-xl  mt-[15px] mb-[20px]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <div className="flex items-center mb-2">
              <Store className="h-8 w-8 mr-3 text-indigo-600" />
              <h1 className="text-3xl font-bold">ตลาดสินทรัพย์</h1>
            </div>
            <p className="text-gray-600">
              เรียกดูตัวเลือกสินทรัพย์แบบ fractional ที่หลากหลายของเรา
            </p>
          </div>

          <div className="mt-4 md:mt-0">
            <Button 
              variant="outline" 
              size="sm"
              className="border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
              onClick={() => refreshAssets()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              รีเฟรช
            </Button>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm mb-8 border border-gray-100">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="ค้นหาตามชื่อหรือสัญลักษณ์"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-indigo-100 focus-visible:ring-indigo-500"
                />
              </div>
              <div className="w-full md:w-64">
                <Select 
                  value={statusFilter} 
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="border-indigo-100 focus-visible:ring-indigo-500">
                    <div className="flex items-center">
                      <Filter className="h-4 w-4 mr-2 text-indigo-500" />
                      <SelectValue placeholder="กรองตามสถานะ" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="flex items-center">
                      ทุกสถานะ <Badge className="ml-2 bg-gray-100 text-gray-700">{assets.length}</Badge>
                    </SelectItem>
                    <SelectItem value={AssetStatus.PENDING.toString()}>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-blue-500" />
                        รอดำเนินการ
                        <Badge className="ml-2 bg-blue-100 text-blue-700">{pendingCount}</Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value={AssetStatus.FUNDING.toString()}>
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 mr-2 text-amber-500" />
                        กำลังระดมทุน
                        <Badge className="ml-2 bg-amber-100 text-amber-700">{fundingCount}</Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value={AssetStatus.CLOSED.toString()}>
                      <div className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                        ปิดแล้ว
                        <Badge className="ml-2 bg-green-100 text-green-700">{closedCount}</Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value={AssetStatus.CANCELED.toString()}>
                      <div className="flex items-center">
                        <XCircle className="h-4 w-4 mr-2 text-red-500" />
                        ยกเลิกแล้ว
                        <Badge className="ml-2 bg-red-100 text-red-700">{canceledCount}</Badge>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="hidden md:block">
              <Tabs defaultValue="all" onValueChange={(value) => setStatusFilter(value)}>
                <TabsList className="w-full justify-start bg-gray-50 p-1">
                  <TabsTrigger 
                    value="all" 
                    className="data-[state=active]:bg-white"
                  >
                    ทั้งหมด
                    <Badge className="ml-2 bg-gray-100 text-gray-700">{assets.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger 
                    value={AssetStatus.FUNDING.toString()}
                    className="data-[state=active]:bg-white"
                  >
                    <Building2 className="h-4 w-4 mr-1 text-amber-500" />
                    กำลังระดมทุน
                    <Badge className="ml-2 bg-amber-100 text-amber-700">{fundingCount}</Badge>
                  </TabsTrigger>
                  <TabsTrigger 
                    value={AssetStatus.PENDING.toString()}
                    className="data-[state=active]:bg-white"
                  >
                    <Clock className="h-4 w-4 mr-1 text-blue-500" />
                    รอดำเนินการ
                    <Badge className="ml-2 bg-blue-100 text-blue-700">{pendingCount}</Badge>
                  </TabsTrigger>
                  <TabsTrigger 
                    value={AssetStatus.CLOSED.toString()}
                    className="data-[state=active]:bg-white"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
                    ปิดแล้ว
                    <Badge className="ml-2 bg-green-100 text-green-700">{closedCount}</Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>
        
        <AssetGrid assets={filteredAssets} loading={loadingAssets} />
      </div>
    </PageLayout>
  );
};

export default Marketplace;
