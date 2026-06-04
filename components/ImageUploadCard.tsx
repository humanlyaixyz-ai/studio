import React, { useState } from 'react';

interface ImageUploadCardProps {
  label: string;
  onFileUpload: (base64: string, mimeType: string) => void;
  onRemove?: () => void;
  currentImage?: string;
  required?: boolean;
  uploadId?: string;
}

const ImageUploadCard: React.FC<ImageUploadCardProps> = ({
  label,
  onFileUpload,
  onRemove,
  currentImage,
  required = false,
  uploadId,
}) => {
  const inputId = `upload-${uploadId ?? label}`;
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Images only');
        return;
      }
      setError(null);
      try {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            const base64String = reader.result.split(',')[1];
            onFileUpload(base64String, file.type);
          }
        };
        reader.readAsDataURL(file);
      } catch (e) {
        setError('Failed');
        console.error('File upload error:', e);
      }
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onRemove) {
      onRemove();
    }
    const input = document.getElementById(inputId) as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  };

  return (
    <div className="relative group w-24 flex flex-col items-center">
      <div className="relative w-24 h-24">
        <label 
          htmlFor={inputId} 
          className={`
            w-full h-full rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200 overflow-hidden border
            ${currentImage 
              ? 'border-transparent bg-[#1E1F20]' 
              : 'border-[#444746] bg-[#1E1F20] hover:bg-[#2D2E30] hover:border-[#A8C7FA]'
            }
            ${error ? 'border-red-400' : ''}
          `}
        >
          {currentImage ? (
            <>
              <img src={`data:image/jpeg;base64,${currentImage}`} alt={label} className="w-full h-full object-cover" />
              
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white">
                   <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                 </svg>
              </div>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-[#8E918F] mb-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span className="text-[10px] font-medium text-[#8E918F] text-center px-1">Upload</span>
            </>
          )}
          <input
            id={inputId}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {/* Remove Button - Moved outside label for reliable clicking */}
        {currentImage && onRemove && (
          <button
            onClick={handleRemove}
            className="absolute -top-1.5 -right-1.5 z-10 bg-[#444746] hover:bg-red-500 text-white rounded-full p-1 shadow-md transition-colors border border-[#1E1F20]"
            title="Remove"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        )}
      </div>
      
      <span className="mt-2 text-[10px] font-medium text-[#C4C7C5] text-center leading-tight max-w-full truncate px-1">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </span>
      
      {error && (
        <span className="absolute -bottom-4 text-[9px] text-red-400">{error}</span>
      )}
    </div>
  );
};

export default ImageUploadCard;