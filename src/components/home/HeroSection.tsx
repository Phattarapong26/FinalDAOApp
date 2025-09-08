import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Sparkles, 
  Building2, 
  Coins, 
  ChevronDown, 
  Wallet, 
  BarChart3,
  ExternalLink,
  ArrowRightCircle,
  RefreshCw,
  ArrowRight
} from "lucide-react";
import { useWeb3 } from "@/contexts/Web3Context";

const HeroSection: React.FC = () => {
  const { connectWallet, isConnected } = useWeb3();

  return (
    <section className="relative py-24 bg-gradient-to-b from-white to-gray-50 h-[890px]">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 opacity-10 bg-indigo-500 rounded-full filter blur-3xl"></div>
        <div className="absolute top-20 -left-20 w-60 h-60 opacity-10 bg-blue-500 rounded-full filter blur-3xl"></div>
      </div>
      <div className="container px-4 mx-auto relative z-10">
        <div className="flex flex-col items-center">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center px-3 py-1 mb-20 text-xs font-medium text-indigo-600 bg-indigo-100 rounded-full animate-pulse">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              การถือครองแบบกระจายอำนาจ
              <Sparkles className="h-3.5 w-3.5 ml-1.5" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl mb-8 animate-fadeIn">
              <span className="block text-gray-900">Fractional Ownership</span>
              <span className="block text-indigo-600 mt-2">ผ่าน<span className="relative">
                การบริหารแบบ DAO
              </span></span>
            </h1>
            <p className="text-lg text-gray-600 mb-10 animate-fadeIn animate-delay-100">
              เป็นเจ้าของสินทรัพย์ร่วมกัน ลงคะแนนในการตัดสินใจเกี่ยวกับการบริหาร <br></br> และรับรายได้แบบ Passive income ผ่านแพลตฟอร์มแบบกระจายอำนาจของเรา
            </p>
            <p className="text-lg text-blue-600 mb-10 animate-fadeIn animate-delay-100">The system is for educational purposes only <br></br> by Computure science SPU.</p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fadeIn animate-delay-200 mb-[40px] mt-[80px]">
              <Button asChild size="lg" className="px-8 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all duration-300 hover:translate-y-[-2px]">
                <Link to="/marketplace" className="flex items-center">
                  <Building2 className="h-5 w-5 mr-2" />
                  ค้นหาสินทรัพย์
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
              {isConnected ? (
                <Button asChild size="lg" variant="outline" className="px-8 border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all duration-300">
                  <Link to="/dashboard" className="flex items-center">
                    <Building2 className="h-5 w-5 mr-2" />
                    ไปยังแดชบอร์ด
                  </Link>
                </Button>
              ) : (
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="px-8 border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all duration-300"
                  onClick={connectWallet}
                >
                  <Wallet className="h-5 w-5 mr-2" />
                  เชื่อมต่อกระเป๋าเงิน
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center mt-10 gap-8 w-full max-w-3xl mx-auto animate-fadeIn animate-delay-300">
            <div className="flex items-center">
              <div className="mr-3 w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <Coins className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold text-gray-900">$12.5M+</div>
                <div className="text-sm text-gray-500">มูลค่าสินทรัพย์ทั้งหมด</div>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="mr-3 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold text-gray-900">45+</div>
                <div className="text-sm text-gray-500">สินทรัพย์บนแพลตฟอร์ม</div>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="mr-3 w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold text-gray-900">8.3%</div>
                <div className="text-sm text-gray-500">ผลตอบแทนเฉลี่ย APY</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-5 left-0 right-0 flex justify-center animate-bounce-slow">
        <div className="flex flex-col items-center cursor-pointer" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
          <p className="text-sm text-gray-500 mb-2">เลื่อนลงเพื่อดูข้อมูลเพิ่มเติม</p>
          <ChevronDown className="h-6 w-6 text-gray-400" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
