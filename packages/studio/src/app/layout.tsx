import type { Metadata } from 'next';
import Theme from '@/theme/Theme';
import LocalizationAdapter from '@/contexts/LocalizationAdapter';
import SnackbarProvider from '@/contexts/SnackbarProvider';
import NavigationProvider from '@/components/navigations/NavigationProvider';

export const metadata: Metadata = {
    title: 'Studio | MerapiHost',
    description: 'Studio for Merapihost',
};
type LayoutProps = {
    children?: React.ReactNode;

};

export default function Layout({ children }: LayoutProps) {
    return (
        <html lang="id">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </head>
            <body>
                <Theme>
                    <NavigationProvider>
                        <LocalizationAdapter>
                            <SnackbarProvider>
                                {children}
                            </SnackbarProvider>
                        </LocalizationAdapter>
                    </NavigationProvider>
                </Theme>
            </body>
        </html>
    );
}
