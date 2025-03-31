import React, { useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import Config from "././Config";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";

const Login = ({ onLogin }) => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = React.useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async () => {
    if (!password) {
      toast.current.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Por favor ingresa la contraseña",
        life: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${Config.apiUrl}/api/login`, {
        password,
      });

      if (response.data && response.data.token) {
        sessionStorage.setItem("jwtToken", response.data.token);
        onLogin(response.data.token);
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Autenticación exitosa",
          life: 3000,
        });

        // Redirige al usuario a la ubicación original o a /serial-reportes por defecto
        const from = location.state?.from || "/serial-reportes";
        setTimeout(() => navigate(from), 1000); // Redirige después de 1 segundo
      } else {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "Contraseña incorrecta",
          life: 3000,
        });
      }
    } catch (error) {
      console.error("Error completo:", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.message || "Error al validar la contraseña",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title="Inicio de Sesión"
      subTitle="Ingresa tu contraseña"
      className="card"
    >
      <div className="flex justify-content-center flex-wrap gap-2">
        <Toast ref={toast} />
        <div>
          <Password
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            toggleMask
            placeholder="Contraseña"
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            promptLabel="Escribe la contraseña"
            weakLabel="Muy simple"
            mediumLabel="Complejidad promedio"
            strongLabel="Complejidad alta"
            feedback={false}
          />
        </div>
        <div>
          <Button
            label={loading ? "Autenticando..." : "Ingresar"}
            icon={loading ? "pi pi-spin pi-spinner" : "pi pi-sign-in"}
            onClick={handleLogin}
            disabled={loading}
            severity="primary"
          />
        </div>
      </div>
    </Card>
  );
};

export default Login;
