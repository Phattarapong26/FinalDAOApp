import React, { createContext, useState, useEffect, useContext, ReactNode } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "./Web3Context";
import { toast } from "sonner";
import { formatBalance } from "@/lib/utils";

// ABI for FractionalDAO contract
const FRACTIONAL_DAO_ABI = [
  // Asset functions
  "function createAsset(string name, string symbol, string ipfsMetadata, uint256 totalShares, uint256 pricePerShare, uint256 minInvestment, uint256 maxInvestment, uint256 totalValue, uint256 apy, uint256 fundingDeadline) external returns (uint256)",
  "function payFeeWithToken() external",
  "function purchaseShares(uint256 assetId, uint256 amount) external",
  "function updateAssetStatus(uint256 assetId, uint8 status) external",
  "function getAllAssets() external view returns (uint256[], string[], string[], string[], uint256[], uint256[], uint256[], uint256[], uint256[], uint256[], uint256[], uint256[], uint256[], address[], uint8[])",
  "function getAssetDetails(uint256 assetId) external view returns (uint256, string, string, string, uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256, address, uint8)",
  "function closeFunding(uint256 assetId) external",
  
  // Investor functions
  "function getInvestorAmount(uint256 assetId, address investor) external view returns (uint256)",
  "function getInvestorAssets(address investor) external view returns (uint256[])",
  "function getUserBalance(address user) external view returns (uint256)",
  "function withdrawBalance(uint256 amount) external",
  "function distributeEarnings(uint256 assetId, uint256 amount) external",
  "function getAssetInvestors(uint256 assetId) external view returns (address[])",
  
  // Governance functions
  "function createProposal(uint256 assetId, string title, string description, string ipfsMetadata, string executionData) external returns (uint256)",
  "function castVote(uint256 proposalId, bool support) external",
  "function executeProposal(uint256 proposalId) external",
  "function getAllProposals() external view returns (uint256[], string[], string[], string[], uint256[], uint256[], uint256[], uint256[], uint256[], uint256[], bool[], bool[], string[], address[], uint256[], uint256[])",
  "function getProposalDetails(uint256 proposalId) external view returns (uint256, string, string, string, uint256, uint256, uint256, uint256, uint256, uint256, bool, bool, string, address, uint256, uint256)",
  "function hasVoted(uint256 proposalId, address voter) external view returns (bool)",
  "function getVoteWeight(uint256 proposalId, address voter) external view returns (uint256)",
  "function getVotingStatus(uint256 proposalId) external view returns (uint256, uint256, uint256)",
  
  // Trading functions
  "function createOrder(uint256 assetId, uint256 shareAmount, uint256 pricePerShare, bool isBuyOrder) external returns (uint256)",
  "function cancelOrder(uint256 orderId) external",
  "function getAssetBuyOrders(uint256 assetId) external view returns (uint256[])",
  "function getAssetSellOrders(uint256 assetId) external view returns (uint256[])",
  "function getOrder(uint256 orderId) external view returns (uint256, uint256, address, uint256, uint256, uint256, uint256, uint256, bool, bool)",
  "function getUserOrders(address user) external view returns (uint256[])",
  "function getRecentTrades(uint256 assetId) external view returns (uint256[])",
  "function getMarketPrices(uint256 assetId) external view returns (uint256, uint256)",
  "function matchOrder(uint256 orderId) external",
  "function getTrade(uint256 tradeId) external view returns (uint256, uint256, uint256, address, address, uint256, uint256, uint256, uint256)",
  "function getUserTrades(address user) external view returns (uint256[])",
  "function canUserTradeAsset(uint256 assetId, address user) external view returns (bool)",
  
  // Token functions
  "function usdtToken() external view returns (address)",
  "function funToken() external view returns (address)",
  "function getFunTotalSupply() external view returns (uint256)",
  
  // Fee management
  "function hasPaidVoteGas(address user) external view returns (bool)",

  // New function from contract
  "function assetEarnings(uint256, uint256) external view returns (uint256, uint256)"
];

// ABI for ERC20 token
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)"
];

// Contract addresses
const CONTRACT_ADDRESS = "0x8215EA8b369Bb0B4247befF06a6E3a041e999724";
const USDT_TOKEN_ADDRESS = "0x44193A1D1FC7411d530efBC2b5342f553EA1890a";
const FUN_TOKEN_ADDRESS = "0xE695c28D03264036608F60ffc6C45c3772A88560";

// Enum for asset status
export enum AssetStatus {
  PENDING = 0,
  FUNDING = 1,
  CLOSED = 2,
  CANCELED = 3
}

// Asset interface
export interface Asset {
  id: number;
  name: string;
  symbol: string;
  ipfsMetadata: string;
  totalShares: ethers.BigNumber;
  availableShares: ethers.BigNumber;
  pricePerShare: ethers.BigNumber;
  minInvestment: ethers.BigNumber;
  maxInvestment: ethers.BigNumber;
  totalValue: ethers.BigNumber;
  fundedAmount: ethers.BigNumber;
  apy: ethers.BigNumber;
  fundingDeadline: ethers.BigNumber;
  creator: string;
  status: AssetStatus;
}

// Proposal interface
export interface Proposal {
  id: number;
  title: string;
  description: string;
  ipfsMetadata: string;
  assetId: number;
  voteStart: ethers.BigNumber;
  voteEnd: ethers.BigNumber;
  yesVotes: ethers.BigNumber;
  noVotes: ethers.BigNumber;
  executionTime: ethers.BigNumber;
  executed: boolean;
  passed: boolean;
  executionData: string;
  creator: string;
  totalVotes: ethers.BigNumber;
  totalSupply: ethers.BigNumber;
}

