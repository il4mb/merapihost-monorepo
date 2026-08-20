#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import "../node/engine/Model";

// ---------------------------------------------------------------------------
// ESM-compatible __dirname (cwd)
// ---------------------------------------------------------------------------
const __dirname = process.cwd();

// ---------------------------------------------------------------------------
// Direktori target
// ---------------------------------------------------------------------------
const BASE_DIR = path.join(__dirname, "node");
const ENGINE_DIR = path.join(BASE_DIR, "engine");
const MODULE_DIR = path.join(BASE_DIR, "mods");
const TYPES_DIR = path.join(MODULE_DIR, "types");
const BLOCKS_DIR = path.join(MODULE_DIR, "blocks");
const OUTPUT_FILE = path.join(ENGINE_DIR, "registry.ts");

// ---------------------------------------------------------------------------
// GUARANTEE: Ensure registry.ts exists IMMEDIATELY on script startup
// ---------------------------------------------------------------------------
function ensureRegistryStubExists(): void {
    if (!fs.existsSync(ENGINE_DIR)) {
        fs.mkdirSync(ENGINE_DIR, { recursive: true });
    }

    if (!fs.existsSync(OUTPUT_FILE)) {
        const emptyStub = `// Temporary empty registry stub

export const TYPE_REGISTRY = new Map<string, any>();
export const BLOCK_REGISTRY = new Map<string, any>();
`;
        fs.writeFileSync(OUTPUT_FILE, emptyStub, "utf-8");
    }
}

// Execute immediately at script load time BEFORE any generator logic
ensureRegistryStubExists();

// ---------------------------------------------------------------------------
// Helper untuk mengubah path absolut menjadi relatif terhadap cwd
// ---------------------------------------------------------------------------
const toRelativePath = (filePath: string): string => {
    const rel = path.relative(__dirname, filePath);
    return rel === "" ? "." : rel.replace(/\\/g, "/");
};

console.log(`\n📦 Generate registry untuk direktori: ${toRelativePath(MODULE_DIR)}`);

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
interface RegistryEntry {
    originalName: string;
    file: string;
    model: any;
}

// ---------------------------------------------------------------------------
// Helper untuk memproses satu direktori registri (types / blocks)
// ---------------------------------------------------------------------------
async function processRegistryDir(dirPath: string, ModelClass: any): Promise<Map<string, RegistryEntry>> {
    const files = scanFiles(dirPath).sort((a, b) => a.localeCompare(b));
    const registry = new Map<string, RegistryEntry>();

    for (const file of files) {
        try {
            const fileUrl = `${pathToFileURL(file).href}?t=${Date.now()}`;
            const module = await import(fileUrl);
            const model = module.default;

            if (!(model instanceof ModelClass)) {
                console.warn(`⚠️  Default export dari ${toRelativePath(file)} bukan instance Model, dilewati.`);
                continue;
            }

            const originalName = model.name;
            const key = originalName.toLowerCase();

            if (registry.has(key)) {
                console.warn(
                    `⚠️  Duplicate entry "${originalName}" terdeteksi di ${toRelativePath(file)}. Menggunakan yang terakhir.`
                );
            }

            registry.set(key, {
                originalName,
                file,
                model,
            });

            console.log(`✅ Registered: ${originalName} (${toRelativePath(file)})`);
        } catch (error) {
            console.error(`❌ Gagal mengimpor ${toRelativePath(file)}:`, error);
        }
    }

    return registry;
}

// ---------------------------------------------------------------------------
// Fungsi utama: generate registry
// ---------------------------------------------------------------------------
async function generateRegistry(): Promise<void> {
    // Import Model dynamically or directly from concrete source file to avoid index.ts cycle
    const modelModule = await import(pathToFileURL(path.join(ENGINE_DIR, "Model.ts")).href);
    const ModelClass = modelModule.Model || modelModule.default;

    console.log(`\n🔄 Memindai direktori...`);

    console.log(`\n🔹 Types:`);
    const typeRegistryMap = await processRegistryDir(TYPES_DIR, ModelClass);

    console.log(`\n🔹 Blocks:`);
    const blockRegistryMap = await processRegistryDir(BLOCKS_DIR, ModelClass);

    let importStatements = ``;
    let importIndex = 0;

    const buildExportMap = (mapName: string, entriesMap: Map<string, RegistryEntry>): string => {
        let code = `export const ${mapName} = new Map<string, any>([\n`;
        const sortedEntries = Array.from(entriesMap.entries()).sort(([a], [b]) => a.localeCompare(b));

        for (const [key, entry] of sortedEntries) {
            const varName = `mod${importIndex++}`;
            const relativePath = path
                .relative(ENGINE_DIR, entry.file)
                .replace(/\\/g, "/")
                .replace(/\.ts$/, "");

            importStatements += `import { default as ${varName} } from "./${relativePath}";\n`;
            code += `  ["${entry.originalName.toLowerCase()}", ${varName}],\n`;
        }

        code += "]);\n\n";
        return code;
    };

    const typeExportCode = buildExportMap("TYPE_REGISTRY", typeRegistryMap);
    const blockExportCode = buildExportMap("BLOCK_REGISTRY", blockRegistryMap);

    const linkCode = `const ALL_REGISTRY = new Map([...TYPE_REGISTRY, ...BLOCK_REGISTRY]);

for (const model of ALL_REGISTRY.values()) {
    const parentName = model?.extendsName;
    if (!parentName) continue;

    const parent = ALL_REGISTRY.get(String(parentName).toLowerCase());
    if (parent) {
        model.extends = parent;
    }
}
`;

    const header = `// ===================================================================
// Generated: ${new Date().toISOString()}
// AUTOMATICALLY GENERATED FILE - DO NOT EDIT
// Modify source files in 'mods/types' or 'mods/blocks' and run watch-node script.
// ===================================================================`;

    const finalOutput = `${header}\n\n${importStatements}${typeExportCode}${blockExportCode}${linkCode}`;

    try {
        fs.writeFileSync(OUTPUT_FILE, finalOutput, "utf-8");
        console.log(`✨ Registry berhasil digenerate: ${toRelativePath(OUTPUT_FILE)}`);
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
        }, 300);
    };

    const handleWatchEvent = (eventType: string, filename: string | null) => {
        console.log(`🔔 Perubahan terdeteksi: ${eventType} ${filename ?? ""}`);
        scheduleGenerate();
    };

    const setupWatcher = (dir: string) => {
        if (!fs.existsSync(dir)) {
            console.warn(`⚠️  Direktori ${toRelativePath(dir)} tidak ditemukan, dilewati.`);
            return;
        }

        try {
            const watcher = fs.watch(dir, { recursive: true }, handleWatchEvent);
            watchers.push(watcher);
        } catch (error) {
            console.warn(
                `⚠️  Gagal memasang recursive watcher pada ${toRelativePath(dir)}. Fallback ke watcher per subdirektori.`
            );
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

    process.on("SIGINT", () => {
        console.log("\n🛑 Menutup watcher...");
        watchers.forEach((w) => w.close());
        process.exit(0);
    });
}

// ---------------------------------------------------------------------------
// Helper: scan semua subdirektori
// ---------------------------------------------------------------------------
function scanDirectories(directory: string): string[] {
    const result: string[] = [directory];
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