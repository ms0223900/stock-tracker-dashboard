---
name: Taiwanese Equity Dashboard
colors:
  surface: '#f3faff'
  surface-dim: '#c7dde9'
  surface-bright: '#f3faff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#e6f6ff'
  surface-container: '#dbf1fe'
  surface-container-high: '#d5ecf8'
  surface-container-highest: '#cfe6f2'
  on-surface: '#071e27'
  on-surface-variant: '#414752'
  inverse-surface: '#1e333c'
  inverse-on-surface: '#dff4ff'
  outline: '#717783'
  outline-variant: '#c1c6d4'
  surface-tint: '#005faf'
  primary: '#005dac'
  on-primary: '#ffffff'
  primary-container: '#1976d2'
  on-primary-container: '#fffdff'
  inverse-primary: '#a5c8ff'
  secondary: '#526069'
  on-secondary: '#ffffff'
  secondary-container: '#d3e2ed'
  on-secondary-container: '#56656e'
  tertiary: '#5a5d5f'
  on-tertiary: '#ffffff'
  tertiary-container: '#737678'
  on-tertiary-container: '#fffeff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d4e3ff'
  primary-fixed-dim: '#a5c8ff'
  on-primary-fixed: '#001c3a'
  on-primary-fixed-variant: '#004786'
  secondary-fixed: '#d6e5ef'
  secondary-fixed-dim: '#bac9d3'
  on-secondary-fixed: '#0f1d25'
  on-secondary-fixed-variant: '#3b4951'
  tertiary-fixed: '#e0e3e5'
  tertiary-fixed-dim: '#c4c7c9'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#444749'
  background: '#f3faff'
  on-background: '#071e27'
  surface-variant: '#cfe6f2'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  title-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: 0em
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.0'
    letterSpacing: 0.05em
  data-mono:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.0'
    letterSpacing: -0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 40px
  container-max: 1280px
  gutter: 24px
---

## Brand & Style

The design system is rooted in high-fidelity minimalism, specifically tailored for the Taiwanese financial market. It aims to evoke a sense of professional calm, precision, and transparency. By prioritizing significant whitespace and a restrained color palette, the system reduces the cognitive load associated with high-frequency stock data. 

The aesthetic follows a **Modern Corporate** approach with a focus on functional clarity. It avoids unnecessary decorative elements, ensuring that data visualization remains the primary focus. The emotional response is one of reliability and institutional trust, providing a "quiet" environment for making critical investment decisions.

## Colors

This design system utilizes a pristine white background (#FFFFFF) to establish a laboratory-clean environment. The primary blue (#1976D2) is reserved for interactive elements and primary actions, while the secondary light blue (#E3F2FD) serves as a subtle highlight for active states and background grouping.

**Note on Market Status Colors:** In adherence to the Taiwan Stock Exchange (TWSE) conventions, this system utilizes **Red for price increases** (#EB0000) and **Green for price decreases** (#008A3B). This is a critical cultural inversion from Western markets and must be strictly maintained for user accuracy. Neutrals are cool-toned grays to maintain a cohesive professional feel.

## Typography

Inter is the sole typeface for this design system, chosen for its exceptional legibility in data-heavy contexts. The typography scale emphasizes a clear hierarchy between ticker symbols, price points, and supporting metadata. 

For stock prices and tabular data, the `data-mono` style must be applied, utilizing Inter's tabular number features (`tnum`) to ensure numerical columns align perfectly for easy vertical scanning. Headlines are slightly tightened in letter spacing to maintain a modern, "engineered" look, while body text remains open for readability.

## Layout & Spacing

The design system employs a **Fixed Grid** layout for desktop, centered within a 1280px container to prevent data excessive eye-travel. It uses a 12-column grid system with 24px gutters.

The spacing rhythm is strictly based on an 8px base unit. 16px (md) is the standard padding for cards and containers, while 24px (lg) is used to separate distinct functional sections. For tight data tables, a compact 12px (sm) vertical spacing is permitted to maximize information density without sacrificing clarity.

## Elevation & Depth

This design system rejects heavy shadows in favor of **Tonal Layers and Low-Contrast Outlines**. Depth is communicated through subtle shifts in background color rather than Z-axis height.

- **Surface Level 0:** The main page background in pure white.
- **Surface Level 1:** Secondary containers or sidebar areas using the tertiary color (#F5F7F9).
- **Surface Level 2:** Cards and interactive elements using a 1px border (#E0E4E8) with no shadow. 
- **Active State:** A soft blue inner glow or a 2px stroke using the primary color (#1976D2) for focus states.

The result is a "flat-plus" aesthetic that feels lightweight and avoids the visual clutter of traditional drop shadows.

## Shapes

The shape language is defined by a consistent **8px (0.5rem) corner radius** for all primary UI elements including cards, input fields, and buttons. This "Rounded" setting strikes a balance between the precision of sharp corners and the approachability of fully rounded shapes.

Smaller components like tags or status badges may use the `rounded-lg` (16px) variation to distinguish them from structural elements. Graphs and charts should use rounded line caps and smoothed corner nodes to align with this geometric philosophy.

## Components

- **Buttons:** Primary buttons use a solid #1976D2 fill with white text. Secondary buttons use #E3F2FD fill with #1976D2 text. Both utilize the 8px corner radius and 16px horizontal padding.
- **Input Fields:** Use a white background with a 1px gray border. On focus, the border transitions to the primary blue with a 0px blur, 2px spread light blue glow.
- **Cards:** Defined by a 1px border (#E0E4E8), 8px radius, and 16px or 24px internal padding. Cards should not have shadows unless they are "floating" modals.
- **Data Tables:** Row-based with 1px light gray bottom borders. No vertical borders. The header row should use the `label-caps` typography style with a subtle tertiary background.
- **Stock Tickers:** Must include a sparkline (mini-chart) using a 2px stroke width. The sparkline color must match the market status (Red for up, Green for down).
- **Chips/Badges:** Used for stock categories (e.g., "Semiconductors," "ETF"). These should be low-contrast, using a light gray fill and darker gray text to avoid competing with price-action colors.
- **Search Bar:** A prominent global search component at the top of the dashboard with a subtle "Search stocks..." placeholder and a leading magnifying glass icon.