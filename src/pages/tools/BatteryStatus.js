import React, { useState, useCallback, useMemo, useRef } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { MeterGroup } from "primereact/metergroup";
import { Toast } from "primereact/toast";
import Config from "../../components/features/Config";

const BATTERY_ENDPOINT = "/api/battery";

const getApiMessage = (error, fallbackMessage) => {
  return error?.message || fallbackMessage;
};

const parseBatteryLevel = (value) => {
  const parsedValue = Number.parseFloat(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

const getBatteryColor = (level) => {
  if (level <= 15) return "#D32F2F";
  if (level <= 40) return "#FBC02D";
  if (level <= 70) return "#1976D2";
  return "#388E3C";
};

const getBatteryLabel = (level) => {
  if (level <= 15) return "Crítico";
  if (level <= 40) return "Bajo";
  if (level <= 70) return "Medio";
  return "Alto";
};

const BatteryStatus = () => {
  const [batteryInfo, setBatteryInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);
  const toast = useRef(null);

  const fetchBatteryStatus = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${Config.apiUrl}${BATTERY_ENDPOINT}`);

      if (!response.ok) {
        throw new Error(`Error ${response.status}: no se pudo consultar la batería`);
      }

      const payload = await response.json();
      setBatteryInfo(payload);
      setUpdatedAt(new Date());

      toast.current?.show({
        severity: "success",
        summary: "Actualizado",
        detail: "Estado de batería recuperado correctamente",
        life: 2500,
      });
    } catch (error) {
      console.error("Error obteniendo la información de la batería", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: getApiMessage(error, "No se pudo recuperar la información de batería"),
        life: 4000,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const batteryLevel = useMemo(
    () => parseBatteryLevel(batteryInfo?.batteryLevel),
    [batteryInfo?.batteryLevel]
  );

  const meterValues = useMemo(
    () => [
      {
        label: <span className="font-bold">Batería</span>,
        value: batteryLevel,
        color: getBatteryColor(batteryLevel),
        icon: "pi pi-bolt",
      },
    ],
    [batteryLevel]
  );

  const footer = (
    <Button
      label={loading ? "Cargando..." : "Actualizar"}
      icon="pi pi-refresh"
      onClick={fetchBatteryStatus}
      disabled={loading}
      loading={loading}
    />
  );

  return (
    <div className="card flex justify-content-center">
      <Toast ref={toast} />
      <Card
        title="Estado de la Batería"
        subTitle="Equipo Dell Inspiron 3421"
        className="w-full max-w-sm shadow-lg"
        footer={footer}
      >
        {batteryInfo ? (
          <div className="space-y-2 text-center">
            <div className="flex justify-content-center">
              <MeterGroup values={meterValues} />
            </div>

            <p>
              <strong>Nivel:</strong> {batteryLevel.toFixed(1)}% ({getBatteryLabel(batteryLevel)})
            </p>
            <p>
              <strong>Estado:</strong> {batteryInfo.chargingStatus || "-"}
            </p>
            <p>
              <strong>Energía Total:</strong> {batteryInfo.energyFull || "-"}
            </p>
            <p>
              <strong>Energía Actual:</strong> {batteryInfo.energyNow || "-"}
            </p>
            <p>
              <strong>Capacidad de Diseño:</strong> {batteryInfo.designCapacity || "-"}
            </p>
            <p>
              <strong>Última Capacidad Total:</strong> {batteryInfo.lastFullCapacity || "-"}
            </p>
            <p>
              <strong>Última actualización:</strong>{" "}
              {updatedAt
                ? updatedAt.toLocaleString("es-CO", { dateStyle: "short", timeStyle: "medium" })
                : "-"}
            </p>
          </div>
        ) : (
          <p className="text-center text-gray-500">
            Presiona el botón para obtener la información de la batería.
          </p>
        )}
      </Card>
    </div>
  );
};

export default BatteryStatus;
