// types.ts
export type ConflictType =
    | "DUPLICATE"
    | "AMBIGUOUS"
    | "INVALID_WILDCARD"
    | "MULTIPLE_WILDCARD";

export interface RouteConflictResult {
    conflict: boolean;
    type?: ConflictType;
    existingRoute?: string;
    message?: string;
}

// ---------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------

/**
 * Menghapus trailing slashes dan slash ganda.
 * Contoh: "//users//" -> "/users"
 */
export function normalizeRoute(route: string): string {
    let normalized = route.replace(/\/+/g, '/').trim();
    if (normalized.length > 1 && normalized.endsWith('/')) {
        normalized = normalized.slice(0, -1);
    }
    if (!normalized.startsWith('/')) {
        normalized = '/' + normalized;
    }
    return normalized;
}

/**
 * Memecah route menjadi array dari segment.
 * Contoh: "/users/:id" -> ["users", ":id"]
 */
export function parseSegments(route: string): string[] {
    const normalized = normalizeRoute(route);
    if (normalized === '/') return [];
    return normalized.split('/').filter(Boolean);
}

export function isParameter(segment: string): boolean {
    return segment.startsWith(':');
}

export function isWildcard(segment: string): boolean {
    return segment.startsWith('{*') && segment.endsWith('}');
}

// ---------------------------------------------------------
// Core Validation Logic
// ---------------------------------------------------------

/**
 * Memvalidasi apakah struktur route itu sendiri valid (tanpa melihat existing).
 */
function validateSelf(segments: string[]): RouteConflictResult | null {
    let wildcardCount = 0;
    let wildcardIndex = -1;

    for (let i = 0; i < segments.length; i++) {
        if (isWildcard(segments[i])) {
            wildcardCount++;
            wildcardIndex = i;
        }
    }

    if (wildcardCount > 1) {
        return {
            conflict: true,
            type: "MULTIPLE_WILDCARD",
            message: "Route cannot have more than one wildcard segment."
        };
    }

    // Rule 4: Wildcard hanya boleh berada di segmen terakhir
    if (wildcardCount === 1 && wildcardIndex !== segments.length - 1) {
        return {
            conflict: true,
            type: "INVALID_WILDCARD",
            message: "Wildcard must be the exact last segment of the route."
        };
    }

    return null; // Route valid secara sintaks
}

/**
 * Membandingkan dua route segment per segment
 */
function compareRoutes(newSegments: string[], existingSegments: string[]): RouteConflictResult | null {
    const maxLen = Math.max(newSegments.length, existingSegments.length);

    for (let i = 0; i < maxLen; i++) {
        const segN = newSegments[i];
        const segE = existingSegments[i];

        // Jika salah satu route lebih pendek, kita harus periksa apakah salah satunya adalah wildcard
        if (segN === undefined) {
            // newRoute habis. Apakah existing route merupakan wildcard di sini?
            if (isWildcard(segE)) return { conflict: true, type: "AMBIGUOUS", message: "Existing wildcard overlaps with the new route" };
            return null; // Tidak ada konflik (Rule 8: Specific vs General tidak conflict)
        }

        if (segE === undefined) {
            // existingRoute habis. Apakah new route merupakan wildcard di sini?
            if (isWildcard(segN)) return { conflict: true, type: "AMBIGUOUS", message: "New wildcard overlaps with an existing route" };
            return null; // Tidak ada konflik (Rule 8)
        }

        const nIsWild = isWildcard(segN);
        const eIsWild = isWildcard(segE);
        const nIsParam = isParameter(segN);
        const eIsParam = isParameter(segE);

        // Jika keduanya wildcard di posisi yang sama -> DUPLICATE (Rule 2 & 7)
        if (nIsWild && eIsWild) {
            return { conflict: true, type: "DUPLICATE", message: "Identical wildcard route already exists" };
        }

        // Rule 6 & 9: Jika salah satunya wildcard -> AMBIGUOUS
        if (nIsWild || eIsWild) {
            return { conflict: true, type: "AMBIGUOUS", message: "Wildcard overlaps parameter or static route" };
        }

        // Rule 1: Static route vs Parameter -> Berbeda cabang (Diverge), tidak ada konflik.
        if ((nIsParam && !eIsParam) || (!nIsParam && eIsParam)) {
            return null; // Aman
        }

        // Keduanya static, tapi hurufnya berbeda -> Berbeda cabang (Diverge), tidak ada konflik.
        if (!nIsParam && !eIsParam && segN !== segE) {
            return null; // Aman
        }

        // Jika sampai sini: 
        // 1. Keduanya parameter yang selevel (misal :id dan :slug) ATAU
        // 2. Keduanya static route yang teksnya sama persis (misal users dan users)
        // Lanjut periksa segmen berikutnya...
    }

    // Jika perulangan selesai tanpa diverge dan panjang route sama -> DUPLICATE (Rule 3)
    return {
        conflict: true,
        type: "DUPLICATE",
        message: "Route is structurally identical to an existing route"
    };
}

/**
 * Fungsi Utama (Entry Point)
 */
export function validateRoute(newRoute: string, existingRoutes: string[]): RouteConflictResult {
    const newSegments = parseSegments(newRoute);

    // 1. Validasi sintaks route baru itu sendiri
    const selfValidation = validateSelf(newSegments);
    if (selfValidation) {
        return selfValidation;
    }

    // 2. Bandingkan dengan route yang sudah ada
    for (const existing of existingRoutes) {
        const existingSegments = parseSegments(existing);

        const comparison = compareRoutes(newSegments, existingSegments);

        if (comparison && comparison.conflict) {
            return {
                ...comparison,
                existingRoute: existing // Beritahu user route mana yang bertabrakan
            };
        }
    }

    return { conflict: false };
}