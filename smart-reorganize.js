const fs = require("fs");
const path = require("path");

const srcDir = path.join(__dirname, "src");
const folders = {
  components: path.join(srcDir, "components"),
  pages: path.join(srcDir, "pages"),
  hooks: path.join(srcDir, "hooks"),
  utils: path.join(srcDir, "utils"),
};

const ignoreFiles = [
  "node_modules",
  "public",
  "README.md",
  "smart-reorganize.js",
  ".gitignore",
];
const componentExtensions = [".jsx", ".tsx", ".js"];
const utilsExtensions = [".js", ".ts"];
const hookPattern = /^use[A-Z].*\.js$/;
const pagePattern = /Page\.js$/;

// Asegurar que las carpetas existen
Object.values(folders).forEach((folder) => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
});

// Escanear archivos en src/
function scanAndMoveFiles(dir) {
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);
    if (ignoreFiles.includes(file)) return;
    if (fs.statSync(fullPath).isDirectory()) {
      scanAndMoveFiles(fullPath);
      return;
    }

    const ext = path.extname(file);
    if (!componentExtensions.includes(ext)) return;

    let newLocation = null;
    if (hookPattern.test(file)) {
      newLocation = path.join(folders.hooks, file);
    } else if (pagePattern.test(file)) {
      newLocation = path.join(folders.pages, file);
    } else if (utilsExtensions.includes(ext) && file.includes("utils")) {
      newLocation = path.join(folders.utils, file);
    } else {
      newLocation = path.join(folders.components, file);
    }

    if (newLocation && fullPath !== newLocation) {
      fs.renameSync(fullPath, newLocation);
      console.log(`Movido: ${file} -> ${newLocation}`);
      updateImports(srcDir, file, newLocation);
    }
  });
}

// Actualizar importaciones en todos los archivos
function updateImports(dir, oldFile, newLocation) {
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      updateImports(fullPath, oldFile, newLocation);
      return;
    }
    if (!componentExtensions.includes(path.extname(file))) return;

    let content = fs.readFileSync(fullPath, "utf8");
    const oldImportRegex = new RegExp(
      `import (.+?) from ['"](.+?${oldFile})['"];`,
      "g"
    );
    const relativePath = path
      .relative(path.dirname(fullPath), newLocation)
      .replace(/\\/g, "/");

    content = content.replace(oldImportRegex, (match, component, oldPath) => {
      return `import ${component} from "./${relativePath}";`;
    });

    fs.writeFileSync(fullPath, content, "utf8");
    console.log(`Actualizado: ${file}`);
  });
}

scanAndMoveFiles(srcDir);
console.log("✅ Reorganización completa.");
