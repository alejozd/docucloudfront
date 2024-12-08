import React, { useState } from "react";
import Config from "./Config";
import axios from "axios";
import { Button } from "primereact/button";

const SerialReportes = () => {
  const [serial, setSerial] = useState("");
  const [responseData, setResponseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copySuccess, setCopySuccess] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Control de autenticación
  const [password, setPassword] = useState(""); // Almacenar contraseña ingresada
  const correctPassword = "Alejo1979*-+"; // Contraseña fija (puedes moverla al backend para mayor seguridad)

  // Validar la contraseña
  const handlePasswordSubmit = () => {
    if (password === correctPassword) {
      setIsAuthenticated(true);
    } else {
      alert("Contraseña incorrecta");
      setPassword("");
    }
  };

  const handleGenerateKey = async () => {
    if (!serial.trim()) {
      setError("Por favor ingresa un serial válido.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${Config.apiUrl}/api/generateReportKey`,
        {
          serial: serial,
        }
      );
      setResponseData(response.data);
      setCopySuccess(null);
    } catch (err) {
      setError("Error al generar la clave. Verifica el serial o la conexión.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyKey = () => {
    if (responseData?.clave) {
      navigator.clipboard
        .writeText(responseData.clave)
        .then(() => setCopySuccess("Clave copiada al portapapeles"))
        .catch(() => setCopySuccess("Error al copiar la clave"));
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "auto" }}>
      {!isAuthenticated ? (
        <div>
          <h1>Protección con Contraseña</h1>
          <p>Por favor, ingresa la contraseña para acceder:</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            style={{
              width: "100%",
              padding: "10px",
              fontSize: "16px",
              marginBottom: "12px",
            }}
          />
          <Button
            label="Acceder"
            icon="pi pi-lock"
            onClick={handlePasswordSubmit}
            className="p-button-raised p-button-primary"
          />
        </div>
      ) : (
        <div>
          <h1>Generar Clave de Reporte</h1>
          <div>
            <label
              htmlFor="serial"
              style={{ display: "block", marginBottom: "8px" }}
            >
              Serial:
            </label>
            <textarea
              id="serial"
              rows="4"
              value={serial}
              onChange={(e) => setSerial(e.target.value)}
              placeholder="Ingresa el serial aquí..."
              style={{
                width: "100%",
                marginBottom: "12px",
                padding: "8px",
                fontSize: "16px",
              }}
            />
            <Button
              label={loading ? "Generando..." : "Generar Clave"}
              icon={loading ? "pi pi-spin pi-spinner" : "pi pi-key"}
              onClick={handleGenerateKey}
              disabled={loading}
              className="p-button-raised p-button-primary"
            />
          </div>

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
                  }}
                />
                <Button
                  label="Copiar"
                  icon="pi pi-copy"
                  onClick={handleCopyKey}
                  className="p-button-outlined p-button-secondary"
                  tooltip="Copiar clave al portapapeles"
                  tooltipOptions={{ position: "top" }}
                />
              </div>
              {copySuccess && (
                <p style={{ color: "green", marginTop: "8px" }}>
                  {copySuccess}
                </p>
              )}

              <p>
                <strong>Serial:</strong> {responseData.soloSerial}
              </p>
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
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SerialReportes;
