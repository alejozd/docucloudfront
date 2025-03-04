import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ isAuthenticated, jwtToken, children }) => {
  const location = useLocation();

  if (!isAuthenticated) {
    console.warn("Token no encontrado. Redirigiendo a /login...");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Pasar el token como prop a los componentes protegidos
  return React.Children.map(children, (child) =>
    React.cloneElement(child, { jwtToken })
  );
};

export default ProtectedRoute;
