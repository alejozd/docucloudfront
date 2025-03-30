#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

// Configuración de las nuevas rutas
const PATH_MAPPINGS = {
  "./Navbar": "./components/layout/Navbar",
  "./Home": "./pages/dashboard/Home",
  "./Clientes": "./pages/clientes/Clientes",
  "./Contactos": "./pages/contactos/Contactos",
  "./Productos": "./pages/productos/Productos",
  "./Contactar": "./pages/contactar/Contactar",
  "./Weather": "./components/Weather",
  "./AsociarClienteContacto": "./pages/clientes/AsociarClienteContacto",
  "./SerialReportes": "./pages/reportes/SerialReportes",
  "./WorkTimeCalculator": "./components/WorkTimeCalculator",
  "./RegistroSolicitudesPage": "./pages/solicitudes/RegistroSolicitudesPage",
  "./BatteryStatus": "./components/BatteryStatus",
  "./SalesDashboard": "./pages/dashboard/SalesDashboard",
  "./ProtectedRoute": "./components/ProtectedRoute",
  "./ClientesMedios": "./pages/clientes/ClientesMedios",
  "./SerialesERP": "./pages/seriales/SerialesERP",
  "./ClavesGeneradas": "./pages/claves/ClavesGeneradas",
  "./GenerarClave": "./pages/claves/GenerarClave",
  "./Vendedores": "./pages/vendedores/Vendedores",
  "./DashboardVendedores": "./pages/vendedores/DashboardVendedores",
  "./Ventas": "./pages/ventas/Ventas",
  "./Pagos": "./pages/pagos/Pagos",
  "./Login": "./pages/auth/Login",
  "./AutorizacionPage": "./pages/auth/AutorizacionPage",
};

// Archivos a actualizar
const FILES_TO_UPDATE = ["src/App.js", "src/index.js"];

function updateImports() {
  FILES_TO_UPDATE.forEach((filePath) => {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      let content = fs.readFileSync(fullPath, "utf8");

      Object.entries(PATH_MAPPINGS).forEach(([oldPath, newPath]) => {
        const regex = new RegExp(
          `from\\s+['"]${escapeRegExp(oldPath)}['"]`,
          "g"
        );
        content = content.replace(regex, `from '${newPath}'`);
      });

      fs.writeFileSync(fullPath, content);
      console.log(`✓ Actualizado: ${filePath}`);
    } else {
      console.log(`✗ No encontrado: ${filePath}`);
    }
  });
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

updateImports();
console.log("✅ Importaciones actualizadas correctamente");
