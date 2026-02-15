import React, { useCallback, useRef, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Password } from "primereact/password";
import { Toast } from "primereact/toast";
import Config from "../../components/features/Config";
import "../../styles/Login.css";

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
    <div
      className="login-page flex align-items-start justify-content-center px-3 pt-6 pb-4"
      
    >
      <Toast ref={toastRef} />

      <Card
        className="login-card w-full"
      >
        <div className="text-center mb-4">
          <div
            className="inline-flex align-items-center justify-content-center border-circle mb-3"
            style={{
              width: "56px",
              height: "56px",
              background: "linear-gradient(135deg, #1d4ed8, #06b6d4)",
              color: "#ffffff",
            }}
          >
            <i className="pi pi-lock text-xl" />
          </div>

          <h2 className="text-2xl font-semibold text-900 m-0">Bienvenido</h2>
          <p className="text-600 mt-2 mb-0">
            Inicia sesión para continuar a DocuCloud
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form flex flex-column gap-3">
          <label htmlFor="password" className="login-field-width font-medium text-700 text-left">
            Contraseña
          </label>

          <div className="login-password-wrapper w-full">
            <Password
              inputId="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Ingresa tu contraseña"
              promptLabel="Escribe la contraseña"
              weakLabel="Muy simple"
              mediumLabel="Complejidad promedio"
              strongLabel="Complejidad alta"
              feedback={false}
              toggleMask
              disabled={loading}
              autoComplete="current-password"
              className="login-password w-full"
              inputClassName="w-full"
            />
          </div>

          <small className="login-field-width text-500 block text-left">
            Tu sesión se inicia de forma segura con token JWT.
          </small>

          <Button
            type="submit"
            label={loading ? "Autenticando..." : "Ingresar"}
            icon={loading ? "pi pi-spin pi-spinner" : "pi pi-arrow-right"}
            disabled={loading}
            className="login-field-width mt-2"
            severity="primary"
            size="large"
          />
        </form>
      </Card>
    </div>
  );
};

export default Login;
