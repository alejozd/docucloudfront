const fs = require("fs");
const path = require("path");

// Define la estructura óptima para un proyecto React
const structure = {
  components: ["common", "features"],
  pages: [],
  "assets/images": [],
  "assets/styles": [],
  utils: [],
  hooks: [],
  context: [],
  services: [],
};

const baseDir = path.join(__dirname, "src");
const excludedDirs = [".git", "node_modules", "build", "public"];
const excludedFiles = ["package.json", "package-lock.json", "organize.js"];

// Crear las carpetas necesarias
const createFolders = () => {
  Object.keys(structure).forEach((folder) => {
    const folderPath = path.join(baseDir, folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    structure[folder].forEach((subfolder) => {
      const subfolderPath = path.join(folderPath, subfolder);
      if (!fs.existsSync(subfolderPath)) {
        fs.mkdirSync(subfolderPath, { recursive: true });
      }
    });
  });
};

// Clasificar archivos y moverlos a su carpeta correcta
const classifyAndMoveFiles = (dir) => {
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);
    if (excludedDirs.includes(file) || excludedFiles.includes(file)) return;

    if (fs.statSync(fullPath).isDirectory()) {
      classifyAndMoveFiles(fullPath);
    } else {
      let targetFolder = null;
      if (file.match(/\.jsx?$/)) {
        if (fullPath.includes("features")) {
          targetFolder = path.join(baseDir, "components/features");
        } else if (file.toLowerCase().includes("page")) {
          targetFolder = path.join(baseDir, "pages");
        } else {
          targetFolder = path.join(baseDir, "components/common");
        }
      } else if (file.match(/\.css$/) || file.match(/\.scss$/)) {
        targetFolder = path.join(baseDir, "assets/styles");
      } else if (file.match(/\.(png|jpg|jpeg|gif|svg)$/)) {
        targetFolder = path.join(baseDir, "assets/images");
      } else if (file.match(/\.js$/) && file.toLowerCase().includes("hook")) {
        targetFolder = path.join(baseDir, "hooks");
      } else if (
        file.match(/\.js$/) &&
        file.toLowerCase().includes("service")
      ) {
        targetFolder = path.join(baseDir, "services");
      } else if (
        file.match(/\.js$/) &&
        file.toLowerCase().includes("context")
      ) {
        targetFolder = path.join(baseDir, "context");
      } else if (file.match(/\.js$/)) {
        targetFolder = path.join(baseDir, "utils");
      }

      if (targetFolder) {
        const newPath = path.join(targetFolder, file);
        if (!fs.existsSync(newPath)) {
          fs.renameSync(fullPath, newPath);
        } else {
          console.log(`Archivo ya existe en destino: ${newPath}, se omite.`);
        }
      }
    }
  });
};

// Actualizar rutas de importación en los archivos
const updateImports = (dir) => {
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      updateImports(fullPath);
    } else if (file.match(/\.jsx?$/)) {
      let content = fs.readFileSync(fullPath, "utf-8");
      content = content.replace(
        /(['"])(\.\/[^'"]+)(['"])/g,
        (match, p1, p2, p3) => {
          let resolvedPath = path.resolve(dir, p2);
          let relativePath = path
            .relative(dir, resolvedPath)
            .replace(/\\/g, "/");
          return `${p1}${relativePath}${p3}`;
        }
      );
      fs.writeFileSync(fullPath, content, "utf-8");
    }
  });
};

// Ejecutar las funciones
createFolders();
classifyAndMoveFiles(baseDir);
updateImports(baseDir);

console.log("Estructura reorganizada correctamente sin mover todo a src.");
