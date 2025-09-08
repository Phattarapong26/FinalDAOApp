import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { ethers } from "ethers"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBalance(balance: ethers.BigNumber, decimals: number, precision = 4): string {
  return parseFloat(ethers.utils.formatUnits(balance, decimals)).toFixed(precision);
}

export function shortenAddress(address: string): string {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

export function formatDate(timestamp: ethers.BigNumber | number): string {
  if (!timestamp) return 'N/A';
  const ts = typeof timestamp === 'number' ? timestamp : timestamp.toNumber() * 1000;
  return new Date(ts).toLocaleDateString();
}

export function formatDateTime(timestamp: ethers.BigNumber): string {
  if (!timestamp) return 'N/A';
  return new Date(timestamp.toNumber() * 1000).toLocaleString();
}

export function getRemainingTime(deadline: ethers.BigNumber): string {
  const now = Math.floor(Date.now() / 1000);
  const deadlineTime = deadline.toNumber();
  
  if (deadlineTime <= now) {
    return 'Expired';
  }
  
  const remainingSeconds = deadlineTime - now;
  const days = Math.floor(remainingSeconds / 86400);
  const hours = Math.floor((remainingSeconds % 86400) / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  
  if (days > 0) {
    return `${days}d ${hours}h remaining`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  }
  return `${minutes}m remaining`;
}

export function getStatusBadgeColor(status: number): string {
  switch(status) {
    case 0: // PENDING
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case 1: // FUNDING
      return "bg-blue-100 text-blue-800 border-blue-200";
    case 2: // CLOSED
      return "bg-green-100 text-green-800 border-green-200";
    case 3: // CANCELED
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

export function getStatusName(status: number): string {
  switch(status) {
    case 0: return "Pending";
    case 1: return "Funding";
    case 2: return "Closed";
    case 3: return "Canceled";
    default: return "Unknown";
  }
}

export function calculateProgress(funded: ethers.BigNumber, total: ethers.BigNumber): number {
  if (total.eq(0)) return 0;
  return funded.mul(100).div(total).toNumber();
}
