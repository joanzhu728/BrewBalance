
import React from 'react';

const CreativeLogo: React.FC = () => {
  return (
    <div className="w-full h-full bg-amber-400 flex items-center justify-center p-2">
      <svg
        viewBox="0 0 512 512"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Handle */}
        <path 
            d="M340 210H370C403.137 210 430 236.863 430 270C430 303.137 403.137 330 370 330H340" 
            stroke="#0F172A" 
            strokeWidth="32" 
            strokeLinecap="round" 
            fill="none" 
        />
        
        {/* Mug Body */}
        <path 
            d="M140 160H340V370C340 408.66 308.66 440 270 440H210C171.34 440 140 408.66 140 370V160Z" 
            fill="#FBBF24" 
            stroke="#0F172A" 
            strokeWidth="32" 
        />
        
        {/* Liquid Details */}
        <path d="M170 190V370C170 390 180 400 200 400H280C300 400 310 390 310 370V190" fill="#F59E0B" fillOpacity="0.4" />
        
        {/* Foam */}
        <path 
            d="M120 160C120 125 150 110 170 120C185 95 230 90 250 110C270 90 320 95 340 120C360 110 370 130 360 160H120Z" 
            fill="#FFF7ED" 
            stroke="#0F172A" 
            strokeWidth="32" 
            strokeLinejoin="round"
        />
        
        {/* Bubbles */}
        <circle cx="200" cy="280" r="12" fill="#FFF" fillOpacity="0.6"/>
        <circle cx="280" cy="240" r="16" fill="#FFF" fillOpacity="0.6"/>
        <circle cx="240" cy="350" r="10" fill="#FFF" fillOpacity="0.6"/>
      </svg>
    </div>
  );
};

export default CreativeLogo;
