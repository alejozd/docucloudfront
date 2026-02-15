import React, { useState, useRef, useCallback, useMemo } from "react";
import axios from "axios";
import Config from "../../components/features/Config";
import { Button } from "primereact/button";
import { Password } from "primereact/password";
import { Toast } from "primereact/toast";

const SerialesReportes = () => {
  const [jwtToken, setJwtToken] = useState(
    sessionStorage.getItem("jwtToken") || ""
  );
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
    toast.current?.show({
      severity,
      summary: severity === "success" ? "Éxito" : "Error",
      detail,
      life: 3000,
    });
  }, []);

  const clearFeedback = () => {
    setError(null);
    setCopySuccess(null);
  };

  const authenticate = async () => {
    if (!password.trim()) {
      showToast("warn", "Por favor ingresa la contraseña");
      return;
    }

    try {
      const response = await axios.post(`${Config.apiUrl}/api/login`, {
        password: password.trim(),
      });

      if (response.data && response.data.token) {
        sessionStorage.setItem("jwtToken", response.data.token);
        setJwtToken(response.data.token);
        showToast("success", "Autenticación exitosa");
      } else {
        showToast("error", "Contraseña incorrecta");
      }
    } catch (err) {
      showToast("error", "Error al validar la contraseña");
      console.error(err);
    }
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
    if (responseData?.clave) {
      try {
        await navigator.clipboard.writeText(responseData.clave);
        setCopySuccess("Clave copiada al portapapeles");
        showToast("success", "Clave copiada al portapapeles");
      } catch {
        setCopySuccess("Error al copiar la clave");
        showToast("error", "Error al copiar la clave");
      }
    }
  };

  const handleSerialChange = (e) => {
    setSerial(e.target.value);
    setError(null);
    setCopySuccess(null);
  };

  return (
    <div>
      <Toast ref={toast} />
      {!jwtToken ? (
        <div>
          <h2>Protección con Contraseña</h2>
          <p>Por favor, ingresa la contraseña para acceder:</p>
          <Password
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            toggleMask
            placeholder="Contraseña"
          />
          <Button
            label="Autenticar"
            onClick={authenticate}
            className="p-button-primary"
          />
        </div>
      ) : (
        <div>
          <h2>Generar Clave de Reporte</h2>
          <textarea
            id="serial"
            rows="4"
            value={serial}
            onChange={handleSerialChange}
            placeholder="Ingresa el serial aquí..."
            style={{
              width: "100%",
              height: "100px",
              marginBottom: "12px",
              padding: "8px",
              fontSize: "16px",
              resize: "vertical",
            }}
          />
          <Button
            label={loading ? "Generando..." : "Generar Clave"}
            icon={loading ? "pi pi-spin pi-spinner" : "pi pi-key"}
            onClick={generateKey}
            disabled={loading}
            severity="success"
          />
          {error && <p style={{ color: "red", marginTop: "12px" }}>{error}</p>}
          {responseData && (
            <div
              style={{
                marginTop: "20px",
                padding: "10px",
                border: "1px solid #ccc",
              }}
            >
              <h3>Datos Generados:</h3>
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <input
                  id="clave"
                  type="text"
                  value={responseData.clave}
                  readOnly
                  style={{
                    flex: 1,
                    padding: "8px",
                    fontSize: "16px",
                    backgroundColor: "#f9f9f9",
                    border: "1px solid #ccc",
                    width: "100%",
                  }}
                />
                <Button
                  label="Copiar"
                  icon="pi pi-copy"
                  onClick={copyKey}
                  className="p-button-outlined p-button-secondary"
                  severity="warning"
                />
              </div>
              {copySuccess && (
                <p style={{ color: "green", marginTop: "8px" }}>
                  {copySuccess}
                </p>
              )}
              <p>
                <strong>Procesador ID:</strong> {responseData.procesadorId}
              </p>
              <p>
                <strong>Hard Drive Serial:</strong>{" "}
                {responseData.hardDriveSerial}
              </p>
              <p>
                <strong>Nombre del Sistema:</strong> {responseData.systemName}
              </p>
              <p>
                <strong>Letra del Módulo:</strong> {responseData.letraModulo}
              </p>
              <p>
                <strong>Módulo:</strong> {responseData.modulo}
              </p>
              <p>
                <strong>Clave:</strong> {responseData.clave}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SerialesReportes;
