import React, { useState, useCallback, useMemo, useRef } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { MeterGroup } from "primereact/metergroup";
import { Toast } from "primereact/toast";
import Config from "../../components/features/Config";
import "../../styles/BatteryStatus.css";

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

const metricConfig = [
  { label: "Estado", key: "chargingStatus" },
  { label: "Energía Total", key: "energyFull" },
  { label: "Energía Actual", key: "energyNow" },
  { label: "Capacidad de Diseño", key: "designCapacity" },
  { label: "Última Capacidad Total", key: "lastFullCapacity" },
  { label: "Última actualización", key: "updatedAt" },
];

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

  const batteryColor = useMemo(() => getBatteryColor(batteryLevel), [batteryLevel]);

  const meterValues = useMemo(
    () => [
      {
        label: <span className="font-bold">Batería</span>,
        value: batteryLevel,
        color: batteryColor,
        icon: "pi pi-bolt",
      },
    ],
    [batteryLevel, batteryColor]
  );

  const formattedUpdatedAt = updatedAt
    ? updatedAt.toLocaleString("es-CO", { dateStyle: "short", timeStyle: "medium" })
    : "-";

  const metricValue = (key) => {
    if (key === "updatedAt") return formattedUpdatedAt;
    return batteryInfo?.[key] || "-";
  };

  const footer = (
    <Button
      label={loading ? "Cargando..." : "Actualizar"}
      icon="pi pi-refresh"
      onClick={fetchBatteryStatus}
      disabled={loading}
      loading={loading}
      className="w-full"
    />
  );

  return (
    <div className="battery-status-page">
      <Toast ref={toast} />
      <Card
        title="Estado de la Batería"
        subTitle="Equipo Dell Inspiron 3421"
        className="battery-status-card"
        footer={footer}
      >
        {batteryInfo ? (
          <>
            <div className="battery-hero">
              <div className="battery-hero-level">
                <i className="pi pi-bolt" />
                <span>{batteryLevel.toFixed(1)}%</span>
              </div>
              <span className="battery-badge" style={{ backgroundColor: batteryColor }}>
                {getBatteryLabel(batteryLevel)}
              </span>
            </div>

            <div className="battery-meter-wrap">
              <MeterGroup values={meterValues} />
            </div>

            <div className="battery-metrics">
              {metricConfig.map((metric) => (
                <div key={metric.key} className="battery-metric">
                  <p className="battery-metric-label">{metric.label}</p>
                  <p className="battery-metric-value">{metricValue(metric.key)}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="battery-empty">Presiona el botón para obtener la información de la batería.</p>
        )}
      </Card>
    </div>
  );
};

export default BatteryStatus;
