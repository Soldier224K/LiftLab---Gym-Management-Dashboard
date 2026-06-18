// convert-to-js.mjs — converts all .ts→.js and .tsx→.jsx in src/ using the
// TypeScript compiler's transpileModule. Uses jsx:Preserve so JSX syntax
// stays readable (no _jsx() calls) — only TypeScript types are stripped.
import fs from "fs";
import path from "path";
import ts from "typescript";

let converted = 0;
let errors = 0;

function convertFile(filePath) {
  const ext = path.extname(filePath);
  if (ext !== ".ts" && ext !== ".tsx") return;

  try {
    const source = fs.readFileSync(filePath, "utf8");
    const newExt = ext === ".tsx" ? ".jsx" : ".js";
    const newPath = filePath.slice(0, -ext.length) + newExt;

    const result = ts.transpileModule(source, {
      compilerOptions: {
        // Preserve keeps JSX as <div>...</div> (readable .jsx), only strips TS types
        jsx: ts.JsxEmit.Preserve,
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        removeComments: false,
        isolatedModules: true,
        allowJs: true,
      },
      fileName: filePath,
    });

    fs.writeFileSync(newPath, result.outputText, "utf8");
    if (newPath !== filePath) fs.unlinkSync(filePath);
    converted++;
  } catch (err) {
    errors++;
    console.error(`✗ ${filePath}: ${err.message}`);
  }
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else convertFile(full);
  }
}

console.log("Converting src/ from TypeScript to JavaScript (JSX preserved)...\n");
walk("src");
console.log(`Done. ${converted} files converted, ${errors} errors.`);
