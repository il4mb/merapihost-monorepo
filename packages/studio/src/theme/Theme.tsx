'use client';

import { useEffect, useMemo, useState, ReactNode } from 'react';
import { ThemeProvider, createTheme, useColorScheme } from '@mui/material/styles';
import type { ThemeOptions } from '@mui/material/styles';
import { inputsCustomizations, dataDisplayCustomizations, feedbackCustomizations, navigationCustomizations, surfacesCustomizations } from './customizations';
import { colorSchemes, typography, shadows, shape } from './themePrimitives';
import "./theme.scss";


interface Props {
	children: ReactNode;
	disableCustomTheme?: boolean;
	themeComponents?: ThemeOptions['components'];
}

export default function Theme({ children, disableCustomTheme, themeComponents }: Props) {

	const [mounted, setMounted] = useState(false);
	const [mode, setMode] = useState<'light' | 'dark'>('light');

	const theme = useMemo(() => {
		if (disableCustomTheme) return {};

		const palette = colorSchemes[mode]?.palette ?? colorSchemes.light.palette;

		return createTheme({
			palette,
			cssVariables: {
				colorSchemeSelector: 'data-color-scheme',
				cssVarPrefix: 'template',
			},
			colorSchemes,
			typography,
			shadows,
			shape,
			components: {
				...inputsCustomizations,
				...dataDisplayCustomizations,
				...feedbackCustomizations,
				...navigationCustomizations,
				...surfacesCustomizations,
				...themeComponents,
			},
		});
	}, [disableCustomTheme, themeComponents, mode]);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		const savedMode = localStorage.getItem('theme-mode') as 'light' | 'dark' | null;
		if (!savedMode) {
			localStorage.setItem('theme-mode', "light");
		}
		setMounted(true);
	}, []);

	if (!mounted) return null;

	if (disableCustomTheme) return <>{children}</>;

	return (
		<ThemeProvider theme={theme} modeStorageKey={'theme-mode'} disableTransitionOnChange>
			<ThemeClient onResolvedMode={setMode}>{children}</ThemeClient>
		</ThemeProvider>
	);
}


type ThemeClientProps = {
	children: ReactNode;
	onResolvedMode: (mode: 'light' | 'dark') => void;
};
function ThemeClient({ children, onResolvedMode }: ThemeClientProps) {
	const { mode, systemMode } = useColorScheme();
	const resolvedMode = (mode ?? systemMode ?? 'light') as 'light' | 'dark';

	useEffect(() => {
		onResolvedMode(resolvedMode);
	}, [resolvedMode]);

	return <>{children}</>;
}

export function useIsDark() {

	const { mode } = useColorScheme();
	return mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
}