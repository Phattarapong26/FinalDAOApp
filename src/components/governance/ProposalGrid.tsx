
import React from "react";
import ProposalCard from "./ProposalCard";
import { Proposal } from "@/contexts/ContractContext";
import { Skeleton } from "@/components/ui/skeleton";

interface ProposalGridProps {
  proposals: Proposal[];
  loading: boolean;
}

const ProposalGrid: React.FC<ProposalGridProps> = ({ proposals, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="rounded-lg overflow-hidden border border-gray-200">
            <Skeleton className="h-[300px]" />
          </div>
        ))}
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No proposals found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {proposals.map((proposal) => (
        <ProposalCard key={proposal.id} proposal={proposal} />
      ))}
    </div>
  );
};

export default ProposalGrid;
