#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

// ---------------------------------------------------------------------------
// Setup & Constants
// ---------------------------------------------------------------------------
const __dirname = process.cwd();

const BASE_DIR = path.join(__dirname, "node");
const ENGINE_DIR = path.join(BASE_DIR, "engine");
const MODEL_FILE = path.join(ENGINE_DIR, "Model.ts");

const MODULE_DIR = path.join(BASE_DIR, "mods");
const TYPES_DIR = path.join(MODULE_DIR, "types");
const BLOCKS_DIR = path.join(MODULE_DIR, "blocks");
const OUTPUT_FILE = path.join(BASE_DIR, "registry.ts");

function ensureRegistryStubExists(): void {
    if (!fs.existsSync(ENGINE_DIR)) {
        fs.mkdirSync(ENGINE_DIR, { recursive: true });
    }

    if (!fs.existsSync(OUTPUT_FILE)) {
        const emptyStub = `// Temporary empty registry stub
export interface TypeRegistry {}
export interface BlockRegistry {}
export const TYPE_REGISTRY = new Map<string, any>();
export const BLOCK_REGISTRY = new Map<string, any>();
`;
        fs.writeFileSync(OUTPUT_FILE, emptyStub, "utf-8");
    }
}
ensureRegistryStubExists();

const toRelative = (filePath: string): string => {
    const rel = path.relative(BASE_DIR, filePath);
    return rel === "" ? "." : "./" + rel.replace(/\\/g, "/").replace(/\.ts$/, "");
};

console.log(`\n📦 Generate registry untuk direktori: ${toRelative(MODULE_DIR)}`);

// ---------------------------------------------------------------------------
// Core Functions
// ---------------------------------------------------------------------------
function scanFiles(directory: string): string[] {
    if (!fs.existsSync(directory)) return [];

    const result: string[] = [];
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const fullPath = path.join(directory, entry.name);
        
        if (entry.isDirectory()) {
            result.push(...scanFiles(fullPath));
        } else if (entry.isFile() && entry.name === "index.ts") {
            result.push(fullPath);
        }
    }
    return result;
}

interface RegistryEntry {
    originalName: string;
    file: string;
    model: any;
}

async function processRegistryDir(dirPath: string, ModelClass: any): Promise<Map<string, RegistryEntry>> {
    const files = scanFiles(dirPath).sort((a, b) => a.localeCompare(b));
    const registry = new Map<string, RegistryEntry>();

    for (const file of files) {
        try {
            const fileUrl = `${pathToFileURL(file).href}?t=${Date.now()}`;
            const module = await import(fileUrl);
            const model = module.default;

            if (!(model instanceof ModelClass)) {
                console.warn(`⚠️  Default export dari ${toRelative(file)} bukan instance Model, dilewati.`);
                continue;
            }

            const originalName = model.name;
            const key = originalName.toLowerCase();

            if (registry.has(key)) {
                console.warn(`⚠️  Duplicate entry "${originalName}" terdeteksi di ${toRelative(file)}. Menggunakan yang terakhir.`);
            }

            registry.set(key, { originalName, file, model });
            console.log(`✅ Registered: ${originalName} (${toRelative(file)})`);
        } catch (error) {
            console.error(`❌ Gagal mengimpor ${toRelative(file)}:`, error);
            // Continue processing other files instead of exiting
        }
    }
    return registry;
}

async function generateRegistry(): Promise<void> {
    try {
        const modelModule = await import(pathToFileURL(MODEL_FILE).href);
        const ModelClass = modelModule.Model || modelModule.default;

        console.log(`\n🔄 Memindai direktori...`);

        console.log(`\n🔹 Types:`);
        const typeRegistryMap = await processRegistryDir(TYPES_DIR, ModelClass);

        console.log(`\n🔹 Blocks:`);
        const blockRegistryMap = await processRegistryDir(BLOCKS_DIR, ModelClass);

        let importStatements = ``;
        let importIndex = 0;

        // Helper to dry up Map iteration logic
        const processEntries = (registryMap: Map<string, RegistryEntry>) => {
            let interfaceProps = ``;
            let mapEntries = ``;
            const sortedEntries = Array.from(registryMap.entries()).sort(([a], [b]) => a.localeCompare(b));

            for (const [key, entry] of sortedEntries) {
                const varName = `mod${importIndex++}`;
                importStatements += `import ${varName} from "${toRelative(entry.file)}";\n`;
                interfaceProps += `    "${key}": typeof ${varName};\n`;
                mapEntries += `  ["${key}", ${varName}],\n`;
            }
            return { interfaceProps, mapEntries };
        };

        const typeData = processEntries(typeRegistryMap);
        const blockData = processEntries(blockRegistryMap);

        const interfacesCode = `export interface TypeRegistry {}\n\nexport interface BlockRegistry {\n${blockData.interfaceProps}}\n`;
        
        const typeExportCode = `export const TYPE_REGISTRY = new Map<string, Model<any>>([\n${typeData.mapEntries}]);\n\n`;
        const blockExportCode = `export const BLOCK_REGISTRY = new Map<string, any>([\n${blockData.mapEntries}]);\n\n`;

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
// ===================================================================
import { Model } from "${toRelative(MODEL_FILE)}";`;

        const finalOutput = `${header}\n\n${importStatements}\n${interfacesCode}\n${typeExportCode}${blockExportCode}${linkCode}`;

        try {
            fs.writeFileSync(OUTPUT_FILE, finalOutput, "utf-8");
            console.log(`✨ Registry berhasil digenerate: ${toRelative(OUTPUT_FILE)}`);
        } catch (error) {
            console.error(`❌ Gagal menulis ${toRelative(OUTPUT_FILE)}:`, error);
        }
    } catch (error) {
        console.error(`❌ Gagal generate registry:`, error);
        // Do not exit, continue running in watch mode
    }
}

// ---------------------------------------------------------------------------
// Watch mode
// ---------------------------------------------------------------------------
function watchDirectories(dirs: string[]) {
    console.log(`\n👀 Watch mode aktif. Memantau perubahan create/delete pada:`);
    dirs.forEach((dir) => console.log(`   - ${toRelative(dir)}`));

    const watchers: fs.FSWatcher[] = [];
    let debounceTimer: NodeJS.Timeout | null = null;

    const scheduleGenerate = () => {
        if (debounceTimer) clearTimeout(debounceTimer);
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
            console.warn(`⚠️  Direktori ${toRelative(dir)} tidak ditemukan, dilewati.`);
            return;
        }

        try {
            const watcher = fs.watch(dir, { recursive: true }, handleWatchEvent);
            watchers.push(watcher);
        } catch (error) {
            console.warn(`⚠️  Gagal memasang recursive watcher pada ${toRelative(dir)}. Fallback ke watcher per subdirektori.`);
            scanDirectories(dir).forEach(subdir => {
                watchers.push(fs.watch(subdir, handleWatchEvent));
            });
        }
    };

    dirs.forEach(setupWatcher);

    process.on("SIGINT", () => {
        console.log("\n🛑 Menutup watcher...");
        watchers.forEach((w) => w.close());
        process.exit(0);
    });
}

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
        watchDirectories([TYPES_DIR, BLOCKS_DIR]);
    }
}

main().catch((error) => {
    console.error("❌ Terjadi error fatal:", error);
    // Don't exit, keep running in watch mode
    if (process.argv.includes("--watch")) {
        console.log("🔄 Watch mode continues despite error...");
    } else {
        process.exit(1);
    }
});