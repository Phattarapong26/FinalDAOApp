import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Marketplace from "./pages/Marketplace";
import AssetDetail from "./pages/AssetDetail";
import InvestAsset from "./pages/InvestAsset";
import Governance from "./pages/Governance";
import ProposalDetail from "./pages/ProposalDetail";
import CreateProposal from "./pages/CreateProposal";
import Trade from "./pages/Trade";
import Dashboard from "./pages/Dashboard";
import CreateAsset from "./pages/CreateAsset";
import UserOrders from "./pages/UserOrders";
import AssetInvestors from "./pages/AssetInvestors";
import { Web3Provider } from "./contexts/Web3Context";
import { ContractProvider } from "./contexts/ContractContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Web3Provider>
        <ContractProvider>
          <Toaster />
          <Sonner />
          <HashRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/asset/:id" element={<AssetDetail />} />
              <Route path="/asset/:id/invest" element={<InvestAsset />} />
              <Route path="/asset/investors/:id" element={<AssetInvestors />} />
              <Route path="/create-asset" element={<CreateAsset />} />
              <Route path="/governance" element={<Governance />} />
              <Route path="/proposal/:id" element={<ProposalDetail />} />
              <Route path="/proposals/create" element={<CreateProposal />} />
              <Route path="/proposals/create/:assetId" element={<CreateProposal />} />
              <Route path="/trade/:id" element={<Trade />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/user-orders" element={<UserOrders />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </HashRouter>
        </ContractProvider>
      </Web3Provider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
