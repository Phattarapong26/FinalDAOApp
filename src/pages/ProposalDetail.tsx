
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import PageLayout from "@/components/layout/PageLayout";
import { useContract } from "@/contexts/ContractContext";
import { useWeb3 } from "@/contexts/Web3Context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Check, X, AlertTriangle, Clock, FileText, User, Calendar } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatBalance, formatDate, formatDateTime, getRemainingTime, shortenAddress } from "@/lib/utils";
import { ethers } from "ethers";
import { toast } from "sonner";

const ProposalDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const proposalId = parseInt(id || "0");
  
  const { 
    proposals, 
    loadingProposals, 
    refreshProposals,
    castVote,
    executeProposal,
    assets
  } = useContract();
  
  const { isConnected, account } = useWeb3();
  
  const [proposal, setProposal] = useState<any>(null);
  const [asset, setAsset] = useState<any>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  
  useEffect(() => {
    if (!loadingProposals) {
      const foundProposal = proposals.find(p => p.id === proposalId);
      if (foundProposal) {
        setProposal(foundProposal);
        
        // Find related asset
        const relatedAsset = assets.find(a => a.id === foundProposal.assetId);
        if (relatedAsset) {
          setAsset(relatedAsset);
        }
      }
    }
  }, [proposalId, proposals, loadingProposals, assets]);
  
  useEffect(() => {
    refreshProposals();
  }, []);
  
  const handleVote = async (support: boolean) => {
    if (!proposal || !isConnected) return;
    
    try {
      setIsVoting(true);
      await castVote(proposalId, support);
      await refreshProposals();
    } catch (error) {
      console.error("Voting error:", error);
    } finally {
      setIsVoting(false);
    }
  };
  
  const handleExecute = async () => {
    if (!proposal || !isConnected) return;
    
    try {
      setIsExecuting(true);
      await executeProposal(proposalId);
      await refreshProposals();
    } catch (error) {
      console.error("Execution error:", error);
    } finally {
      setIsExecuting(false);
    }
  };
  
  if (loadingProposals) {
    return (
      <PageLayout>
        <div className="container px-4 py-8 mx-auto">
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Loading proposal details...</p>
          </div>
        </div>
      </PageLayout>
    );
  }
  
  if (!proposal) {
    return (
      <PageLayout>
        <div className="container px-4 py-8 mx-auto">
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-gray-500 mb-4">Proposal not found</p>
            <Button asChild variant="outline">
              <Link to="/governance">Back to Governance</Link>
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }
  
  const now = Math.floor(Date.now() / 1000);
  const isActive = !proposal.executed && now < proposal.voteEnd.toNumber();
  const isPending = !proposal.executed && now >= proposal.voteEnd.toNumber();
  const canExecute = isPending && proposal.yesVotes.gt(proposal.noVotes);
  
  const totalVotes = proposal.yesVotes.add(proposal.noVotes);
  const yesPercentage = totalVotes.gt(0) 
    ? proposal.yesVotes.mul(100).div(totalVotes).toNumber() 
    : 0;
  const noPercentage = totalVotes.gt(0) 
    ? proposal.noVotes.mul(100).div(totalVotes).toNumber() 
    : 0;
  
  return (
    <PageLayout>
      <div className="container px-4 py-8 mx-auto bg-white shadow-sm border border-gray-200 rounded-xl  mt-[15px] mb-[20px]">
        <Link to="/governance" className="inline-flex items-center text-blue-600 hover:underline mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Governance
        </Link>
        
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-start flex-wrap mb-6">
            <div>
              <h1 className="text-3xl font-bold">{proposal.title}</h1>
              <div className="flex items-center mt-2 space-x-4">
                <span className="text-gray-500">Proposal #{proposal.id}</span>
                {asset && (
                  <Link to={`/asset/${asset.id}`} className="text-blue-600 hover:underline">
                    Asset: {asset.name}
                  </Link>
                )}
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  proposal.executed
                    ? proposal.passed
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                    : isActive
                      ? "bg-blue-100 text-blue-800"
                      : "bg-yellow-100 text-yellow-800"
                }`}>
                  {proposal.executed
                    ? proposal.passed
                      ? "Executed"
                      : "Rejected"
                    : isActive
                      ? "Active"
                      : "Pending Execution"}
                </span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Proposal Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Description</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-800 whitespace-pre-wrap">{proposal.description}</p>
                      </div>
                    </div>
                    
                    {proposal.ipfsMetadata && (
                      <div>
                        <h3 className="text-lg font-medium mb-2">Metadata</h3>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm break-words">{proposal.ipfsMetadata}</p>
                        </div>
                      </div>
                    )}
                    
                    {proposal.executionData && (
                      <div>
                        <h3 className="text-lg font-medium mb-2">Execution Data</h3>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm break-words font-mono">{proposal.executionData}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-start space-x-2">
                        <User className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Creator</p>
                          <p className="font-medium">{shortenAddress(proposal.creator)}</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Voting Period</p>
                          <p className="font-medium">
                            {formatDate(proposal.voteStart)} - {formatDate(proposal.voteEnd)}
                          </p>
                        </div>
                      </div>
                      {proposal.executed && (
                        <div className="flex items-start space-x-2">
                          <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Execution Time</p>
                            <p className="font-medium">{formatDateTime(proposal.executionTime)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Voting Results</CardTitle>
                  <CardDescription>
                    Current voting status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="flex items-center">
                          <Check className="h-4 w-4 mr-1 text-green-600" /> 
                          Yes
                        </span>
                        <span>{formatBalance(proposal.yesVotes, 18, 0)} votes</span>
                      </div>
                      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full" 
                          style={{ width: `${yesPercentage}%` }}
                        ></div>
                      </div>
                      <p className="text-right text-xs mt-1">{yesPercentage}%</p>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="flex items-center">
                          <X className="h-4 w-4 mr-1 text-red-600" /> 
                          No
                        </span>
                        <span>{formatBalance(proposal.noVotes, 18, 0)} votes</span>
                      </div>
                      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-red-500 rounded-full" 
                          style={{ width: `${noPercentage}%` }}
                        ></div>
                      </div>
                      <p className="text-right text-xs mt-1">{noPercentage}%</p>
                    </div>
                    
                    <div className="pt-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Total Votes</span>
                        <span className="font-medium">{formatBalance(totalVotes, 18, 0)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Participation</span>
                        <span className="font-medium">
                          {proposal.totalSupply.gt(0) 
                            ? `${totalVotes.mul(100).div(proposal.totalSupply).toNumber()}%` 
                            : '0%'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {!isConnected ? (
                      <Alert>
                        <AlertDescription>
                          Connect your wallet to participate in governance.
                        </AlertDescription>
                      </Alert>
                    ) : isActive ? (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600">
                          Cast your vote for this proposal:
                        </p>
                        <div className="flex space-x-2">
                          <Button 
                            onClick={() => handleVote(true)} 
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            disabled={isVoting}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Vote Yes
                          </Button>
                          <Button 
                            onClick={() => handleVote(false)} 
                            variant="destructive"
                            className="flex-1"
                            disabled={isVoting}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Vote No
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 text-center">
                          {getRemainingTime(proposal.voteEnd)} for voting
                        </p>
                      </div>
                    ) : isPending && canExecute ? (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600">
                          This proposal has passed and is ready for execution:
                        </p>
                        <Button 
                          onClick={handleExecute} 
                          className="w-full"
                          disabled={isExecuting}
                        >
                          Execute Proposal
                        </Button>
                      </div>
                    ) : proposal.executed ? (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600">
                          This proposal has been executed{proposal.passed ? ' and passed' : ' but rejected'}.
                        </p>
                        <p className="text-xs text-gray-500">
                          Executed on: {formatDateTime(proposal.executionTime)}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600">
                          Voting has ended. This proposal has been {proposal.yesVotes.gt(proposal.noVotes) ? 'approved' : 'rejected'} but not yet executed.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default ProposalDetail;
