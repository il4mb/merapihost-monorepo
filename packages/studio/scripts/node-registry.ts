#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { TypeModel } from "../node/cores";

// ---------------------------------------------------------------------------
// ESM-compatible __dirname (sama dengan cwd)
// ---------------------------------------------------------------------------
const __dirname = process.cwd();

// ---------------------------------------------------------------------------
// Direktori target
// ---------------------------------------------------------------------------
const MODULE_DIR = path.join(__dirname, "node", "mods");
const TYPES_DIR = path.join(MODULE_DIR, "types");
const BLOCKS_DIR = path.join(MODULE_DIR, "blocks");
const OUTPUT_FILE = path.join(MODULE_DIR, "index.ts");

// ---------------------------------------------------------------------------
// Helper untuk mengubah path absolut menjadi relatif terhadap cwd
// ---------------------------------------------------------------------------
const toRelativePath = (filePath: string): string => {
    const rel = path.relative(__dirname, filePath);
    return rel === "" ? "." : rel.replace(/\\/g, "/");
};

console.log(`\n📦 Generate type registry untuk direktori: ${toRelativePath(MODULE_DIR)}`);

// ---------------------------------------------------------------------------
// Scan semua file index.ts di dalam directory secara rekursif
// ---------------------------------------------------------------------------
function scanFiles(directory: string): string[] {
    const result: string[] = [];

    if (!fs.existsSync(directory)) {
        return result;
    }

    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const fullPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
            result.push(...scanFiles(fullPath));
            continue;
        }

        if (entry.isFile() && entry.name === "index.ts") {
            result.push(fullPath);
        }
    }

    return result;
}

// ---------------------------------------------------------------------------
// Registry sementara
// ---------------------------------------------------------------------------
interface TypeRegistryEntry {
    originalName: string;
    file: string;
    model: TypeModel;
}

// ---------------------------------------------------------------------------
// Fungsi utama: generate registry
// ---------------------------------------------------------------------------
async function generateRegistry(): Promise<void> {
    console.log(`\n🔄 Memindai direktori...`);
    const files = scanFiles(TYPES_DIR).sort((a, b) => a.localeCompare(b));

    const registry = new Map<string, TypeRegistryEntry>();

    for (const file of files) {
        try {
            const module = await import(pathToFileURL(file).href);
            const model = module.default;

            if (!(model instanceof TypeModel)) {
                console.warn(`⚠️  Default export dari ${toRelativePath(file)} bukan instance TypeModel, dilewati.`);
                continue;
            }

            const originalName = model.name;
            const key = originalName.toLowerCase();

            if (registry.has(key)) {
                console.warn(
                    `⚠️  Duplicate type "${originalName}" terdeteksi di ${toRelativePath(file)}. Menggunakan yang terakhir.`
                );
            }

            registry.set(key, {
                originalName,
                file,
                model,
            });

            console.log(`✅ Registered type: ${originalName} (${toRelativePath(file)})`);
        } catch (error) {
            console.error(`❌ Gagal mengimpor ${toRelativePath(file)}:`, error);
        }
    }

    if (registry.size === 0) {
        console.error("❌ Tidak ada TypeModel yang valid ditemukan. Registri tidak digenerate.");
        return;
    }

    // -------------------------------------------------------------------------
    // Generate isi file index.ts
    // -------------------------------------------------------------------------
    let importStatements = "";
    let exportStatements = "export const TYPE_REGISTRY = new Map<string, TypeModel>([\n";

    // Import type TypeModel untuk typing yang benar
    const coreFile = path.resolve(path.join(MODULE_DIR, "..", "cores.ts"));
    const coreRelative = path
        .relative(MODULE_DIR, coreFile)
        .replace(/\\/g, "/")
        .replace(/\.ts$/, "");
    const coreImportPath = coreRelative.startsWith(".") ? coreRelative : `./${coreRelative}`;
    importStatements += `import type { TypeModel } from "${coreImportPath}";\n\n`;

    // Sortir berdasarkan nama asli agar output deterministik
    const sortedEntries = Array.from(registry.entries()).sort(([a], [b]) =>
        a.localeCompare(b)
    );

    let importIndex = 0;
    for (const [key, entry] of sortedEntries) {
        const varName = `type${importIndex++}`;
        const relativePath = path
            .relative(MODULE_DIR, entry.file)
            .replace(/\\/g, "/")
            .replace(/\.ts$/, "");

        importStatements += `import { default as ${varName} } from "./${relativePath}";\n`;
        exportStatements += `  ["${entry.originalName.toLowerCase()}", ${varName}],\n`;
    }

    exportStatements += "]);\n";

    const header = `// ===================================================================
// Generated: ${new Date().toISOString()}
// AUTOMATICALLY GENERATED FILE - DO NOT EDIT
// Modify source files in 'mods/types' and run autoload script.
// ===================================================================`;

    const finalOutput = `${header}\n\n${importStatements}\n${exportStatements}`;

    try {
        fs.writeFileSync(OUTPUT_FILE, finalOutput, "utf-8");
        console.log(`✨ Type registry berhasil digenerate: ${toRelativePath(OUTPUT_FILE)}`);
    } catch (error) {
        console.error(`❌ Gagal menulis ${toRelativePath(OUTPUT_FILE)}:`, error);
    }
}

