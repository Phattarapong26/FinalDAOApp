
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import PageLayout from "@/components/layout/PageLayout";
import { useContract } from "@/contexts/ContractContext";
import { useWeb3 } from "@/contexts/Web3Context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Info, AlertTriangle, Check } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";

const CreateProposal: React.FC = () => {
  const navigate = useNavigate();
  const { assetId: assetIdParam } = useParams<{ assetId?: string }>();
  
  const { 
    assets, 
    loadingAssets, 
    refreshAssets,
    createProposal,
    funBalance,
    hasPaidFee,
    payFeeWithToken,
    funSymbol,
    funDecimals
  } = useContract();
  
  const { isConnected, connectWallet } = useWeb3();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assetId, setAssetId] = useState<string>(assetIdParam || "");
  const [ipfsMetadata, setIpfsMetadata] = useState("");
  const [executionData, setExecutionData] = useState("");
  const [processing, setProcessing] = useState(false);
  
  useEffect(() => {
    refreshAssets();
  }, []);
  
  useEffect(() => {
    if (assetIdParam) {
      setAssetId(assetIdParam);
    }
  }, [assetIdParam]);
  
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
    
    if (!title || !description || !assetId) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    if (!hasPaidFee) {
      toast.error("You need to pay the governance fee first");
      return;
    }
    
    try {
      setProcessing(true);
      await createProposal(
        parseInt(assetId),
        title,
        description,
        ipfsMetadata,
        executionData
      );
      toast.success("Proposal created successfully");
      navigate("/governance");
    } catch (error) {
      console.error("Error creating proposal:", error);
      toast.error("Failed to create proposal");
    } finally {
      setProcessing(false);
    }
  };
  
  return (
    <PageLayout>
      <div className="container px-4 py-8 mx-auto bg-white shadow-sm border border-gray-200 rounded-xl  mt-[15px] mb-[20px]">
        <Link to="/governance" className="inline-flex items-center text-blue-600 hover:underline mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Governance
        </Link>
        
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Create Proposal</CardTitle>
              <CardDescription>
                Submit a new governance proposal for the DAO to vote on
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent>
                <div className="space-y-6">
                  {!isConnected ? (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>Connect your wallet</AlertTitle>
                      <AlertDescription>
                        You need to connect your wallet to create a proposal.
                        <Button onClick={connectWallet} variant="outline" className="mt-2">
                          Connect Wallet
                        </Button>
                      </AlertDescription>
                    </Alert>
                  ) : funBalance.isZero() ? (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Insufficient FUN tokens</AlertTitle>
                      <AlertDescription>
                        You need FUN tokens to create a proposal and participate in governance.
                      </AlertDescription>
                    </Alert>
                  ) : !hasPaidFee ? (
                    <Alert variant="warning" className="bg-amber-50 border-amber-200">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertTitle className="text-amber-700">Governance Fee Required</AlertTitle>
                      <AlertDescription className="text-amber-600">
                        You need to pay a one-time governance fee of 10 {funSymbol} to create proposals.
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
                    <Alert className="bg-green-50 border-green-200">
                      <Check className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-green-700">Governance Fee Paid</AlertTitle>
                      <AlertDescription className="text-green-600">
                        You have paid the governance fee and can now create proposals.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Asset <span className="text-red-500">*</span></label>
                    <Select 
                      value={assetId} 
                      onValueChange={setAssetId}
                      disabled={processing || !isConnected}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an asset" />
                      </SelectTrigger>
                      <SelectContent>
                        {assets.map((asset) => (
                          <SelectItem key={asset.id} value={asset.id.toString()}>
                            {asset.name} ({asset.symbol})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Title <span className="text-red-500">*</span></label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter proposal title"
                      disabled={processing || !isConnected}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description <span className="text-red-500">*</span></label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Provide a detailed description of your proposal"
                      rows={6}
                      disabled={processing || !isConnected}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">IPFS Metadata (Optional)</label>
                    <Input
                      value={ipfsMetadata}
                      onChange={(e) => setIpfsMetadata(e.target.value)}
                      placeholder="Enter IPFS metadata URI if available"
                      disabled={processing || !isConnected}
                    />
                    <p className="text-xs text-gray-500">
                      You can include an IPFS URI that points to additional documentation
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Execution Data (Optional)</label>
                    <Textarea
                      value={executionData}
                      onChange={(e) => setExecutionData(e.target.value)}
                      placeholder="Enter technical execution data in JSON format if needed"
                      rows={4}
                      disabled={processing || !isConnected}
                    />
                    <p className="text-xs text-gray-500">
                      Technical data that will be used when executing the proposal
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex justify-end space-x-2 w-full">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => navigate("/governance")}
                    disabled={processing}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={processing || !isConnected || !title || !description || !assetId || !hasPaidFee}
                  >
                    {processing ? "Creating..." : "Create Proposal"}
                  </Button>
                </div>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default CreateProposal;
