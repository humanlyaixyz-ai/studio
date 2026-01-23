
import React, { useState, useEffect, useCallback } from 'react';
import { ColorAdjustments } from '../utils/imageUtils';

interface ColorGradingControlProps {
  originalImage: string; // Base64
  onApply: (newImageBase64: string) => void;
  onPreview: (adjustments: ColorAdjustments) => Promise<string>;
  onCancel: () => void;
}

const DEFAULT_ADJUSTMENTS: ColorAdjustments = {
  exposure: 0,
  contrast: 0,
  brightness: 0,
  saturation: 0,
  temperature: 0,
  tint: 0,
  sharpness: 0,
};

const Slider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
}> = ({ label, value, min, max, onChange }) => (
  <div className="mb-4">
    <div className="flex justify-between mb-1">
      <label className="text-[10px] uppercase font-bold text-[#8E918F] tracking-wider">{label}</label>
      <span className="text-[10px] font-mono text-[#A8C7FA]">{value > 0 ? `+${value}` : value}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-1 bg-[#444746] rounded-lg appearance-none cursor-pointer accent-[#A8C7FA]"
    />
  </div>
);

const ColorGradingControl: React.FC<ColorGradingControlProps> = ({ originalImage, onApply, onPreview, onCancel }) => {
  const [adjustments, setAdjustments] = useState<ColorAdjustments>(DEFAULT_ADJUSTMENTS);
  const [previewImage, setPreviewImage] = useState<string>(originalImage);
  const [isProcessing, setIsProcessing] = useState(false);

  // Debounced preview update
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setIsProcessing(true);
      try {
        const result = await onPreview(adjustments);
        if (active) {
          setPreviewImage(result);
        }
      } finally {
        if (active) setIsProcessing(false);
      }
    }, 150); // 150ms debounce

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [adjustments, onPreview]);

  const handleChange = (key: keyof ColorAdjustments, value: number) => {
    setAdjustments(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onApply(previewImage);
  };

  const handleReset = () => {
    setAdjustments(DEFAULT_ADJUSTMENTS);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1E1F20] border border-[#444746] rounded-2xl w-full max-w-5xl h-[80vh] flex flex-col md:flex-row overflow-hidden shadow-2xl">
        
        {/* Preview Area */}
        <div className="flex-1 bg-[#131314] flex items-center justify-center p-4 relative overflow-hidden">
           <img 
             src={`data:image/jpeg;base64,${previewImage}`} 
             alt="Preview" 
             className="max-w-full max-h-full object-contain shadow-lg"
           />
           {isProcessing && (
             <div className="absolute top-4 right-4 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
               Rendering...
             </div>
           )}
        </div>

        {/* Controls Panel */}
        <div className="w-full md:w-80 bg-[#1E1F20] border-l border-[#444746] flex flex-col">
          <div className="p-4 border-b border-[#444746] flex justify-between items-center">
            <h3 className="text-sm font-semibold text-[#E3E3E3]">Color Correction</h3>
            <button onClick={handleReset} className="text-[10px] text-[#A8C7FA] hover:text-white underline">Reset</button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            
            <div className="mb-6">
              <h4 className="text-xs font-semibold text-[#E3E3E3] mb-4">Light</h4>
              <Slider label="Exposure" value={adjustments.exposure} min={-100} max={100} onChange={(v) => handleChange('exposure', v)} />
              <Slider label="Contrast" value={adjustments.contrast} min={-100} max={100} onChange={(v) => handleChange('contrast', v)} />
              <Slider label="Brightness" value={adjustments.brightness} min={-100} max={100} onChange={(v) => handleChange('brightness', v)} />
            </div>

            <div className="mb-6">
              <h4 className="text-xs font-semibold text-[#E3E3E3] mb-4">Color</h4>
              <Slider label="Saturation" value={adjustments.saturation} min={-100} max={100} onChange={(v) => handleChange('saturation', v)} />
              <Slider label="Temp" value={adjustments.temperature} min={-100} max={100} onChange={(v) => handleChange('temperature', v)} />
              <Slider label="Tint" value={adjustments.tint} min={-100} max={100} onChange={(v) => handleChange('tint', v)} />
            </div>

          </div>

          <div className="p-4 border-t border-[#444746] bg-[#1E1F20] flex gap-3">
             <button 
               onClick={onCancel}
               className="flex-1 py-2.5 rounded-lg border border-[#444746] text-[#C4C7C5] text-xs font-medium hover:bg-[#2D2E30]"
             >
               Cancel
             </button>
             <button 
               onClick={handleApply}
               className="flex-1 py-2.5 rounded-lg bg-[#A8C7FA] text-[#062E6F] text-xs font-bold hover:bg-[#D3E3FD]"
             >
               Apply Changes
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorGradingControl;
