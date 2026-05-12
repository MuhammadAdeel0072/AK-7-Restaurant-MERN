/**
 * DineXis Branding Component
 * Centralized logo/branding for consistent rendering
 */

// Logo component - renders DineXis branding
export const Logo = ({ size = 'md', className = '' }) => {
    const sizes = {
        sm: { brand: 'text-lg', tag: 'text-[6px]' },
        md: { brand: 'text-2xl md:text-3xl', tag: 'text-[8px] md:text-[10px]' },
        lg: { brand: 'text-4xl md:text-5xl', tag: 'text-[10px] md:text-[12px]' },
        xl: { brand: 'text-5xl md:text-6xl', tag: 'text-[12px] md:text-[14px]' },
    };

    const s = sizes[size] || sizes.md;

    return (
        <div className={`flex flex-col items-center ${className}`}>
            <h1 className={`${s.brand} font-serif font-black tracking-tighter leading-none`}>
                <span className="text-white">Dine</span>
                <span className="text-gold">Xis</span>
            </h1>
            <span className={`${s.tag} font-black uppercase tracking-[0.35em] text-soft-white/40 mt-1`}>
                Premium Smart Dining
            </span>
        </div>
    );
};

// Inline logo for navbar / compact spaces
export const InlineLogo = ({ size = 'md', className = '' }) => {
    const sizes = {
        sm: { brand: 'text-lg', tag: 'text-[6px]' },
        md: { brand: 'text-2xl md:text-3xl', tag: 'text-[8px] md:text-[10px]' },
        lg: { brand: 'text-4xl md:text-5xl', tag: 'text-[10px] md:text-[12px]' },
    };

    const s = sizes[size] || sizes.md;

    return (
        <span className={`${s.brand} font-serif font-black tracking-tighter ${className}`}>
            <span className="text-white">Dine</span>
            <span className="text-gold">Xis</span>
        </span>
    );
};

// Full branded header
export const BrandedHeader = ({ size = 'lg', subtitle = 'Premium Smart Dining', className = '' }) => {
    const sizes = {
        sm: { brand: 'text-lg', tag: 'text-[6px]' },
        md: { brand: 'text-2xl md:text-3xl', tag: 'text-[8px] md:text-[10px]' },
        lg: { brand: 'text-4xl md:text-5xl', tag: 'text-[10px] md:text-[12px]' },
        xl: { brand: 'text-5xl md:text-6xl', tag: 'text-[12px] md:text-[14px]' },
    };

    const s = sizes[size] || sizes.lg;

    return (
        <div className={`text-center ${className}`}>
            <h1 className={`${s.brand} font-serif font-black tracking-tighter leading-none`}>
                <span className="text-white">Dine</span>
                <span className="text-gold">Xis</span>
            </h1>
            {subtitle && (
                <p className={`${s.tag} font-black uppercase tracking-[0.35em] text-soft-white/40 mt-2`}>
                    {subtitle}
                </p>
            )}
        </div>
    );
};

export default { Logo, InlineLogo, BrandedHeader };
