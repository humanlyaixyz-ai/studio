
import React from 'react';
import { CameraConfig } from '../types';
import { CAMERA_ANGLES, CAMERA_FRAMINGS, FOCAL_LENGTHS } from '../constants';

interface CameraSettingsProps {
  config: CameraConfig;
  onChange: (update: Partial<CameraConfig>) => void;
}

const CameraSettings: React.FC<CameraSettingsProps> = ({ config, onChange }) => {
  return (
    <div className="mt-4">
      <h3 className="text-xs font-semibold text-[#8E918F] mb-3">Camera & Composition</h3>
      <div className="grid grid-cols-1 gap-3">
        {/* Framing */}
        <div>
           <label className="text-[10px] text-[#C4C7C5] mb-1 block">Shot Framing</label>
           <select 
             value={config.framing}
             onChange={(e) => onChange({ framing: e.target.value })}
             className="w-full p-2 bg-[#131314] border border-[#444746] rounded text-xs text-[#E3E3E3] outline-none focus:border-[#A8C7FA]"
           >
             <option value="">Default (Auto)</option>
             {CAMERA_FRAMINGS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
           </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
            {/* Angle */}
            <div>
               <label className="text-[10px] text-[#C4C7C5] mb-1 block">Camera Angle</label>
               <select 
                 value={config.angle}
                 onChange={(e) => onChange({ angle: e.target.value })}
                 className="w-full p-2 bg-[#131314] border border-[#444746] rounded text-xs text-[#E3E3E3] outline-none focus:border-[#A8C7FA]"
               >
                 <option value="">Default (Auto)</option>
                 {CAMERA_ANGLES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
               </select>
            </div>

            {/* Lens */}
            <div>
               <label className="text-[10px] text-[#C4C7C5] mb-1 block">Focal Length (Lens)</label>
               <select 
                 value={config.focalLength}
                 onChange={(e) => onChange({ focalLength: e.target.value })}
                 className="w-full p-2 bg-[#131314] border border-[#444746] rounded text-xs text-[#E3E3E3] outline-none focus:border-[#A8C7FA]"
               >
                 <option value="">Default (Auto)</option>
                 {FOCAL_LENGTHS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
               </select>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CameraSettings;
