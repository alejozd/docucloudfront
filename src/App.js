import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "././components/layout/Navbar";
import Home from "././pages/Home";
import Clientes from "./pages/Clientes";
import Contactos from "./pages/Contactos";
import Productos from "./pages/Productos";
import Contactar from "./pages/Contactar";
import Weather from "./pages/Weather";
import AsociarClienteContacto from "./pages/AsociarClienteContacto";
import SerialReportes from "./pages/protected/SerialReportes";
import WorkTimeCalculator from "./pages/tools/WorkTimeCalculator";
import RegistroSolicitudesPage from "./pages/RegistroSolicitudesPage";
import BatteryStatus from "./pages/tools/BatteryStatus";
import SalesDashboard from "./pages/SalesDashboard";
import ProtectedRoute from "././components/features/ProtectedRoute";
import ClientesMedios from "./pages/protected/ClientesMedios";
import SerialesERP from "./pages/protected/SerialesERP";
import ClavesGeneradas from "./pages/protected/ClavesGeneradas";
import GenerarClave from "./pages/protected/GenerarClave";
import Vendedores from "./pages/protected/Vendedores";
import DashboardVendedores from "./pages/protected/DashboardVendedores";
import Ventas from "./pages/protected/Ventas";
import Pagos from "./pages/protected/Pagos";
import Login from "./pages/protected/Login";
import AutorizacionPage from "./pages/protected/AutorizacionPage";
import "././styles/App.css";
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";

// Función para obtener la fecha de expiración del token JWT
const getTokenExpiration = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1])); // Decodifica el payload
    return payload.exp ? payload.exp * 1000 : null; // Convierte a milisegundos
  } catch (error) {
    return null;
  }
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const storedToken = sessionStorage.getItem("jwtToken");
    return !!storedToken;
  });

  const [jwtToken, setJwtToken] = useState(
    () => sessionStorage.getItem("jwtToken") || ""
  );

  useEffect(() => {
    if (!jwtToken) {
      console.warn("No se encontró ningún token JWT en sessionStorage.");
    } else {
      console.log("Token JWT cargado correctamente:");
    }

    const expirationTime = getTokenExpiration(jwtToken);
    if (!expirationTime) return;

    const currentTime = Date.now();
    const timeUntilLogout = expirationTime - currentTime;

    if (timeUntilLogout > 0) {
      const logoutTimer = setTimeout(() => handleLogout(), timeUntilLogout);
      return () => clearTimeout(logoutTimer); // Limpia el timeout si el componente se desmonta
    } else {
      handleLogout();
    }
  }, [jwtToken]);

  const handleAuthenticate = (token) => {
    setIsAuthenticated(true);
    setJwtToken(token);
    sessionStorage.setItem("jwtToken", token);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setJwtToken("");
    sessionStorage.removeItem("jwtToken");
    alert("Sesión expirada. Por favor, inicia sesión nuevamente.");
  };

  return (
    <Router>
      <div className="App">
        <Navbar onLogout={handleLogout} />
        <div className="content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/productos" element={<Productos />} />
            <Route path="/contactos" element={<Contactos />} />
            <Route path="/contactar" element={<Contactar />} />
            <Route path="/weather" element={<Weather />} />
            <Route
              path="/AsociarClienteContacto"
              element={<AsociarClienteContacto />}
            />
            <Route
              path="/WorkTimeCalculator"
              element={<WorkTimeCalculator />}
            />
            <Route
              path="/RegistroSolicitudesPage"
              element={<RegistroSolicitudesPage />}
            />
            <Route path="/BatteryStatus" element={<BatteryStatus />} />
            <Route path="/SalesDashboard" element={<SalesDashboard />} />

            {/* Ruta de autenticación */}
            <Route
              path="/login"
              element={<Login onLogin={handleAuthenticate} />}
            />

            {/* Rutas protegidas */}
            <Route
              path="/SerialReportes"
              element={
                <ProtectedRoute
                  isAuthenticated={isAuthenticated}
                  jwtToken={jwtToken}
                >
                  <SerialReportes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clientes-medios"
              element={
                <ProtectedRoute
                  isAuthenticated={isAuthenticated}
                  jwtToken={jwtToken}
                >
                  <ClientesMedios />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seriales-erp"
              element={
                <ProtectedRoute
                  isAuthenticated={isAuthenticated}
                  jwtToken={jwtToken}
                >
                  <SerialesERP />
                </ProtectedRoute>
              }
            />
            <Route
              path="/claves-generadas"
              element={
                <ProtectedRoute
                  isAuthenticated={isAuthenticated}
                  jwtToken={jwtToken}
                >
                  <ClavesGeneradas />
                </ProtectedRoute>
              }
            />
            <Route
              path="/generar-clave"
              element={
                <ProtectedRoute
                  isAuthenticated={isAuthenticated}
                  jwtToken={jwtToken}
                >
                  <GenerarClave />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vendedores"
              element={
                <ProtectedRoute
                  isAuthenticated={isAuthenticated}
                  jwtToken={jwtToken}
                >
                  <Vendedores />
                </ProtectedRoute>
              }
            />
            <Route
              path="/DashboardVendedores"
              element={
                <ProtectedRoute
                  isAuthenticated={isAuthenticated}
                  jwtToken={jwtToken}
                >
                  <DashboardVendedores />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ventas"
              element={
                <ProtectedRoute
                  isAuthenticated={isAuthenticated}
                  jwtToken={jwtToken}
                >
                  <Ventas />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pagos"
              element={
                <ProtectedRoute
                  isAuthenticated={isAuthenticated}
                  jwtToken={jwtToken}
                >
                  <Pagos />
                </ProtectedRoute>
              }
            />
            <Route path="/AutorizacionPage" element={<AutorizacionPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
