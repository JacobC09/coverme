import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const colorMap = new Map([
    ["#12343b", { token: "primary", cssVar: "--primary" }],
    ["#0d272d", { token: "primary-hover", cssVar: "--primary-hover" }],
    ["#f7f4ef", { token: "background", cssVar: "--background" }],
    ["#f6f3ed", { token: "background-soft", cssVar: "--background-soft" }],
    ["#fffaf2", { token: "cream", cssVar: "--cream" }],
    ["#fff8e6", { token: "warning-soft", cssVar: "--warning-soft" }],
    ["#f3c53b", { token: "gold", cssVar: "--gold" }],
    ["#7a4e09", { token: "gold-foreground", cssVar: "--gold-foreground" }],
]);

const supportedExtensions = new Set([
    ".css",
    ".html",
    ".js",
    ".jsx",
    ".mdx",
    ".ts",
    ".tsx",
]);

const ignoredDirectories = new Set([
    ".git",
    ".next",
    "coverage",
    "dist",
    "node_modules",
]);

const utilityPattern =
    /((?:[\w-]+:)*(?:accent|bg|border|caret|decoration|divide|fill|from|outline|placeholder|ring|shadow|stroke|text|to|via)-)\[(#[0-9a-fA-F]{3,8})\](\/(?:\d{1,3}|\[[^\]]+\]))?/g;

const cssHexPattern = /(?<!\[)#[0-9a-fA-F]{3,8}\b/g;

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const roots = args.filter((arg) => arg !== "--dry-run");
const searchRoots = roots.length > 0 ? roots : ["app", "components"];

function normalizeHex(hex) {
    return hex.toLowerCase();
}

function replaceTailwindUtilities(source) {
    return source.replace(utilityPattern, (match, prefix, hex, opacity = "") => {
        const color = colorMap.get(normalizeHex(hex));

        if (!color) {
            return match;
        }

        return `${prefix}${color.token}${opacity}`;
    });
}

function replaceCssHexValues(source) {
    return source
        .split(/(\r?\n)/)
        .map((line) => {
            if (/^\s*--[\w-]+\s*:/.test(line)) {
                return line;
            }

            return line.replace(cssHexPattern, (hex) => {
                const color = colorMap.get(normalizeHex(hex));

                if (!color) {
                    return hex;
                }

                return `var(${color.cssVar})`;
            });
        })
        .join("");
}

async function collectFiles(root) {
    const rootPath = path.resolve(root);
    const rootStats = await stat(rootPath);

    if (rootStats.isFile()) {
        return supportedExtensions.has(path.extname(rootPath)) ? [rootPath] : [];
    }

    const entries = await readdir(rootPath, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        if (entry.isDirectory() && ignoredDirectories.has(entry.name)) {
            continue;
        }

        const entryPath = path.join(rootPath, entry.name);

        if (entry.isDirectory()) {
            files.push(...(await collectFiles(entryPath)));
            continue;
        }

        if (entry.isFile() && supportedExtensions.has(path.extname(entry.name))) {
            files.push(entryPath);
        }
    }

    return files;
}

async function updateFile(filePath) {
    const source = await readFile(filePath, "utf8");
    let updated = replaceTailwindUtilities(source);

    if (path.extname(filePath) === ".css") {
        updated = replaceCssHexValues(updated);
    }

    if (updated === source) {
        return false;
    }

    if (!dryRun) {
        await writeFile(filePath, updated);
    }

    return true;
}

const changedFiles = [];

for (const root of searchRoots) {
    const files = await collectFiles(root);

    for (const file of files) {
        if (await updateFile(file)) {
            changedFiles.push(path.relative(process.cwd(), file));
        }
    }
}

if (changedFiles.length === 0) {
    console.log("No color replacements found.");
} else {
    const action = dryRun ? "Would update" : "Updated";
    console.log(`${action} ${changedFiles.length} file${changedFiles.length === 1 ? "" : "s"}:`);

    for (const file of changedFiles) {
        console.log(`- ${file}`);
    }
}
