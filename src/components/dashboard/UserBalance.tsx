
import React, { useState } from "react";
import { useContract } from "@/contexts/ContractContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wallet } from "lucide-react";
import { formatBalance } from "@/lib/utils";
import { ethers } from "ethers";
import { toast } from "sonner";

const UserBalance: React.FC = () => {
  const {
    contractUserBalance,
    withdrawBalance,
    usdtSymbol,
    usdtDecimals
  } = useContract();

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [processing, setProcessing] = useState(false);

  const handleWithdraw = async () => {
    if (!withdrawAmount) return;

    try {
      setProcessing(true);
      await withdrawBalance(withdrawAmount);
      setWithdrawAmount("");
      toast.success("Withdrawal successful");
    } catch (error) {
      console.error("Withdrawal error:", error);
      toast.error("Failed to withdraw");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Your Balance
        </CardTitle>
        <CardDescription>
          Manage your {usdtSymbol} balance in the platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Available Balance</p>
            <p className="text-2xl font-bold">
              {formatBalance(contractUserBalance, usdtDecimals)} {usdtSymbol}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Withdraw Amount</label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder={`Amount in ${usdtSymbol}`}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                disabled={processing}
              />
              <Button 
                onClick={handleWithdraw}
                disabled={!withdrawAmount || processing || contractUserBalance.eq(0)}
              >
                {processing ? "Processing..." : "Withdraw"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserBalance;
