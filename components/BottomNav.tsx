import React from 'react';
import { Home, PlayCircle, LayoutGrid, User, ShoppingCart } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const AILogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="ai_gradient_nav" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop stopColor="#a82283" />
        <stop stopColor="#6366f1" />
      </linearGradient>
      <filter id="glow_nav" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="5" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <circle cx="50" cy="50" r="45" fill="url(#ai_gradient_nav)" />
    <path d="M50 20C53 40 60 47 80 50C60 53 53 60 50 80C47 60 40 53 20 50C40 47 47 40 50 20Z" fill="white" filter="url(#glow_nav)" />
    <path d="M75 25C77 35 82 40 92 42C82 44 77 49 75 59C73 49 68 44 58 42C68 40 73 35 75 25Z" fill="white" opacity="0.6" />
  </svg>
);

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'play', label: 'Play', icon: PlayCircle },
    { id: 'categories', label: 'Categories', icon: LayoutGrid },
    { id: 'account', label: 'Account', icon: User },
    { id: 'cart', label: 'Cart', icon: ShoppingCart },
    { id: 'ai-chat', label: 'Ask AI', icon: AILogo, isSpecial: true },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-2 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="flex justify-between items-end max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const isSpecial = (item as any).isSpecial;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center w-full py-1 transition-colors duration-200 ${
                isActive ? 'text-[#a82283]' : 'text-gray-500'
              }`}
            >
              <div className={`relative ${isActive ? '-mt-1' : ''} transition-all`}>
                  {isSpecial ? (
                      <div className={`p-1 rounded-xl ${isActive ? 'bg-transparent scale-110' : ''}`}>
                         <item.icon 
                            className={`w-8 h-8 ${isActive ? 'drop-shadow-md' : 'opacity-80 grayscale-[0.5]'}`} 
                         />
                      </div>
                  ) : (
                    <item.icon 
                        fill={isActive ? "currentColor" : "none"} 
                        strokeWidth={isActive ? 2.5 : 2} 
                        className={`w-6 h-6 mb-1`} 
                    />
                  )}
              </div>
              <span className={`text-[10px] font-medium ${isActive ? 'font-bold' : ''} ${isSpecial && !isActive ? 'text-[#a82283]' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};