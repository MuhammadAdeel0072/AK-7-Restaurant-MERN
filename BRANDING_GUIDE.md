# AK-7 REST Branding & Typography Guide

## 🎨 Consistent Design System Across All Panels

This document outlines the unified branding, typography, and logo usage across all three panels: **Admin**, **Chef**, and **Rider**.
 
---

## 📝 Typography System

### Font Stack
All panels now use a **consistent 2-font system**:

#### **Playfair Display** (Serif)
- **Usage**: Headlines, logo, section headings, major titles
- **Weights**: 400, 600, 700, 900 (all weights available)
- **Style**: Italic for logo and premium moments
- **Source**: Google Fonts

#### **Outfit** (Sans-Serif)
- **Usage**: Body text, labels, navigation, UI elements
- **Weights**: 100-900 (variable weight available)
- **Style**: Regular
- **Source**: Google Fonts

### Typography Classes

Located in each panel's `BrandingUtils.jsx`:

```javascript
// Main Headings
heading1: "text-5xl md:text-6xl font-serif font-black italic"
heading2: "text-4xl md:text-5xl font-serif font-black italic"
heading3: "text-3xl md:text-4xl font-serif font-bold italic"
heading4: "text-2xl md:text-3xl font-serif font-bold italic"

// Section Headers
sectionHead: "text-lg md:text-xl font-serif font-bold text-gold"
sectionHeadSmall: "text-base md:text-lg font-serif font-bold text-gold"

// Body Text
body: "text-base md:text-lg text-soft-white/80"
bodySmall: "text-sm md:text-base text-soft-white/70"
bodySemibold: "text-base md:text-lg font-semibold"

// Labels
label: "text-xs md:text-sm font-bold uppercase tracking-widest"
labelSmall: "text-[10px] md:text-xs font-bold uppercase tracking-wider"

// Navigation
navItem: "font-bold uppercase tracking-[0.05em] text-soft-white/60"
navItemActive: "font-bold uppercase tracking-[0.05em] text-gold"
```

---

## 🏆 AK-7 REST Logo

### Logo Component

The `BrandLogo` component is available in all panels:

```jsx
import { BrandLogo } from './components/BrandingUtils';

// Size options: 'sm', 'md' (default), 'lg', 'xl'
<BrandLogo size="md" />

// With tagline
<BrandLogo size="md" showTagline={true} />

// Variants
<BrandLogo variant="minimal" />    // Just AK-7 REST
<BrandLogo variant="default" />    // With optional tagline
<BrandLogo variant="full" />       // Full branding with tagline
```

### Logo Colors
- **"AK-7"**: Gold (`#D4AF37`)
- **"REST"**: Crimson (`#dc143c`)
- **Tagline**: Gold at 40% opacity
- **Font**: Playfair Display, Black weight, Italic

### Logo Tagline
**"Exquisite Taste, Premium Experience"**

---

## 🎭 Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| **Gold** | `#D4AF37` | Logo "AK-7", highlights, CTAs, active states |
| **Crimson** | `#dc143c` | Logo "REST", accents, warnings |
| **Charcoal** | `#121212` | Background |
| **Soft White** | `#E0E0E0` | Primary text |
| **Off White** | `#F9F9F9` | Secondary text |

---

## 📍 Logo Placement

### Admin Panel
- **Sidebar Header**: `BrandLogo` component, size `md`
- **Location**: [admin-panel/src/components/Sidebar.jsx](admin-panel/src/components/Sidebar.jsx)

### Chef Panel
- **Sidebar Header**: `BrandLogo` component, size `md`
- **Subtitle**: "PRO KITCHEN STATION"
- **Location**: [chef-panel/src/components/Sidebar.jsx](chef-panel/src/components/Sidebar.jsx)

### Rider Panel
- **Sidebar Header**: `BrandLogo` component, size `md`
- **Subtitle**: "Rider Logistics Terminal"
- **Location**: [rider-panel/src/components/RiderLayout.jsx](rider-panel/src/components/RiderLayout.jsx)

---

## 🔤 Usage Examples

### Using Typography Components

```jsx
import { Typography, BrandLogo, AccentText, typographyClasses } from './components/BrandingUtils';

// Header usage
<Typography.H1>Dashboard</Typography.H1>
<Typography.H2>Recent Orders</Typography.H2>
<Typography.H3>Statistics</Typography.H3>

// Body text
<Typography.Body>This is regular body text at medium size.</Typography.Body>
<Typography.Body size="sm">Smaller body text for secondary content.</Typography.Body>

// Labels
<Typography.Label>STATUS LABEL</Typography.Label>
<Typography.Label size="sm">Small label</Typography.Label>

// Accent text
<AccentText color="gold">Important Gold Text</AccentText>
<AccentText color="crimson">Error Text</AccentText>

// Direct class usage
<h1 className={typographyClasses.heading1}>My Header</h1>
<p className={typographyClasses.body}>My paragraph</p>
```

### Using BrandLogo

```jsx
import { BrandLogo } from './components/BrandingUtils';

// Standard logo at medium size
<BrandLogo size="md" />

// Logo with tagline
<BrandLogo size="lg" showTagline={true} />

// Minimal variant (just text)
<BrandLogo variant="minimal" />

// Full branded experience
<BrandLogo variant="full" />
```

