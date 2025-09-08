
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/layout/PageLayout";
import { useContract } from "@/contexts/ContractContext";
import { useWeb3 } from "@/contexts/Web3Context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, AlertTriangle, Check } from "lucide-react";
import { toast } from "sonner";

const CreateAsset: React.FC = () => {
  const navigate = useNavigate();
  const { isConnected, connectWallet } = useWeb3();
  const { 
    createAsset, 
    usdtDecimals, 
    usdtSymbol, 
    funBalance, 
    funSymbol,
    funDecimals,
    hasPaidFee,
    payFeeWithToken
  } = useContract();

  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    ipfsMetadata: "",
    totalShares: "",
    pricePerShare: "",
    minInvestment: "",
    maxInvestment: "",
    totalValue: "",
    apy: "",
    fundingDays: "30"
  });
  const [processing, setProcessing] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePayFee = async () => {
    if (hasPaidFee) {
      toast.info("Fee has already been paid");
      return;
    }
    
    try {
      await payFeeWithToken();
    } catch (error) {
      console.error("Error paying fee:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      toast.error("Please connect your wallet");
      return;
    }
    
    // Validate form
    if (!formData.name || !formData.symbol || !formData.totalShares || !formData.pricePerShare) {
      toast.error("Please fill all required fields");
      return;
    }
    
    if (!hasPaidFee) {
      toast.error("You need to pay the governance fee first");
      return;
    }
    
    try {
      setProcessing(true);
      
      // Calculate funding deadline (current time + days)
      const fundingDeadline = Math.floor(Date.now() / 1000) + (parseInt(formData.fundingDays) * 86400);
      
      // Calculate total value if not provided
      const totalValue = formData.totalValue || 
        (parseFloat(formData.totalShares) * parseFloat(formData.pricePerShare)).toString();
      
      await createAsset(
        formData.name,
        formData.symbol,
        formData.ipfsMetadata,
        formData.totalShares,
        formData.pricePerShare,
        formData.minInvestment || "0",
        formData.maxInvestment || "0",
        totalValue,
        formData.apy || "0",
        fundingDeadline
      );
      
      toast.success("Asset created successfully");
      navigate("/marketplace");
    } catch (error) {
      console.error("Error creating asset:", error);
      toast.error("Failed to create asset");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <PageLayout>
      <div className="container px-4 py-8 mx-auto bg-white shadow-sm border border-gray-200 rounded-xl  mt-[15px] mb-[20px]">
        <h1 className="text-3xl font-bold mb-6">Create New Asset</h1>
        
        <div className="max-w-3xl mx-auto">
          {!isConnected ? (
            <Alert className="mb-6">
              <Info className="h-4 w-4" />
              <AlertTitle>Wallet not connected</AlertTitle>
              <AlertDescription>
                You need to connect your wallet to create an asset.
                <Button onClick={connectWallet} className="mt-2">
                  Connect Wallet
                </Button>
              </AlertDescription>
            </Alert>
          ) : funBalance.isZero() ? (
            <Alert className="mb-6" variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Insufficient FUN tokens</AlertTitle>
              <AlertDescription>
                Creating an asset requires 10 {funSymbol} tokens. You currently have {funBalance.gt(0) ? parseFloat(funBalance.toString()) / Math.pow(10, funDecimals) : 0} {funSymbol}.
              </AlertDescription>
            </Alert>
          ) : !hasPaidFee ? (
            <Alert className="mb-6 bg-amber-50 border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-700">Governance Fee Required</AlertTitle>
              <AlertDescription className="text-amber-600">
                You need to pay a one-time governance fee of 10 {funSymbol} to create assets.
                <Button 
                  onClick={handlePayFee} 
                  variant="outline" 
                  className="mt-2 border-amber-300 bg-amber-100 hover:bg-amber-200 text-amber-800"
                >
                  Pay Governance Fee
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-700">Governance Fee Paid</AlertTitle>
              <AlertDescription className="text-green-600">
                You have paid the governance fee and can now create assets.
              </AlertDescription>
            </Alert>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>Asset Details</CardTitle>
              <CardDescription>
                Create a new asset for fractional ownership
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Name *</label>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Luxury Apartment #123"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Symbol *</label>
                    <Input
                      name="symbol"
                      value={formData.symbol}
                      onChange={handleChange}
                      placeholder="e.g. APT123"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Metadata/Description</label>
                  <Textarea
                    name="ipfsMetadata"
                    value={formData.ipfsMetadata}
                    onChange={handleChange}
                    placeholder="Description or IPFS metadata for the asset"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Total Shares *</label>
                    <Input
                      name="totalShares"
                      type="number"
                      value={formData.totalShares}
                      onChange={handleChange}
                      placeholder="Total number of shares"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Price Per Share ({usdtSymbol}) *</label>
                    <Input
                      name="pricePerShare"
                      type="number"
                      step="0.000001"
                      value={formData.pricePerShare}
                      onChange={handleChange}
                      placeholder={`Price in ${usdtSymbol}`}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Minimum Investment ({usdtSymbol})</label>
                    <Input
                      name="minInvestment"
                      type="number"
                      step="0.000001"
                      value={formData.minInvestment}
                      onChange={handleChange}
                      placeholder="Optional"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Maximum Investment ({usdtSymbol})</label>
                    <Input
                      name="maxInvestment"
                      type="number"
                      step="0.000001"
                      value={formData.maxInvestment}
                      onChange={handleChange}
                      placeholder="Optional"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">APY (%)</label>
                    <Input
                      name="apy"
                      type="number"
                      value={formData.apy}
                      onChange={handleChange}
                      placeholder="Expected annual return"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Total Value ({usdtSymbol})</label>
                    <Input
                      name="totalValue"
                      type="number"
                      step="0.000001"
                      value={formData.totalValue}
                      onChange={handleChange}
                      placeholder={`Auto-calculated from shares & price`}
                    />
                    <p className="text-xs text-gray-500">
                      If left empty, it will be calculated as (Total Shares × Price Per Share)
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Funding Period (Days) *</label>
                    <Input
                      name="fundingDays"
                      type="number"
                      value={formData.fundingDays}
                      onChange={handleChange}
                      placeholder="e.g. 30"
                      required
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={!isConnected || processing || !hasPaidFee}
                >
                  {processing ? "Creating..." : "Create Asset"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default CreateAsset;
