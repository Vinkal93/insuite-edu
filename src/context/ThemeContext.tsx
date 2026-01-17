import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeColor {
    name: string;
    primary: string;
    secondary: string;
    gradient: string;
}

const themeColors: ThemeColor[] = [
    { name: 'Indigo', primary: '#6366f1', secondary: '#14b8a6', gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
    { name: 'Blue', primary: '#3b82f6', secondary: '#06b6d4', gradient: 'linear-gradient(135deg, #3b82f6, #0ea5e9)' },
    { name: 'Purple', primary: '#8b5cf6', secondary: '#ec4899', gradient: 'linear-gradient(135deg, #8b5cf6, #a855f7)' },
    { name: 'Emerald', primary: '#10b981', secondary: '#06b6d4', gradient: 'linear-gradient(135deg, #10b981, #14b8a6)' },
    { name: 'Rose', primary: '#f43f5e', secondary: '#ec4899', gradient: 'linear-gradient(135deg, #f43f5e, #fb7185)' },
    { name: 'Orange', primary: '#f97316', secondary: '#eab308', gradient: 'linear-gradient(135deg, #f97316, #fb923c)' },
    { name: 'Cyan', primary: '#06b6d4', secondary: '#3b82f6', gradient: 'linear-gradient(135deg, #06b6d4, #22d3ee)' },
    { name: 'Slate', primary: '#475569', secondary: '#64748b', gradient: 'linear-gradient(135deg, #475569, #64748b)' },
];

interface ThemeContextType {
    theme: ThemeMode;
    resolvedTheme: 'light' | 'dark';
    themeColor: ThemeColor;
    themeColors: ThemeColor[];
    setTheme: (theme: ThemeMode) => void;
    setThemeColor: (color: ThemeColor) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<ThemeMode>(() => {
        const saved = localStorage.getItem('insuite_theme');
        return (saved as ThemeMode) || 'light';
    });

    const [themeColor, setThemeColorState] = useState<ThemeColor>(() => {
        const saved = localStorage.getItem('insuite_theme_color');
        if (saved) {
            const parsed = JSON.parse(saved);
            return themeColors.find(c => c.name === parsed.name) || themeColors[0];
        }
        return themeColors[0];
    });

    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

    useEffect(() => {
        const updateResolvedTheme = () => {
            if (theme === 'system') {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                setResolvedTheme(prefersDark ? 'dark' : 'light');
            } else {
                setResolvedTheme(theme);
            }
        };

        updateResolvedTheme();

        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handler = () => updateResolvedTheme();
            mediaQuery.addEventListener('change', handler);
            return () => mediaQuery.removeEventListener('change', handler);
        }
    }, [theme]);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', resolvedTheme);
    }, [resolvedTheme]);

    useEffect(() => {
        // Apply theme color CSS variables
        const root = document.documentElement;
        root.style.setProperty('--theme-primary', themeColor.primary);
        root.style.setProperty('--theme-secondary', themeColor.secondary);
        root.style.setProperty('--theme-gradient', themeColor.gradient);

        // Generate color shades
        const hexToHSL = (hex: string) => {
            const r = parseInt(hex.slice(1, 3), 16) / 255;
            const g = parseInt(hex.slice(3, 5), 16) / 255;
            const b = parseInt(hex.slice(5, 7), 16) / 255;
            const max = Math.max(r, g, b), min = Math.min(r, g, b);
            let h = 0, s = 0;
            const l = (max + min) / 2;
            if (max !== min) {
                const d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                    case g: h = ((b - r) / d + 2) / 6; break;
                    case b: h = ((r - g) / d + 4) / 6; break;
                }
            }
            return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
        };

        const hsl = hexToHSL(themeColor.primary);

        // Set primary color variants
        root.style.setProperty('--primary-50', `hsl(${hsl.h}, ${hsl.s}%, 97%)`);
        root.style.setProperty('--primary-100', `hsl(${hsl.h}, ${hsl.s}%, 94%)`);
        root.style.setProperty('--primary-200', `hsl(${hsl.h}, ${hsl.s}%, 86%)`);
        root.style.setProperty('--primary-300', `hsl(${hsl.h}, ${hsl.s}%, 76%)`);
        root.style.setProperty('--primary-400', `hsl(${hsl.h}, ${hsl.s}%, 66%)`);
        root.style.setProperty('--primary-500', themeColor.primary);
        root.style.setProperty('--primary-600', `hsl(${hsl.h}, ${hsl.s}%, 45%)`);
        root.style.setProperty('--primary-700', `hsl(${hsl.h}, ${hsl.s}%, 38%)`);
        root.style.setProperty('--primary-800', `hsl(${hsl.h}, ${hsl.s}%, 30%)`);
        root.style.setProperty('--primary-900', `hsl(${hsl.h}, ${hsl.s}%, 22%)`);
    }, [themeColor]);

    const setTheme = (newTheme: ThemeMode) => {
        setThemeState(newTheme);
        localStorage.setItem('insuite_theme', newTheme);
    };

    const setThemeColor = (color: ThemeColor) => {
        setThemeColorState(color);
        localStorage.setItem('insuite_theme_color', JSON.stringify(color));
    };

    const toggleTheme = () => {
        const newTheme = resolvedTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    };

    return (
        <ThemeContext.Provider value={{
            theme,
            resolvedTheme,
            themeColor,
            themeColors,
            setTheme,
            setThemeColor,
            toggleTheme
        }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
