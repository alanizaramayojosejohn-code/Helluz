/** @type {import('tailwindcss').Config} */
module.exports = {
   content: ['./src/**/*.{html,ts}'],
   theme: {
      extend: {
         colors: {
            // Brand
            brand: {
               500: 'var(--color-brand-500)',
               600: 'var(--color-brand-600)',
               700: 'var(--color-brand-700)',
               900: 'var(--color-brand-900)',
            },
            // Status
            success: 'var(--color-success)',
            warning: 'var(--color-warning)',
            info: 'var(--color-info)',
            error: 'var(--color-error)',
            // Surfaces
            bg: {
               base: 'var(--color-bg-base)',
               surface: 'var(--color-bg-surface)',
               elevated: 'var(--color-bg-elevated)',
               inset: 'var(--color-bg-inset)',
               'brand-soft': 'var(--color-bg-brand-soft)',
            },
            // Borders (uso: border-border-default, etc.)
            'border-default': 'var(--color-border-default)',
            'border-strong': 'var(--color-border-strong)',
            'border-subtle': 'var(--color-border-subtle)',
            'border-brand': 'var(--color-border-brand)',
            // Text (uso: text-ink, text-muted, etc. — alias semánticos)
            ink: 'var(--color-text-primary)',
            muted: 'var(--color-text-secondary)',
            faint: 'var(--color-text-tertiary)',
            'on-brand': 'var(--color-text-on-brand)',
            inverse: 'var(--color-text-inverse)',
         },
         fontFamily: {
            display: 'var(--font-family-display)',
            body: 'var(--font-family-body)',
            mono: 'var(--font-family-mono)',
         },
         fontSize: {
            display: ['var(--font-display)', { lineHeight: '1' }],
            h1: ['var(--font-h1)', { lineHeight: '1.1' }],
            h2: ['var(--font-h2)', { lineHeight: '1.2' }],
            h3: ['var(--font-h3)', { lineHeight: '1.3' }],
            h4: ['var(--font-h4)', { lineHeight: '1.4' }],
            'body-lg': ['var(--font-body-lg)', { lineHeight: '1.5' }],
            body: ['var(--font-body)', { lineHeight: '1.5' }],
            'body-sm': ['var(--font-body-sm)', { lineHeight: '1.5' }],
            caption: ['var(--font-caption)', { lineHeight: '1.4' }],
            label: ['var(--font-label)', { lineHeight: '1.3' }],
         },
         fontWeight: {
            regular: 'var(--weight-regular)',
            medium: 'var(--weight-medium)',
            semibold: 'var(--weight-semibold)',
            bold: 'var(--weight-bold)',
            extrabold: 'var(--weight-extrabold)',
         },
         borderRadius: {
            sm: 'var(--radius-sm)',
            md: 'var(--radius-md)',
            lg: 'var(--radius-lg)',
            xl: 'var(--radius-xl)',
            '2xl': 'var(--radius-2xl)',
            full: 'var(--radius-full)',
         },
         boxShadow: {
            sm: 'var(--shadow-sm)',
            md: 'var(--shadow-md)',
            lg: 'var(--shadow-lg)',
            xl: 'var(--shadow-xl)',
            brand: 'var(--shadow-brand)',
         },
         borderWidth: {
            hairline: 'var(--border-hairline)',
            standard: 'var(--border-standard)',
            thick: 'var(--border-thick)',
            heavy: 'var(--border-heavy)',
         },
         opacity: {
            disabled: 'var(--opacity-disabled)',
            muted: 'var(--opacity-muted)',
            scrim: 'var(--opacity-scrim)',
            hover: 'var(--opacity-hover)',
            pressed: 'var(--opacity-pressed)',
         },
         zIndex: {
            base: 'var(--z-base)',
            dropdown: 'var(--z-dropdown)',
            sticky: 'var(--z-sticky)',
            drawer: 'var(--z-drawer)',
            modal: 'var(--z-modal)',
            popover: 'var(--z-popover)',
            toast: 'var(--z-toast)',
            tooltip: 'var(--z-tooltip)',
         },
         transitionDuration: {
            instant: 'var(--duration-instant)',
            fast: 'var(--duration-fast)',
            normal: 'var(--duration-normal)',
            slow: 'var(--duration-slow)',
            slower: 'var(--duration-slower)',
         },
         transitionTimingFunction: {
            standard: 'var(--easing-standard)',
            decelerate: 'var(--easing-decelerate)',
            accelerate: 'var(--easing-accelerate)',
            spring: 'var(--easing-spring)',
         },
         letterSpacing: {
            tightest: '-0.05em',
            'extra-wide': '0.2em',
         },
      },
   },
   plugins: [],
   // Importante: deshabilitar preflight para no romper Angular Material
   corePlugins: {
      preflight: false,
   },
};
