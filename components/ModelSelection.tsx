import React from 'react';
import { ModelType } from '../types';
import { MODEL_CONFIGS } from '../constants';

interface ModelSelectionProps {
  selectedModel: ModelType;
  onSelect: (model: ModelType) => void;
}

const ModelSelection: React.FC<ModelSelectionProps> = ({ selectedModel, onSelect }) => {
  return (
    <div className="mt-6">
      <h3 className="text-xs font-semibold text-[#8E918F] mb-3">Style</h3>
      <div className="grid grid-cols-2 gap-3">
        {Object.values(ModelType).map((model) => {
          const isSelected = selectedModel === model;
          return (
            <button
              key={model}
              className={`
                p-3 rounded-xl text-left transition-all border relative overflow-hidden
                ${isSelected
                  ? 'bg-[#004A77] border-[#A8C7FA] bg-opacity-30'
                  : 'bg-[#1E1F20] border-transparent hover:bg-[#2D2E30]'
                }
              `}
              onClick={() => onSelect(model)}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#A8C7FA]"></div>
              )}
              <span className={`block text-xs font-semibold mb-1 ${isSelected ? 'text-[#A8C7FA]' : 'text-[#E3E3E3]'}`}>
                {model.replace(/_/g, ' ')}
              </span>
              <span className={`block text-[10px] leading-relaxed ${isSelected ? 'text-[#D3E3FD]' : 'text-[#8E918F]'}`}>
                {MODEL_CONFIGS[model].description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ModelSelection;