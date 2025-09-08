import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useWeb3 } from "@/contexts/Web3Context";
import { useContract } from "@/contexts/ContractContext";
import { formatBalance, shortenAddress } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { 
  Menu, 
  X, 
  ChevronDown, 
  Check, 
  Home, 
  Store, 
  GalleryVerticalEnd, 
  LayoutDashboard, 
  PlusCircle, 
  ScrollText, 
  BarChartBig, 
  Wallet, 
  LogOut, 
  ShoppingCart,
  Sparkles
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

import FundeeLogo from '../../../imagePR/FundeeDAO.png';

const navigation = [
  { name: "Home", path: "/", icon: <Home className="h-4 w-4 mr-2" /> },
  { name: "Marketplace", path: "/marketplace", icon: <Store className="h-4 w-4 mr-2" /> },
  { name: "Governance", path: "/governance", icon: <GalleryVerticalEnd className="h-4 w-4 mr-2" /> },
  { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard className="h-4 w-4 mr-2" /> },
];

const Header: React.FC = () => {
  const location = useLocation();
  const { isConnected, connectWallet, disconnectWallet, account } = useWeb3();
  const { 
    usdtBalance, 
    usdtSymbol, 
    usdtDecimals, 
    funBalance, 
    funSymbol, 
    funDecimals, 
    payFeeWithToken, 
    hasPaidFee,
    checkFeeStatus
  } = useContract();
  const isMobile = useIsMobile();

  // Check fee status on mount and when account changes
  useEffect(() => {
    if (isConnected && account) {
      checkFeeStatus();
    }
  }, [isConnected, account, checkFeeStatus]);

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

  return (
    <header className="bg-white shadow-sm backdrop-blur-md bg-opacity-90 sticky top-0 z-50 pt-[25px] pb-[25px]">
      <div className="container mx-auto px-4">
        <div className="flex h-16 justify-between items-center">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-2xl font-bold text-indigo-600 flex items-center">
              <img 
                width={150} 
                height={150} 
                className="text-dao mr-2" 
                src={FundeeLogo}
                alt="FractionalDAO Logo" 
              />
            </Link>

            {!isMobile && (
              <nav className="hidden md:flex space-x-6">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`text-sm font-medium transition-colors hover:text-indigo-500 flex items-center ${
                      location.pathname === item.path ? "text-indigo-600" : "text-gray-600"
                    }`}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                ))}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="text-sm font-medium text-gray-600 flex items-center hover:text-indigo-500 transition-colors">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Create
                      <ChevronDown className="ml-1 h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="animate-in slide-in-from-top-5">
                    <DropdownMenuItem asChild>
                      <Link to="/create-asset" className="flex items-center">
                        <Store className="h-4 w-4 mr-2" />
                        Create Asset
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/proposals/create" className="flex items-center">
                        <ScrollText className="h-4 w-4 mr-2" />
                        Create Proposal
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </nav>
            )}
          </div>

          <div className="flex items-center gap-4">
          {isConnected && (
              <Button 
                variant={hasPaidFee ? "outline" : "default"} 
                size="sm" 
                onClick={handlePayFee}
                className={hasPaidFee ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800" : ""}
                disabled={hasPaidFee}
              >
                {hasPaidFee ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    จ่ายแล้ว
                  </>
                ) : (
                  "จ่ายค่าธรรมเนียม"
                )}
              </Button>
            )}
            {isConnected && !isMobile && (
              <div className="hidden md:flex items-center space-x-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="border-indigo-100 bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
                      <Wallet className="h-4 w-4 mr-2 text-indigo-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="animate-in slide-in-from-top-5">
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="flex items-center">
                        <BarChartBig className="h-4 w-4 mr-2" />
                        View Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/user-orders" className="flex items-center">
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        My Orders
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

  

            {isConnected ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="border-indigo-100 bg-indigo-50 hover:bg-indigo-100">
                      <Wallet className="h-4 w-4 mr-2 text-indigo-600" />
                      {shortenAddress(account || "")}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="animate-in slide-in-from-top-5">
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="flex items-center">
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={disconnectWallet} 
                  className="flex items-center text-red-500 hover:text-red-600 border-red-200 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  ออกจากระบบ
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={connectWallet} className="bg-indigo-600 hover:bg-indigo-700">
                <Wallet className="h-4 w-4 mr-2" />
                เชื่อมต่อกระเป๋าเงิน
              </Button>
            )}

            {isMobile && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-sm">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between border-b pb-4">
                      <Link to="/" className="text-2xl font-bold text-indigo-600 flex items-center">
                        <img 
                          width={36} 
                          height={36} 
                          className="text-dao mr-2" 
                          src="/imagePR/FundeeDAO.png" 
                          alt="FractionalDAO Logo" 
                        />
                        FractionalDAO
                      </Link>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="icon">
                          <X className="h-5 w-5" />
                          <span className="sr-only">Close menu</span>
                        </Button>
                      </SheetTrigger>
                    </div>
                    <nav className="flex flex-col gap-4 py-6">
                      {navigation.map((item) => (
                        <Link
                          key={item.name}
                          to={item.path}
                          className={`text-base font-medium transition-colors hover:text-indigo-500 flex items-center ${
                            location.pathname === item.path ? "text-indigo-600" : "text-gray-600"
                          }`}
                        >
                          {item.icon}
                          {item.name}
                        </Link>
                      ))}
                      <div className="pt-2 border-t mt-2">
                        <p className="text-sm font-medium text-gray-500 mb-2">Create</p>
                        <Link to="/create-asset" className="text-base font-medium text-gray-600 hover:text-indigo-500 flex items-center py-2">
                          <Store className="h-4 w-4 mr-2" />
                          Create Asset
                        </Link>
                        <Link to="/proposals/create" className="text-base font-medium text-gray-600 hover:text-indigo-500 flex items-center py-2">
                          <ScrollText className="h-4 w-4 mr-2" />
                          Create Proposal
                        </Link>
                      </div>
                      <div className="pt-2 border-t mt-2">
                        <p className="text-sm font-medium text-gray-500 mb-2">My Account</p>
                        <Link to="/user-orders" className="text-base font-medium text-gray-600 hover:text-indigo-500 flex items-center py-2">
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          My Orders
                        </Link>
                      </div>
                      {isConnected && (
                        <div className="border-t pt-4 mt-2">
                          <p className="text-sm font-semibold mb-2 flex items-center">
                            <Wallet className="h-4 w-4 mr-2 text-indigo-600" />
                            Balances
                          </p>
                          <p className="text-sm ml-6 py-1">{usdtSymbol}: {formatBalance(usdtBalance, usdtDecimals)}</p>
                          <p className="text-sm ml-6 py-1">{funSymbol}: {formatBalance(funBalance, funDecimals)}</p>
                        </div>
                      )}
                    </nav>
                    <div className="mt-auto">
                      {isConnected && (
                        <Button 
                          variant={hasPaidFee ? "outline" : "default"} 
                          className={`w-full mb-4 ${hasPaidFee ? "bg-green-50 text-green-700 border-green-200" : ""}`}
                          onClick={handlePayFee}
                          disabled={hasPaidFee}
                        >
                          {hasPaidFee ? (
                            <>
                              <Check className="h-4 w-4 mr-1" />
                              จ่ายค่าธรรมเนียมแล้ว
                            </>
                          ) : (
                            "จ่ายค่าธรรมเนียมด้วย FUN"
                          )}
                        </Button>
                      )}
                      <div className="border-t pt-4">
                        {isConnected ? (
                          <div className="space-y-2">
                            <p className="text-sm">Connected as:</p>
                            <p className="text-sm font-mono">{shortenAddress(account || "")}</p>
                            <Button variant="outline" className="w-full flex items-center justify-center text-red-500 hover:text-red-600 border-red-200 hover:bg-red-50" onClick={disconnectWallet}>
                              <LogOut className="h-4 w-4 mr-2" />
                              ออกจากระบบ
                            </Button>
                          </div>
                        ) : (
                          <Button className="w-full" onClick={connectWallet}>
                            เชื่อมต่อกระเป๋าเงิน
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
