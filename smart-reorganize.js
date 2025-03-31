#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

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
