// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title FractionalDAO
 * @dev A DAO that manages fractional ownership of real-world assets
 */
contract FractionalDAO is Ownable, ReentrancyGuard {
    IERC20 public usdtToken;
    IERC20 public funToken;
    
    // Asset status enum
    enum AssetStatus {
        PENDING,    // Just created, waiting for governance approval
        FUNDING,    // Approved by governance, currently raising funds
        CLOSED,     // Funding period ended
        CANCELED    // Asset was rejected or canceled
    }
    
    // Asset struct
    struct Asset {
        uint256 id;
        string name;
        string symbol;
        string ipfsMetadata;
        uint256 totalShares;
        uint256 availableShares;
        uint256 pricePerShare;
        uint256 minInvestment;
        uint256 maxInvestment;
        uint256 totalValue;
        uint256 fundedAmount;
        uint256 apy;
        uint256 fundingDeadline;
        address[] investors;
        mapping(address => uint256) investorAmounts;
        address creator;
        AssetStatus status;
    }
    
    // Proposal struct
    struct Proposal {
        uint256 id;
        string title;
        string description;
        string ipfsMetadata;
        uint256 assetId;
        uint256 voteStart;
        uint256 voteEnd;
        uint256 yesVotes;
        uint256 noVotes;
        uint256 executionTime;
        bool executed;
        bool passed;
        string executionData;
        address creator;
        mapping(address => bool) hasVoted;
        mapping(address => uint256) voteWeights; // Track each voter's weight
    }
    
    // Order struct (Enhanced for trading)
    struct Order {
        uint256 id;
        uint256 assetId;
        address creator;
        uint256 shareAmount;
        uint256 pricePerShare;
        uint256 totalPrice;
        uint256 filledAmount;
        uint256 timestamp;
        bool isBuyOrder;
        bool isActive;
    }
    
    // Trade struct (Records of completed trades)
    struct Trade {
        uint256 id;
        uint256 assetId;
        uint256 orderId;
        address buyer;
        address seller;
        uint256 shareAmount;
        uint256 pricePerShare;
        uint256 totalPrice;
        uint256 timestamp;
    }
    
    // Earnings distribution struct
    struct EarningsDistribution {
        uint256 timestamp;
        uint256 amount;
    }
    
    // State variables
    uint256 public assetCount;
    uint256 public proposalCount;
    uint256 public orderCount;
    uint256 public tradeCount;
    uint256 public votingPeriod = 7 days;  // Updated to 7 days as specified
    uint256 public executionDelay = 1 days;
    uint256 public voteFee = 10 * 10**18; // Fee in FUN tokens (18 decimals)
    uint256 public tradeFeePercent = 1; // 1% trading fee
    
    mapping(uint256 => Asset) public assets;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => Order) public orders;
    mapping(uint256 => Trade) public trades;
    mapping(address => bool) public hasPaidVoteGas;
    mapping(address => uint256[]) public userAssets;
    mapping(uint256 => EarningsDistribution[]) public assetEarnings;
    mapping(address => uint256) public userBalances; // For tracking USDT balances held in the contract
    mapping(uint256 => uint256[]) public assetBuyOrders; // AssetId => OrderId[]
    mapping(uint256 => uint256[]) public assetSellOrders; // AssetId => OrderId[]
    mapping(address => uint256[]) public userOrders; // User's orders
    mapping(address => uint256[]) public userTrades; // User's trade history
    
    // Events
    event AssetCreated(uint256 indexed assetId, string name, address indexed creator);
    event AssetStatusUpdated(uint256 indexed assetId, AssetStatus status);
    event SharesPurchased(uint256 indexed assetId, address indexed investor, uint256 amount);
    event SharesSold(uint256 indexed assetId, address indexed investor, uint256 amount);
    event ProposalCreated(uint256 indexed proposalId, uint256 indexed assetId, address indexed creator);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed proposalId);
    event OrderCreated(uint256 indexed orderId, uint256 indexed assetId, address indexed creator, bool isBuyOrder, uint256 shareAmount, uint256 pricePerShare);
    event OrderCancelled(uint256 indexed orderId, uint256 indexed assetId, address indexed creator);
    event OrderFilled(uint256 indexed orderId, uint256 indexed assetId, uint256 shareAmount, uint256 pricePerShare);
    event TradeExecuted(uint256 indexed tradeId, uint256 indexed assetId, address buyer, address seller, uint256 shareAmount, uint256 pricePerShare);
    event EarningsDistributed(uint256 indexed assetId, uint256 amount);
    event FundingClosed(uint256 indexed assetId);
    event UserBalanceUpdated(address indexed user, uint256 amount);
    event Withdrawal(address indexed user, uint256 amount);
    event ProposalStatusUpdated(uint256 indexed proposalId, bool passed);
    event FeePaid(address indexed user, uint256 amount);
    event FeeExpired(address indexed user);
    
    constructor(address _usdtToken, address _funToken) Ownable(msg.sender) ReentrancyGuard() {
        usdtToken = IERC20(_usdtToken);
        funToken = IERC20(_funToken);
    }
    
    /**
     * @dev Pay fee with FUN token to participate in governance
     */
    function payFeeWithToken() external nonReentrant {
        // Only allow payment if the user hasn't paid or their previous payment has expired
        require(!hasPaidVoteGas[msg.sender], "Fee already paid for this transaction");
        
        // Transfer FUN tokens from user to this contract
        uint256 fee = voteFee;
        bool success = funToken.transferFrom(msg.sender, address(this), fee);
        require(success, "FUN token transfer failed");
        
        hasPaidVoteGas[msg.sender] = true;
        
        emit FeePaid(msg.sender, fee);
    }
    
    /**
     * @dev Reset fee status after a transaction is completed
     */
    function resetFeeStatus(address user) internal {
        hasPaidVoteGas[user] = false;
        emit FeeExpired(user);
    }
    
    /**
     * @dev Create a new asset
     */
    function createAsset(
        string memory name,
        string memory symbol,
        string memory ipfsMetadata,
        uint256 totalShares,
        uint256 pricePerShare,
        uint256 minInvestment,
        uint256 maxInvestment,
        uint256 totalValue,
        uint256 apy,
        uint256 fundingDeadline
    ) external returns (uint256) {
        require(hasPaidVoteGas[msg.sender], "Must pay fee with FUN tokens to create assets");
        require(totalShares > 0, "Total shares must be greater than 0");
        require(pricePerShare > 0, "Price per share must be greater than 0");
        require(fundingDeadline > block.timestamp, "Funding deadline must be in the future");
        
        uint256 assetId = assetCount++;
        Asset storage newAsset = assets[assetId];
        
        newAsset.id = assetId;
        newAsset.name = name;
        newAsset.symbol = symbol;
        newAsset.ipfsMetadata = ipfsMetadata;
        newAsset.totalShares = totalShares;
        newAsset.availableShares = totalShares; // All shares available initially
        newAsset.pricePerShare = pricePerShare;
        newAsset.minInvestment = minInvestment;
        newAsset.maxInvestment = maxInvestment;
        newAsset.totalValue = totalValue;
        newAsset.fundedAmount = 0;
        newAsset.apy = apy;
        newAsset.fundingDeadline = fundingDeadline;
        newAsset.creator = msg.sender;
        newAsset.status = AssetStatus.PENDING; // Need governance approval
        
        emit AssetCreated(assetId, name, msg.sender);
        
        // Reset fee status after transaction
        resetFeeStatus(msg.sender);
        
        return assetId;
    }
    
    /**
     * @dev Update the status of an asset
     */
    function updateAssetStatus(uint256 assetId, AssetStatus status) external {
        require(hasPaidVoteGas[msg.sender], "Must pay fee with FUN tokens to update asset status");
        require(msg.sender == assets[assetId].creator || msg.sender == owner(), "Not authorized");
        require(assetId < assetCount, "Asset does not exist");
        
        assets[assetId].status = status;
        
        emit AssetStatusUpdated(assetId, status);
        
        // Reset fee status after transaction
        resetFeeStatus(msg.sender);
    }
    
    /**
     * @dev Purchase shares in an asset
     */
    function purchaseShares(uint256 assetId, uint256 amount) external {
        require(hasPaidVoteGas[msg.sender], "Must pay fee with FUN tokens to purchase shares");
        require(assetId < assetCount, "Asset does not exist");
        require(assets[assetId].status == AssetStatus.FUNDING, "Asset not in funding stage");
        require(block.timestamp < assets[assetId].fundingDeadline, "Funding deadline passed");
        
        Asset storage asset = assets[assetId];
        
        uint256 sharesToPurchase = amount / asset.pricePerShare;
        require(sharesToPurchase > 0, "Amount too small to purchase shares");
        require(sharesToPurchase <= asset.availableShares, "Not enough shares available");
        
        if (asset.minInvestment > 0) {
            require(amount >= asset.minInvestment, "Below minimum investment");
        }
        if (asset.maxInvestment > 0) {
            require(amount <= asset.maxInvestment, "Above maximum investment");
        }
        
        // Transfer USDT from user to contract
        bool success = usdtToken.transferFrom(msg.sender, address(this), amount);
        require(success, "USDT transfer failed");
        
        // Update asset state
        asset.availableShares -= sharesToPurchase;
        asset.fundedAmount += amount;
        
        // Track investor
        if (asset.investorAmounts[msg.sender] == 0) {
            asset.investors.push(msg.sender);
            userAssets[msg.sender].push(assetId);
        }
        asset.investorAmounts[msg.sender] += amount;
        
        emit SharesPurchased(assetId, msg.sender, amount);
        
        // Reset fee status after transaction
        resetFeeStatus(msg.sender);
    }
    
    /**
     * @dev Create a governance proposal
     */
    function createProposal(
        uint256 assetId,
        string memory title,
        string memory description,
        string memory ipfsMetadata,
        string memory executionData
    ) external returns (uint256) {
        require(hasPaidVoteGas[msg.sender], "Must pay fee with FUN tokens to create proposals");
        require(assetId < assetCount, "Asset does not exist");
        
        uint256 proposalId = proposalCount++;
        Proposal storage newProposal = proposals[proposalId];
        
        newProposal.id = proposalId;
        newProposal.title = title;
        newProposal.description = description;
        newProposal.ipfsMetadata = ipfsMetadata;
        newProposal.assetId = assetId;
        newProposal.voteStart = block.timestamp;
        newProposal.voteEnd = block.timestamp + votingPeriod;
        newProposal.yesVotes = 0;
        newProposal.noVotes = 0;
        newProposal.executionTime = 0;
        newProposal.executed = false;
        newProposal.passed = false;
        newProposal.executionData = executionData;
        newProposal.creator = msg.sender;
        
        emit ProposalCreated(proposalId, assetId, msg.sender);
        
        // Reset fee status after transaction
        resetFeeStatus(msg.sender);
        
        return proposalId;
    }
    
    /**
     * @dev Get the total supply of FUN tokens to calculate voting weight
     */
    function getFunTotalSupply() public view returns (uint256) {
        return funToken.totalSupply();
    }
    
    /**
     * @dev Vote on a proposal with weight based on FUN token holdings
     */
    function castVote(uint256 proposalId, bool support) external {
        require(hasPaidVoteGas[msg.sender], "Must pay fee with FUN tokens to vote");
        require(proposalId < proposalCount, "Proposal does not exist");
        require(block.timestamp >= proposals[proposalId].voteStart, "Voting not started");
        require(block.timestamp <= proposals[proposalId].voteEnd, "Voting ended");
        require(!proposals[proposalId].hasVoted[msg.sender], "Already voted");
        
        Proposal storage proposal = proposals[proposalId];
        
        // Calculate voting weight based on FUN token holdings
        uint256 voterBalance = funToken.balanceOf(msg.sender);
        require(voterBalance > 0, "Must hold FUN tokens to vote");
        
        // Record voter's weight
        proposal.voteWeights[msg.sender] = voterBalance;
        
        // Add votes based on token balance
        if (support) {
            proposal.yesVotes += voterBalance;
        } else {
            proposal.noVotes += voterBalance;
        }
        
        proposal.hasVoted[msg.sender] = true;
        
        emit VoteCast(proposalId, msg.sender, support, voterBalance);
        
        // Check if proposal passed with >51% of total supply
        uint256 totalSupply = getFunTotalSupply();
        uint256 majorityThreshold = (totalSupply * 51) / 100;
        
        if (proposal.yesVotes > majorityThreshold) {
            proposal.passed = true;
            proposal.executionTime = block.timestamp;
            emit ProposalStatusUpdated(proposalId, true);
        }
        
        // Reset fee status after transaction
        resetFeeStatus(msg.sender);
    }
    
    /**
     * @dev Check if a voter has voted on a proposal
     */
    function hasVoted(uint256 proposalId, address voter) external view returns (bool) {
        require(proposalId < proposalCount, "Proposal does not exist");
        return proposals[proposalId].hasVoted[voter];
    }
    
    /**
     * @dev Get voter's weight on a specific proposal
     */
    function getVoteWeight(uint256 proposalId, address voter) external view returns (uint256) {
        require(proposalId < proposalCount, "Proposal does not exist");
        return proposals[proposalId].voteWeights[voter];
    }
    
    /**
     * @dev Get the current voting status (yes votes, no votes, total supply)
     */
    function getVotingStatus(uint256 proposalId) external view returns (uint256 yesVotes, uint256 noVotes, uint256 totalSupply) {
        require(proposalId < proposalCount, "Proposal does not exist");
        Proposal storage proposal = proposals[proposalId];
        
        return (
            proposal.yesVotes,
            proposal.noVotes,
            getFunTotalSupply()
        );
    }
    
    /**
     * @dev Execute a passed proposal
     */
    function executeProposal(uint256 proposalId) external {
        require(hasPaidVoteGas[msg.sender], "Must pay fee with FUN tokens to execute proposals");
        require(proposalId < proposalCount, "Proposal does not exist");
        require(!proposals[proposalId].executed, "Already executed");
        
        Proposal storage proposal = proposals[proposalId];
        
        // Check if proposal has passed either through voting period end or majority
        bool hasPassedByTime = block.timestamp > proposal.voteEnd && proposal.yesVotes > proposal.noVotes;
        bool hasPassedByMajority = proposal.passed; // Set previously if >51% votes achieved
        
        require(hasPassedByTime || hasPassedByMajority, "Proposal has not passed");
        
        proposal.executed = true;
        if (!proposal.passed) {
            proposal.passed = true;
            proposal.executionTime = block.timestamp;
            emit ProposalStatusUpdated(proposalId, true);
        }
        
        // Execute proposal logic based on execution data
        // For this example, we'll handle asset status updates and withdrawals
        
        if (keccak256(abi.encodePacked(proposal.title)) == keccak256(abi.encodePacked("Approve Asset Funding"))) {
            // Update asset status to FUNDING
            assets[proposal.assetId].status = AssetStatus.FUNDING;
            emit AssetStatusUpdated(proposal.assetId, AssetStatus.FUNDING);
        } else if (bytes(proposal.executionData).length > 0) {
            // Try to decode execution data (in real implementation, more robust parsing would be used)
            // This is a simplified example
            string memory executionType = "withdrawal"; // Simplified for this example
            
            if (keccak256(abi.encodePacked(executionType)) == keccak256(abi.encodePacked("withdrawal"))) {
                // Process withdrawal
                // In a real implementation, you would parse the executionData JSON and extract parameters
                
                // For this example, we assume that there is enough data to execute
                // Transfer funds to the asset creator
                uint256 withdrawalAmount = 1000000; // 1 USDT (simplified)
                address recipient = assets[proposal.assetId].creator;
                
                bool success = usdtToken.transfer(recipient, withdrawalAmount);
                require(success, "USDT transfer failed");
            }
        }
        
        emit ProposalExecuted(proposalId);
        
        // Reset fee status after transaction
        resetFeeStatus(msg.sender);
    }
    
    /**
     * @dev Distribute earnings to investors
     */
    function distributeEarnings(uint256 assetId, uint256 amount) external {
        require(assetId < assetCount, "Asset does not exist");
        require(msg.sender == assets[assetId].creator, "Only creator can distribute earnings");
        require(assets[assetId].status == AssetStatus.CLOSED, "Asset must be closed");
        
        Asset storage asset = assets[assetId];
        
        // Transfer USDT from creator to contract
        bool success = usdtToken.transferFrom(msg.sender, address(this), amount);
        require(success, "USDT transfer failed");
        
        // Record the earnings distribution
        assetEarnings[assetId].push(EarningsDistribution({
            timestamp: block.timestamp,
            amount: amount
        }));
        
        // Distribute to investors based on their share
        for (uint256 i = 0; i < asset.investors.length; i++) {
            address investor = asset.investors[i];
            uint256 investorAmount = asset.investorAmounts[investor];
            
            if (investorAmount > 0) {
                uint256 proportion = (investorAmount * 1e18) / asset.fundedAmount;
                uint256 payout = (amount * proportion) / 1e18;
                
                if (payout > 0) {
                    // Instead of direct transfer, add to user balance
                    userBalances[investor] += payout;
                    emit UserBalanceUpdated(investor, userBalances[investor]);
                }
            }
        }
        
        emit EarningsDistributed(assetId, amount);
    }
    
    /**
     * @dev Close the funding period for an asset
     */
    function closeFunding(uint256 assetId) external {
        require(assetId < assetCount, "Asset does not exist");
        require(
            msg.sender == assets[assetId].creator || 
            msg.sender == owner() || 
            block.timestamp >= assets[assetId].fundingDeadline, 
            "Not authorized or deadline not reached"
        );
        require(assets[assetId].status == AssetStatus.FUNDING, "Asset not in funding stage");
        
        assets[assetId].status = AssetStatus.CLOSED;
        
        emit FundingClosed(assetId);
    }
    
    /**
     * @dev Withdraw asset funds (must be approved by governance)
     */
    function withdrawAssetFunds(uint256 assetId, uint256 amount, address recipient) external {
        require(assetId < assetCount, "Asset does not exist");
        require(msg.sender == owner(), "Only owner can execute withdrawals");
        require(assets[assetId].creator == recipient, "Recipient must be asset creator");
        
        // Check if there are sufficient funds
        require(amount <= assets[assetId].fundedAmount, "Insufficient funds");
        
        // Transfer USDT to recipient
        bool success = usdtToken.transfer(recipient, amount);
        require(success, "USDT transfer failed");
    }
    
    /**
     * @dev Get asset investor amount
     */
    function getInvestorAmount(uint256 assetId, address investor) external view returns (uint256) {
        require(assetId < assetCount, "Asset does not exist");
        return assets[assetId].investorAmounts[investor];
    }
    
    /**
     * @dev Get asset investors
     */
    function getAssetInvestors(uint256 assetId) external view returns (address[] memory) {
        require(assetId < assetCount, "Asset does not exist");
        return assets[assetId].investors;
    }
    
    /**
     * @dev Get investor assets
     */
    function getInvestorAssets(address investor) external view returns (uint256[] memory) {
        return userAssets[investor];
    }
    
    /**
     * @dev Get asset status
     */
    function getAssetStatus(uint256 assetId) external view returns (AssetStatus) {
        require(assetId < assetCount, "Asset does not exist");
        return assets[assetId].status;
    }
    
    /**
     * @dev Emergency function to update the token addresses
     */
    function updateTokenAddresses(address newUsdtToken, address newFunToken) external onlyOwner {
        if (newUsdtToken != address(0)) {
            usdtToken = IERC20(newUsdtToken);
        }
        if (newFunToken != address(0)) {
            funToken = IERC20(newFunToken);
        }
    }
    
    /**
     * @dev Check if user can trade this asset
     */
    function canUserTradeAsset(uint256 assetId, address user) public view returns (bool) {
        require(assetId < assetCount, "Asset does not exist");
        
        // Asset must be in CLOSED status to be tradable
        if (assets[assetId].status != AssetStatus.CLOSED) {
            return false;
        }
        
        // For selling: User must own shares
        return assets[assetId].investorAmounts[user] > 0;
    }
    
    /**
     * @dev Create a new buy or sell order
     */
    function createOrder(
        uint256 assetId, 
        uint256 shareAmount, 
        uint256 pricePerShare, 
        bool isBuyOrder
    ) external nonReentrant returns (uint256) {
        require(assetId < assetCount, "Asset does not exist");
        require(assets[assetId].status == AssetStatus.CLOSED, "Asset must be closed to trade");
        require(shareAmount > 0, "Amount must be greater than 0");
        require(pricePerShare > 0, "Price must be greater than 0");
        
        uint256 totalPrice = shareAmount * pricePerShare;
        
        // For sell orders, check that user has enough shares
        if (!isBuyOrder) {
            require(
                assets[assetId].investorAmounts[msg.sender] >= totalPrice,
                "Insufficient shares to sell"
            );
        } else {
            // For buy orders, transfer USDT to contract first
            bool success = usdtToken.transferFrom(msg.sender, address(this), totalPrice);
            require(success, "USDT transfer failed");
            
            // Add to user balance within contract
            userBalances[msg.sender] += totalPrice;
            emit UserBalanceUpdated(msg.sender, userBalances[msg.sender]);
        }
        
        // Create order
        uint256 orderId = orderCount++;
        Order storage newOrder = orders[orderId];
        
        newOrder.id = orderId;
        newOrder.assetId = assetId;
        newOrder.creator = msg.sender;
        newOrder.shareAmount = shareAmount;
        newOrder.pricePerShare = pricePerShare;
        newOrder.totalPrice = totalPrice;
        newOrder.filledAmount = 0;
        newOrder.timestamp = block.timestamp;
        newOrder.isBuyOrder = isBuyOrder;
        newOrder.isActive = true;
        
        // Track orders by asset
        if (isBuyOrder) {
            assetBuyOrders[assetId].push(orderId);
        } else {
            assetSellOrders[assetId].push(orderId);
        }
        
        // Track user orders
        userOrders[msg.sender].push(orderId);
        
        emit OrderCreated(orderId, assetId, msg.sender, isBuyOrder, shareAmount, pricePerShare);
        
        // Try to match with existing orders
        _tryMatchOrder(orderId);
        
        return orderId;
    }
    
    /**
     * @dev Cancel an existing order
     */
    function cancelOrder(uint256 orderId) external nonReentrant {
        require(orderId < orderCount, "Order does not exist");
        require(orders[orderId].creator == msg.sender, "Not your order");
        require(orders[orderId].isActive, "Order already inactive");
        
        Order storage order = orders[orderId];
        uint256 remainingAmount = order.shareAmount - order.filledAmount;
        
        order.isActive = false;
        
        // If it's a buy order, refund the user's USDT
        if (order.isBuyOrder && remainingAmount > 0) {
            uint256 refundAmount = remainingAmount * order.pricePerShare;
            
            // Reduce user's balance in the contract
            userBalances[msg.sender] -= refundAmount;
            emit UserBalanceUpdated(msg.sender, userBalances[msg.sender]);
            
            // Transfer USDT back to user
            bool success = usdtToken.transfer(msg.sender, refundAmount);
            require(success, "USDT transfer failed");
        }
        
        emit OrderCancelled(orderId, order.assetId, msg.sender);
    }
    
    /**
     * @dev Try to match a new order with existing opposite orders
     */
    function _tryMatchOrder(uint256 orderId) internal {
        Order storage order = orders[orderId];
        if (!order.isActive) return;
        
        uint256 assetId = order.assetId;
        uint256 remainingAmount = order.shareAmount - order.filledAmount;
        
        if (remainingAmount == 0) return;
        
        // Get opposite orders
        uint256[] storage oppositeOrders = order.isBuyOrder ? 
            assetSellOrders[assetId] : assetBuyOrders[assetId];
        
        // Sort orders by price (best price first)
        // For simplicity, we'll iterate through all orders, but a production system would use a more efficient data structure
        for (uint256 i = 0; i < oppositeOrders.length; i++) {
            uint256 oppositeOrderId = oppositeOrders[i];
            Order storage oppositeOrder = orders[oppositeOrderId];
            
            // Skip inactive or fully filled orders
            if (!oppositeOrder.isActive || oppositeOrder.filledAmount == oppositeOrder.shareAmount) {
                continue;
            }
            
            // Check if prices match
            bool priceMatches = order.isBuyOrder ? 
                order.pricePerShare >= oppositeOrder.pricePerShare : // Buy order can match if its price is >= sell price
                order.pricePerShare <= oppositeOrder.pricePerShare;  // Sell order can match if its price is <= buy price
            
            if (priceMatches) {
                // Calculate match amount
                uint256 oppositeRemaining = oppositeOrder.shareAmount - oppositeOrder.filledAmount;
                uint256 matchAmount = remainingAmount < oppositeRemaining ? remainingAmount : oppositeRemaining;
                
                if (matchAmount > 0) {
                    // Use the oppositeOrder's price for the trade
                    uint256 tradePrice = oppositeOrder.pricePerShare;
                    uint256 tradeTotalPrice = matchAmount * tradePrice;
                    
                    // Update order fill amounts
                    order.filledAmount += matchAmount;
                    oppositeOrder.filledAmount += matchAmount;
                    
                    // Set orders inactive if fully filled
                    if (order.filledAmount == order.shareAmount) {
                        order.isActive = false;
                    }
                    if (oppositeOrder.filledAmount == oppositeOrder.shareAmount) {
                        oppositeOrder.isActive = false;
                    }
                    
                    // Determine buyer and seller
                    address buyer = order.isBuyOrder ? order.creator : oppositeOrder.creator;
                    address seller = order.isBuyOrder ? oppositeOrder.creator : order.creator;
                    
                    // Calculate fee (1% of trade value)
                    uint256 fee = (tradeTotalPrice * tradeFeePercent) / 100;
                    uint256 sellerReceives = tradeTotalPrice - fee;
                    
                    // Update user balances
                    if (order.isBuyOrder) {
                        // Buyer already deposited USDT when creating buy order
                        // Reduce buy order creator's balance
                        userBalances[buyer] -= tradeTotalPrice;
                        
                        // Update asset ownership
                        if (assets[assetId].investorAmounts[seller] > 0) {
                            assets[assetId].investorAmounts[seller] -= tradeTotalPrice;
                        }
                        
                        if (assets[assetId].investorAmounts[buyer] == 0) {
                            assets[assetId].investors.push(buyer);
                            userAssets[buyer].push(assetId);
                        }
                        assets[assetId].investorAmounts[buyer] += tradeTotalPrice;
                        
                        // Add to seller's balance
                        userBalances[seller] += sellerReceives;
                    } else {
                        // Sell order creator receives USDT
                        // Reduce buyer's balance (from the opposite buy order)
                        userBalances[buyer] -= tradeTotalPrice;
                        
                        // Update asset ownership
                        if (assets[assetId].investorAmounts[seller] > 0) {
                            assets[assetId].investorAmounts[seller] -= tradeTotalPrice;
                        }
                        
                        if (assets[assetId].investorAmounts[buyer] == 0) {
                            assets[assetId].investors.push(buyer);
                            userAssets[buyer].push(assetId);
                        }
                        assets[assetId].investorAmounts[buyer] += tradeTotalPrice;
                        
                        // Add to seller's balance
                        userBalances[seller] += sellerReceives;
                    }
                    
                    emit UserBalanceUpdated(buyer, userBalances[buyer]);
                    emit UserBalanceUpdated(seller, userBalances[seller]);
                    
                    // Create trade record
                    uint256 tradeId = tradeCount++;
                    trades[tradeId] = Trade({
                        id: tradeId,
                        assetId: assetId,
                        orderId: orderId,
                        buyer: buyer,
                        seller: seller,
                        shareAmount: matchAmount,
                        pricePerShare: tradePrice,
                        totalPrice: tradeTotalPrice,
                        timestamp: block.timestamp
                    });
                    
                    // Track user trades
                    userTrades[buyer].push(tradeId);
                    userTrades[seller].push(tradeId);
                    
                    emit OrderFilled(orderId, assetId, matchAmount, tradePrice);
                    emit TradeExecuted(tradeId, assetId, buyer, seller, matchAmount, tradePrice);
                    
                    // Update remaining amount
                    remainingAmount -= matchAmount;
                    if (remainingAmount == 0) break;
                }
            }
        }
    }
    
    /**
     * @dev Get all buy orders for an asset
     */
    function getAssetBuyOrders(uint256 assetId) external view returns (uint256[] memory) {
        return assetBuyOrders[assetId];
    }
    
    /**
     * @dev Get all sell orders for an asset
     */
    function getAssetSellOrders(uint256 assetId) external view returns (uint256[] memory) {
        return assetSellOrders[assetId];
    }
    
    /**
     * @dev Get order details
     */
    function getOrder(uint256 orderId) external view returns (
        uint256 id,
        uint256 assetId,
        address creator,
        uint256 shareAmount,
        uint256 pricePerShare,
        uint256 totalPrice,
        uint256 filledAmount,
        uint256 timestamp,
        bool isBuyOrder,
        bool isActive
    ) {
        require(orderId < orderCount, "Order does not exist");
        
        Order storage order = orders[orderId];
        return (
            order.id,
            order.assetId,
            order.creator,
            order.shareAmount,
            order.pricePerShare,
            order.totalPrice,
            order.filledAmount,
            order.timestamp,
            order.isBuyOrder,
            order.isActive
        );
    }
    
    /**
     * @dev Get trade details
     */
    function getTrade(uint256 tradeId) external view returns (
        uint256 id,
        uint256 assetId,
        uint256 orderId,
        address buyer,
        address seller,
        uint256 shareAmount,
        uint256 pricePerShare,
        uint256 totalPrice,
        uint256 timestamp
    ) {
        require(tradeId < tradeCount, "Trade does not exist");
        
        Trade storage trade = trades[tradeId];
        return (
            trade.id,
            trade.assetId,
            trade.orderId,
            trade.buyer,
            trade.seller,
            trade.shareAmount,
            trade.pricePerShare,
            trade.totalPrice,
            trade.timestamp
        );
    }
    
    /**
     * @dev Get user's orders
     */
    function getUserOrders(address user) external view returns (uint256[] memory) {
        return userOrders[user];
    }
    
    /**
     * @dev Get user's trades
     */
    function getUserTrades(address user) external view returns (uint256[] memory) {
        return userTrades[user];
    }
    
    /**
     * @dev Get user's balance
     */
    function getUserBalance(address user) external view returns (uint256) {
        return userBalances[user];
    }
    
    /**
     * @dev Withdraw user's balance
     */
    function withdrawBalance(uint256 amount) external nonReentrant {
        require(userBalances[msg.sender] >= amount, "Insufficient balance");
        
        userBalances[msg.sender] -= amount;
        emit UserBalanceUpdated(msg.sender, userBalances[msg.sender]);
        
        bool success = usdtToken.transfer(msg.sender, amount);
        require(success, "USDT transfer failed");
        
        emit Withdrawal(msg.sender, amount);
    }
    
    /**
     * @dev Get recent trades for an asset (returns the most recent 20 trades)
     */
    function getRecentTrades(uint256 assetId) external view returns (uint256[] memory) {
        uint256 count = 0;
        uint256[] memory recentTrades = new uint256[](20);
        
        // Count backward from the most recent trade
        for (uint256 i = tradeCount; i > 0 && count < 20; i--) {
            uint256 tradeId = i - 1;
            if (trades[tradeId].assetId == assetId) {
                recentTrades[count] = tradeId;
                count++;
            }
        }
        
        // Trim array to actual size
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = recentTrades[i];
        }
        
        return result;
    }
    
    /**
     * @dev Get highest bid and lowest ask for an asset
     */
    function getMarketPrices(uint256 assetId) external view returns (uint256 highestBid, uint256 lowestAsk) {
        highestBid = 0;
        lowestAsk = type(uint256).max;
        
        // Find highest bid
        for (uint256 i = 0; i < assetBuyOrders[assetId].length; i++) {
            uint256 orderId = assetBuyOrders[assetId][i];
            Order storage order = orders[orderId];
            
            if (order.isActive && order.filledAmount < order.shareAmount) {
                if (order.pricePerShare > highestBid) {
                    highestBid = order.pricePerShare;
                }
            }
        }
        
        // Find lowest ask
        for (uint256 i = 0; i < assetSellOrders[assetId].length; i++) {
            uint256 orderId = assetSellOrders[assetId][i];
            Order storage order = orders[orderId];
            
            if (order.isActive && order.filledAmount < order.shareAmount) {
                if (order.pricePerShare < lowestAsk) {
                    lowestAsk = order.pricePerShare;
                }
            }
        }
        
        if (lowestAsk == type(uint256).max) {
            lowestAsk = 0;
        }
        
        return (highestBid, lowestAsk);
    }
    
    /**
     * @dev Manually match an order (can be called by anyone, but mostly for maintenance)
     */
    function matchOrder(uint256 orderId) external {
        require(orderId < orderCount, "Order does not exist");
        require(orders[orderId].isActive, "Order not active");
        
        _tryMatchOrder(orderId);
    }
    
    /**
     * @dev Get asset details for frontend display
     * Combined function to reduce transaction count
     */
    function getAssetDetails(uint256 assetId) external view returns (
        uint256 id,
        string memory name,
        string memory symbol,
        string memory ipfsMetadata,
        uint256 totalShares,
        uint256 availableShares,
        uint256 pricePerShare,
        uint256 minInvestment,
        uint256 maxInvestment,
        uint256 totalValue,
        uint256 fundedAmount,
        uint256 apy,
        uint256 fundingDeadline,
        address creator,
        uint8 status
    ) {
        require(assetId < assetCount, "Asset does not exist");
        Asset storage asset = assets[assetId];
        
        return (
            asset.id,
            asset.name,
            asset.symbol,
            asset.ipfsMetadata,
            asset.totalShares,
            asset.availableShares,
            asset.pricePerShare,
            asset.minInvestment,
            asset.maxInvestment,
            asset.totalValue,
            asset.fundedAmount,
            asset.apy,
            asset.fundingDeadline,
            asset.creator,
            uint8(asset.status)
        );
    }
    
    /**
     * @dev Get proposal details for frontend display
     * Combined function to reduce transaction count
     */
    function getProposalDetails(uint256 proposalId) external view returns (
        uint256 id,
        string memory title,
        string memory description,
        string memory ipfsMetadata,
        uint256 assetId,
        uint256 voteStart,
        uint256 voteEnd,
        uint256 yesVotes,
        uint256 noVotes,
        uint256 executionTime,
        bool executed,
        bool passed,
        string memory executionData,
        address creator,
        uint256 totalVotes,
        uint256 totalSupply
    ) {
        require(proposalId < proposalCount, "Proposal does not exist");
        Proposal storage proposal = proposals[proposalId];
        
        return (
            proposal.id,
            proposal.title,
            proposal.description,
            proposal.ipfsMetadata,
            proposal.assetId,
            proposal.voteStart,
            proposal.voteEnd,
            proposal.yesVotes,
            proposal.noVotes,
            proposal.executionTime,
            proposal.executed,
            proposal.passed,
            proposal.executionData,
            proposal.creator,
            proposal.yesVotes + proposal.noVotes,
            getFunTotalSupply()
        );
    }
    
    /**
     * @dev Emergency function to update vote fee
     */
    function updateVoteFee(uint256 newFee) external onlyOwner {
        voteFee = newFee;
    }
    
    /**
     * @dev Emergency function to update voting period
     */
    function updateVotingPeriod(uint256 newPeriod) external onlyOwner {
        votingPeriod = newPeriod;
    }
    
    /**
     * @dev Get all assets
     */
    function getAllAssets() external view returns (
        uint256[] memory ids,
        string[] memory names,
        string[] memory symbols,
        string[] memory ipfsMetadata,
        uint256[] memory totalShares,
        uint256[] memory availableShares,
        uint256[] memory pricePerShares,
        uint256[] memory minInvestments,
        uint256[] memory maxInvestments,
        uint256[] memory totalValues,
        uint256[] memory fundedAmounts,
        uint256[] memory apys,
        uint256[] memory fundingDeadlines,
        address[] memory creators,
        uint8[] memory statuses
    ) {
        uint256 count = assetCount;
        
        ids = new uint256[](count);
        names = new string[](count);
        symbols = new string[](count);
        ipfsMetadata = new string[](count);
        totalShares = new uint256[](count);
        availableShares = new uint256[](count);
        pricePerShares = new uint256[](count);
        minInvestments = new uint256[](count);
        maxInvestments = new uint256[](count);
        totalValues = new uint256[](count);
        fundedAmounts = new uint256[](count);
        apys = new uint256[](count);
        fundingDeadlines = new uint256[](count);
        creators = new address[](count);
        statuses = new uint8[](count);
        
        for (uint256 i = 0; i < count; i++) {
            Asset storage asset = assets[i];
            ids[i] = asset.id;
            names[i] = asset.name;
            symbols[i] = asset.symbol;
            ipfsMetadata[i] = asset.ipfsMetadata;
            totalShares[i] = asset.totalShares;
            availableShares[i] = asset.availableShares;
            pricePerShares[i] = asset.pricePerShare;
            minInvestments[i] = asset.minInvestment;
            maxInvestments[i] = asset.maxInvestment;
            totalValues[i] = asset.totalValue;
            fundedAmounts[i] = asset.fundedAmount;
            apys[i] = asset.apy;
            fundingDeadlines[i] = asset.fundingDeadline;
            creators[i] = asset.creator;
            statuses[i] = uint8(asset.status);
        }
        
        return (
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
        );
    }

    /**
     * @dev Get all proposals
     * Combined function to reduce transaction count
     */
    function getAllProposals() external view returns (
        uint256[] memory ids,
        string[] memory titles,
        string[] memory descriptions,
        string[] memory ipfsMetadata,
        uint256[] memory assetIds,
        uint256[] memory voteStarts,
        uint256[] memory voteEnds,
        uint256[] memory yesVotes,
        uint256[] memory noVotes,
        uint256[] memory executionTimes,
        bool[] memory executed,
        bool[] memory passed,
        string[] memory executionData,
        address[] memory creators,
        uint256[] memory totalVotes,
        uint256[] memory totalSupplies
    ) {
        uint256 count = proposalCount;
        
        ids = new uint256[](count);
        titles = new string[](count);
        descriptions = new string[](count);
        ipfsMetadata = new string[](count);
        assetIds = new uint256[](count);
        voteStarts = new uint256[](count);
        voteEnds = new uint256[](count);
        yesVotes = new uint256[](count);
        noVotes = new uint256[](count);
        executionTimes = new uint256[](count);
        executed = new bool[](count);
        passed = new bool[](count);
        executionData = new string[](count);
        creators = new address[](count);
        totalVotes = new uint256[](count);
        totalSupplies = new uint256[](count);
        
        for (uint256 i = 0; i < count; i++) {
            Proposal storage proposal = proposals[i];
            ids[i] = proposal.id;
            titles[i] = proposal.title;
            descriptions[i] = proposal.description;
            ipfsMetadata[i] = proposal.ipfsMetadata;
            assetIds[i] = proposal.assetId;
            voteStarts[i] = proposal.voteStart;
            voteEnds[i] = proposal.voteEnd;
            yesVotes[i] = proposal.yesVotes;
            noVotes[i] = proposal.noVotes;
            executionTimes[i] = proposal.executionTime;
            executed[i] = proposal.executed;
            passed[i] = proposal.passed;
            executionData[i] = proposal.executionData;
            creators[i] = proposal.creator;
            totalVotes[i] = proposal.yesVotes + proposal.noVotes;
            totalSupplies[i] = getFunTotalSupply();
        }
        
        return (
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
        );
    }
}