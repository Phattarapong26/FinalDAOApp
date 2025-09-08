import React, { useMemo } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Proposal } from "@/contexts/ContractContext";
import { formatBalance, formatDate, getRemainingTime } from "@/lib/utils";
import { Link } from "react-router-dom";
import { ethers } from "ethers";

// รูปภาพแนวการประชุม การตัดสินใจ และการบริหาร
const governanceImages = [
  "https://images.unsplash.com/photo-1573167507387-6b4b98cb7c13?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1453738773917-9c3eff1db985?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1590402494582-44b93c3bf111?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1577415124269-fc1140a69e91?q=80&w=800&auto=format&fit=crop"
];

interface ProposalCardProps {
  proposal: Proposal;
}

const ProposalCard: React.FC<ProposalCardProps> = ({ proposal }) => {
  // สุ่มเลือกรูปภาพจากอาร์เรย์โดยใช้ ID ของ proposal
  const randomImage = useMemo(() => {
    const index = parseInt(proposal.id.toString()) % governanceImages.length;
    return governanceImages[index];
  }, [proposal.id]);
  
  const isActive = !proposal.executed && Date.now() / 1000 < proposal.voteEnd.toNumber();
  
  const totalVotes = proposal.yesVotes.add(proposal.noVotes);
  const yesPercentage = totalVotes.gt(0) 
    ? proposal.yesVotes.mul(100).div(totalVotes).toNumber() 
    : 0;
  const noPercentage = totalVotes.gt(0) 
    ? proposal.noVotes.mul(100).div(totalVotes).toNumber() 
    : 0;
  
  const statusClass = proposal.executed
    ? proposal.passed
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-red-100 text-red-800 border-red-200"
    : isActive
      ? "bg-blue-100 text-blue-800 border-blue-200"
      : "bg-yellow-100 text-yellow-800 border-yellow-200";
  
  const statusText = proposal.executed
    ? proposal.passed
      ? "ดำเนินการแล้ว"
      : "ถูกปฏิเสธ"
    : isActive
      ? "กำลังลงคะแนน"
      : "รอดำเนินการ";
  
  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md border-gray-200 hover:border-indigo-200 flex flex-col h-full">
      {/* รูปภาพด้านบนของ Card */}
      <div className="w-full h-40 overflow-hidden">
        <img 
          src={randomImage} 
          alt={proposal.title} 
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold truncate">{proposal.title}</h3>
            <p className="text-sm text-gray-500">รหัสสินทรัพย์: {proposal.assetId.toString()}</p>
          </div>
          <div className={`px-2 py-1 text-xs font-medium rounded-full ${statusClass}`}>
            {statusText}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3 flex-grow">
        <div className="space-y-3">
          <p className="text-sm text-gray-700 line-clamp-2">{proposal.description}</p>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">ความคืบหน้าการลงคะแนน</span>
            </div>
            <div className="h-2.5 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full" 
                style={{ width: `${yesPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span>เห็นด้วย: {yesPercentage}% ({formatBalance(proposal.yesVotes, 18, 0)} คะแนน)</span>
              <span>ไม่เห็นด้วย: {noPercentage}% ({formatBalance(proposal.noVotes, 18, 0)} คะแนน)</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <div>
              <p className="text-xs text-gray-500">สร้างโดย</p>
              <p className="text-sm font-medium">
                {`${proposal.creator.substring(0, 6)}...${proposal.creator.substring(proposal.creator.length - 4)}`}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">สิ้นสุดการลงคะแนน</p>
              <p className="text-sm font-medium">{formatDate(proposal.voteEnd)}</p>
            </div>
            {isActive && (
              <div className="col-span-2">
                <p className="text-xs text-gray-500">เวลาที่เหลือ</p>
                <p className="text-sm font-medium">{getRemainingTime(proposal.voteEnd)}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0 mt-auto">
        <Button asChild className="w-full" variant={isActive ? "default" : "outline"}>
          <Link to={`/proposal/${proposal.id}`}>
            {isActive ? "ลงคะแนนเสียง" : "ดูรายละเอียด"}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProposalCard;
