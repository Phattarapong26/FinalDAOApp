import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useContract } from "@/contexts/ContractContext";
import { useWeb3 } from "@/contexts/Web3Context";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead as TableHeaderCell, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatBalance, shortenAddress } from "@/lib/utils";
import { ArrowLeft, FileSpreadsheet, AlertCircle, PlusCircle, Coins, Loader2, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import Header from "@/components/layout/Header";
import { Loader } from "lucide-react";
import { Banknote } from "lucide-react";

interface EarningsDisplayData {
  timestamp: string;
  date: string;
  amount: string;
  formattedAmount: string;
}

interface InvestorData {
  address: string;
  shortenedAddress: string;
  amount: ethers.BigNumber;
  formattedAmount: string;
  percentage: string;
}

const AssetInvestors = () => {
  const params = useParams<{ assetId?: string, id?: string }>();
  const paramId = params.assetId || params.id;
  const navigate = useNavigate();
  const { 
    getAssetInvestors, 
    getInvestorAmount, 
    getAssetEarningsHistory,
    getAssetDetails,
    distributeEarnings,
    usdtDecimals,
    usdtSymbol,
    hasPaidFee,
    payFeeWithToken
  } = useContract();
  const { account, isConnected } = useWeb3();

  const [loading, setLoading] = useState(true);
  const [investors, setInvestors] = useState<InvestorData[]>([]);
  const [earnings, setEarnings] = useState<EarningsDisplayData[]>([]);
  const [assetName, setAssetName] = useState<string>("");
  const [totalFundedAmount, setTotalFundedAmount] = useState<ethers.BigNumber>(ethers.BigNumber.from(0));
  const [error, setError] = useState<string>("");
  const [isCreator, setIsCreator] = useState(false);
  const [assetStatus, setAssetStatus] = useState<number>(0);
  const [distributionAmount, setDistributionAmount] = useState<string>("");
  const [isDistributing, setIsDistributing] = useState(false);
const [distributeError, setDistributeError] = useState<string>("");
  
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    
    const fetchData = async () => {
      console.log("URL parameters:", params);
      console.log("paramId:", paramId);
      
      if (paramId === undefined || paramId === null || paramId === "") {
        setError("ไม่พบ Asset ID");
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError("");
      
      try {
        console.log("เริ่มดึงข้อมูล paramId:", paramId);
        
        const assetIdNum = parseInt(paramId);
        console.log("assetId หลังการแปลงเป็นตัวเลข:", assetIdNum);
        
        if (isNaN(assetIdNum)) {
          setError("รหัสสินทรัพย์ไม่ถูกต้อง");
          setLoading(false);
          return;
        }
        
        console.log("กำลังเรียก getAssetDetails ด้วย assetId:", assetIdNum);
        const assetDetails = await getAssetDetails(assetIdNum);
        console.log("ได้รับข้อมูล assetDetails:", assetDetails);
        setAssetName(assetDetails.name);
        
        // เก็บค่า fundedAmount ไว้ในตัวแปรก่อนเพื่อใช้ในการคำนวณต่อ
        const fundedAmount = assetDetails.fundedAmount;
        setTotalFundedAmount(fundedAmount);
        
        // เช็คว่าผู้ใช้ปัจจุบันเป็นเจ้าของทรัพย์สินหรือไม่
        setIsCreator(account && assetDetails.creator && 
                    account.toLowerCase() === assetDetails.creator.toLowerCase());
        
        // เก็บสถานะทรัพย์สิน
        setAssetStatus(assetDetails.status);

        console.log("กำลังเรียก getAssetInvestors ด้วย assetId:", assetIdNum);
        const investorAddresses = await getAssetInvestors(assetIdNum);
        console.log("ได้รับข้อมูลนักลงทุน:", investorAddresses);
        
        if (!investorAddresses || investorAddresses.length === 0) {
          console.log("ไม่พบข้อมูลนักลงทุน");
          setInvestors([]);
        } else {
          console.log("กำลังดึงข้อมูลเงินลงทุนของแต่ละคน");
          const investorsData: InvestorData[] = await Promise.all(
            investorAddresses.map(async (address) => {
              try {
                console.log("ดึงข้อมูลเงินลงทุนสำหรับ address:", address);
                const amount = await getInvestorAmount(assetIdNum, address);
                console.log("จำนวนเงินลงทุน:", amount.toString());
                
                let percentage = "0";
                if (fundedAmount && !fundedAmount.isZero()) {
                  percentage = ((Number(ethers.utils.formatUnits(amount, usdtDecimals || 18)) / 
                              Number(ethers.utils.formatUnits(fundedAmount, usdtDecimals || 18))) * 100).toFixed(2);
                }
                
                return {
                  address,
                  shortenedAddress: shortenAddress(address),
                  amount,
                  formattedAmount: `${formatBalance(amount, usdtDecimals || 18)} ${usdtSymbol || ""}`,
                  percentage: `${percentage}%`
                };
              } catch (err) {
                console.error("เกิดข้อผิดพลาดในการดึงข้อมูลเงินลงทุน:", err);
                return {
                  address,
                  shortenedAddress: shortenAddress(address),
                  amount: ethers.BigNumber.from(0),
                  formattedAmount: "0",
                  percentage: "0%"
                };
              }
            })
          );
          
          console.log("เรียงลำดับข้อมูลนักลงทุน");
          investorsData.sort((a, b) => (a.amount.lt(b.amount) ? 1 : -1));
          console.log("ข้อมูลนักลงทุนที่เรียงแล้ว:", investorsData);
          setInvestors(investorsData);
        }
        
        console.log("กำลังเรียก getAssetEarningsHistory ด้วย assetId:", assetIdNum);
        try {
          const earningsHistory = await getAssetEarningsHistory(assetIdNum);
          console.log("ได้รับข้อมูลประวัติการจ่ายผลตอบแทน:", earningsHistory);
          
          if (!earningsHistory || earningsHistory.length === 0) {
            console.log("ไม่พบข้อมูลประวัติการจ่ายผลตอบแทน");
            setEarnings([]);
          } else {
            const earningsData: EarningsDisplayData[] = earningsHistory.map((earning) => {
              try {
                const timestamp = earning.timestamp.toNumber() || Date.now() / 1000;
                const date = new Date(timestamp * 1000);
                
                return {
                  timestamp: earning.timestamp.toString(),
                  date: date.toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }),
                  amount: earning.amount.toString(),
                  formattedAmount: `${formatBalance(earning.amount, usdtDecimals || 18)} ${usdtSymbol || ""}`
                };
              } catch (err) {
                console.error("เกิดข้อผิดพลาดในการแปลงข้อมูลประวัติการจ่ายผลตอบแทน:", err);
                return {
                  timestamp: "0",
                  date: "ไม่สามารถแสดงวันที่ได้",
                  amount: "0",
                  formattedAmount: `0 ${usdtSymbol || ""}`
                };
              }
            });
            
            setEarnings(earningsData);
          }
        } catch (earningsError) {
          console.error("เกิดข้อผิดพลาดในการดึงข้อมูลประวัติการจ่ายผลตอบแทน:", earningsError);
          setEarnings([]);
        }
        
        fetchedRef.current = true;
        
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการดึงข้อมูล:", error);
        setError("ไม่สามารถดึงข้อมูลได้ โปรดลองอีกครั้ง");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [paramId, getAssetDetails, getAssetInvestors, getInvestorAmount, getAssetEarningsHistory, account]);

  const goBack = () => {
    navigate(`/asset/${paramId}`);
  };

  // เพิ่มฟังก์ชันสำหรับจ่ายผลตอบแทน
  const handleDistributeEarnings = async () => {
    if (!isConnected || !account || !isCreator) {
      toast.error("คุณไม่มีสิทธิ์จ่ายผลตอบแทน");
      return;
    }

    if (!distributionAmount || parseFloat(distributionAmount) <= 0) {
      toast.error("โปรดระบุจำนวนที่ต้องการจ่าย");
      return;
    }

    try {
      setIsDistributing(true);

      // เช็คว่าได้จ่ายค่าธรรมเนียมหรือยัง
      if (!hasPaidFee) {
        await payFeeWithToken();
      }

      // ให้ paramId เป็นตัวเลขแน่ๆ
      const assetIdNum = parseInt(paramId || "0");
           // ส่ง distributionAmount เป็น string ปกติ เช่น "100.50" ไปให้ distributeEarnings
      // ไม่ต้อง parseUnits ในหน้านี้ ให้ ContractContext เป็นคนแปลง
      if (isNaN(Number(distributionAmount)) || Number(distributionAmount) <= 0) {
        toast.error("จำนวนเงินต้องเป็นตัวเลขมากกว่า 0");
        setIsDistributing(false);
        return;
      }
      console.log("จำนวนเงินที่จะจ่าย (string):", distributionAmount);
      await distributeEarnings(assetIdNum, distributionAmount);
      
      // หลังจากจ่ายผลตอบแทนสำเร็จ ล้างค่า input
      setDistributionAmount("");
      
      // รีเฟรชข้อมูล
      fetchedRef.current = false;
      
      // แสดงข้อความสำเร็จ
      toast.success("จ่ายผลตอบแทนสำเร็จ");
      
      // โหลดข้อมูลใหม่
      const assetDetails = await getAssetDetails(assetIdNum);
      setAssetName(assetDetails.name);
      const fundedAmount = assetDetails.fundedAmount;
      setTotalFundedAmount(fundedAmount);
      
      // ดึงประวัติการจ่ายผลตอบแทนใหม่
      const earningsHistory = await getAssetEarningsHistory(assetIdNum);
      if (earningsHistory && earningsHistory.length > 0) {
        const earningsData = earningsHistory.map((earning) => {
          try {
            const timestamp = earning.timestamp.toNumber() || Date.now() / 1000;
            const date = new Date(timestamp * 1000);
            
            return {
              timestamp: earning.timestamp.toString(),
              date: date.toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }),
              amount: earning.amount.toString(),
              formattedAmount: `${formatBalance(earning.amount, usdtDecimals || 18)} ${usdtSymbol || ""}`
            };
          } catch (err) {
            return {
              timestamp: "0",
              date: "ไม่สามารถแสดงวันที่ได้",
              amount: "0",
              formattedAmount: `0 ${usdtSymbol || ""}`
            };
          }
        });
        
        setEarnings(earningsData);
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการจ่ายผลตอบแทน:", error);
      toast.error("เกิดข้อผิดพลาดในการจ่ายผลตอบแทน");
    } finally {
      setIsDistributing(false);
    }
  };

  const investorsColumns = [
    {
      header: "นักลงทุน",
      cell: (row: InvestorData) => (
        <div className="flex flex-col">
          <span className="text-sm">{row.shortenedAddress}</span>
          <span className="text-sm text-muted-foreground">{row.address}</span>
        </div>
      ),
    },
    {
      header: "จำนวนเงินลงทุน",
      cell: (row: InvestorData) => row.formattedAmount,
    },
    {
      header: "สัดส่วน",
      cell: (row: InvestorData) => row.percentage,
    },
  ];

  const earningsColumns = [
    {
      header: "วันที่",
      cell: (row: EarningsDisplayData) => row.date,
    },
    {
      header: "จำนวนเงิน",
      cell: (row: EarningsDisplayData) => row.formattedAmount,
    },
  ];

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <Button variant="outline" size="sm" onClick={goBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> กลับ
        </Button>
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-64 w-full mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Button variant="outline" size="sm" onClick={goBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> กลับ
        </Button>
        
        <Card className="mb-8 border-red-200">
          <CardHeader>
            <div className="flex items-center text-red-500">
              <AlertCircle className="mr-2 h-5 w-5" />
              <CardTitle>เกิดข้อผิดพลาด</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-center py-6">{error}</p>
            <div className="text-center mt-4">
              <p className="text-sm text-muted-foreground">ข้อมูลสำหรับการแก้ไขปัญหา:</p>
              <p className="text-sm text-muted-foreground">รหัสสินทรัพย์: {paramId}</p>
              <p className="text-sm text-muted-foreground">ประเภทข้อมูล: {typeof paramId}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Header/>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)} 
            className="mb-2 flex items-center text-gray-700 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            กลับไปหน้าก่อนหน้า
          </Button>
        </div>

        {loading ? (
          <div className="text-center p-12">
            <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-indigo-500" />
            <p className="text-gray-500">กำลังโหลดข้อมูลนักลงทุน...</p>
          </div>
        ) : error ? (
          <div className="text-center p-12 border border-dashed border-gray-200 rounded-lg">
            <AlertCircle className="h-10 w-10 mx-auto mb-4 text-red-500" />
            <p className="text-gray-700 text-lg font-medium mb-2">เกิดข้อผิดพลาด</p>
            <p className="text-gray-500">{error}</p>
          </div>
        ) : (
          <>
            <h2 className="text-3xl font-bold mb-6">ข้อมูลนักลงทุน - {assetName || "ไม่ระบุชื่อ"}</h2>

            {/* ส่วนสำหรับจ่ายผลตอบแทน - แสดงเฉพาะเจ้าของ Asset ที่จ่ายค่าธรรมเนียมแล้ว และ Asset ปิดการระดมทุนแล้ว */}
            {isCreator && hasPaidFee && assetStatus === 2 && (
              <Card className="mb-8 shadow-sm border border-gray-200">
                <CardHeader className="bg-white border-b border-gray-100">
                  <div className="flex items-center">
                    <Banknote className="mr-2 h-5 w-5 text-indigo-500" />
                    <div>
                      <CardTitle>แจกจ่ายผลตอบแทน</CardTitle>
                      <CardDescription>
                        แจกจ่ายผลตอบแทนให้กับผู้ลงทุนตามสัดส่วนการถือครอง
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-end gap-4">
                    <div className="flex-grow">
                      <Label htmlFor="distribute-amount" className="mb-2 block text-sm font-medium">
                        จำนวนเงิน (THB)
                      </Label>
                      <Input
                        id="distribute-amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={distributionAmount}
                        onChange={(e) => setDistributionAmount(e.target.value)}
                        className="border-gray-300 focus:border-indigo-500"
                        placeholder="ระบุจำนวนเงิน"
                      />
                    </div>
                    <Button 
                      onClick={handleDistributeEarnings} 
                      disabled={parseFloat(distributionAmount) <= 0 || isDistributing} 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white h-10"
                    >
                      {isDistributing ? (
                        <>
                          <Loader className="mr-2 h-4 w-4 animate-spin" />
                          กำลังแจกจ่าย...
                        </>
                      ) : (
                        <>
                          <DollarSign className="mr-2 h-4 w-4" />
                          แจกจ่ายผลตอบแทน
                        </>
                      )}
                    </Button>
                  </div>
                  {distributeError && (
                    <p className="mt-2 text-sm text-red-600">{distributeError}</p>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="mb-8 shadow-sm border-gray-200">
              <CardHeader className="bg-white border-b border-gray-100">
                <div className="flex items-center">
                  <FileSpreadsheet className="mr-2 h-5 w-5 text-indigo-500" />
                  <div>
                    <CardTitle>รายชื่อนักลงทุน ({investors.length})</CardTitle>
                    <CardDescription>
                      ผู้ลงทุนทั้งหมดที่ถือครองสินทรัพย์นี้
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {investors.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {investorsColumns.map((column, i) => (
                          <TableHeaderCell key={i} className="bg-gray-50">{column.header}</TableHeaderCell>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {investors.map((investor, i) => (
                        <TableRow key={i} className="hover:bg-gray-50">
                          {investorsColumns.map((column, j) => (
                            <TableCell key={j}>{column.cell(investor)}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-10 border border-dashed border-gray-200 rounded-lg">
                    <p className="text-gray-500 mb-2">ยังไม่มีนักลงทุนสำหรับสินทรัพย์นี้</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm border-gray-200">
              <CardHeader className="bg-white border-b border-gray-100">
                <div className="flex items-center">
                  <Coins className="mr-2 h-5 w-5 text-indigo-500" />
                  <div>
                    <CardTitle>ประวัติการจ่ายผลตอบแทน ({earnings.length})</CardTitle>
                    <CardDescription>
                      รายการผลตอบแทนที่จ่ายให้ผู้ลงทุนในสินทรัพย์นี้
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {earnings.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {earningsColumns.map((column, i) => (
                          <TableHeaderCell key={i} className="bg-gray-50">{column.header}</TableHeaderCell>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {earnings.map((earning, i) => (
                        <TableRow key={i} className="hover:bg-gray-50">
                          {earningsColumns.map((column, j) => (
                            <TableCell key={j}>{column.cell(earning)}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-10 border border-dashed border-gray-200 rounded-lg">
                    <p className="text-gray-500 mb-2">ยังไม่มีประวัติการจ่ายผลตอบแทนสำหรับสินทรัพย์นี้</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};


export default AssetInvestors;
