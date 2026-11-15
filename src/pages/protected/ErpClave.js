import React, { useState, useRef, useCallback, useMemo } from "react";
import axios from "axios";
import Config from "../../components/features/Config";
import { Button } from "primereact/button";
import { Password } from "primereact/password";
import { Toast } from "primereact/toast";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import "../../styles/ErpClave.css";

// Genera la clave de ingreso del ERP contable.
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
  const claveInputRef = useRef(null);

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

  // Respaldo para navegadores sin Clipboard API disponible (contexto no seguro / permiso denegado).
  const copyConRespaldo = () => {
    const input = claveInputRef.current;
    if (input) {
      input.focus();
      input.select();
      input.setSelectionRange?.(0, input.value.length);
      if (document.execCommand?.("copy")) return true;
    }
    const tmp = document.createElement("textarea");
    tmp.value = responseData?.clave || "";
    tmp.setAttribute("readonly", "");
    tmp.style.position = "fixed";
    tmp.style.top = "-1000px";
    tmp.style.opacity = "0";
    document.body.appendChild(tmp);
    tmp.select();
    tmp.setSelectionRange(0, tmp.value.length);
    const ok = document.execCommand?.("copy");
    document.body.removeChild(tmp);
    return Boolean(ok);
  };

  const copyKey = async () => {
    if (!responseData?.clave) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard API no disponible");
      await navigator.clipboard.writeText(responseData.clave);
      setCopySuccess("Clave copiada al portapapeles");
      showToast("success", "Clave copiada al portapapeles");
    } catch {
      try {
        if (!copyConRespaldo()) throw new Error("No se pudo copiar");
        setCopySuccess("Clave copiada al portapapeles");
        showToast("success", "Clave copiada al portapapeles");
      } catch {
        setCopySuccess("Error al copiar la clave");
        showToast("error", "Error al copiar la clave");
      }
    }
  };

  const handlePasswordKeyDown = (event) => {
    if (event.key === "Enter") authenticate();
  };

  if (!jwtToken) {
    return (
      <div className="erp-clave-page">
        <Toast ref={toast} />
        <div className="erp-login-wrap">
          <div className="erp-login-card">
            <div className="erp-login-icon">
              <i className="pi pi-lock" aria-hidden="true" />
            </div>
            <h2>Protección con Contraseña</h2>
            <p>Por favor, ingresa la contraseña para acceder.</p>
            <div className="erp-field">
              <Password
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onKeyDown={handlePasswordKeyDown}
                toggleMask
                feedback={false}
                placeholder="Contraseña"
                inputId="erp-password"
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
        </div>
      </div>
    );
  }

  return (
    <div className="erp-clave-page">
      <Toast ref={toast} />

      <section className="erp-hero">
        <div className="erp-hero-main">
          <div className="erp-hero-icon">
            <i className="pi pi-key" aria-hidden="true" />
          </div>
          <div>
            <p className="erp-hero-eyebrow">ERP contable</p>
            <h2 className="erp-hero-title">Generar clave de acceso a ERP contable</h2>
            <p className="erp-hero-subtitle">
              Ingresa los datos de la licencia para obtener la clave de ingreso.
            </p>
          </div>
        </div>
        <div className="erp-hero-actions">
          <Button
            label={loading ? "Generando..." : "Generar Clave"}
            icon={loading ? "pi pi-spin pi-spinner" : "pi pi-key"}
            onClick={generarClave}
            disabled={loading}
            severity="success"
          />
          <Button label="Cerrar sesión" icon="pi pi-sign-out" severity="secondary" onClick={logout} />
        </div>
      </section>

      <div className="erp-grid">
        <section className="erp-panel">
          <header className="erp-panel-header">
            <span className="erp-panel-icon">
              <i className="pi pi-pencil" aria-hidden="true" />
            </span>
            <div>
              <h3>Datos de la licencia</h3>
              <p>Licencia, Nit y Pista son obligatorios.</p>
            </div>
          </header>

          <div className="erp-fields">
            <div className="erp-field erp-field-wide">
              <label htmlFor="licencia">Licencia (12, sin guion)</label>
              <IconField iconPosition="left">
                <InputIcon className="pi pi-id-card" />
                <InputText
                  id="licencia"
                  value={licencia}
                  onChange={(e) => setLicencia(e.target.value.toUpperCase())}
                  placeholder="Ej: LCN3FF026050"
                  autoComplete="off"
                />
              </IconField>
            </div>

            <div className="erp-field">
              <label htmlFor="nit">Nit</label>
              <IconField iconPosition="left">
                <InputIcon className="pi pi-building" />
                <InputText
                  id="nit"
                  value={nit}
                  onChange={(e) => setNit(e.target.value)}
                  placeholder="Ej: 800300600"
                  autoComplete="off"
                />
              </IconField>
            </div>

            <div className="erp-field">
              <label htmlFor="pista">Pista (como la muestra el programa)</label>
              <IconField iconPosition="left">
                <InputIcon className="pi pi-compass" />
                <InputText
                  id="pista"
                  value={pista}
                  onChange={(e) => setPista(e.target.value)}
                  placeholder="Ej: EU68CTQB0"
                  autoComplete="off"
                />
              </IconField>
            </div>

            <div className="erp-field">
              <label htmlFor="sesiones">Sesiones</label>
              <InputNumber
                id="sesiones"
                value={sesiones}
                onValueChange={(e) => setSesiones(e.value ?? 0)}
                min={0}
                max={255}
                showButtons
                buttonLayout="horizontal"
              />
              <span className="erp-field-hint">Entre 0 y 255</span>
            </div>

            <div className="erp-field">
              <label htmlFor="mora">Mora</label>
              <InputNumber
                id="mora"
                value={mora}
                onValueChange={(e) => setMora(e.value ?? 0)}
                min={0}
                max={4095}
                showButtons
                buttonLayout="horizontal"
              />
              <span className="erp-field-hint">Entre 0 y 4095</span>
            </div>
          </div>

          {error && (
            <p className="erp-alert" role="alert">
              <i className="pi pi-exclamation-circle" aria-hidden="true" />
              <span>{error}</span>
            </p>
          )}
        </section>

        <section className="erp-panel">
          <header className="erp-panel-header">
            <span className="erp-panel-icon">
              <i className="pi pi-shield" aria-hidden="true" />
            </span>
            <div>
              <h3>Clave generada</h3>
              <p>Cópiala y úsala para el ingreso.</p>
            </div>
          </header>

          {responseData ? (
            <div className="erp-result erp-result-filled">
              <p className="erp-result-label">
                <i className="pi pi-check-circle" aria-hidden="true" />
                Clave de acceso
              </p>
              <div className="erp-key-row">
                <InputText
                  ref={claveInputRef}
                  value={responseData.clave || ""}
                  readOnly
                  aria-label="Clave generada"
                  onFocus={(e) => e.target.select()}
                />
                <Button label="Copiar" icon="pi pi-copy" onClick={copyKey} severity="warning" />
              </div>
              {copySuccess && (
                <p className={`erp-copy-note${copySuccess.includes("Error") ? " erp-copy-note-error" : ""}`}>
                  {copySuccess}
                </p>
              )}
              <div className="erp-meta">
                <div className="erp-chip">
                  <i className="pi pi-users" aria-hidden="true" />
                  <div>
                    <span className="erp-chip-label">Sesiones</span>
                    <span className="erp-chip-value">{responseData.sesiones}</span>
                  </div>
                </div>
                <div className="erp-chip">
                  <i className="pi pi-clock" aria-hidden="true" />
                  <div>
                    <span className="erp-chip-label">Mora</span>
                    <span className="erp-chip-value">{responseData.mora}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="erp-empty">
              <i className="pi pi-key" aria-hidden="true" />
              <p>Completa los datos de la licencia y presiona “Generar Clave” para ver aquí el resultado.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ErpClave;
