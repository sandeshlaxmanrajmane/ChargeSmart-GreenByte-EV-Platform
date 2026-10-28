import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
  showTagline = false,
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const titleSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Brand Icon: Integrated Leaf & Lightning */}
      <div
        className={`${iconSizes[size]} relative flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-forest shadow-md shadow-emerald-500/20 text-white shrink-0`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5/6 h-5/6 text-white drop-shadow-sm"
        >
          {/* Leaf outline */}
          <path
            d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"
            fill="currentColor"
            fillOpacity="0.25"
          />
          {/* Lightning bolt inside leaf */}
          <path
            d="M13 2L6 13h5l-2 9 8-11h-5l1-9z"
            fill="#FACC15"
            stroke="#FEF08A"
            strokeWidth="1.2"
          />
        </svg>
      </div>

      {/* Brand Text */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-extrabold tracking-tight text-slate-900 ${titleSizes[size]}`}>
            Charge<span className="text-emerald-600">Smart</span>
          </span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            GreenByte
          </span>
        </div>
        {showTagline && (
          <span className="text-xs text-slate-500 font-medium tracking-tight mt-0.5">
            Smarter Charging. A Cleaner Tomorrow.
          </span>
        )}
      </div>
    </div>
  );
};
