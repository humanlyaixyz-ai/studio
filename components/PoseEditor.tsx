import React, { useState, useEffect, useCallback } from 'react';
import { ModelType, ProductCategory, ShotConfig } from '../types';
import { IMAGES_PER_GENERATION, NON_FASHION_CATEGORIES } from '../constants';

interface PoseEditorProps {
  selectedModel: ModelType;
  selectedCategory: ProductCategory;
  currentShots: ShotConfig[];
  onShotsChange: (shots: ShotConfig[]) => void;
}

const PoseEditor: React.FC<PoseEditorProps> = ({
  selectedModel,
  selectedCategory,
  currentShots,
  onShotsChange,
}) => {
  const [editableShots, setEditableShots] = useState<ShotConfig[]>(currentShots);

  // Sync internal state with prop changes
  useEffect(() => {
    setEditableShots(currentShots);
  }, [currentShots]);

  const handlePromptChange = useCallback((index: number, newPrompt: string) => {
    const updated = [...editableShots];
    updated[index] = { ...updated[index], prompt: newPrompt };
    setEditableShots(updated);
    onShotsChange(updated);
  }, [editableShots, onShotsChange]);

  const handleImageUpload = useCallback(async (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                const base64String = reader.result.split(',')[1];
                const updated = [...editableShots];
                updated[index] = { 
                    ...updated[index], 
                    referenceImage: { data: base64String, mimeType: file.type } 
                };
                setEditableShots(updated);
                onShotsChange(updated);
            }
        };
        reader.readAsDataURL(file);
    }
  }, [editableShots, onShotsChange]);

  const handleRemoveImage = useCallback((index: number) => {
    const updated = [...editableShots];
    updated[index] = { ...updated[index], referenceImage: undefined };
    setEditableShots(updated);
    onShotsChange(updated);
  }, [editableShots, onShotsChange]);

  const handleAddShot = useCallback(() => {
    if (editableShots.length < IMAGES_PER_GENERATION) {
      const updated = [...editableShots, { prompt: '' }];
      setEditableShots(updated);
      onShotsChange(updated);
    }
  }, [editableShots, onShotsChange]);

  const handleRemoveShot = useCallback((index: number) => {
    if (editableShots.length > 1) {
      const updated = editableShots.filter((_, i) => i !== index);
      setEditableShots(updated);
      onShotsChange(updated);
    }
  }, [editableShots, onShotsChange]);

  const isReferenceAllowed = NON_FASHION_CATEGORIES.includes(selectedCategory);

  return (
    <div className="mt-6 mb-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xs font-semibold text-[#8E918F]">Shot List</h3>
        <span className="text-[10px] text-[#E3E3E3] bg-[#004A77] px-2 py-0.5 rounded-full font-medium">{editableShots.length} / {IMAGES_PER_GENERATION}</span>
      </div>
      
      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar p-1">
        {editableShots.map((shot, index) => (
          <div key={index} className="bg-[#1E1F20] border border-[#444746] rounded-xl p-3 shadow-sm hover:border-[#8E918F] transition-colors group relative">
            
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-[#A8C7FA] uppercase tracking-wider">Shot {String(index + 1).padStart(2, '0')}</span>
              <div className="flex items-center gap-2">
                 {/* Remove Shot Button */}
                 {editableShots.length > 1 && (
                    <button
                      onClick={() => handleRemoveShot(index)}
                      className="text-[#8E918F] hover:text-red-400 p-1 rounded-full hover:bg-[#3C1A1A] transition-colors"
                      title="Delete shot"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
              </div>
            </div>
            
            <div className="flex gap-3">
                <textarea
                  className="flex-1 bg-[#131314] text-xs text-[#E3E3E3] rounded-lg border border-transparent focus:border-[#A8C7FA] p-2 transition-all resize-none outline-none leading-relaxed min-h-[60px]"
                  rows={2}
                  value={shot.prompt}
                  onChange={(e) => handlePromptChange(index, e.target.value)}
                  placeholder="Describe the shot..."
                />
                
                {/* Reference Image Upload - Conditional Render */}
                {isReferenceAllowed && (
                  <div className="flex-shrink-0 flex flex-col gap-2">
                      {shot.referenceImage ? (
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-[#444746] group/image">
                              <img src={`data:${shot.referenceImage.mimeType};base64,${shot.referenceImage.data}`} className="w-full h-full object-cover" />
                              <button 
                                onClick={() => handleRemoveImage(index)}
                                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity text-white"
                              >
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
                              </button>
                          </div>
                      ) : (
                          <label className="w-16 h-16 flex flex-col items-center justify-center bg-[#131314] rounded-lg border border-[#444746] border-dashed hover:border-[#A8C7FA] hover:bg-[#2D2E30] cursor-pointer transition-all">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-[#8E918F] mb-1">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                              </svg>
                              <span className="text-[8px] text-[#8E918F] font-medium leading-none text-center">Ref</span>
                              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(index, e)} className="hidden" />
                          </label>
                      )}
                  </div>
                )}
            </div>
            
            {shot.referenceImage && isReferenceAllowed && (
                <div className="mt-2 text-[10px] text-[#A8C7FA] flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" /></svg>
                    Reference image active for angle & composition
                </div>
            )}
          </div>
        ))}
      </div>
      
      {editableShots.length < IMAGES_PER_GENERATION && (
        <button
          onClick={handleAddShot}
          className="mt-3 w-full py-3 rounded-xl border border-dashed border-[#444746] text-[#A8C7FA] hover:bg-[#004A77]/20 hover:border-[#A8C7FA] text-xs font-medium transition-all flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          Add New Shot
        </button>
      )}
    </div>
  );
};

export default PoseEditor;