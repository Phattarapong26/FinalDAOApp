import React, { createContext, useState, useEffect, useContext, ReactNode } from "react";
import { ethers } from "ethers";
import { toast } from "sonner";

interface Web3ContextType {
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  account: string | null;
  chainId: number | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  isConnecting: boolean;
  isConnected: boolean;
}

const Web3Context = createContext<Web3ContextType>({
  provider: null,
  signer: null,
  account: null,
  chainId: null,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  isConnecting: false,
  isConnected: false,
});

export const useWeb3 = () => useContext(Web3Context);

interface Web3ProviderProps {
  children: ReactNode;
}

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize provider from window.ethereum
  useEffect(() => {
    const initProvider = async () => {
      if (window.ethereum) {
        console.log("Initializing Web3 provider");
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(web3Provider);

        // Check if already connected
        try {
          const accounts = await web3Provider.listAccounts();
          if (accounts.length > 0) {
            const network = await web3Provider.getNetwork();
            console.log("Connected to account:", accounts[0]);
            console.log("Network:", network);
            setAccount(accounts[0]);
            setChainId(network.chainId);
            setSigner(web3Provider.getSigner());
            setIsConnected(true);
          }
        } catch (error) {
          console.error("Failed to get accounts", error);
        }
      } else {
        console.warn("No Ethereum provider (window.ethereum) detected");
      }
    };

    initProvider();
  }, []);

  // Setup event listeners
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts.length === 0) {
          // Disconnected
          setAccount(null);
          setSigner(null);
          setIsConnected(false);
        } else {
          // Connected or changed account
          setAccount(accounts[0]);
          if (provider) {
            setSigner(provider.getSigner());
            setIsConnected(true);
          }
        }
      };

      const handleChainChanged = (chainIdHex: string) => {
        const newChainId = parseInt(chainIdHex, 16);
        setChainId(newChainId);
        window.location.reload(); // Best practice from MetaMask docs
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [provider]);

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error("No Ethereum wallet found. Please install MetaMask.");
      return;
    }
    
    setIsConnecting(true);
    
    try {
      console.log("Connecting to wallet...");
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      await web3Provider.send("eth_requestAccounts", []);
      
      const accounts = await web3Provider.listAccounts();
      const network = await web3Provider.getNetwork();
      
      console.log("Connected account:", accounts[0]);
      console.log("Connected network:", network);
      
      setProvider(web3Provider);
      setAccount(accounts[0]);
      setChainId(network.chainId);
      setSigner(web3Provider.getSigner());
      setIsConnected(true);
      
      toast.success("Wallet connected successfully");
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast.error("Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setSigner(null);
    setIsConnected(false);
    toast.info("Wallet disconnected");
  };

  return (
    <Web3Context.Provider
      value={{
        provider,
        signer,
        account,
        chainId,
        connectWallet,
        disconnectWallet,
        isConnecting,
        isConnected,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};
