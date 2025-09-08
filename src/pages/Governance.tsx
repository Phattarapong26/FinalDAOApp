import React, { useState, useEffect } from "react";
import PageLayout from "@/components/layout/PageLayout";
import ProposalGrid from "@/components/governance/ProposalGrid";
import { useContract } from "@/contexts/ContractContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  FileText, 
  PlusCircle, 
  GalleryVerticalEnd, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Vote, 
  FunctionSquare, 
  ListChecks,
  BarChart3,
  Users,
  BookOpen
} from "lucide-react";
import { Link } from "react-router-dom";
import { formatBalance } from "@/lib/utils";

const Governance: React.FC = () => {
  const { proposals, loadingProposals, refreshProposals, getFunTotalSupply, funDecimals } = useContract();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [totalSupply, setTotalSupply] = useState<string>("0");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    active: 0,
    pending: 0,
    executed: 0,
    total: 0
  });

  useEffect(() => {
    refreshProposals();
    fetchTotalSupply();
    calculateStats();
  }, []);
  
  useEffect(() => {
    calculateStats();
  }, [proposals]);

  const fetchTotalSupply = async () => {
    try {
      setLoading(true);
      const supply = await getFunTotalSupply();
      setTotalSupply(formatBalance(supply, funDecimals));
    } catch (error) {
      console.error("Error fetching total supply:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const now = Math.floor(Date.now() / 1000);
    
    const active = proposals.filter(p => 
      !p.executed && now < p.voteEnd.toNumber()
    ).length;
    
    const pending = proposals.filter(p => 
      !p.executed && now >= p.voteEnd.toNumber()
    ).length;
    
    const executed = proposals.filter(p => 
      p.executed
    ).length;
    
    setStats({
      active,
      pending,
      executed,
      total: proposals.length
    });
  };

  const filteredProposals = proposals.filter(proposal => {
    const matchesSearch = 
      proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const now = Math.floor(Date.now() / 1000);
    const isActive = !proposal.executed && now < proposal.voteEnd.toNumber();
    const isPending = !proposal.executed && now >= proposal.voteEnd.toNumber();
    
    const matchesStatus = 
      statusFilter === "all" || 
      (statusFilter === "active" && isActive) ||
      (statusFilter === "pending" && isPending) ||
      (statusFilter === "executed" && proposal.executed);
    
    return matchesSearch && matchesStatus;
  });

  return (
    <PageLayout>
      <div className="container px-4 py-8 mx-auto bg-white shadow-sm border border-gray-200 rounded-xl  mt-[15px] mb-[20px]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div className="flex items-center">
            <GalleryVerticalEnd className="h-8 w-8 mr-3 text-indigo-600" />
            <div>
              <h1 className="text-3xl font-bold">การบริหาร DAO</h1>
              <p className="text-gray-600 mt-1">
                ร่วมตัดสินใจในการพัฒนาและบริหารแพลตฟอร์ม
              </p>
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={refreshProposals}
              className="border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loadingProposals ? 'animate-spin' : ''}`} />
              รีเฟรช
            </Button>
            <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
              <Link to="/proposals/create" className="flex items-center">
                <PlusCircle className="h-4 w-4 mr-2" />
                สร้างข้อเสนอใหม่
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="shadow-sm border-gray-200 hover:border-indigo-200 hover:shadow-md transition duration-200">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center text-gray-500">
                <BookOpen className="h-4 w-4 mr-1 text-indigo-500" />
                ข้อเสนอทั้งหมด
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border-gray-200 hover:border-indigo-200 hover:shadow-md transition duration-200">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center text-gray-500">
                <Clock className="h-4 w-4 mr-1 text-amber-500" />
                กำลังลงคะแนน
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.active}</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border-gray-200 hover:border-indigo-200 hover:shadow-md transition duration-200">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center text-gray-500">
                <AlertTriangle className="h-4 w-4 mr-1 text-blue-500" />
                รอการดำเนินการ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border-gray-200 hover:border-indigo-200 hover:shadow-md transition duration-200">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center text-gray-500">
                <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
                ดำเนินการแล้ว
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.executed}</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="bg-white border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-indigo-500" />
                    <div>
                      <CardTitle>กรองข้อเสนอ</CardTitle>
                      <CardDescription>
                        ค้นหาและกรองข้อเสนอตามความต้องการของคุณ
                      </CardDescription>
                    </div>
                  </div>
                  {loadingProposals && (
                    <Badge variant="outline" className="bg-gray-50 text-gray-500">
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      กำลังโหลด
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="relative flex-grow">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="ค้นหาข้อเสนอ"
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
                        <SelectValue placeholder="กรองตามสถานะ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">ทุกข้อเสนอ</SelectItem>
                        <SelectItem value="active">กำลังลงคะแนน</SelectItem>
                        <SelectItem value="pending">รอการดำเนินการ</SelectItem>
                        <SelectItem value="executed">ดำเนินการแล้ว</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Tabs defaultValue="grid" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4 bg-gray-100">
                    <TabsTrigger value="grid" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                      <ListChecks className="h-4 w-4 mr-2" />
                      แบบกริด
                    </TabsTrigger>
                    <TabsTrigger value="list" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                      <FunctionSquare className="h-4 w-4 mr-2" />
                      แบบรายการ
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="grid" className="mt-0">
                    <ProposalGrid proposals={filteredProposals} loading={loadingProposals} />
                  </TabsContent>
                  
                  <TabsContent value="list" className="mt-0">
                    {loadingProposals ? (
                      <div className="flex justify-center py-12">
                        <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin" />
                      </div>
                    ) : filteredProposals.length > 0 ? (
                      <div className="space-y-3">
                        {filteredProposals.map((proposal) => {
                          const now = Math.floor(Date.now() / 1000);
                          const isActive = !proposal.executed && now < proposal.voteEnd.toNumber();
                          const isPending = !proposal.executed && now >= proposal.voteEnd.toNumber();
                          
                          return (
                            <Card key={proposal.id} className="overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border-gray-100">
                              <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-100">
                                <div className="flex items-center">
                                  {isActive ? (
                                    <Clock className="h-4 w-4 text-amber-500 mr-2" />
                                  ) : isPending ? (
                                    <AlertTriangle className="h-4 w-4 text-blue-500 mr-2" />
                                  ) : (
                                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                                  )}
                                  <h3 className="font-medium">{proposal.title}</h3>
                                </div>
                                {isActive ? (
                                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                    กำลังลงคะแนน
                                  </Badge>
                                ) : isPending ? (
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    รอการดำเนินการ
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    ดำเนินการแล้ว
                                  </Badge>
                                )}
                              </div>
                              <div className="p-4">
                                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                  {proposal.description}
                                </p>
                                <Button asChild variant="outline" size="sm" className="w-full border-indigo-200 hover:bg-indigo-50">
                                  <Link to={`/proposal/${proposal.id}`} className="flex items-center justify-center">
                                    เรียกดูรายละเอียด
                                  </Link>
                                </Button>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12 border border-dashed border-gray-200 rounded-lg">
                        <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500 mb-4">ไม่พบข้อเสนอที่ตรงกับเงื่อนไขการค้นหา</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6 animate-fadeIn animate-delay-300">
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="bg-white border-b border-gray-100">
                <div className="flex items-center">
                  <Vote className="h-5 w-5 mr-2 text-indigo-500" />
                  <div>
                    <CardTitle>ข้อมูลสรุป</CardTitle>
                    <CardDescription>
                      ภาพรวมของการบริหารแบบ DAO
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5">
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center mb-2">
                      <Users className="h-4 w-4 mr-2 text-indigo-500" />
                      <span className="text-sm font-medium">โทเคนการบริหารทั้งหมด</span>
                    </div>
                    <p className="text-xl font-semibold mb-1">{totalSupply} FUN</p>
                    <p className="text-xs text-gray-500">หนึ่งโทเคน = หนึ่งเสียงในการลงคะแนน</p>
                  </div>
                  
                  <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                    <h3 className="text-sm font-medium text-indigo-700 mb-3 flex items-center">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      อัตราส่วนข้อเสนอตามสถานะ
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs font-medium flex items-center">
                            <Clock className="h-3 w-3 mr-1 text-amber-500" />
                            กำลังลงคะแนน
                          </span>
                          <span className="text-xs font-medium">{stats.active}</span>
                        </div>
                        <Progress value={stats.total > 0 ? (stats.active / stats.total) * 100 : 0} className="h-1.5 bg-gray-200" indicatorClassName="bg-amber-500" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs font-medium flex items-center">
                            <AlertTriangle className="h-3 w-3 mr-1 text-blue-500" />
                            รอการดำเนินการ
                          </span>
                          <span className="text-xs font-medium">{stats.pending}</span>
                        </div>
                        <Progress value={stats.total > 0 ? (stats.pending / stats.total) * 100 : 0} className="h-1.5 bg-gray-200" indicatorClassName="bg-blue-500" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs font-medium flex items-center">
                            <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                            ดำเนินการแล้ว
                          </span>
                          <span className="text-xs font-medium">{stats.executed}</span>
                        </div>
                        <Progress value={stats.total > 0 ? (stats.executed / stats.total) * 100 : 0} className="h-1.5 bg-gray-200" indicatorClassName="bg-green-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="bg-white border-b border-gray-100">
                <div className="flex items-center">
                  <PlusCircle className="h-5 w-5 mr-2 text-indigo-500" />
                  <div>
                    <CardTitle>สร้างข้อเสนอใหม่</CardTitle>
                    <CardDescription>
                      เสนอการเปลี่ยนแปลงหรือการพัฒนาใหม่
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5">
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 mb-4">
                  <p className="text-indigo-700 text-sm">
                    คุณสามารถเสนอการเปลี่ยนแปลงต่างๆ ให้ผู้ถือโทเคนอื่นๆ ลงคะแนนเสียง
                  </p>
                </div>
                <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700">
                  <Link to="/proposals/create" className="flex items-center justify-center">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    สร้างข้อเสนอ
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Governance;