// Order interface
export interface Order {
  id: number;
  assetId: number;
  creator: string;
  shareAmount: ethers.BigNumber;
  pricePerShare: ethers.BigNumber;
  totalPrice: ethers.BigNumber;
  filledAmount: ethers.BigNumber;
  timestamp: ethers.BigNumber;
  isBuyOrder: boolean;
  isActive: boolean;
}

// Market Price interface
export interface MarketPrice {
  highestBid: ethers.BigNumber;
  lowestAsk: ethers.BigNumber;
}

// Trade interface
export interface Trade {
  id: number;
  assetId: number;
  orderId: number;
  buyer: string;
  seller: string;
  shareAmount: ethers.BigNumber;
  pricePerShare: ethers.BigNumber;
  totalPrice: ethers.BigNumber;
  timestamp: ethers.BigNumber;
}

interface EarningsDistribution {
  timestamp: ethers.BigNumber;
  amount: ethers.BigNumber;
}

interface ContractContextType {
  daoContract: ethers.Contract | null;
  usdtContract: ethers.Contract | null;
  funContract: ethers.Contract | null;
  loadingAssets: boolean;
  assets: Asset[];
  userAssets: number[];
  loadingProposals: boolean;
  proposals: Proposal[];
  loadingOrders: boolean;
  createAsset: (
    name: string,
    symbol: string,
    ipfsMetadata: string,
    totalShares: string,
    pricePerShare: string,
    minInvestment: string,
    maxInvestment: string,
    totalValue: string,
    apy: string,
    fundingDeadline: number
  ) => Promise<void>;
  payFeeWithToken: () => Promise<void>;
  purchaseShares: (assetId: number, amount: string) => Promise<void>;
  updateAssetStatus: (assetId: number, status: AssetStatus) => Promise<void>;
  createProposal: (
    assetId: number,
    title: string,
    description: string,
    ipfsMetadata: string,
    executionData: string
  ) => Promise<void>;
  castVote: (proposalId: number, support: boolean) => Promise<void>;
  executeProposal: (proposalId: number) => Promise<void>;
  createOrder: (
    assetId: number,
    shareAmount: string,
    pricePerShare: string,
    isBuyOrder: boolean
  ) => Promise<void>;
  cancelOrder: (orderId: number) => Promise<void>;
  refreshAssets: () => Promise<void>;
  refreshProposals: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  usdtBalance: ethers.BigNumber;
  funBalance: ethers.BigNumber;
  contractUserBalance: ethers.BigNumber;
  withdrawBalance: (amount: string) => Promise<void>;
  loadingBalances: boolean;
  approveUSDT: (amount: string) => Promise<void>;
  approveFUN: (amount: string) => Promise<void>;
  usdtDecimals: number;
  funDecimals: number;
  usdtSymbol: string;
  funSymbol: string;
  usdtAllowance: ethers.BigNumber;
  funAllowance: ethers.BigNumber;
  hasPaidFee: boolean;
  checkFeeStatus: () => Promise<void>;
  
  // เพิ่มฟังก์ชันใหม่
  closeFunding: (assetId: number) => Promise<void>;
  distributeEarnings: (assetId: number, amount: string) => Promise<void>;
  matchOrder: (orderId: number) => Promise<void>;
  getAssetBuyOrders: (assetId: number) => Promise<number[]>;
  getAssetSellOrders: (assetId: number) => Promise<number[]>;
  getUserOrders: () => Promise<number[]>;
  getOrder: (orderId: number) => Promise<Order>;
  getOrdersByAsset: (assetId: number) => Promise<Order[]>;
  getRecentTrades: (assetId: number) => Promise<number[]>;
  getUserTrades: () => Promise<number[]>;
  getTrade: (tradeId: number) => Promise<Trade>;
  getMarketPrices: (assetId: number) => Promise<MarketPrice>;
  canUserTradeAsset: (assetId: number) => Promise<boolean>;
  getAssetInvestors: (assetId: number) => Promise<string[]>;
  hasVoted: (proposalId: number, voter: string) => Promise<boolean>;
  getVoteWeight: (proposalId: number, voter: string) => Promise<ethers.BigNumber>;
  getVotingStatus: (proposalId: number) => Promise<{yesVotes: ethers.BigNumber, noVotes: ethers.BigNumber, totalSupply: ethers.BigNumber}>;
  getInvestorAmount: (assetId: number, address?: string) => Promise<ethers.BigNumber>;
  getFunTotalSupply: () => Promise<ethers.BigNumber>;
  getAssetEarningsHistory: (assetId: number) => Promise<EarningsDistribution[]>;
  getAssetDetails: (assetId: number) => Promise<Asset>;
}