// ---------------------------------------------------------------------------
// Watch mode
// ---------------------------------------------------------------------------
function watchDirectories(dirs: string[]) {
    console.log(`\n👀 Watch mode aktif. Memantau perubahan create/delete pada:`);
    dirs.forEach((dir) => console.log(`   - ${toRelativePath(dir)}`));

    const watchers: fs.FSWatcher[] = [];
    let debounceTimer: NodeJS.Timeout | null = null;

    const scheduleGenerate = () => {
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }
        debounceTimer = setTimeout(async () => {
            console.clear();
            await generateRegistry();
        }, 300); // debounce 300ms
    };

    const handleWatchEvent = (eventType: string, filename: string | null) => {
        console.log(`🔔 Perubahan terdeteksi: ${eventType} ${filename ?? ""}`);

        // Hanya proses event create/delete. fs.watch melaporkan keduanya sebagai 'rename'
        // (di Linux/Windows). Event 'change' menandakan update isi file → abaikan.
        if (eventType === "rename") {
            scheduleGenerate();
        } else {
            console.log(`ℹ️  Event ${eventType} diabaikan (hanya create/delete yang diproses).`);
        }
    };

    const setupWatcher = (dir: string) => {
        if (!fs.existsSync(dir)) {
            console.warn(`⚠️  Direktori ${toRelativePath(dir)} tidak ditemukan, dilewati.`);
            return;
        }

        try {
            // Recursive watcher (didukung di macOS & Windows, Node >= v14)
            const watcher = fs.watch(dir, { recursive: true }, handleWatchEvent);
            watchers.push(watcher);
        } catch (error) {
            console.warn(
                `⚠️  Gagal memasang recursive watcher pada ${toRelativePath(dir)}. Fallback ke watcher per subdirektori.`
            );
            // Fallback: pasang watcher untuk setiap subdirektori
            const subdirs = scanDirectories(dir);
            for (const subdir of subdirs) {
                const subWatcher = fs.watch(subdir, handleWatchEvent);
                watchers.push(subWatcher);
            }
        }
    };

    for (const dir of dirs) {
        setupWatcher(dir);
    }

    // Bersihkan watcher saat proses dihentikan
    process.on("SIGINT", () => {
        console.log("\n🛑 Menutup watcher...");
        watchers.forEach((w) => w.close());
        process.exit(0);
    });
}

// ---------------------------------------------------------------------------
// Helper: scan semua subdirektori (untuk fallback watcher)
// ---------------------------------------------------------------------------
function scanDirectories(directory: string): string[] {
    const result: string[] = [directory]; // include root
    if (!fs.existsSync(directory)) return result;

    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            result.push(...scanDirectories(path.join(directory, entry.name)));
        }
    }
    return result;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
    const args = process.argv.slice(2);
    const watchMode = args.includes("--watch");

    // Jalankan generate sekali di awal
    await generateRegistry();

    if (watchMode) {
        const dirsToWatch = [TYPES_DIR, BLOCKS_DIR];
        watchDirectories(dirsToWatch);
    }
}

main().catch((error) => {
    console.error("❌ Terjadi error fatal:", error);
    process.exit(1);
});