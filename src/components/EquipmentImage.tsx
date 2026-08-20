import React, { useState, useEffect } from 'react';
import { FlaskConical } from 'lucide-react';
import { 
  getEquipmentImageUrl, 
  getEquipmentSecondaryUrl, 
  getEquipmentFallbackUrl 
} from '../data/drive_mappings';

interface EquipmentImageProps {
  id: string;
  name: string;
  type?: string;
  className?: string;
  aspectRatio?: 'video' | 'square' | 'auto';
  showBadge?: boolean;
}

export const EquipmentImage: React.FC<EquipmentImageProps> = ({
  id,
  name,
  type,
  className = '',
  aspectRatio = 'video',
  showBadge = true
}) => {
  // Stage: 0 = primary (lh3), 1 = secondary (drive thumbnail), 2 = curated fallback, 3 = placeholder icon
  const [stage, setStage] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Reset stage if id changes
  useEffect(() => {
    setStage(0);
    setIsLoaded(false);
  }, [id]);

  const primaryUrl = getEquipmentImageUrl(id);
  const secondaryUrl = getEquipmentSecondaryUrl(id);
  const fallbackUrl = getEquipmentFallbackUrl(type, name);

  const getCurrentUrl = () => {
    switch (stage) {
      case 0:
        return primaryUrl || secondaryUrl || fallbackUrl;
      case 1:
        return secondaryUrl || fallbackUrl;
      case 2:
        return fallbackUrl;
      default:
        return '';
    }
  };

  const handleImageError = () => {
    if (stage === 0) {
      if (secondaryUrl && secondaryUrl !== primaryUrl) {
        setStage(1);
      } else {
        setStage(2);
      }
    } else if (stage === 1) {
      setStage(2);
    } else {
      setStage(3);
    }
  };

  const currentUrl = getCurrentUrl();

  const aspectClass = 
    aspectRatio === 'video' ? 'aspect-video' :
    aspectRatio === 'square' ? 'aspect-square' : '';

  if (stage === 3 || !currentUrl) {
    return (
      <div 
        id={`equipment_img_fallback_${id}`}
        className={`relative w-full ${aspectClass} bg-slate-100 flex flex-col items-center justify-center text-slate-400 p-4 border-b border-slate-100 select-none ${className}`}
      >
        <FlaskConical className="w-8 h-8 text-vet-navy-400/60 mb-1 animate-pulse" />
        <span className="text-[11px] font-mono font-bold text-vet-navy-900 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
          {id}
        </span>
      </div>
    );
  }

  return (
    <div 
      id={`equipment_img_container_${id}`}
      className={`relative w-full ${aspectClass} bg-slate-100 overflow-hidden ${className}`}
    >
      {/* Loading Skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-slate-200/60 to-slate-100 animate-pulse flex items-center justify-center">
          <FlaskConical className="w-6 h-6 text-slate-300 animate-bounce" />
        </div>
      )}

      {/* Actual Image */}
      <img
        id={`equipment_img_${id}`}
        src={currentUrl}
        alt={name}
        loading="lazy"
        referrerPolicy="no-referrer"
        onLoad={() => setIsLoaded(true)}
        onError={handleImageError}
        className={`w-full h-full object-cover transition-all duration-300 ${
          isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      />
    </div>
  );
};
