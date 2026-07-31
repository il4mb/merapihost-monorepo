import { CSSProperties } from 'react';

let parserNode: HTMLDivElement | null = null;

const getParserNode = (): HTMLDivElement | null => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return null;
    if (!parserNode) parserNode = document.createElement('div');
    return parserNode;
};

const toCamelCase = (str: string): string => {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
};

// Standard CSS properties that accept unitless numbers
const UNITLESS_PROPS = new Set([
    'opacity', 'zIndex', 'lineHeight', 'fontWeight', 'flex', 'flexGrow', 'flexShrink', 'order'
]);

/**
 * Normalizes numeric values. E.g., '8' -> '8px', but leaves 'opacity: 0.5' alone.
 */
const normalizeValue = (key: string, value: any): string => {
    const strVal = String(value).trim();
    if (strVal === '') return '';

    // Check if the value is purely numeric (e.g., 8, "8", "8.5")
    const isNumeric = !isNaN(Number(strVal));

    // If it's numeric, NOT 0 (0 is valid without units), and NOT a unitless property, append 'px'
    if (isNumeric && strVal !== '0' && !UNITLESS_PROPS.has(key)) {
        return `${strVal}px`;
    }

    return strVal;
};

export const expandCSSProperties = (styleObj: CSSProperties): Record<string, string> => {
    const node = getParserNode();
    if (!node) return {};

    node.style.cssText = '';

    for (const [key, value] of Object.entries(styleObj)) {
        if (value !== undefined && value !== null && value !== '') {
            // Apply normalization
            const parsedValue = normalizeValue(key, value);
            try {
                (node.style as any)[key] = parsedValue;
            } catch (e) {
                console.warn(`CSS Engine: Ignored invalid style property "${key}"`);
            }
        }
    }

    const expandedStyles: Record<string, string> = {};

    for (let i = 0; i < node.style.length; i++) {
        const cssProperty = node.style[i];
        const value = node.style.getPropertyValue(cssProperty);
        expandedStyles[toCamelCase(cssProperty)] = value;
    }

    return expandedStyles;
};

export const getCSSGroup = (styleObj: CSSProperties, prefix: string): Record<string, string> => {
    const expanded = expandCSSProperties(styleObj);
    const group: Record<string, string> = {};

    for (const [key, value] of Object.entries(expanded)) {
        if (key.startsWith(prefix)) {
            group[key] = value;
        }
    }

    return group;
};