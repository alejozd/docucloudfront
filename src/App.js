import "./App.css";
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./Navbar";
import Home from "./Home";
import Clientes from "./Clientes";
import Contactos from "./Contactos";
import Productos from "./Productos";
import Contactar from "./Contactar";
import Weather from "./Weather";
import AsociarClienteContacto from "./AsociarClienteContacto";
import SerialReportes from "./SerialReportes";
import WorkTimeCalculator from "./WorkTimeCalculator";
import RegistroSolicitudesPage from "./RegistroSolicitudesPage";
import BatteryStatus from "./BatteryStatus";
import SalesDashboard from "./SalesDashboard";
import ProtectedRoute from "./ProtectedRoute";
import ClientesMedios from "./ClientesMedios";
import SerialesERP from "./SerialesERP";
import ClavesGeneradas from "./ClavesGeneradas";
import Login from "./Login"; // Nuevo componente de autenticación

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
  const [jwtToken, setJwtToken] = useState(
    () => sessionStorage.getItem("jwtToken") || ""
  );

  useEffect(() => {
    if (!jwtToken) return;

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
    setJwtToken(token);
    sessionStorage.setItem("jwtToken", token);
  };

  const handleLogout = () => {
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
              element={<Login onAuthenticate={handleAuthenticate} />}
            />

            {/* Rutas protegidas */}
            {/* <Route
              path="/serial-reportes"
              element={
                <ProtectedRoute>
                  <SerialReportes />
                </ProtectedRoute>
              }
            /> */}
            <Route path="/serial-reportes" element={<SerialReportes />} />

            <Route
              path="/clientes-medios"
              element={
                <ProtectedRoute>
                  <ClientesMedios />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seriales-erp"
              element={
                <ProtectedRoute>
                  <SerialesERP />
                </ProtectedRoute>
              }
            />
            <Route
              path="/claves-generadas"
              element={
                <ProtectedRoute>
                  <ClavesGeneradas />
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
