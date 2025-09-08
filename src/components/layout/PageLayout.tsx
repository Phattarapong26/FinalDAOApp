import React, { ReactNode } from "react";
import Header from "./Header";
import { Github, Globe, ExternalLink, HeartHandshake, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import FundeeLogo from '../../../imagePR/FundeeDAO.png';

interface PageLayoutProps {
  children: ReactNode;
}

const PageLayout: React.FC<PageLayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <footer className="py-8 bg-white">
        <div className="container px-4 mx-auto">

          <div className=" mt-8 pb-8  flex flex-col md:flex-row justify-between items-center">
            <img
              width={100}
              height={100}
              className="text-dao mr-2"
              src={FundeeLogo}
              alt="FractionalDAO Logo"
            />
            <p className="text-sm text-gray-500 text-center">
              © 2025 FractionalDAO. สงวนลิขสิทธิ์ทั้งหมด <br></br><p className="text-yellow-500">The system is for educational purposes only</p>
            </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <a href="https://github.com/Phattarapong26/FractionalDAO" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-xs text-gray-500 hover:text-indigo-600">
                ช่วยเหลือ
              </a>
              <span className="text-gray-300">|</span>
              <a href="https://github.com/Phattarapong26/FractionalDAO" className="text-xs text-gray-500 hover:text-indigo-600">
                ติดต่อเรา
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PageLayout;
