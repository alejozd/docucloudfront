#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
<<<<<<< HEAD

// Correcciones específicas para tu proyecto
const FIXES = {
  // Imágenes
  "./resources/images/logo-metro.png": "../../assets/images/logo-metro.png",

  // Componentes
  "./components/CardDashboard": "../ui/CardDashboard",

  // Otras correcciones que necesites...
};

function fixImports() {
  console.log("🔍 Buscando y corrigiendo imports...");

  // Buscar todos los archivos JS/JSX en src/
  const files = [];
  function scanDir(directory) {
    fs.readdirSync(directory).forEach((file) => {
      const fullPath = path.join(directory, file);
      if (fs.statSync(fullPath).isDirectory()) {
        scanDir(fullPath);
      } else if (/\.(js|jsx)$/.test(file)) {
        files.push(fullPath);
      }
    });
  }
  scanDir(path.join(process.cwd(), "src"));

  // Aplicar correcciones
  files.forEach((file) => {
    let content = fs.readFileSync(file, "utf8");
    let updated = false;

    Object.entries(FIXES).forEach(([wrongPath, correctPath]) => {
      const regex = new RegExp(
        `from\\s+['"]${escapeRegExp(wrongPath)}['"]`,
        "g"
      );
      if (regex.test(content)) {
        content = content.replace(regex, `from '${correctPath}'`);
        updated = true;
      }
    });

    if (updated) {
      fs.writeFileSync(file, content);
      console.log(`✅ Corregido: ${path.relative(process.cwd(), file)}`);
    }
  });

  console.log("🎉 Importaciones corregidas!");
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Ejecutar
fixImports();
=======
const readline = require("readline");

// Configuración mejorada
const CONFIG = {
  ignoreFiles: ["App.test.js", "setupTests.js", "reportWebVitals.js"],
  typeFolders: {
    component: "components",
    page: "pages",
    hook: "hooks",
    util: "utils",
    test: "__tests__",
    unknown: "misc",
  },
  specialCases: {
    "index.js": "index.js",
    "App.js": "App.js", // Mantener App.js en src/
  },
};

const fileAnalysis = {};
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  console.log("🧠 Analizando proyecto...");

  const srcPath = path.join(process.cwd(), "src");

  // 1. Análisis profundo
  analyzeProject(srcPath);

  // 2. Mostrar resumen
  showAnalysisSummary();

  // 3. Confirmar antes de proceder
  await confirmAction();

  // 4. Reorganizar
  await reorganizeProject(srcPath);

  console.log("\n✅ ¡Reorganización completada!");
  rl.close();
}

function analyzeProject(dir) {
  const files = scanDirectory(dir);

  files.forEach((file) => {
    const relPath = path.relative(dir, file);
    const fileName = path.basename(file);

    // Ignorar archivos específicos
    if (CONFIG.ignoreFiles.includes(fileName)) {
      fileAnalysis[relPath] = { type: "ignore" };
      return;
    }

    // Casos especiales
    if (CONFIG.specialCases[fileName]) {
      fileAnalysis[relPath] = {
        type: "special",
        newLocation: CONFIG.specialCases[fileName],
      };
      return;
    }

    const content = fs.readFileSync(file, "utf8");
    fileAnalysis[relPath] = {
      type: classifyFile(fileName, content),
      newLocation: determineNewLocation(fileName, content),
    };
  });
}

function classifyFile(name, content) {
  if (/\.test\.js$/.test(name)) return "test";
  if (/use[A-Z]/.test(name)) return "hook";
  if (/Page\.js$/.test(name) || /View\.js$/.test(name)) return "page";
  if (/Component\.js$/.test(name) || /\.jsx$/.test(name)) return "component";
  if (/Util\.js$/.test(name) || /Helper\.js$/.test(name)) return "util";
  return "unknown";
}

function determineNewLocation(fileName, content) {
  const type = classifyFile(fileName, content);
  const folder = CONFIG.typeFolders[type] || "misc";

  // Manejo especial para páginas
  if (type === "page") {
    const domain = inferDomain(fileName);
    return path.join(folder, domain, fileName);
  }

  return path.join(folder, fileName);
}

function inferDomain(fileName) {
  return fileName.replace(/(Page|View|Screen)\.js$/, "").toLowerCase();
}

function showAnalysisSummary() {
  console.log("\n📂 Resumen de análisis:");

  const typeCounts = {};
  Object.values(fileAnalysis).forEach(({ type }) => {
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });

  Object.entries(typeCounts).forEach(([type, count]) => {
    console.log(`- ${type}: ${count} archivos`);
  });
}

async function confirmAction() {
  return new Promise((resolve) => {
    rl.question(
      "\n¿Deseas continuar con la reorganización? (s/n) ",
      (answer) => {
        if (answer.toLowerCase() !== "s") {
          console.log("❌ Reorganización cancelada");
          process.exit(0);
        }
        resolve();
      }
    );
  });
}

async function reorganizeProject(srcPath) {
  console.log("\n🛠 Reorganizando archivos...");

  // Primero crear todas las carpetas necesarias
  createAllFolders(srcPath);

  // Luego mover los archivos
  for (const [relPath, analysis] of Object.entries(fileAnalysis)) {
    if (analysis.type === "ignore") continue;

    const oldPath = path.join(srcPath, relPath);
    const newPath = path.join(srcPath, analysis.newLocation);

    try {
      if (oldPath !== newPath) {
        fs.mkdirSync(path.dirname(newPath), { recursive: true });
        fs.renameSync(oldPath, newPath);
        console.log(`✓ Movido: ${relPath} → ${analysis.newLocation}`);
      }
    } catch (error) {
      console.error(`✗ Error moviendo ${relPath}: ${error.message}`);
    }
  }
}

function createAllFolders(srcPath) {
  Object.values(CONFIG.typeFolders).forEach((folder) => {
    const fullPath = path.join(srcPath, folder);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`↳ Creada carpeta: ${folder}`);
    }
  });
}

function scanDirectory(dir) {
  let results = [];
  const list = fs.readdirSync(dir);

  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      results = results.concat(scanDirectory(fullPath));
    } else if (/\.(js|jsx)$/.test(file)) {
      results.push(fullPath);
    }
  });

  return results;
}

main().catch((err) => {
  console.error("❌ Error fatal:", err);
  rl.close();
});
>>>>>>> a739d483a280cf5b91115033ebfe5f1cce60c7cb
