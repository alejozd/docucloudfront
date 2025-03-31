#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

// Configuración
const IGNORED_DIRS = ["build", "node_modules", "public", "dist", ".git"]; // Directorios a ignorar
const MAX_DEPTH = 5; // Profundidad máxima de anidación a mostrar

function displayTree(startPath, depth = 0) {
  // Verificar si debemos ignorar este directorio
  const dirName = path.basename(startPath);
  if (depth > 0 && IGNORED_DIRS.includes(dirName)) {
    return;
  }

  // Obtener contenido del directorio
  let items;
  try {
    items = fs.readdirSync(startPath);
  } catch (error) {
    console.error(`Error al leer directorio: ${startPath}`);
    return;
  }

  // Procesar cada elemento
  items.forEach((item, index) => {
    const fullPath = path.join(startPath, item);
    const isLast = index === items.length - 1;
    const stat = fs.statSync(fullPath);

    // Determinar prefijo visual
    const prefix =
      depth === 0 ? "" : "│   ".repeat(depth - 1) + (isLast ? "└── " : "├── ");

    // Mostrar el elemento
    console.log(prefix + item);

    // Si es directorio y no está en la lista negra, mostrar su contenido
    if (
      stat.isDirectory() &&
      !IGNORED_DIRS.includes(item) &&
      depth < MAX_DEPTH
    ) {
      displayTree(fullPath, depth + 1);
    }
  });
}

// Mostrar estructura desde el directorio actual
const rootPath = process.cwd();
console.log(`\nEstructura de: ${rootPath}\n`);
displayTree(rootPath);
console.log("\n✅ Listado completado\n");
