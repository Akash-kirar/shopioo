import React from 'react';
import { Category } from '../types';

interface CategoryRailProps {
  categories: Category[];
  onCategoryClick?: (categoryName: string) => void;
}

export const CategoryRail: React.FC<CategoryRailProps> = ({ categories, onCategoryClick }) => {
  return (
    <div className="bg-white py-4 shadow-sm">
      <div className="flex overflow-x-auto no-scrollbar px-4 gap-6">
        {categories.map((cat) => (
          <div 
            key={cat.id} 
            onClick={() => onCategoryClick?.(cat.name)}
            className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
          >
            <div className="w-14 h-14 bg-purple-50 rounded-full flex items-center justify-center mb-2 border border-purple-100 group-hover:border-[#a82283] transition-colors">
              <cat.icon className="w-6 h-6 text-[#a82283]" />
            </div>
            <span className="text-xs font-medium text-gray-700 text-center whitespace-nowrap">
              {cat.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};