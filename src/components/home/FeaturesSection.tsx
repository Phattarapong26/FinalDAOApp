import React from "react";
import { 
  Coins, 
  Building2, 
  Vote, 
  BarChart4, 
  GanttChart, 
  CircleDollarSign, 
  Building, 
  Users, 
  TrendingUp, 
  Lock,
  LightbulbIcon,
  Scale
} from "lucide-react";

const features = [
  {
    title: "การลงทุนแบบเศษส่วน",
    description: "ลงทุนในสินทรัพย์มูลค่าสูงด้วยเงินทุนน้อยโดยการซื้อหุ้นแบบเศษส่วน",
    icon: <Coins className="h-10 w-10 text-indigo-500" />,
    delay: "0"
  },
  {
    title: "กรรมสิทธิ์ในสินทรัพย์จริง",
    description: "เป็นเจ้าของส่วนแบ่งของอสังหาริมทรัพย์ งานศิลปะ หรือสินทรัพย์พรีเมียมอื่นๆ ที่มีกรอบกฎหมายรองรับ",
    icon: <Building2 className="h-10 w-10 text-indigo-500" />,
    delay: "150"
  },
  {
    title: "การบริหารแบบ DAO",
    description: "มีส่วนร่วมในการตัดสินใจสำคัญผ่านการลงคะแนนเสียงที่โปร่งใสโดยใช้โทเคนการบริหาร FUN",
    icon: <Scale className="h-10 w-10 text-indigo-500" />,
    delay: "300"
  },
  {
    title: "การซื้อขายในตลาดรอง",
    description: "ซื้อและขายหุ้นของคุณบนตลาดรองที่ผสานรวมในแพลตฟอร์มของเรา",
    icon: <TrendingUp className="h-10 w-10 text-indigo-500" />,
    delay: "450"
  },
];

const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="py-24 bg-white relative">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute bottom-0 left-1/2 w-full h-1/2 bg-gradient-to-t from-gray-50 to-transparent"></div>
      </div>
      
      <div className="container px-4 mx-auto relative z-10">
        <div className="text-center mb-16 animate-fadeIn">
          <div className="inline-flex items-center px-3 py-1 mb-6 text-xs font-medium text-indigo-600 bg-indigo-100 rounded-full">
            <LightbulbIcon className="h-3.5 w-3.5 mr-1.5" />
            วิธีการทำงาน
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">ระบบการทำงานของแพลตฟอร์ม</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            แพลตฟอร์มของเราช่วยทำให้การเป็นเจ้าของสินทรัพย์พรีเมียมง่ายขึ้นผ่านเทคโนโลยีบล็อกเชนและการบริหารแบบกระจายอำนาจ
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="flex flex-col items-center text-center p-8 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition duration-300 bg-white animate-fadeIn"
              style={{ animationDelay: `${feature.delay}ms` }}
            >
              <div className="mb-6 p-4 rounded-full bg-indigo-50 shadow-sm">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-24 bg-indigo-50 p-8 rounded-2xl shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="flex items-center justify-center md:col-span-1">
              <div className="relative h-60 w-60">
                <div className="absolute inset-0 bg-indigo-100 rounded-full opacity-50 animate-pulse"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Lock className="h-24 w-24 text-indigo-500" />
                </div>
              </div>
            </div>
            
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold text-indigo-700 mb-4">ความปลอดภัยและการปฏิบัติตามกฎหมาย</h3>
              <p className="text-indigo-800 mb-6">
                เรายึดมั่นในมาตรฐานความปลอดภัยและการปฏิบัติตามกฎหมายระดับสูงสุด เพื่อปกป้องการลงทุนของคุณและรับรองความถูกต้องตามกฎหมาย
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start">
                  <div className="mr-3 p-1.5 rounded-full bg-indigo-200 text-indigo-700">
                    <CircleDollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium">การรับประกันทางการเงิน</h4>
                    <p className="text-sm text-gray-600">สินทรัพย์ทั้งหมดได้รับการตรวจสอบและรับประกันอย่างเต็มรูปแบบ</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="mr-3 p-1.5 rounded-full bg-indigo-200 text-indigo-700">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium">การตรวจสอบ KYC/AML</h4>
                    <p className="text-sm text-gray-600">ระบบการตรวจสอบความถูกต้องตามหลัก KYC/AML ที่เข้มงวด</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
