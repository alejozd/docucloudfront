import React, { useState, useRef, useCallback, useMemo } from "react";
import axios from "axios";
import Config from "../../components/features/Config";
import { Button } from "primereact/button";
import { Password } from "primereact/password";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";

// Genera la clave de ingreso de Helisa contable (Helisa NIIF).
// El algoritmo vive en el backend (POST /api/erp/generar-clave); aqui solo el formulario.
const ErpClave = () => {
  const [jwtToken, setJwtToken] = useState(sessionStorage.getItem("jwtToken") || "");
  const [password, setPassword] = useState("");
  const [licencia, setLicencia] = useState("");
  const [nit, setNit] = useState("");
  const [pista, setPista] = useState("");
  const [sesiones, setSesiones] = useState(99);
  const [mora, setMora] = useState(0);
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
      severity === "success" ? "Éxito" : severity === "warn" ? "Advertencia" : "Error";
    toast.current?.show({ severity, summary, detail, life: 3000 });
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
    clearFeedback();
  };

  const generarClave = async () => {
    clearFeedback();
    if (!licencia.trim() || !nit.trim() || !pista.trim()) {
      setError("Licencia, Nit y Pista son obligatorios.");
      showToast("warn", "Completa Licencia, Nit y Pista");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(
        `${Config.apiUrl}/api/erp/generar-clave`,
        {
          licencia: licencia.trim(),
          nit: nit.trim(),
          pista: pista.trim(),
          sesiones,
          mora,
        },
        authHeaders
      );
      setResponseData(response.data);
      showToast("success", "Clave generada exitosamente");
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || "Error al generar la clave. Verifica los datos o la conexión.";
      setError(msg);
      showToast("error", msg);
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

  const handlePasswordKeyDown = (event) => {
    if (event.key === "Enter") authenticate();
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
        <h2>ERP · Clave de ingreso Helisa contable</h2>
        <div className="clientes-actions">
          <Button
            label={loading ? "Generando..." : "Generar Clave"}
            icon={loading ? "pi pi-spin pi-spinner" : "pi pi-key"}
            onClick={generarClave}
            disabled={loading}
            severity="success"
          />
          <Button label="Cerrar sesión" icon="pi pi-sign-out" severity="secondary" onClick={logout} />
        </div>
      </div>

      <Card className="clientes-table-card">
        <div className="p-fluid">
          <div className="p-field" style={{ marginBottom: "12px" }}>
            <label htmlFor="licencia">Licencia (12, sin guion)</label>
            <InputText
              id="licencia"
              value={licencia}
              onChange={(e) => setLicencia(e.target.value.toUpperCase())}
              placeholder="Ej: LCN3FF026050"
            />
          </div>
          <div className="p-field" style={{ marginBottom: "12px" }}>
            <label htmlFor="nit">Nit</label>
            <InputText id="nit" value={nit} onChange={(e) => setNit(e.target.value)} placeholder="Ej: 800300600" />
          </div>
          <div className="p-field" style={{ marginBottom: "12px" }}>
            <label htmlFor="pista">Pista (como la muestra el programa)</label>
            <InputText id="pista" value={pista} onChange={(e) => setPista(e.target.value)} placeholder="Ej: EU68CTQB0" />
          </div>
          <div style={{ display: "flex", gap: "16px", marginBottom: "12px" }}>
            <div className="p-field" style={{ flex: 1 }}>
              <label htmlFor="sesiones">Sesiones</label>
              <InputNumber id="sesiones" value={sesiones} onValueChange={(e) => setSesiones(e.value ?? 0)} min={0} max={255} />
            </div>
            <div className="p-field" style={{ flex: 1 }}>
              <label htmlFor="mora">Mora</label>
              <InputNumber id="mora" value={mora} onValueChange={(e) => setMora(e.value ?? 0)} min={0} max={4095} />
            </div>
          </div>

          {error && <p style={{ color: "red", marginTop: "4px" }}>{error}</p>}

          {responseData && (
            <Card style={{ marginTop: "14px" }}>
              <h3 style={{ marginTop: 0 }}>Clave generada</h3>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <InputText
                  value={responseData.clave || ""}
                  readOnly
                  style={{ width: "100%", fontFamily: "monospace", fontWeight: "bold", fontSize: "1.2rem" }}
                />
                <Button label="Copiar" icon="pi pi-copy" onClick={copyKey} severity="warning" />
              </div>
              {copySuccess && (
                <p style={{ color: copySuccess.includes("Error") ? "#dc3545" : "#28a745", marginTop: 0 }}>
                  {copySuccess}
                </p>
              )}
              <p style={{ margin: "6px 0" }}>
                <strong>Sesiones:</strong> {responseData.sesiones} &nbsp; <strong>Mora:</strong> {responseData.mora}
              </p>
            </Card>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ErpClave;
