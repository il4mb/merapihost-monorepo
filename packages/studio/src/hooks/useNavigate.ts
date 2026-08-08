import { useNavigation } from "@/components/navigations/NavigationProvider";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

// Keeps the base path clean for UI highlighting (e.g., active sidebar links)
function cleanPath(path?: string) {
    if (!path) return "/";
    return path.split("#")[0].split("?")[0].replace(/\/+$/, "") || "/";
}

export const useClickNavigate = (href: string) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { setLoading } = useNavigation();

    const cleanHref = useMemo(() => cleanPath(String(href || "/")), [href]);
    const currentPath = useMemo(() => cleanPath(pathname || "/"), [pathname]);

    // Used for UI (e.g., styling active menu items)
    const isActive = currentPath === cleanHref;

    const handleClick = useCallback((e: React.MouseEvent) => {
        if (e.defaultPrevented) return;
        e.preventDefault();
        e.stopPropagation();

        if (!href) return;

        // Construct current full URL to prevent redundant navigations
        const currentSearch = searchParams?.toString();
        const currentFullUrl = pathname + (currentSearch ? `?${currentSearch}` : "");

        // If the exact destination matches current exact URL, do nothing
        // We no longer use `isActive` here so query changes on the same page aren't blocked!
        if (href === currentFullUrl) return;

        setLoading(true);
        router.push(String(href));
    }, [href, router, setLoading, pathname, searchParams]);

    return [handleClick, isActive] as const;
}

export const useNavigate = () => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { setLoading } = useNavigation();

    const navigate = useCallback((href: string, query?: Record<string, string>) => {
        // 1. Use the URL API to safely parse the href and append/merge new queries
        // Using "http://localhost" as a dummy base allows relative paths like "/dashboard" to parse safely
        const url = new URL(href, "http://localhost");

        if (query) {
            Object.entries(query).forEach(([key, value]) => {
                url.searchParams.set(key, value);
            });
        }

        // Reconstruct the final relative path
        const finalHref = url.pathname + url.search + url.hash;

        // 2. Prevent navigation if we are already exactly on that URL
        const currentSearch = searchParams?.toString();
        const currentFullUrl = pathname + (currentSearch ? `?${currentSearch}` : "");

        if (finalHref === currentFullUrl) return;

        setLoading(true);
        setTimeout(() => {
            router.push(finalHref);
        }, 100);
    }, [router, setLoading, pathname, searchParams]);

    return navigate;
}