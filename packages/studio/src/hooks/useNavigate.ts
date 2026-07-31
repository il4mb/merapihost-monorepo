import { useNavigation } from "@/components/navigations/NavigationProvider";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";

function cleanPath(path?: string) {
    if (!path) return "/";
    return path.split("#")[0].split("?")[0].replace(/\/+$/, "") || "/";
}


export const useClickNavigate = (href: string) => {
    const router = useRouter();
    const pathname = usePathname();
    const { setLoading } = useNavigation();

    const cleanHref = useMemo(() => cleanPath(String(href || "/")), [href]);
    const currentPath = useMemo(() => cleanPath(pathname || "/"), [pathname]);
    const isActive = currentPath === cleanHref;

    const handleClick = useCallback((e: React.MouseEvent) => {
        if (e.defaultPrevented) return;

        e.preventDefault();
        e.stopPropagation();
        if (isActive || !href) return;

        setLoading(true);
        router.push(String(href));
    }, [href, router, setLoading, isActive]);

    return [handleClick, isActive] as const;
}

export const useNavigate = () => {
    const router = useRouter();
    const pathname = usePathname();
    const currentPath = useMemo(() => cleanPath(pathname || "/"), [pathname]);
    const { setLoading } = useNavigation();

    const navigate = useCallback((href: string) => {
        const cleanHref = cleanPath(href);
        if (cleanHref === currentPath) return;
        setLoading(true);
        setTimeout(() => {
            router.push(cleanHref);
        }, 100);
    }, [router, setLoading, pathname]);

    return navigate;
}