const ContractContext = createContext<ContractContextType>({
  daoContract: null,
  usdtContract: null,
  funContract: null,
  loadingAssets: false,
  assets: [],
  userAssets: [],
  loadingProposals: false,
  proposals: [],
  loadingOrders: false,
  createAsset: async () => {},
  payFeeWithToken: async () => {},
  purchaseShares: async () => {},
  updateAssetStatus: async () => {},
  createProposal: async () => {},
  castVote: async () => {},
  executeProposal: async () => {},
  createOrder: async () => {},
  cancelOrder: async () => {},
  refreshAssets: async () => {},
  refreshProposals: async () => {},
  refreshUserData: async () => {},
  usdtBalance: ethers.BigNumber.from(0),
  funBalance: ethers.BigNumber.from(0),
  contractUserBalance: ethers.BigNumber.from(0),
  withdrawBalance: async () => {},
  loadingBalances: false,
  approveUSDT: async () => {},
  approveFUN: async () => {},
  usdtDecimals: 18,
  funDecimals: 18,
  usdtSymbol: "USDT",
  funSymbol: "FUN",
  usdtAllowance: ethers.BigNumber.from(0),
  funAllowance: ethers.BigNumber.from(0),
  hasPaidFee: false,
  checkFeeStatus: async () => {},
  
  // เพิ่มฟังก์ชันใหม่
  closeFunding: async () => {},
  distributeEarnings: async () => {},
  matchOrder: async () => {},
  getAssetBuyOrders: async () => [],
  getAssetSellOrders: async () => [],
  getUserOrders: async () => [],
  getOrder: async () => ({} as Order),
  getOrdersByAsset: async () => [],
  getRecentTrades: async () => [],
  getUserTrades: async () => [],
  getTrade: async () => ({} as Trade),
  getMarketPrices: async () => ({ highestBid: ethers.BigNumber.from(0), lowestAsk: ethers.BigNumber.from(0) }),
  canUserTradeAsset: async () => false,
  getAssetInvestors: async () => [],
  hasVoted: async () => false,
  getVoteWeight: async () => ethers.BigNumber.from(0),
  getVotingStatus: async () => ({ yesVotes: ethers.BigNumber.from(0), noVotes: ethers.BigNumber.from(0), totalSupply: ethers.BigNumber.from(0) }),
  getInvestorAmount: async () => ethers.BigNumber.from(0),
  getFunTotalSupply: async () => ethers.BigNumber.from(0),
  getAssetEarningsHistory: async () => [],
  getAssetDetails: async () => ({} as Asset),
});

export const useContract = () => useContext(ContractContext);

interface ContractProviderProps {
  children: ReactNode;
}

