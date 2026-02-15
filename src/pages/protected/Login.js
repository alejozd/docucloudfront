import React, { useCallback, useRef, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Password } from "primereact/password";
import { Toast } from "primereact/toast";
import Config from "../../components/features/Config";

const DEFAULT_REDIRECT_PATH = "/serial-reportes";
const TOAST_LIFE = 3000;

const getLoginErrorMessage = (error) =>
  error?.response?.data?.message || "Error al validar la contraseña";

const Login = ({ onLogin }) => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const toastRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const showToast = useCallback((severity, summary, detail) => {
    toastRef.current?.show({
      severity,
      summary,
      detail,
      life: TOAST_LIFE,
    });
  }, []);

  const handleLogin = useCallback(async () => {
    if (!password) {
      showToast("warn", "Advertencia", "Por favor ingresa la contraseña");
      return;
    }

    setLoading(true);

    try {
      const { data } = await axios.post(`${Config.apiUrl}/api/login`, {
        password,
      });

      if (!data?.token) {
        showToast("error", "Error", "Contraseña incorrecta");
        return;
      }

      sessionStorage.setItem("jwtToken", data.token);
      onLogin(data.token);
      showToast("success", "Éxito", "Autenticación exitosa");

      const from = location.state?.from || DEFAULT_REDIRECT_PATH;
      setTimeout(() => navigate(from, { replace: true }), 1000);
    } catch (error) {
      console.error("Error completo:", error);
      showToast("error", "Error", getLoginErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [location.state, navigate, onLogin, password, showToast]);

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
      void handleLogin();
    },
    [handleLogin]
  );

  return (
    <Card
      title="Inicio de Sesión"
      subTitle="Ingresa tu contraseña"
      className="card"
    >
      <Toast ref={toastRef} />

      <form
        onSubmit={handleSubmit}
        className="flex justify-content-center flex-wrap gap-2"
      >
        <Password
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Contraseña"
          promptLabel="Escribe la contraseña"
          weakLabel="Muy simple"
          mediumLabel="Complejidad promedio"
          strongLabel="Complejidad alta"
          feedback={false}
          toggleMask
          disabled={loading}
          inputProps={{ autoComplete: "current-password" }}
        />

        <Button
          type="submit"
          label={loading ? "Autenticando..." : "Ingresar"}
          icon={loading ? "pi pi-spin pi-spinner" : "pi pi-sign-in"}
          disabled={loading}
          severity="primary"
        />
      </form>
    </Card>
  );
};

export default Login;
