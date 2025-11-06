import React, { useState } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { MeterGroup } from "primereact/metergroup";
import Config from "./../../components/features/Config";

const BatteryStatus = () => {
  const [batteryInfo, setBatteryInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchBatteryStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${Config.apiUrl}/api/battery`);
      const data = await response.json();
      setBatteryInfo(data);
    } catch (error) {
      console.error("Error obteniendo la información de la batería", error);
    }
    setLoading(false);
  };

  // Función para determinar el color de la barra según el nivel de batería
  const getBatteryColor = (level) => {
    if (level <= 15) return "#D32F2F"; // Rojo (Crítico)
    if (level <= 40) return "#FBC02D"; // Amarillo (Bajo)
    if (level <= 70) return "#1976D2"; // Azul (Medio)
    return "#388E3C"; // Verde (Alto)
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
        subTitle="Equipo HP Mini 210"
        className="w-full max-w-sm shadow-lg"
        footer={footer}
      >
        {batteryInfo ? (
          <div className="space-y-2 text-center">
            <div className="flex justify-content-center">
              <MeterGroup
                values={[
                  {
                    label: <span className="font-bold">Batería</span>,
                    value: parseFloat(batteryInfo.batteryLevel),
                    color: getBatteryColor(
                      parseFloat(batteryInfo.batteryLevel)
                    ),
                    icon: "pi pi-bolt",
                  },
                ]}
              />
            </div>
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
