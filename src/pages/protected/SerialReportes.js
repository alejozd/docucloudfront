import React, { useState, useRef, useCallback, useMemo } from "react";
import axios from "axios";
import Config from "../../components/features/Config";
import { Button } from "primereact/button";
import { Password } from "primereact/password";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { InputTextarea } from "primereact/inputtextarea";
import { InputText } from "primereact/inputtext";

const RESULT_FIELDS = [
  { label: "Procesador ID", key: "procesadorId" },
  { label: "Hard Drive Serial", key: "hardDriveSerial" },
  { label: "Nombre del Sistema", key: "systemName" },
  { label: "Letra del Módulo", key: "letraModulo" },
  { label: "Módulo", key: "modulo" },
  { label: "Clave", key: "clave" },
];

const SerialesReportes = () => {
  const [jwtToken, setJwtToken] = useState(sessionStorage.getItem("jwtToken") || "");
  const [password, setPassword] = useState("");
  const [serial, setSerial] = useState("");
  const [responseData, setResponseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(null);
  const [error, setError] = useState(null);
  const toast = useRef(null);

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${jwtToken}` } }),
    [jwtToken]
  );

  const showToast = useCallback((severity, detail) => {
    const summary =
      severity === "success"
        ? "Éxito"
        : severity === "warn"
          ? "Advertencia"
          : "Error";

    toast.current?.show({
      severity,
      summary,
      detail,
      life: 3000,
    });
  }, []);

  const clearFeedback = useCallback(() => {
    setError(null);
    setCopySuccess(null);
  }, []);

  const authenticate = async () => {
    if (!password.trim()) {
      showToast("warn", "Por favor ingresa la contraseña");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${Config.apiUrl}/api/login`, {
        password: password.trim(),
      });

      if (response.data?.token) {
        sessionStorage.setItem("jwtToken", response.data.token);
        setJwtToken(response.data.token);
        setPassword("");
        showToast("success", "Autenticación exitosa");
      } else {
        showToast("error", "Contraseña incorrecta");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Error al validar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem("jwtToken");
    setJwtToken("");
    setResponseData(null);
    setSerial("");
    clearFeedback();
  };

  const generateKey = async () => {
    if (!serial.trim()) {
      setError("Por favor ingresa un serial válido.");
      showToast("warn", "Por favor ingresa un serial válido");
      return;
    }

    setLoading(true);
    clearFeedback();

    try {
      const response = await axios.post(
        `${Config.apiUrl}/api/generateReportKey`,
        { serial: serial.trim() },
        authHeaders
      );
      setResponseData(response.data);
      showToast("success", "Clave generada exitosamente");
    } catch (err) {
      console.error(err);
      setError("Error al generar la clave. Verifica el serial o la conexión.");
      showToast("error", "Error al generar la clave");
    } finally {
      setLoading(false);
    }
  };

  const copyKey = async () => {
    if (!responseData?.clave) return;

    try {
      await navigator.clipboard.writeText(responseData.clave);
      setCopySuccess("Clave copiada al portapapeles");
      showToast("success", "Clave copiada al portapapeles");
    } catch {
      setCopySuccess("Error al copiar la clave");
      showToast("error", "Error al copiar la clave");
    }
  };

  const handleSerialChange = (event) => {
    setSerial(event.target.value);
    clearFeedback();
  };

  const handlePasswordKeyDown = (event) => {
    if (event.key === "Enter") {
      authenticate();
    }
  };

  if (!jwtToken) {
    return (
      <div className="clientes-page">
        <Toast ref={toast} />
        <Card style={{ maxWidth: "500px", margin: "0 auto" }}>
          <h2 style={{ marginTop: 0 }}>Protección con Contraseña</h2>
          <p>Por favor, ingresa la contraseña para acceder.</p>
          <div className="p-fluid">
            <div className="p-field" style={{ marginBottom: "12px" }}>
              <Password
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onKeyDown={handlePasswordKeyDown}
                toggleMask
                feedback={false}
                placeholder="Contraseña"
              />
            </div>
            <Button
              label={loading ? "Autenticando..." : "Autenticar"}
              icon={loading ? "pi pi-spin pi-spinner" : "pi pi-sign-in"}
              onClick={authenticate}
              className="p-button-primary"
              disabled={loading}
            />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="clientes-page">
      <Toast ref={toast} />

      <div className="clientes-header">
        <h2>Generar Clave de Reporte</h2>
        <div className="clientes-actions">
          <Button
            label={loading ? "Generando..." : "Generar Clave"}
            icon={loading ? "pi pi-spin pi-spinner" : "pi pi-key"}
            onClick={generateKey}
            disabled={loading}
            severity="success"
          />
          <Button label="Cerrar sesión" icon="pi pi-sign-out" severity="secondary" onClick={logout} />
        </div>
      </div>

      <Card className="clientes-table-card">
        <div className="p-fluid">
          <div className="p-field" style={{ marginBottom: "12px" }}>
            <label htmlFor="serial">Serial</label>
            <InputTextarea
              id="serial"
              rows={5}
              value={serial}
              onChange={handleSerialChange}
              placeholder="Ingresa el serial aquí..."
              autoResize
            />
          </div>

          {error && <p style={{ color: "red", marginTop: "4px" }}>{error}</p>}

          {responseData && (
            <Card style={{ marginTop: "14px" }}>
              <h3 style={{ marginTop: 0 }}>Datos Generados</h3>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <InputText value={responseData.clave || ""} readOnly style={{ width: "100%" }} />
                <Button label="Copiar" icon="pi pi-copy" onClick={copyKey} severity="warning" />
              </div>
              {copySuccess && (
                <p style={{ color: copySuccess.includes("Error") ? "#dc3545" : "#28a745", marginTop: 0 }}>
                  {copySuccess}
                </p>
              )}

              <div>
                {RESULT_FIELDS.map((field) => (
                  <p key={field.key} style={{ margin: "6px 0" }}>
                    <strong>{field.label}:</strong> {responseData[field.key] || "-"}
                  </p>
                ))}
              </div>
            </Card>
          )}
        </div>
      </Card>
    </div>
  );
};

export default SerialesReportes;
