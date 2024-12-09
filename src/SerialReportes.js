import React, { useState } from "react";
import axios from "axios";
import Config from "./Config";
import { Button } from "primereact/button";

const SerialReportes = () => {
  const [serial, setSerial] = useState("");
  const [responseData, setResponseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copySuccess, setCopySuccess] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [jwtToken, setJwtToken] = useState(""); // Estado para almacenar el token JWT

  /**
   * Valida la contraseña contra el servidor
   */
  const handlePasswordSubmit = async () => {
    if (password === "") {
      alert("Por favor ingresa la contraseña");
      return;
    }
    // console.log("ruta y password", `${Config.apiUrl}/api/login`, password);
    try {
      const response = await axios.post(`${Config.apiUrl}/api/login`, {
        password,
      });

      if (response.data && response.data.token) {
        // console.log("token", response.data.token);
        setJwtToken(response.data.token); // Guarda el token JWT en el estado
        setIsAuthenticated(true);
        setError(null);
      } else {
        alert("Contraseña incorrecta");
        setError("Contraseña inválida.");
      }
    } catch (err) {
      alert("Error al validar la contraseña.");
      console.error(err);
    }
  };

  /**
   * Generar clave de reporte
   */
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
          serial,
        },
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`, // Enviar el token JWT
          },
        }
      );

      setResponseData(response.data);
      setCopySuccess(null);
    } catch (err) {
      console.error(err);
      setError("Error al generar la clave. Verifica el serial o la conexión.");
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
          {error && <p style={{ color: "red", marginTop: "12px" }}>{error}</p>}
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
                />
              </div>
              {copySuccess && (
                <p style={{ color: "green", marginTop: "8px" }}>
                  {copySuccess}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SerialReportes;
