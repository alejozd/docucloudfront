import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Config from "./Config";
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
  const toast = useRef(null);

  const authenticate = async () => {
    if (password === "") {
      toast.current.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Por favor ingresa la contraseña",
        life: 3000,
      });
      return;
    }
    try {
      const response = await axios.post(`${Config.apiUrl}/api/login`, {
        password,
      });
      if (response.data && response.data.token) {
        sessionStorage.setItem("jwtToken", response.data.token);
        setJwtToken(response.data.token);
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Autenticación exitosa",
          life: 3000,
        });
      } else {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "Contraseña incorrecta",
          life: 3000,
        });
      }
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al validar la contraseña",
        life: 3000,
      });
      console.error(err);
    }
  };

  const generateKey = async () => {
    if (!serial.trim()) {
      toast.current.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "Por favor ingresa un serial válido",
        life: 3000,
      });
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(
        `${Config.apiUrl}/api/generateReportKey`,
        { serial },
        { headers: { Authorization: `Bearer ${jwtToken}` } }
      );
      setResponseData(response.data);
      toast.current.show({
        severity: "success",
        summary: "Éxito",
        detail: "Clave generada exitosamente",
        life: 3000,
      });
    } catch (err) {
      console.error(err);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al generar la clave",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
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
            value={serial}
            onChange={(e) => setSerial(e.target.value)}
            placeholder="Ingresa el serial aquí..."
          />
          <Button
            label={loading ? "Generando..." : "Generar Clave"}
            onClick={generateKey}
            disabled={loading}
            className="p-button-success"
          />
          {responseData && (
            <p>
              <strong>Clave:</strong> {responseData.clave}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default SerialesReportes;
