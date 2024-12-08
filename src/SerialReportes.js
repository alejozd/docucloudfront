import React, { useState } from "react";
import Config from "./Config";
import axios from "axios";

const SerialReportes = () => {
  const [serial, setSerial] = useState(""); // Estado para almacenar el serial ingresado
  const [responseData, setResponseData] = useState(null); // Estado para almacenar los datos de la respuesta
  const [loading, setLoading] = useState(false); // Estado para manejar el loading
  const [error, setError] = useState(null); // Estado para manejar errores

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
    } catch (err) {
      setError("Error al generar la clave. Verifica el serial o la conexión.");
      console.error(err);
    } finally {
      setLoading(false);
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
        <button
          onClick={handleGenerateKey}
          disabled={loading}
          style={{
            backgroundColor: "#007bff",
            color: "#fff",
            padding: "10px 20px",
            border: "none",
            cursor: "pointer",
            borderRadius: "5px",
            fontSize: "16px",
          }}
        >
          {loading ? "Generando..." : "Generar Clave"}
        </button>
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
          <p>
            <strong>Clave:</strong> {responseData.clave}
          </p>
        </div>
      )}
    </div>
  );
};

export default SerialReportes;
