
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import PageLayout from "@/components/layout/PageLayout";
import { useContract } from "@/contexts/ContractContext";
import { useWeb3 } from "@/contexts/Web3Context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Info, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatBalance, getStatusName, calculateProgress } from "@/lib/utils";
import { ethers } from "ethers";
import { toast } from "sonner";

const InvestAsset: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const assetId = parseInt(id || "0");
  
  const { 
    assets, 
    loadingAssets, 
    refreshAssets,
    purchaseShares,
    usdtBalance,
    usdtDecimals, 
    usdtSymbol,
    usdtAllowance,
    approveUSDT
  } = useContract();
  
  const { isConnected, connectWallet } = useWeb3();
  
  const [asset, setAsset] = useState<any>(null);
  const [investAmount, setInvestAmount] = useState("");
  const [estimatedShares, setEstimatedShares] = useState("0");
  const [processing, setProcessing] = useState(false);
  
  useEffect(() => {
    if (!loadingAssets) {
      const foundAsset = assets.find(a => a.id === assetId);
      if (foundAsset) {
        setAsset(foundAsset);
      }
    }
  }, [assetId, assets, loadingAssets]);
  
  useEffect(() => {
    refreshAssets();
  }, []);
  
  useEffect(() => {
    if (asset && investAmount) {
      try {
        const amountBN = ethers.utils.parseUnits(investAmount, usdtDecimals);
        const sharesBN = amountBN.div(asset.pricePerShare);
        setEstimatedShares(sharesBN.toString());
      } catch (error) {
        setEstimatedShares("0");
      }
    } else {
      setEstimatedShares("0");
    }
  }, [asset, investAmount, usdtDecimals]);
  
  const handleInvest = async () => {
    if (!asset || !isConnected) return;
    
    try {
      const amountBN = ethers.utils.parseUnits(investAmount, usdtDecimals);
      
      // Check if amount is within limits
      if (asset.minInvestment.gt(0) && amountBN.lt(asset.minInvestment)) {
        toast.error(`Minimum investment is ${formatBalance(asset.minInvestment, usdtDecimals)} ${usdtSymbol}`);
        return;
      }
      
      if (asset.maxInvestment.gt(0) && amountBN.gt(asset.maxInvestment)) {
        toast.error(`Maximum investment is ${formatBalance(asset.maxInvestment, usdtDecimals)} ${usdtSymbol}`);
        return;
      }
      
      // Check if user has enough USDT
      if (amountBN.gt(usdtBalance)) {
        toast.error(`Insufficient ${usdtSymbol} balance`);
        return;
      }
      
      setProcessing(true);
      
      // Check if approval is needed
      if (usdtAllowance.lt(amountBN)) {
        await approveUSDT("max");
      }
      
      // Purchase shares
      await purchaseShares(assetId, investAmount);
      
      toast.success("Investment successful!");
      navigate(`/asset/${assetId}`);
    } catch (error) {
      console.error("Investment error:", error);
      toast.error("Investment failed");
    } finally {
      setProcessing(false);
    }
  };
  
  if (loadingAssets) {
    return (
      <PageLayout>
        <div className="container px-4 py-8 mx-auto">
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Loading asset details...</p>
          </div>
        </div>
      </PageLayout>
    );
  }
  
  if (!asset) {
    return (
      <PageLayout>
        <div className="container px-4 py-8 mx-auto">
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-gray-500 mb-4">Asset not found</p>
            <Button asChild variant="outline">
              <Link to="/marketplace">Back to Marketplace</Link>
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }
  
  if (asset.status !== 1) { // Not in FUNDING state
    return (
      <PageLayout>
        <div className="container px-4 py-8 mx-auto">
          <div className="flex flex-col items-center justify-center h-64">
            <Alert variant="destructive" className="mb-4 max-w-md">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Asset not available for investment</AlertTitle>
              <AlertDescription>
                This asset is currently in {getStatusName(asset.status)} status and is not open for investment.
              </AlertDescription>
            </Alert>
            <Button asChild variant="outline">
              <Link to={`/asset/${asset.id}`}>Back to Asset Details</Link>
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }
  
  return (
    <PageLayout>
      <div className="container px-4 py-8 mx-auto bg-white shadow-sm border border-gray-200 rounded-xl  mt-[15px] mb-[20px]">
        <Link to={`/asset/${asset.id}`} className="inline-flex items-center text-blue-600 hover:underline mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Asset Details
        </Link>
        
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Invest in {asset.name}</CardTitle>
              <CardDescription>
                Purchase shares in this asset using {usdtSymbol}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {!isConnected ? (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Connect your wallet</AlertTitle>
                    <AlertDescription>
                      You need to connect your wallet to invest in this asset.
                      <Button onClick={connectWallet} variant="outline" className="mt-2">
                        Connect Wallet
                      </Button>
                    </AlertDescription>
                  </Alert>
                ) : null}
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Asset Information</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded">
                      <span className="text-xs text-gray-500">Price per Share</span>
                      <p className="font-medium">{formatBalance(asset.pricePerShare, usdtDecimals)} {usdtSymbol}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                      <span className="text-xs text-gray-500">Available Shares</span>
                      <p className="font-medium">{asset.availableShares.toString()}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                      <span className="text-xs text-gray-500">Minimum Investment</span>
                      <p className="font-medium">{formatBalance(asset.minInvestment, usdtDecimals)} {usdtSymbol}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                      <span className="text-xs text-gray-500">Maximum Investment</span>
                      <p className="font-medium">
                        {asset.maxInvestment.toString() === "0" 
                          ? "No limit" 
                          : `${formatBalance(asset.maxInvestment, usdtDecimals)} ${usdtSymbol}`}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Investment Amount ({usdtSymbol})</label>
                  <Input
                    type="number"
                    placeholder={`Enter amount in ${usdtSymbol}`}
                    value={investAmount}
                    onChange={(e) => setInvestAmount(e.target.value)}
                    disabled={!isConnected || processing}
                  />
                  <p className="text-xs text-gray-500">
                    Available balance: {formatBalance(usdtBalance, usdtDecimals)} {usdtSymbol}
                  </p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-800">Estimated Shares</span>
                    <span className="font-medium text-blue-800">{estimatedShares}</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleInvest} 
                disabled={!isConnected || !investAmount || processing}
                className="w-full"
              >
                {processing ? "Processing..." : "Confirm Investment"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default InvestAsset;