---

## 📄 Files Updated for Consistency

### HTML Files (Font Imports)
- ✅ [admin-panel/index.html](admin-panel/index.html) - Added Google Fonts
- ✅ [chef-panel/index.html](chef-panel/index.html) - Updated to consistent fonts
- ✅ [rider-panel/index.html](rider-panel/index.html) - Maintained fonts
- ✅ [client/index.html](client/index.html) - Changed from Inter to Outfit

### CSS Files (Typography Configuration)
- ✅ [admin-panel/src/index.css](admin-panel/src/index.css) - Updated fonts to Outfit + Playfair
- ✅ [chef-panel/src/index.css](chef-panel/src/index.css) - Maintained Outfit + Playfair
- ✅ [rider-panel/src/index.css](rider-panel/src/index.css) - (uses chef config)
- ✅ [client/src/index.css](client/src/index.css) - Changed from Inter to Outfit

### Component Files (Branding Implementation)
- ✅ [admin-panel/src/components/Sidebar.jsx](admin-panel/src/components/Sidebar.jsx) - Uses BrandLogo
- ✅ [chef-panel/src/components/Sidebar.jsx](chef-panel/src/components/Sidebar.jsx) - Uses BrandLogo
- ✅ [rider-panel/src/components/RiderLayout.jsx](rider-panel/src/components/RiderLayout.jsx) - Uses BrandLogo

### Branding Utils (New Files)
- ✅ [admin-panel/src/components/BrandingUtils.jsx](admin-panel/src/components/BrandingUtils.jsx)
- ✅ [chef-panel/src/components/BrandingUtils.jsx](chef-panel/src/components/BrandingUtils.jsx)
- ✅ [rider-panel/src/components/BrandingUtils.jsx](rider-panel/src/components/BrandingUtils.jsx)
- ✅ [client/src/components/BrandingUtils.jsx](client/src/components/BrandingUtils.jsx)

---

## 🎯 Implementation Checklist

### ✅ Completed
- [x] Consistent Outfit + Playfair Display fonts across all panels
- [x] BrandLogo component created in all panels
- [x] Updated HTML files with Google Fonts imports
- [x] Updated CSS files with typography system
- [x] Updated Sidebar components to use BrandLogo
- [x] Color scheme consistency (Gold, Crimson, Charcoal theme)
- [x] Typography classes exported for global use
- [x] AccentText component for emphasis

### 📋 For Future Enhancement
- [ ] Create shared component library across projects (monorepo)
- [ ] Add custom Tailwind plugin for typography utilities
- [ ] Create Figma design system mirror
- [ ] Add brand guidelines documentation portal
- [ ] Implement animated logo for splash screens
- [ ] Create brand kit with logo variations

---

## 🚀 Quick Start Guide

### To Use Consistent Branding:

1. **Import the branding utilities** in any component:
   ```jsx
   import { BrandLogo, Typography, typographyClasses, AccentText } from './components/BrandingUtils';
   ```

2. **Use the BrandLogo component** in headers:
   ```jsx
   <BrandLogo size="md" />
   ```

3. **Use typography components** for text:
   ```jsx
   <Typography.H1>Page Title</Typography.H1>
   <Typography.Body>Description text</Typography.Body>
   ```

4. **Apply typography classes** for custom elements:
   ```jsx
   <span className={typographyClasses.label}>LABEL</span>
   ```

---

## 📐 Responsive Design

All typography is responsive:
- Mobile: Smaller sizes (as specified)
- Tablet+: Larger sizes (md breakpoint and above)

Example responsive class:
```css
"text-2xl md:text-3xl"  /* 2xl on mobile, 3xl on tablets+ */
```

---

## 🎨 Brand Voice

**AK-7 REST** represents:
- **Exquisite**: Premium quality food and service
- **Taste**: Culinary excellence
- **Premium**: High-end restaurant experience
- **Experience**: Customer satisfaction focus

All typography styling reinforces these brand values through:
- **Elegant serif fonts** for premium feel (Playfair Display)
- **Clean sans-serif** for modern efficiency (Outfit)
- **Gold accents** for luxury positioning
- **Generous spacing** for premium presentation

---

## 🔒 Font Licensing

- **Playfair Display**: SIL Open Font License (Free)
- **Outfit**: SIL Open Font License (Free)
- **Source**: Google Fonts (CDN linked, no downloads required)

---

## 📞 Support

For questions about branding consistency:
- Check `BrandingUtils.jsx` in each panel
- Review this guide's examples
- Refer to DEVELOPMENT_FIX_SUMMARY.md for setup context

---

## ✨ Final Result

Your AK-7 REST platform now features:
- ✅ **Unified visual identity** across all three panels
- ✅ **Consistent typography** using premium fonts
- ✅ **Professional branding** with logo system
- ✅ **Premium color scheme** with gold and crimson accents
- ✅ **Reusable components** for easy implementation
- ✅ **Responsive design** that scales beautifully

**Launch with confidence! 🚀**
