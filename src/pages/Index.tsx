import React from "react";
import PageLayout from "@/components/layout/PageLayout";
import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import FeaturedAssets from "@/components/home/FeaturedAssets";
import { motion } from 'framer-motion';

const founders = [
  {
    name: "Phattarapong Phengtavee",
    title: "Founder",
    image: "https://github.com/Zx0966566414/image/blob/main/Screenshot%202568-03-28%20at%2013.08.08.png?raw=true",
    delay: 0.1
  },
  {
    name: "Athitaya Chaisiriwattanasai",
    title: "Co-Founder",
    image: "https://github.com/Zx0966566414/image/blob/main/Screenshot%202568-03-28%20at%2012.50.37.png?raw=true",
    delay: 0.2
  },
  {
    name: "Kittipat Pramjit",
    title: "Co-Founder",
    image: "https://github.com/Zx0966566414/image/blob/main/Screenshot%202568-03-28%20at%2012.57.20.png?raw=true",
    delay: 0.3
  }
];

const Founders = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl font-bold mb-6">ทีมผู้ก่อตั้ง</h2>
          <p className="text-gray-600">
            พบกับทีมผู้มีวิสัยทัศน์ผู้อยู่เบื้องหลัง FractionalDAO ที่ทำงานเพื่อปฏิวัติการเป็นเจ้าของสินทรัพย์ในรูปแบบใหม่
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {founders.map((founder, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: founder.delay }}
              viewport={{ once: true }}
              className="bg-white rounded-lg shadow-md p-6 text-center"
            >
              <div className="mb-6 rounded-full overflow-hidden w-48 h-48 mx-auto">
                <img
                  src={founder.image}
                  alt={founder.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold mb-2">{founder.name}</h3>
              <p className="text-blue-600 font-medium">{founder.title}</p>
              <p className="text-gray-600 mt-4">
                {founder.name === "Phattarapong Phengtavee" 
                  ? "ผมมุ่งมั่นที่จะสร้างประชาธิปไตยให้กับโอกาสในการลงทุน ทำให้การเข้าถึงเงินทุนเป็นไปอย่างราบรื่นและครอบคลุมสำหรับทุกคน"
                  : founder.name === "Athitaya Chaisiriwattanasai"
                  ? "ฉันหลงใหลในเทคโนโลยีและนวัตกรรมบล็อกเชน พัฒนาโซลูชั่นล้ำสมัยเพื่อขับเคลื่อนการเปลี่ยนแปลงของอุตสาหกรรม"
                  : "ในฐานะนักพัฒนาและผู้เชี่ยวชาญด้านสมาร์ทคอนแทรคต์ ผมสร้างระบบที่ปลอดภัยและมีประสิทธิภาพสำหรับการจัดการสินทรัพย์ดิจิทัล"}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Index: React.FC = () => {
  return (
    <PageLayout>
      <HeroSection />
      <FeaturesSection />
      <FeaturedAssets />
      <Founders />
    </PageLayout>
  );
};

export default Index;
