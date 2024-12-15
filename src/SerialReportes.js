import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Config from "./Config";
import { Button } from "primereact/button";
import { Password } from "primereact/password";

// Custom hook for authentication
const useAuthentication = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [jwtToken, setJwtToken] = useState("");
  const [error, setError] = useState(null);

  const authenticate = useCallback(async (password) => {
    if (password === "") {
      alert("Por favor ingresa la contraseña");
      return;
    }
    try {
      const response = await axios.post(`${Config.apiUrl}/api/login`, {
        password,
      });
      if (response.data && response.data.token) {
        setJwtToken(response.data.token);
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
  }, []);

  return { isAuthenticated, jwtToken, error, authenticate };
};

// Custom hook for generating report keys
const useReportKey = (jwtToken) => {
  const [serial, setSerial] = useState("");
  const [responseData, setResponseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copySuccess, setCopySuccess] = useState(null);

  const generateKey = async () => {
    if (!serial.trim()) {
      setError("Por favor ingresa un serial válido.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(
        `${Config.apiUrl}/api/generateReportKey`,
        { serial },
        { headers: { Authorization: `Bearer ${jwtToken}` } }
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

  const copyKey = () => {
    if (responseData?.clave) {
      navigator.clipboard
        .writeText(responseData.clave)
        .then(() => setCopySuccess("Clave copiada al portapapeles"))
        .catch(() => setCopySuccess("Error al copiar la clave"));
    }
  };

  return {
    serial,
    setSerial,
    responseData,
    loading,
    error,
    copySuccess,
    generateKey,
    copyKey,
  };
};

// Authentication component
const Authentication = ({ onAuthenticate, error }) => {
  const [password, setPassword] = useState("");

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Enter") {
        onAuthenticate(password);
      }
    };

    const passwordInput = document.querySelector('input[type="password"]');
    if (passwordInput) {
      passwordInput.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      if (passwordInput) {
        passwordInput.removeEventListener("keydown", handleKeyDown);
      }
    };
  }, [password, onAuthenticate]);

  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <h1>Protección con Contraseña</h1>
      <p>Por favor, ingresa la contraseña para acceder:</p>
      <Password
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        toggleMask
        placeholder="Contraseña"
        style={{ padding: "10px" }}
      />
      <Button
        label="Acceder"
        icon="pi pi-lock"
        onClick={() => onAuthenticate(password)}
        className="p-button-raised p-button-primary"
      />
      {error && <p style={{ color: "red", marginTop: "12px" }}>{error}</p>}
    </div>
  );
};

// Report Key Generation component
const ReportKeyGeneration = ({ jwtToken }) => {
  const {
    serial,
    setSerial,
    responseData,
    loading,
    error,
    copySuccess,
    generateKey,
    copyKey,
  } = useReportKey(jwtToken);

  return (
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
          onClick={generateKey}
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
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
              onClick={copyKey}
              className="p-button-outlined p-button-secondary"
            />
          </div>
          {copySuccess && (
            <p style={{ color: "green", marginTop: "8px" }}>{copySuccess}</p>
          )}
          <p>
            <strong>Procesador ID:</strong> {responseData.procesadorId}
          </p>
          <p>
            <strong>Hard Drive Serial:</strong> {responseData.hardDriveSerial}
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
  );
};

// Main component
const SerialReportes = () => {
  const { isAuthenticated, jwtToken, error, authenticate } =
    useAuthentication();

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "auto" }}>
      {!isAuthenticated ? (
        <Authentication onAuthenticate={authenticate} error={error} />
      ) : (
        <ReportKeyGeneration jwtToken={jwtToken} />
      )}
    </div>
  );
};

export default SerialReportes;
