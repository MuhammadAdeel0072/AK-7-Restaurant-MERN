/**
 * DineXis Branding Component
 * Implements consistent typography and logo across all panels
 */

// Logo component - renders DineXis branding
export const BrandLogo = ({ 
  size = 'md', 
  showTagline = false, 
  className = '',
  variant = 'default' // 'default', 'minimal', 'full'
}) => {
  const sizeMap = {
    sm: { dine: 'text-lg', xis: 'text-lg', tag: 'text-[6px]' },
    md: { dine: 'text-2xl md:text-3xl', xis: 'text-2xl md:text-3xl', tag: 'text-[8px] md:text-[10px]' },
    lg: { dine: 'text-4xl md:text-5xl', xis: 'text-4xl md:text-5xl', tag: 'text-[10px] md:text-[12px]' },
    xl: { dine: 'text-5xl md:text-6xl', xis: 'text-5xl md:text-6xl', tag: 'text-[12px] md:text-[14px]' },
  };

  const sizes = sizeMap[size];

  if (variant === 'minimal') {
    return (
      <div className={`inline-flex items-baseline gap-1 ${className}`}>
        <span className={`${sizes.dine} font-serif font-black tracking-tighter text-white`}>
          Dine
        </span>
        <span className={`${sizes.xis} font-serif font-black tracking-tighter text-gold`}>
          Xis
        </span>
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className={`flex flex-col ${className}`}>
        <div className="inline-flex items-baseline gap-1">
          <span className={`${sizes.dine} font-serif font-bold text-white`}>
            Dine
          </span>
          <span className={`${sizes.xis} font-serif font-bold text-gold`}>
            Xis
          </span>
        </div>
        <p className={`${sizes.tag} font-black uppercase tracking-[0.3em] text-gold/40 mt-1 italic`}>
          Exquisite Taste, Premium Experience
        </p>
      </div>
    );
  }

  // Default variant - logo with optional tagline
  return (
    <div className={`flex flex-col ${className}`}>
      <div className="inline-flex items-baseline gap-1">
        <span className={`${sizes.dine} font-serif font-black tracking-tighter text-white`}>
          Dine
        </span>
        <span className={`${sizes.xis} font-serif font-black tracking-tighter text-gold`}>
          Xis
        </span>
      </div>
      {showTagline && (
        <p className={`${sizes.tag} font-black uppercase tracking-[0.3em] text-gold/40 mt-1 italic`}>
          Culinary Excellence
        </p>
      )}
    </div>
  );
};

// Typography hooks and utilities
export const typographyClasses = {
  // Main headers
  heading1: 'text-5xl md:text-6xl font-serif font-black tracking-tighter text-soft-white',
  heading2: 'text-4xl md:text-5xl font-serif font-black tracking-tighter text-soft-white',
  heading3: 'text-3xl md:text-4xl font-serif font-bold tracking-tight text-soft-white',
  heading4: 'text-2xl md:text-3xl font-serif font-bold text-soft-white',
  
  // Section headers
  sectionHead: 'text-lg md:text-xl font-serif font-bold text-gold mb-6 md:mb-8 flex items-center gap-3',
  sectionHeadSmall: 'text-base md:text-lg font-serif font-bold text-gold mb-4',
  
  // Body text
  body: 'text-base md:text-lg text-soft-white/80 leading-relaxed font-normal',
  bodySmall: 'text-sm md:text-base text-soft-white/70 leading-relaxed font-normal',
  bodySemibold: 'text-base md:text-lg text-soft-white/80 leading-relaxed font-semibold',
  
  // Labels and captions
  label: 'text-xs md:text-sm font-bold uppercase tracking-widest text-soft-white/60',
  labelSmall: 'text-[10px] md:text-xs font-bold uppercase tracking-wider text-soft-white/50',
  caption: 'text-xs text-soft-white/50 font-normal',
  
  // Accents
  accentGold: 'text-gold font-semibold',
  accentWhite: 'text-white font-semibold',
  accentBold: 'font-black uppercase tracking-wider',
  
  // Menu/Navigation
  navItem: 'font-bold tracking-wide uppercase text-sm tracking-[0.05em] text-soft-white/60 hover:text-gold transition-colors',
  navItemActive: 'font-bold tracking-wide uppercase text-sm tracking-[0.05em] text-gold',
};

// Variant components for common text patterns
export const Typography = {
  H1: ({ children, className = '' }) => (
    <h1 className={`${typographyClasses.heading1} ${className}`}>{children}</h1>
  ),
  
  H2: ({ children, className = '' }) => (
    <h2 className={`${typographyClasses.heading2} ${className}`}>{children}</h2>
  ),
  
  H3: ({ children, className = '' }) => (
    <h3 className={`${typographyClasses.heading3} ${className}`}>{children}</h3>
  ),
  
  H4: ({ children, className = '' }) => (
    <h4 className={`${typographyClasses.heading4} ${className}`}>{children}</h4>
  ),
  
  Body: ({ children, className = '', size = 'md' }) => (
    <p className={`${size === 'md' ? typographyClasses.body : typographyClasses.bodySmall} ${className}`}>
      {children}
    </p>
  ),
  
  Label: ({ children, className = '', size = 'md' }) => (
    <span className={`${size === 'md' ? typographyClasses.label : typographyClasses.labelSmall} ${className}`}>
      {children}
    </span>
  ),
  
  Caption: ({ children, className = '' }) => (
    <span className={`${typographyClasses.caption} ${className}`}>{children}</span>
  ),
};

// Accent text wrapper
export const AccentText = ({ children, color = 'gold', className = '' }) => {
  const colorClass = color === 'white' ? typographyClasses.accentWhite : typographyClasses.accentGold;
  return <span className={`${colorClass} ${className}`}>{children}</span>;
};

export default BrandLogo;
