import React, { useState } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";

const BatteryStatus = () => {
  const [batteryInfo, setBatteryInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchBatteryStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch("https://zetamini.ddns.net/api/battery"); // Ajusta la URL según tu backend
      const data = await response.json();
      setBatteryInfo(data);
    } catch (error) {
      console.error("Error obteniendo la información de la batería", error);
    }
    setLoading(false);
  };

  const footer = (
    <>
      <Button
        label={loading ? "Cargando..." : "Actualizar"}
        icon="pi pi-refresh"
        onClick={fetchBatteryStatus}
        disabled={loading}
      />
    </>
  );

  return (
    <div className="card flex justify-content-center">
      <Card
        title="Estado de la Batería"
        subTitle="Bateria HP Mini 210"
        className="w-full max-w-sm shadow-lg"
        footer={footer}
      >
        {batteryInfo ? (
          <div className="space-y-2 text-center">
            <p>
              <strong>Nivel:</strong> {batteryInfo.batteryLevel}
            </p>
            <p>
              <strong>Estado:</strong> {batteryInfo.chargingStatus}
            </p>
            <p>
              <strong>Energía Total:</strong> {batteryInfo.energyFull}
            </p>
            <p>
              <strong>Energía Actual:</strong> {batteryInfo.energyNow}
            </p>
            <p>
              <strong>Capacidad de Diseño:</strong> {batteryInfo.designCapacity}
            </p>
            <p>
              <strong>Última Capacidad Total:</strong>{" "}
              {batteryInfo.lastFullCapacity}
            </p>
          </div>
        ) : (
          <p className="text-center text-gray-500">
            Presiona el botón para obtener la información
          </p>
        )}
      </Card>
    </div>
  );
};

export default BatteryStatus;
