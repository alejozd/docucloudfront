import React, { useState } from "react";
import axios from "axios";
import Config from "./Config";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";

const Login = ({ onLogin }) => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = React.useRef(null);

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
      } else {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "Contraseña incorrecta",
          life: 3000,
        });
      }
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al validar la contraseña",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <Toast ref={toast} />
      <h2>Inicio de Sesión</h2>
      <Password
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        toggleMask
        placeholder="Contraseña"
        // style={{ marginBottom: "10px" }}
      />
      <Button
        label={loading ? "Autenticando..." : "Ingresar"}
        icon={loading ? "pi pi-spin pi-spinner" : "pi pi-sign-in"}
        onClick={handleLogin}
        disabled={loading}
        className="p-button-raised p-button-primary"
      />
    </div>
  );
};

export default Login;
