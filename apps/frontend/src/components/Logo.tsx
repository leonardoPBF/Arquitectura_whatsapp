import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => {
  return (
    <img 
      src="https://i.ibb.co/9k50nCtb/Whats-App-Image-2025-11-13-at-1-47-03-AM-removebg-preview.png" 
      alt="LUMINA Logo" 
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
};

