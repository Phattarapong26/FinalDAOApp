# เอกสารสำหรับนักพัฒนา 👨‍💻

## 📚 สารบัญ

1. [ภาพรวมทางเทคนิค](#ภาพรวมทางเทคนิค)
2. [การตั้งค่าสภาพแวดล้อมการพัฒนา](#การตั้งค่าสภาพแวดล้อมการพัฒนา)
3. [โครงสร้างโปรเจค](#โครงสร้างโปรเจค)
4. [Frontend](#frontend)
5. [Smart Contract](#smart-contract)
6. [การเชื่อมต่อกับ Blockchain](#การเชื่อมต่อกับ-blockchain)
7. [การ Deploy](#การ-deploy)
8. [การทดสอบ](#การทดสอบ)
9. [แนวทางการพัฒนาต่อยอด](#แนวทางการพัฒนาต่อยอด)

## 🔍 ภาพรวมทางเทคนิค

SmartContractMD เป็นแอปพลิเคชัน dApp (Decentralized Application) ที่ประกอบด้วย:

- **Frontend**: พัฒนาด้วย React, TypeScript, Vite
- **UI**: ใช้ Shadcn UI และ Tailwind CSS
- **Blockchain**: ใช้ Ethers.js เชื่อมต่อกับ Smart Contract บน Ethereum
- **Smart Contract**: พัฒนาด้วย Solidity

## ⚙️ การตั้งค่าสภาพแวดล้อมการพัฒนา

### ความต้องการของระบบ

- Node.js (เวอร์ชั่น 18 หรือใหม่กว่า)
- NPM หรือ Yarn
- MetaMask หรือ Wallet อื่นๆ ที่รองรับ
- Git

### ขั้นตอนการตั้งค่า

1. โคลนโปรเจค:
```bash
git clone https://github.com/yourusername/SmartContractMD.git
cd SmartContractMD
```

2. ติดตั้ง Dependencies:
```bash
npm install
# หรือใช้ Yarn
yarn
```

3. สร้างไฟล์ `.env` ในโฟลเดอร์หลักและกำหนดค่าต่างๆ:
```
VITE_INFURA_ID=your_infura_project_id
VITE_CONTRACT_ADDRESS=your_deployed_contract_address
VITE_USDT_ADDRESS=usdt_token_address
VITE_FUN_ADDRESS=fun_token_address
```

4. รันในโหมดพัฒนา:
```bash
npm run dev
# หรือใช้ Yarn
yarn dev
```

5. สำหรับการพัฒนา Smart Contract:
   - ติดตั้ง [Hardhat](https://hardhat.org/) หรือ [Truffle](https://www.trufflesuite.com/) สำหรับ Local Blockchain
   - ติดตั้ง [Ganache](https://www.trufflesuite.com/ganache) สำหรับทดสอบ

## 📁 โครงสร้างโปรเจค

```
SmartContractMD/
├── src/                  # โค้ดหลักของ Frontend
│   ├── components/       # React Components
│   │   ├── ui/           # Shadcn UI Components
│   │   ├── layout/       # Layout Components
│   │   └── ...           # Components อื่นๆ
│   ├── contexts/         # React Contexts
│   │   ├── WalletContext.tsx  # Context สำหรับการจัดการ Wallet
│   │   └── ...
│   ├── hooks/            # Custom React Hooks
│   │   ├── useContract.tsx   # Hook สำหรับเชื่อมต่อกับ Contract
│   │   └── ...
│   ├── lib/              # Utilities และฟังก์ชันช่วยเหลือ
│   ├── pages/            # หน้าต่างๆ ของแอป
│   │   ├── Home.tsx      # หน้าหลัก
│   │   ├── Assets.tsx    # หน้าแสดงสินทรัพย์
│   │   └── ...
│   ├── types/            # TypeScript Type Definitions
│   ├── App.tsx           # Component หลัก
│   └── main.tsx          # Entry point
├── smartContract/        # Smart Contract
│   └── smartContract.sol # ไฟล์ Smart Contract หลัก
├── public/               # Static Assets
├── docs/                 # เอกสาร
└── ...                   # ไฟล์การกำหนดค่าต่างๆ
```

## 🖥️ Frontend

### Shadcn UI และ Tailwind CSS

โปรเจคนี้ใช้ [Shadcn UI](https://ui.shadcn.com/) ซึ่งเป็น Component Library ที่สร้างด้วย Tailwind CSS:

```jsx
// ตัวอย่างการใช้ Button Component
import { Button } from "@/components/ui/button";

function MyComponent() {
  return (
    <Button variant="default" onClick={() => console.log("คลิก!")}>
      คลิกฉัน
    </Button>
  );
}
```

### การจัดการ State

เราใช้ React Context สำหรับการจัดการ State ที่ใช้ร่วมกันทั้งแอปพลิเคชัน:

```tsx
// src/contexts/WalletContext.tsx
import { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";

interface WalletContextType {
  account: string | null;
  connect: () => Promise<void>;
  // ... properties และ methods อื่นๆ
}

const WalletContext = createContext<WalletContextType | null>(null);

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  
  const connect = async () => {
    // โค้ดสำหรับเชื่อมต่อกับ Wallet
  };
  
  // ...
  
  return (
    <WalletContext.Provider value={{ account, connect }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
```

## 💎 Smart Contract

### FractionalDAO Contract

Smart Contract หลักในโปรเจคนี้คือ `FractionalDAO` ซึ่งจัดการกรรมสิทธิ์แบบแบ่งส่วนของสินทรัพย์:

```solidity
// ตัวอย่างการเรียกใช้ฟังก์ชันจาก Smart Contract
// src/hooks/useContract.tsx
import { ethers } from "ethers";
import contractABI from "../assets/abi/FractionalDAO.json";

export function useContract() {
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const contract = new ethers.Contract(contractAddress, contractABI, signer);
  
  const getAssets = async () => {
    try {
      const assetCount = await contract.assetCount();
      const assets = [];
      
      for (let i = 0; i < assetCount; i++) {
        const asset = await contract.assets(i);
        assets.push(asset);
      }
      
      return assets;
    } catch (error) {
      console.error("Error fetching assets:", error);
      return [];
    }
  };
  
  // ฟังก์ชันอื่นๆ สำหรับโต้ตอบกับ Contract
  
  return {
    contract,
    getAssets,
    // ...
  };
}
```

### การ Deploy Smart Contract

สำหรับการ Deploy Smart Contract คุณจะต้องมี:

1. [Hardhat](https://hardhat.org/) หรือ [Truffle](https://www.trufflesuite.com/)
2. กระเป๋า Wallet ที่มี ETH สำหรับค่า Gas
3. Infura หรือ Alchemy API Key (สำหรับเชื่อมต่อกับ Network)

ตัวอย่างการ Deploy ด้วย Hardhat:

```javascript
// hardhat.config.js
module.exports = {
  solidity: "0.8.17",
  networks: {
    goerli: {
      url: `https://goerli.infura.io/v3/${process.env.INFURA_ID}`,
      accounts: [process.env.PRIVATE_KEY]
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_ID}`,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};

// scripts/deploy.js
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const usdtAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7"; // USDT on Mainnet
  const funAddress = "0x419D0d8BdD9aF5e606Ae2232ed285Aff190E711b"; // FUN on Mainnet

  const FractionalDAO = await ethers.getContractFactory("FractionalDAO");
  const fractionalDAO = await FractionalDAO.deploy(usdtAddress, funAddress);

  await fractionalDAO.deployed();
  console.log("FractionalDAO deployed to:", fractionalDAO.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

## 🔌 การเชื่อมต่อกับ Blockchain

โปรเจคนี้ใช้ [ethers.js](https://docs.ethers.io/) สำหรับเชื่อมต่อกับ Blockchain:

```typescript
// src/lib/ethereum.ts
import { ethers } from "ethers";

export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error("กรุณาติดตั้ง MetaMask หรือ Wallet อื่นๆ ที่รองรับ");
  }

  try {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const address = await signer.getAddress();
    
    return { provider, signer, address };
  } catch (error) {
    console.error("Error connecting to wallet:", error);
    throw error;
  }
}

export async function getChainId() {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const network = await provider.getNetwork();
  return network.chainId;
}
```

## 🚀 การ Deploy

### Frontend

สำหรับการ Deploy Frontend ไปยัง Production:

```bash
# สร้าง Production Build
npm run build

# ทดสอบ Production Build ในเครื่อง
npm run preview
```

คุณสามารถ Deploy ไปยัง:
- Vercel
- Netlify
- GitHub Pages (ใช้ GitHub Actions)
- AWS S3 + CloudFront

### Backend (หากมี)

หากโปรเจคมี Backend เพิ่มเติม คุณสามารถ Deploy ไปยัง:
- Heroku
- AWS EC2
- Google Cloud Run
- DigitalOcean

## 🧪 การทดสอบ

### การทดสอบ Frontend

เราใช้ [Vitest](https://vitest.dev/) สำหรับการทดสอบ:

```bash
# รันการทดสอบทั้งหมด
npm test

# รันการทดสอบแบบ Watch Mode
npm test -- --watch
```

ตัวอย่างการทดสอบ Component:

```tsx
// src/components/ConnectButton.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConnectButton } from "./ConnectButton";
import { WalletProvider } from "../contexts/WalletContext";

describe("ConnectButton", () => {
  it("should render connect button when not connected", () => {
    render(
      <WalletProvider>
        <ConnectButton />
      </WalletProvider>
    );
    
    expect(screen.getByText("เชื่อมต่อกระเป๋า")).toBeInTheDocument();
  });
  
  // การทดสอบอื่นๆ
});
```

### การทดสอบ Smart Contract

ใช้ [Hardhat](https://hardhat.org/) หรือ [Truffle](https://www.trufflesuite.com/) สำหรับทดสอบ Smart Contract:

```typescript
// test/FractionalDAO.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FractionalDAO", function () {
  let fractionalDAO;
  let owner;
  let addr1;
  let addr2;
  let usdtToken;
  let funToken;

  beforeEach(async function () {
    // Deploy Mock Tokens
    const MockToken = await ethers.getContractFactory("MockERC20");
    usdtToken = await MockToken.deploy("USDT", "USDT");
    funToken = await MockToken.deploy("FUN", "FUN");
    
    // Deploy FractionalDAO
    const FractionalDAO = await ethers.getContractFactory("FractionalDAO");
    [owner, addr1, addr2] = await ethers.getSigners();
    fractionalDAO = await FractionalDAO.deploy(usdtToken.address, funToken.address);
    
    // Mint tokens for testing
    await usdtToken.mint(addr1.address, ethers.utils.parseEther("1000"));
    await funToken.mint(addr1.address, ethers.utils.parseEther("1000"));
  });

  it("Should create a new asset", async function () {
    // Approve tokens
    await funToken.connect(addr1).approve(fractionalDAO.address, ethers.utils.parseEther("10"));
    
    // Pay fee
    await fractionalDAO.connect(addr1).payFeeWithToken();
    
    // Create asset
    const tx = await fractionalDAO.connect(addr1).createAsset(
      "Test Asset",
      "TASSET",
      "ipfs://metadata",
      100, // totalShares
      ethers.utils.parseEther("1"), // pricePerShare
      ethers.utils.parseEther("1"), // minInvestment
      ethers.utils.parseEther("10"), // maxInvestment
      ethers.utils.parseEther("100"), // totalValue
      500, // 5% APY
      Math.floor(Date.now() / 1000) + 86400 // fundingDeadline (24 hours from now)
    );
    
    await tx.wait();
    
    const assetCount = await fractionalDAO.assetCount();
    expect(assetCount).to.equal(1);
  });
  
  // การทดสอบอื่นๆ
});
```

## 🚩 แนวทางการพัฒนาต่อยอด

### ฟีเจอร์ที่น่าพัฒนาเพิ่มเติม

1. **Analytics Dashboard** - แสดงข้อมูลและสถิติการลงทุน
2. **Mobile App** - พัฒนาเวอร์ชันแอปพลิเคชันมือถือ
3. **Multi-chain Support** - รองรับ Blockchain เครือข่ายอื่นๆ เช่น Polygon, BSC
4. **DAO Governance** - ปรับปรุงระบบบริหารจัดการให้เป็น DAO เต็มรูปแบบ
5. **NFT Integration** - เชื่อมโยงกับ NFT สำหรับการแสดงความเป็นเจ้าของ

### Best Practices

1. **การทำ Code Review** - ใช้ Pull Request สำหรับการตรวจสอบโค้ด
2. **CI/CD** - ตั้งค่า GitHub Actions สำหรับการทดสอบและ Deploy อัตโนมัติ
3. **Security Audit** - ตรวจสอบความปลอดภัยของ Smart Contract ก่อน Deploy
4. **Documentation** - อัพเดทเอกสารเมื่อมีการเปลี่ยนแปลงฟีเจอร์หรือ API
5. **Test Coverage** - เพิ่มการทดสอบให้ครอบคลุมโค้ดมากกว่า 80%

---

หากมีคำถามหรือข้อเสนอแนะเกี่ยวกับการพัฒนา กรุณาเปิด Issue ใน GitHub Repository หรือติดต่อทีมพัฒนาที่ [phattarapong.phe@spumail.net](mailto:phattarapong.phe@spumail.net) 
