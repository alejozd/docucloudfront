// GenerarClave.js
import React, { useState } from "react";
import axios from "axios";
import Config from "./Config";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";

const GenerarClave = ({ jwtToken }) => {
  const [serial, setSerial] = useState("");
  const [claveGenerada, setClaveGenerada] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copySuccess, setCopySuccess] = useState(null);
  const toast = React.useRef(null);

  // Función para generar la clave
  const generarClave = async () => {
    if (!serial.trim()) {
      setError("Por favor ingresa un serial válido.");
      toast.current.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Por favor ingresa un serial válido",
        life: 3000,
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${Config.apiUrl}/api/generar-clave`,
        { serial: serial },
        { headers: { Authorization: `Bearer ${jwtToken}` } }
      );

      setClaveGenerada(response.data);
      toast.current.show({
        severity: "success",
        summary: "Éxito",
        detail: "Clave generada exitosamente",
        life: 3000,
      });
    } catch (err) {
      console.error(err);
      const errorMessage =
        err.response?.data?.error || "Error al guardar el serial ERP.";
      setError(errorMessage); // Muestra el mensaje específico del backend
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: errorMessage, // Usa el mensaje específico del backend
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para copiar la clave al portapapeles
  const copiarClave = () => {
    if (claveGenerada?.claveGenerada) {
      navigator.clipboard
        .writeText(claveGenerada.claveGenerada)
        .then(() => {
          setCopySuccess("Clave copiada al portapapeles");
          toast.current.show({
            severity: "success",
            summary: "Éxito",
            detail: "Clave copiada al portapapeles",
            life: 3000,
          });
        })
        .catch(() => {
          setCopySuccess("Error al copiar la clave");
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail: "Error al copiar la clave",
            life: 3000,
          });
        });
    }
  };

  return (
    <div className="card p-fluid">
      <h2>Generar Clave</h2>
      <p>Ingresa el serial ERP para generar la clave:</p>
      <div style={{ marginBottom: "12px" }}>
        <InputTextarea
          value={serial}
          onChange={(e) => setSerial(e.target.value)}
          placeholder="Serial ERP"
        />
      </div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Button
          label={loading ? "Generando..." : "Generar Clave"}
          icon={loading ? "pi pi-spin pi-spinner" : "pi pi-key"}
          onClick={generarClave}
          disabled={loading}
          style={{ width: "auto" }}
        />
      </div>
      {error && <p style={{ color: "red", marginTop: "12px" }}>{error}</p>}
      {claveGenerada && (
        <div
          style={{
            marginTop: "20px",
            padding: "10px",
            border: "1px solid #ccc",
          }}
        >
          <h3>Datos Generados:</h3>
          <p>
            <strong>Serial ERP:</strong> {claveGenerada.serialERP}
          </p>
          <p>
            <strong>Año Medios:</strong> {claveGenerada.anoMedios}
          </p>
          <p>
            <strong>Cliente:</strong> {claveGenerada.cliente}
          </p>
          <p>
            <strong>MAC Servidor:</strong> {claveGenerada.macServidor}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <p>
              <strong>Clave Generada:</strong> {claveGenerada.claveGenerada}
            </p>
            <Button
              label="Copiar"
              icon="pi pi-copy"
              onClick={copiarClave}
              className="p-button-outlined p-button-secondary"
            />
          </div>
          {copySuccess && (
            <p
              style={{
                color: copySuccess.includes("Error") ? "red" : "green",
                marginTop: "8px",
              }}
            >
              {copySuccess}
            </p>
          )}
        </div>
      )}
      <Toast ref={toast} />
    </div>
  );
};

export default GenerarClave;