export const ContractProvider: React.FC<ContractProviderProps> = ({ children }) => {
  const { provider, signer, account, isConnected } = useWeb3();
  
  const [daoContract, setDaoContract] = useState<ethers.Contract | null>(null);
  const [usdtContract, setUsdtContract] = useState<ethers.Contract | null>(null);
  const [funContract, setFunContract] = useState<ethers.Contract | null>(null);
  
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [userAssets, setUserAssets] = useState<number[]>([]);
  
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  
  const [loadingOrders, setLoadingOrders] = useState(false);
  
  const [usdtBalance, setUsdtBalance] = useState<ethers.BigNumber>(ethers.BigNumber.from(0));
  const [funBalance, setFunBalance] = useState<ethers.BigNumber>(ethers.BigNumber.from(0));
  const [contractUserBalance, setContractUserBalance] = useState<ethers.BigNumber>(ethers.BigNumber.from(0));
  const [loadingBalances, setLoadingBalances] = useState(false);
  
  const [usdtDecimals, setUsdtDecimals] = useState(18);
  const [funDecimals, setFunDecimals] = useState(18);
  const [usdtSymbol, setUsdtSymbol] = useState("USDT");
  const [funSymbol, setFunSymbol] = useState("FUN");
  
  const [usdtAllowance, setUsdtAllowance] = useState<ethers.BigNumber>(ethers.BigNumber.from(0));
  const [funAllowance, setFunAllowance] = useState<ethers.BigNumber>(ethers.BigNumber.from(0));
  
  const [hasPaidFee, setHasPaidFee] = useState(false);

  useEffect(() => {
    if (provider) {
      console.log("Initializing contracts with provider")
      const readOnlyDaoContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        FRACTIONAL_DAO_ABI,
        provider
      );
      const readOnlyUsdtContract = new ethers.Contract(
        USDT_TOKEN_ADDRESS,
        ERC20_ABI,
        provider
      );
      const readOnlyFunContract = new ethers.Contract(
        FUN_TOKEN_ADDRESS,
        ERC20_ABI,
        provider
      );
      
      setDaoContract(readOnlyDaoContract);
      setUsdtContract(readOnlyUsdtContract);
      setFunContract(readOnlyFunContract);
      
      if (signer) {
        console.log("Connecting contracts with signer")
        const daoWithSigner = readOnlyDaoContract.connect(signer);
        const usdtWithSigner = readOnlyUsdtContract.connect(signer);
        const funWithSigner = readOnlyFunContract.connect(signer);
        
        setDaoContract(daoWithSigner);
        setUsdtContract(usdtWithSigner);
        setFunContract(funWithSigner);
      }
    }
  }, [provider, signer]);

  useEffect(() => {
    const fetchTokenInfo = async () => {
      try {
        if (usdtContract) {
          const decimals = await usdtContract.decimals();
          const symbol = await usdtContract.symbol();
          setUsdtDecimals(decimals);
          setUsdtSymbol(symbol);
        }
        
        if (funContract) {
          const decimals = await funContract.decimals();
          const symbol = await funContract.symbol();
          setFunDecimals(decimals);
          setFunSymbol(symbol);
        }
      } catch (error) {
        console.error("Error fetching token info:", error);
      }
    };
    
    fetchTokenInfo();
  }, [usdtContract, funContract]);

  useEffect(() => {
    if (daoContract) {
      refreshAssets();
      refreshProposals();
    }
  }, [daoContract]);

  useEffect(() => {
    if (daoContract && account && isConnected) {
      refreshUserData();
      checkFeeStatus();
    } else {
      setHasPaidFee(false);
    }
  }, [daoContract, account, isConnected]);

  const checkFeeStatus = async () => {
    if (!daoContract || !account) return;
    
    try {
      const feeStatus = await daoContract.hasPaidVoteGas(account);
      setHasPaidFee(feeStatus);
    } catch (error) {
      console.error("Error checking fee status:", error);
      setHasPaidFee(false);
    }
  };

  const refreshAssets = async () => {
    if (!daoContract) return;
    
    setLoadingAssets(true);
    try {
      const result = await daoContract.getAllAssets();
      
      const [
        ids,
        names,
        symbols,
        ipfsMetadata,
        totalShares,
        availableShares,
        pricePerShares,
        minInvestments,
        maxInvestments,
        totalValues,
        fundedAmounts,
        apys,
        fundingDeadlines,
        creators,
        statuses
      ] = result;
      
      const formattedAssets: Asset[] = ids.map((id: ethers.BigNumber, index: number) => ({
        id: id.toNumber(),
        name: names[index],
        symbol: symbols[index],
        ipfsMetadata: ipfsMetadata[index],
        totalShares: totalShares[index],
        availableShares: availableShares[index],
        pricePerShare: pricePerShares[index],
        minInvestment: minInvestments[index],
        maxInvestment: maxInvestments[index],
        totalValue: totalValues[index],
        fundedAmount: fundedAmounts[index],
        apy: apys[index],
        fundingDeadline: fundingDeadlines[index],
        creator: creators[index],
        status: statuses[index]
      }));
      
      setAssets(formattedAssets);
    } catch (error) {
      console.error("Error fetching assets:", error);
      toast.error("Failed to load assets");
    } finally {
      setLoadingAssets(false);
    }
  };

  const refreshProposals = async () => {
    if (!daoContract) return;
    
    setLoadingProposals(true);
    try {
      const result = await daoContract.getAllProposals();
      
      const [
        ids,
        titles,
        descriptions,
        ipfsMetadata,
        assetIds,
        voteStarts,
        voteEnds,
        yesVotes,
        noVotes,
        executionTimes,
        executed,
        passed,
        executionData,
        creators,
        totalVotes,
        totalSupplies
      ] = result;
      
      const formattedProposals: Proposal[] = ids.map((id: ethers.BigNumber, index: number) => ({
        id: id.toNumber(),
        title: titles[index],
        description: descriptions[index],
        ipfsMetadata: ipfsMetadata[index],
        assetId: assetIds[index].toNumber(),
        voteStart: voteStarts[index],
        voteEnd: voteEnds[index],
        yesVotes: yesVotes[index],
        noVotes: noVotes[index],
        executionTime: executionTimes[index],
        executed: executed[index],
        passed: passed[index],
        executionData: executionData[index],
        creator: creators[index],
        totalVotes: totalVotes[index],
        totalSupply: totalSupplies[index]
      }));
      
      setProposals(formattedProposals);
    } catch (error) {
      console.error("Error fetching proposals:", error);
      toast.error("Failed to load proposals");
    } finally {
      setLoadingProposals(false);
    }
  };

  const refreshUserData = async () => {
    if (!daoContract || !usdtContract || !funContract || !account) return;
    
    setLoadingBalances(true);
    try {
      const userAssetIds = await daoContract.getInvestorAssets(account);
      setUserAssets(userAssetIds.map((id: ethers.BigNumber) => id.toNumber()));
      
      const usdtBal = await usdtContract.balanceOf(account);
      const funBal = await funContract.balanceOf(account);
      const contractBal = await daoContract.getUserBalance(account);
      
      setUsdtBalance(usdtBal);
      setFunBalance(funBal);
      setContractUserBalance(contractBal);
      
      const usdtAllow = await usdtContract.allowance(account, CONTRACT_ADDRESS);
      const funAllow = await funContract.allowance(account, CONTRACT_ADDRESS);
      
      setUsdtAllowance(usdtAllow);
      setFunAllowance(funAllow);
      
      await checkFeeStatus();
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoadingBalances(false);
    }
  };

  const createAsset = async (
    name: string,
    symbol: string,
    ipfsMetadata: string,
    totalShares: string,
    pricePerShare: string,
    minInvestment: string,
    maxInvestment: string,
    totalValue: string,
    apy: string,
    fundingDeadline: number
  ) => {
    if (!daoContract || !account) {
      toast.error("Wallet not connected");
      return;
    }
    
    try {
      await payFeeWithToken();
      
      const tx = await daoContract.createAsset(
        name,
        symbol,
        ipfsMetadata,
        ethers.utils.parseUnits(totalShares, 0),
        ethers.utils.parseUnits(pricePerShare, usdtDecimals),
        ethers.utils.parseUnits(minInvestment, usdtDecimals),
        ethers.utils.parseUnits(maxInvestment, usdtDecimals),
        ethers.utils.parseUnits(totalValue, usdtDecimals),
        ethers.utils.parseUnits(apy, 0),
        fundingDeadline
      );
      
      toast.info("Creating asset...");
      await tx.wait();
      
      toast.success("Asset created successfully");
      await refreshAssets();
    } catch (error: unknown) {
      console.error("Error creating asset:", error);
      toast.error(`Failed to create asset: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const payFeeWithToken = async () => {
    if (!daoContract || !funContract || !account) {
      toast.error("Wallet not connected");
      return;
    }
    
    try {
      const alreadyPaid = await daoContract.hasPaidVoteGas(account);
      if (alreadyPaid) {
        setHasPaidFee(true);
        return;
      }
      
      const voteFee = ethers.utils.parseUnits("10", funDecimals);
      
      if (funBalance.lt(voteFee)) {
        toast.error(`Insufficient ${funSymbol} balance. You need at least 10 ${funSymbol}`);
        return;
      }
      
      if (funAllowance.lt(voteFee)) {
        toast.info(`Approving ${funSymbol} token...`);
        const approveTx = await funContract.approve(CONTRACT_ADDRESS, ethers.constants.MaxUint256);
        await approveTx.wait();
        setFunAllowance(ethers.constants.MaxUint256);
        toast.success(`${funSymbol} token approved`);
      }
      
      toast.info("Paying governance fee...");
      const tx = await daoContract.payFeeWithToken();
      await tx.wait();
      
      setHasPaidFee(true);
      
      toast.success("Governance fee paid");
      await refreshUserData();
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes("Fee already paid")) {
        setHasPaidFee(true);
        return;
      }
      
      console.error("Error paying fee:", error);
      toast.error(`Failed to pay fee: ${error instanceof Error ? error.message : "Unknown error"}`);
      throw error;
    }
  };

  const purchaseShares = async (assetId: number, amount: string) => {
    if (!daoContract || !usdtContract || !account) {
      toast.error("Wallet not connected");
      return;
    }
    
    try {
      await payFeeWithToken();
      
      const amountBN = ethers.utils.parseUnits(amount, usdtDecimals);
      
      if (usdtAllowance.lt(amountBN)) {
        toast.info(`Approving ${usdtSymbol} token...`);
        const approveTx = await usdtContract.approve(CONTRACT_ADDRESS, ethers.constants.MaxUint256);
        await approveTx.wait();
        setUsdtAllowance(ethers.constants.MaxUint256);
        toast.success(`${usdtSymbol} token approved`);
      }
      
      const tx = await daoContract.purchaseShares(assetId, amountBN);
      await tx.wait();
      
      toast.success("Shares purchased successfully");
      await refreshAssets();
      await refreshUserData();
    } catch (error: unknown) {
      console.error("Error purchasing shares:", error);
      toast.error(`Failed to purchase shares: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const updateAssetStatus = async (assetId: number, status: AssetStatus) => {
    if (!daoContract || !account) {
      toast.error("Wallet not connected");
      return;
    }
    
    try {
      await payFeeWithToken();
      
      const tx = await daoContract.updateAssetStatus(assetId, status);
      await tx.wait();
      
      toast.success("Asset status updated successfully");
      await refreshAssets();
    } catch (error: unknown) {
      console.error("Error updating asset status:", error);
      toast.error(`Failed to update asset status: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const createProposal = async (
    assetId: number,
    title: string,
    description: string,
    ipfsMetadata: string,
    executionData: string
  ) => {
    if (!daoContract || !account) {
      toast.error("Wallet not connected");
      return;
    }
    
    try {
      await payFeeWithToken();
      
      const tx = await daoContract.createProposal(
        assetId,
        title,
        description,
        ipfsMetadata,
        executionData
      );
      await tx.wait();
      
      toast.success("Proposal created successfully");
      await refreshProposals();
    } catch (error: unknown) {
      console.error("Error creating proposal:", error);
      toast.error(`Failed to create proposal: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const castVote = async (proposalId: number, support: boolean) => {
    if (!daoContract || !account) {
      toast.error("Wallet not connected");
      return;
    }
    
    try {
      await payFeeWithToken();
      
      const tx = await daoContract.castVote(proposalId, support);
      await tx.wait();
      
      toast.success(`Vote cast successfully (${support ? "Yes" : "No"})`);
      await refreshProposals();
    } catch (error: unknown) {
      console.error("Error casting vote:", error);
      toast.error(`Failed to cast vote: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const executeProposal = async (proposalId: number) => {
    if (!daoContract || !account) {
      toast.error("Wallet not connected");
      return;
    }
    
    try {
      await payFeeWithToken();
      
      const tx = await daoContract.executeProposal(proposalId);
      await tx.wait();
      
      toast.success("Proposal executed successfully");
      await refreshProposals();
      await refreshAssets();
    } catch (error: unknown) {
      console.error("Error executing proposal:", error);
      toast.error(`Failed to execute proposal: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const createOrder = async (
    assetId: number,
    shareAmount: string,
    pricePerShare: string,
    isBuyOrder: boolean
  ) => {
    if (!daoContract || !usdtContract || !account) {
      toast.error("Wallet not connected");
      return;
    }
    
    try {
      const shareAmountBN = ethers.utils.parseUnits(shareAmount, 0);
      const pricePerShareBN = ethers.utils.parseUnits(pricePerShare, usdtDecimals);
      const totalAmount = shareAmountBN.mul(pricePerShareBN);
      
      if (isBuyOrder) {
        if (usdtAllowance.lt(totalAmount)) {
          toast.info(`Approving ${usdtSymbol} token...`);
          const approveTx = await usdtContract.approve(CONTRACT_ADDRESS, ethers.constants.MaxUint256);
          await approveTx.wait();
          setUsdtAllowance(ethers.constants.MaxUint256);
          toast.success(`${usdtSymbol} token approved`);
        }
      }
      
      const tx = await daoContract.createOrder(
        assetId,
        shareAmountBN,
        pricePerShareBN,
        isBuyOrder
      );
      await tx.wait();
      
      toast.success(`${isBuyOrder ? "Buy" : "Sell"} order created successfully`);
      await refreshUserData();
    } catch (error: unknown) {
      console.error("Error creating order:", error);
      toast.error(`Failed to create order: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const cancelOrder = async (orderId: number) => {
    if (!daoContract || !account) {
      toast.error("Wallet not connected");
      return;
    }
    
    try {
      const tx = await daoContract.cancelOrder(orderId);
      await tx.wait();
      
      toast.success("Order cancelled successfully");
      await refreshUserData();
    } catch (error: unknown) {
      console.error("Error cancelling order:", error);
      toast.error(`Failed to cancel order: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const withdrawBalance = async (amount: string) => {
    if (!daoContract || !account) {
      toast.error("Wallet not connected");
      return;
    }
    
    try {
      const amountBN = ethers.utils.parseUnits(amount, usdtDecimals);
      
      const tx = await daoContract.withdrawBalance(amountBN);
      await tx.wait();
      
      toast.success("Balance withdrawn successfully");
      await refreshUserData();
    } catch (error: unknown) {
      console.error("Error withdrawing balance:", error);
      toast.error(`Failed to withdraw balance: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const approveUSDT = async (amount: string) => {
    if (!usdtContract || !account) {
      toast.error("Wallet not connected");
      return;
    }
    
    try {
      const amountBN = amount === "max" 
        ? ethers.constants.MaxUint256 
        : ethers.utils.parseUnits(amount, usdtDecimals);
      
      toast.info(`Approving ${usdtSymbol} token...`);
      const tx = await usdtContract.approve(CONTRACT_ADDRESS, amountBN);
      await tx.wait();
      
      setUsdtAllowance(amountBN);
      toast.success(`${usdtSymbol} token approved`);
    } catch (error: unknown) {
      console.error("Error approving USDT:", error);
      toast.error(`Failed to approve ${usdtSymbol}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const approveFUN = async (amount: string) => {
    if (!funContract || !account) {
      toast.error("Wallet not connected");
      return;
    }
    
    try {
      const amountBN = amount === "max" 
        ? ethers.constants.MaxUint256 
        : ethers.utils.parseUnits(amount, funDecimals);
      
      toast.info(`Approving ${funSymbol} token...`);
      const tx = await funContract.approve(CONTRACT_ADDRESS, amountBN);
      await tx.wait();
      
      setFunAllowance(amountBN);
      toast.success(`${funSymbol} token approved`);
    } catch (error: unknown) {
      console.error("Error approving FUN:", error);
      toast.error(`Failed to approve ${funSymbol}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  // เพิ่มฟังก์ชันใหม่
  const closeFunding = async (assetId: number) => {
    if (!daoContract || !account) {
      toast.error("Wallet not connected");
      return;
    }
    
    try {
      const tx = await daoContract.closeFunding(assetId);
      await tx.wait();
      
      toast.success("Funding closed successfully");
      await refreshAssets();
    } catch (error: unknown) {
      console.error("Error closing funding:", error);
      toast.error(`Failed to close funding: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const distributeEarnings = async (assetId: number, amount: string) => {
    if (!daoContract || !usdtContract || !account) {
      toast.error("Wallet not connected");
      return;
    }
    
    try {
      const amountBN = ethers.utils.parseUnits(amount, usdtDecimals);
      
      if (usdtAllowance.lt(amountBN)) {
        toast.info(`Approving ${usdtSymbol} token...`);
        const approveTx = await usdtContract.approve(CONTRACT_ADDRESS, ethers.constants.MaxUint256);
        await approveTx.wait();
        setUsdtAllowance(ethers.constants.MaxUint256);
        toast.success(`${usdtSymbol} token approved`);
      }
      
      const tx = await daoContract.distributeEarnings(assetId, amountBN);
      await tx.wait();
      
      toast.success("Earnings distributed successfully");
      await refreshUserData();
    } catch (error: unknown) {
      console.error("Error distributing earnings:", error);
      toast.error(`Failed to distribute earnings: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const matchOrder = async (orderId: number) => {
    if (!daoContract || !account) {
      toast.error("Wallet not connected");
      return;
    }
    
    try {
      const tx = await daoContract.matchOrder(orderId);
      await tx.wait();
      
      toast.success("Order matched successfully");
      await refreshUserData();
    } catch (error: unknown) {
      console.error("Error matching order:", error);
      toast.error(`Failed to match order: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const getAssetBuyOrders = async (assetId: number): Promise<number[]> => {
    if (!daoContract) return [];
    
    try {
      const buyOrders = await daoContract.getAssetBuyOrders(assetId);
      return buyOrders.map((id: ethers.BigNumber) => id.toNumber());
    } catch (error) {
      console.error("Error getting asset buy orders:", error);
      return [];
    }
  };

  const getAssetSellOrders = async (assetId: number): Promise<number[]> => {
    if (!daoContract) return [];
    
    try {
      const sellOrders = await daoContract.getAssetSellOrders(assetId);
      return sellOrders.map((id: ethers.BigNumber) => id.toNumber());
    } catch (error) {
      console.error("Error getting asset sell orders:", error);
      return [];
    }
  };

  const getUserOrders = async (): Promise<number[]> => {
    if (!daoContract || !account) return [];
    
    try {
      const userOrders = await daoContract.getUserOrders(account);
      return userOrders.map((id: ethers.BigNumber) => id.toNumber());
    } catch (error) {
      console.error("Error getting user orders:", error);
      return [];
    }
  };

  const getOrder = async (orderId: number): Promise<Order> => {
    if (!daoContract) throw new Error("Contract not loaded");
    
    try {
      const [
        id,
        assetId,
        creator,
        shareAmount,
        pricePerShare,
        totalPrice,
        filledAmount,
        timestamp,
        isBuyOrder,
        isActive
      ] = await daoContract.getOrder(orderId);
      
      return {
        id: id.toNumber(),
        assetId: assetId.toNumber(),
        creator,
        shareAmount,
        pricePerShare,
        totalPrice,
        filledAmount,
        timestamp,
        isBuyOrder,
        isActive
      };
    } catch (error) {
      console.error("Error getting order:", error);
      throw error;
    }
  };

  const getOrdersByAsset = async (assetId: number): Promise<Order[]> => {
    try {
      const buyOrderIds = await getAssetBuyOrders(assetId);
      const sellOrderIds = await getAssetSellOrders(assetId);
      
      const orders: Order[] = [];
      
      for (const orderId of [...buyOrderIds, ...sellOrderIds]) {
        try {
          const order = await getOrder(orderId);
          orders.push(order);
        } catch (error) {
          console.error(`Error fetching order ${orderId}:`, error);
        }
      }
      
      return orders;
    } catch (error) {
      console.error("Error getting orders by asset:", error);
      return [];
    }
  };

  const getRecentTrades = async (assetId: number): Promise<number[]> => {
    if (!daoContract) return [];
    
    try {
      const trades = await daoContract.getRecentTrades(assetId);
      return trades.map((id: ethers.BigNumber) => id.toNumber());
    } catch (error) {
      console.error("Error getting recent trades:", error);
      return [];
    }
  };

  const getUserTrades = async (): Promise<number[]> => {
    if (!daoContract || !account) return [];
    
    try {
      const trades = await daoContract.getUserTrades(account);
      return trades.map((id: ethers.BigNumber) => id.toNumber());
    } catch (error) {
      console.error("Error getting user trades:", error);
      return [];
    }
  };

  const getTrade = async (tradeId: number): Promise<Trade> => {
    if (!daoContract) throw new Error("Contract not loaded");
    
    try {
      const [
        id,
        assetId,
        orderId,
        buyer,
        seller,
        shareAmount,
        pricePerShare,
        totalPrice,
        timestamp
      ] = await daoContract.getTrade(tradeId);
      
      return {
        id: id.toNumber(),
        assetId: assetId.toNumber(),
        orderId: orderId.toNumber(),
        buyer,
        seller,
        shareAmount,
        pricePerShare,
        totalPrice,
        timestamp
      };
    } catch (error) {
      console.error("Error getting trade:", error);
      throw error;
    }
  };

  const getMarketPrices = async (assetId: number): Promise<MarketPrice> => {
    if (!daoContract) throw new Error("Contract not loaded");
    
    try {
      const [highestBid, lowestAsk] = await daoContract.getMarketPrices(assetId);
      return {
        highestBid,
        lowestAsk
      };
    } catch (error) {
      console.error("Error getting market prices:", error);
      throw error;
    }
  };

  const canUserTradeAsset = async (assetId: number): Promise<boolean> => {
    if (!daoContract || !account) return false;
    
    try {
      return await daoContract.canUserTradeAsset(assetId, account);
    } catch (error) {
      console.error("Error checking if user can trade asset:", error);
      return false;
    }
  };

  const getAssetInvestors = async (assetId: number): Promise<string[]> => {
    if (!daoContract) {
      console.error("DAO contract is not initialized in getAssetInvestors");
      throw new Error("DAO contract is not initialized");
    }
    console.log("Calling getAssetInvestors with assetId:", assetId);
    
    try {
      console.log("Trying to call contract getAssetInvestors...");
      const result = await daoContract.getAssetInvestors(assetId);
      console.log("Raw contract result:", result);
      
      // ตรวจสอบว่าข้อมูลที่ได้เป็น array หรือไม่
      if (Array.isArray(result)) {
        console.log("Valid result from contract:", result);
        return result;
      } else {
        console.log("Invalid result format from contract");
        return [];
      }
    } catch (error) {
      console.error("Error in getAssetInvestors:", error);
      throw error;
    }
  };

  const hasVoted = async (proposalId: number, voter: string): Promise<boolean> => {
    if (!daoContract) return false;
    
    try {
      return await daoContract.hasVoted(proposalId, voter);
    } catch (error) {
      console.error("Error checking if user has voted:", error);
      return false;
    }
  };

  const getVoteWeight = async (proposalId: number, voter: string): Promise<ethers.BigNumber> => {
    if (!daoContract) return ethers.BigNumber.from(0);
    
    try {
      return await daoContract.getVoteWeight(proposalId, voter);
    } catch (error) {
      console.error("Error getting vote weight:", error);
      return ethers.BigNumber.from(0);
    }
  };

  const getVotingStatus = async (proposalId: number): Promise<{yesVotes: ethers.BigNumber, noVotes: ethers.BigNumber, totalSupply: ethers.BigNumber}> => {
    if (!daoContract) throw new Error("Contract not loaded");
    
    try {
      const [yesVotes, noVotes, totalSupply] = await daoContract.getVotingStatus(proposalId);
      return {
        yesVotes,
        noVotes,
        totalSupply
      };
    } catch (error) {
      console.error("Error getting voting status:", error);
      throw error;
    }
  };

  const getInvestorAmount = async (assetId: number, address?: string): Promise<ethers.BigNumber> => {
    if (!daoContract) {
      console.error("DAO contract is not initialized in getInvestorAmount");
      throw new Error("DAO contract is not initialized");
    }
    
    console.log("Getting investor amount for assetId:", assetId, "address:", address);
    
    try {
      if (address) {
        console.log("Calling contract getInvestorAmount...");
        const result = await daoContract.getInvestorAmount(assetId, address);
        console.log("Contract returned amount:", result.toString());
        return result;
      } else {
        // ถ้าไม่ระบุ address จะใช้ address ของผู้ใช้ปัจจุบัน
        if (!account) {
          throw new Error("Wallet not connected");
        }
        return await daoContract.getInvestorAmount(assetId, account);
      }
    } catch (error) {
      console.error("Error in getInvestorAmount:", error);
      // Return zero if error
      return ethers.BigNumber.from(0);
    }
  };

  const getFunTotalSupply = async (): Promise<ethers.BigNumber> => {
    if (!daoContract) return ethers.BigNumber.from(0);
    
    try {
      return await daoContract.getFunTotalSupply();
    } catch (error) {
      console.error("Error getting FUN total supply:", error);
      return ethers.BigNumber.from(0);
    }
  };

  const getAssetEarningsHistory = async (assetId: number): Promise<EarningsDistribution[]> => {
    if (!daoContract) return [];
    
    try {
      console.log(`เริ่มต้นดึงข้อมูลประวัติผลตอบแทนสำหรับ assetId: ${assetId}`);
      
      // ใช้ event logs เนื่องจาก contract ไม่มี getter function สำหรับ array ของ EarningsDistribution
      const provider = daoContract.provider;
      
      // ดึงข้อมูลจาก event EarningsDistributed
      const filter = {
        address: CONTRACT_ADDRESS,
        topics: [
          ethers.utils.id("EarningsDistributed(uint256,uint256)"),
          ethers.utils.hexZeroPad(ethers.utils.hexlify(assetId), 32)
        ]
      };
      
      const latestBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, latestBlock - 10000);
      
      const events = await provider.getLogs({
        ...filter,
        fromBlock,
        toBlock: latestBlock
      });
      
      if (!events || events.length === 0) {
        console.log("ไม่พบข้อมูลประวัติการจ่ายผลตอบแทน");
        return [];
      }
      
      const distributions: EarningsDistribution[] = await Promise.all(
        events.map(async (event) => {
          try {
            const amount = ethers.BigNumber.from(event.data);
            const block = await provider.getBlock(event.blockNumber);
            
            return {
              timestamp: ethers.BigNumber.from(block.timestamp),
              amount: amount
            };
          } catch (error) {
            console.error("เกิดข้อผิดพลาดในการแปลงข้อมูล event:", error);
            return {
              timestamp: ethers.BigNumber.from(0),
              amount: ethers.BigNumber.from(0)
            };
          }
        })
      );
      
      // เรียงลำดับตามเวลาล่าสุด
      const sortedDistributions = distributions
        .filter(dist => !dist.amount.isZero())
        .sort((a, b) => (b.timestamp.gt(a.timestamp) ? 1 : -1));
      
      return sortedDistributions;
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูลประวัติผลตอบแทน:", error);
      return [];
    }
  };

  const getAssetDetails = async (assetId: number): Promise<Asset> => {
    if (!daoContract) throw new Error("Contract not loaded");
    
    try {
      const [
        id,
        name,
        symbol,
        ipfsMetadata,
        totalShares,
        availableShares,
        pricePerShare,
        minInvestment,
        maxInvestment,
        totalValue,
        fundedAmount,
        apy,
        fundingDeadline,
        creator,
        status
      ] = await daoContract.getAssetDetails(assetId);
      
      return {
        id: id.toNumber(),
        name,
        symbol,
        ipfsMetadata,
        totalShares,
        availableShares,
        pricePerShare,
        minInvestment,
        maxInvestment,
        totalValue,
        fundedAmount,
        apy,
        fundingDeadline,
        creator,
        status
      };
    } catch (error) {
      console.error("Error getting asset details:", error);
      throw error;
    }
  };

  return (
    <ContractContext.Provider
      value={{
        daoContract,
        usdtContract,
        funContract,
        loadingAssets,
        assets,
        userAssets,
        loadingProposals,
        proposals,
        loadingOrders,
        createAsset,
        payFeeWithToken,
        purchaseShares,
        updateAssetStatus,
        createProposal,
        castVote,
        executeProposal,
        createOrder,
        cancelOrder,
        refreshAssets,
        refreshProposals,
        refreshUserData,
        usdtBalance,
        funBalance,
        contractUserBalance,
        withdrawBalance,
        loadingBalances,
        approveUSDT,
        approveFUN,
        usdtDecimals,
        funDecimals,
        usdtSymbol,
        funSymbol,
        usdtAllowance,
        funAllowance,
        hasPaidFee,
        checkFeeStatus,
        
        // เพิ่มฟังก์ชันใหม่
        closeFunding,
        distributeEarnings,
        matchOrder,
        getAssetBuyOrders,
        getAssetSellOrders,
        getUserOrders,
        getOrder,
        getOrdersByAsset,
        getRecentTrades,
        getUserTrades,
        getTrade,
        getMarketPrices,
        canUserTradeAsset,
        getAssetInvestors,
        hasVoted,
        getVoteWeight,
        getVotingStatus,
        getInvestorAmount,
        getFunTotalSupply,
        getAssetEarningsHistory,
        getAssetDetails
      }}
    >
      {children}
    </ContractContext.Provider>
  );
};
