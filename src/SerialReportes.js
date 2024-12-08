import React, { useState } from "react";
import Config from "./Config";
import axios from "axios";
import { Button } from "primereact/button"; // Importar el botón de PrimeReact

const SerialReportes = () => {
  const [serial, setSerial] = useState(""); // Estado para almacenar el serial ingresado
  const [responseData, setResponseData] = useState(null); // Estado para almacenar los datos de la respuesta
  const [loading, setLoading] = useState(false); // Estado para manejar el loading
  const [error, setError] = useState(null); // Estado para manejar errores
  const [copySuccess, setCopySuccess] = useState(null); // Estado para mostrar un mensaje de éxito al copiar

  // Función para enviar el serial al endpoint
  const handleGenerateKey = async () => {
    if (!serial.trim()) {
      setError("Por favor ingresa un serial válido.");
      return;
    }

    setLoading(true);
    setError(null); // Limpiar errores previos

    try {
      const response = await axios.post(
        `${Config.apiUrl}/api/generateReportKey`,
        {
          serial: serial,
        }
      );
      setResponseData(response.data); // Guardar los datos de la respuesta
      setCopySuccess(null); // Limpiar mensaje de éxito al copiar
    } catch (err) {
      setError("Error al generar la clave. Verifica el serial o la conexión.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Función para copiar la clave al portapapeles
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

      {/* Mostrar mensajes de error */}
      {error && <p style={{ color: "red", marginTop: "12px" }}>{error}</p>}

      {/* Mostrar los datos de la respuesta */}
      {responseData && (
        <div
          style={{
            marginTop: "20px",
            padding: "10px",
            border: "1px solid #ccc",
          }}
        >
          <h3>Datos Generados:</h3>
          {/* Caja de texto para la clave y botón de copiar */}
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
              onClick={handleCopyKey}
              className="p-button-outlined p-button-secondary"
              tooltip="Copiar clave al portapapeles"
              tooltipOptions={{ position: "top" }}
            />
          </div>

          {/* Mostrar mensaje de éxito o error al copiar */}
          {copySuccess && (
            <p style={{ color: "green", marginTop: "8px" }}>{copySuccess}</p>
          )}

          {/* Mostrar los demás datos */}
          <p>
            <strong>Serial:</strong> {responseData.soloSerial}
          </p>
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
        </div>
      )}
    </div>
  );
};

export default SerialReportes;
