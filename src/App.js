import "./App.css";
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./Navbar"; // Importa tu componente Navbar
import Home from "./Home"; // Importa tu componente Home
import Clientes from "./Clientes"; // Importa tu componente Clientes
import Contactos from "./Contactos"; // Importa tu componente Contacto
import Productos from "./Productos"; // Importa tu componente Productos
import Contactar from "./Contactar";
import Weather from "./Weather"; // Importa tu componente Weather
import AsociarClienteContacto from "./AsociarClienteContacto";
import SerialReportes from "./SerialReportes";
import WorkTimeCalculator from "./WorkTimeCalculator";
import RegistroSolicitudesPage from "./RegistroSolicitudesPage";
import BatteryStatus from "./BatteryStatus";
import SalesDashboard from "./SalesDashboard";
import ProtectedRoute from "./ProtectedRoute"; // Importa el componente ProtectedRoute
import ClientesMedios from "./ClientesMedios"; // Importa tu componente ClientesMedios
import SerialesERP from "./SerialesERP"; // Importa tu componente SerialesERP
import ClavesGeneradas from "./ClavesGeneradas"; // Importa tu componente ClavesGeneradas
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Verificar si hay un token JWT almacenado en localStorage
    const storedToken = localStorage.getItem("jwtToken");
    return !!storedToken; // Convertir a booleano
  });

  const [jwtToken, setJwtToken] = useState(() => {
    // Obtener el token JWT almacenado en localStorage
    return localStorage.getItem("jwtToken") || "";
  });

  // Función para manejar la autenticación
  const handleAuthenticate = (token) => {
    setIsAuthenticated(true);
    setJwtToken(token);
    localStorage.setItem("jwtToken", token); // Almacenar el token en localStorage
  };

  // Función para cerrar sesión
  const handleLogout = () => {
    setIsAuthenticated(false);
    setJwtToken("");
    localStorage.removeItem("jwtToken"); // Eliminar el token del almacenamiento
  };

  return (
    <Router>
      <div className="App">
        <Navbar isAuthenticated={isAuthenticated} onLogout={handleLogout} />
        <div className="content">
          <Routes>
            {/* Ruta pública */}
            <Route path="/" element={<Home />} />

            {/* Rutas públicas adicionales */}
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
              path="/SerialReportes"
              element={
                <SerialReportes
                  onAuthenticate={handleAuthenticate}
                  isAuthenticated={isAuthenticated}
                />
              }
            />

            {/* Rutas protegidas */}
            <Route
              path="/clientes-medios"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <ClientesMedios jwtToken={jwtToken} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seriales-erp"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <SerialesERP jwtToken={jwtToken} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/claves-generadas"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <ClavesGeneradas jwtToken={jwtToken} />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
