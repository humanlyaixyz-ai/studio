import React from 'react';
import { ProductCategory } from '../types';

interface CategorySelectionProps {
  selectedCategory: ProductCategory;
  onSelect: (category: ProductCategory) => void;
}

const CategorySelection: React.FC<CategorySelectionProps> = ({ selectedCategory, onSelect }) => {
  return (
    <div className="mt-6">
      <h3 className="text-xs font-semibold text-[#8E918F] mb-3">Category</h3>
      <div className="flex flex-wrap gap-2">
        {Object.values(ProductCategory).map((category) => {
          const isSelected = selectedCategory === category;
          return (
            <button
              key={category}
              className={`
                px-4 py-1.5 rounded-full text-xs font-medium transition-all border
                ${isSelected
                  ? 'bg-[#A8C7FA] text-[#062E6F] border-[#A8C7FA]'
                  : 'bg-transparent text-[#E3E3E3] border-[#444746] hover:bg-[#2D2E30]'
                }
              `}
              onClick={() => onSelect(category)}
            >
              {category}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategorySelection;