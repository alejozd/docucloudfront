import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import Config from "../components/features/Config";
import "../styles/TomaTensionDashboard.css";

const getNormalizedData = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.items)) return payload.items;
  if (payload && typeof payload === "object") return [payload];
  return [];
};

const parseSyncStatus = (row) => {
  const statusValue =
    row?.synced ?? row?.sincronizado ?? row?.status ?? row?.estado ?? null;

  if (typeof statusValue === "boolean") {
    return statusValue ? "Sincronizado" : "Pendiente";
  }

  if (typeof statusValue === "string") {
    const normalized = statusValue.toLowerCase();
    if (["sync", "synced", "ok", "success", "sincronizado"].includes(normalized)) {
      return "Sincronizado";
    }
    if (["pending", "pendiente", "in_progress", "processing"].includes(normalized)) {
      return "Pendiente";
    }
    if (["error", "failed", "fallo", "fallido"].includes(normalized)) {
      return "Error";
    }
  }

  return "Desconocido";
};

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return "-";

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch (error) {
      return String(value);
    }
  }

  return String(value);
};

const TomaTensionDashboard = () => {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(`${Config.apiUrl}/api/toma-tension/sync`);
      const data = getNormalizedData(response.data);
      setRegistros(data);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "No se pudo cargar la información de sincronización de toma de tensión."
      );
      setRegistros([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const columns = useMemo(() => {
    const uniqueFields = new Set();

    registros.forEach((registro) => {
      if (registro && typeof registro === "object") {
        Object.keys(registro).forEach((field) => uniqueFields.add(field));
      }
    });

    return Array.from(uniqueFields);
  }, [registros]);

  const totalRegistros = registros.length;

  const statusStats = useMemo(() => {
    return registros.reduce(
      (acc, registro) => {
        const status = parseSyncStatus(registro);
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      { Sincronizado: 0, Pendiente: 0, Error: 0, Desconocido: 0 }
    );
  }, [registros]);

  const statusBodyTemplate = (rowData) => {
    const status = parseSyncStatus(rowData);
    const severityMap = {
      Sincronizado: "success",
      Pendiente: "warning",
      Error: "danger",
      Desconocido: "info",
    };

    return <Tag value={status} severity={severityMap[status] || "info"} />;
  };

  return (
    <div className="toma-tension-dashboard">
      <div className="toma-tension-header">
        <h2>Dashboard de Toma de Tensión</h2>
        <Button
          icon="pi pi-refresh"
          label="Actualizar"
          onClick={fetchDashboardData}
          loading={loading}
        />
      </div>

      {error && <div className="toma-tension-error">{error}</div>}

      <div className="toma-tension-kpis">
        <Card title="Total de registros" className="kpi-card">
          <span>{totalRegistros}</span>
        </Card>
        <Card title="Sincronizados" className="kpi-card">
          <span>{statusStats.Sincronizado}</span>
        </Card>
        <Card title="Pendientes" className="kpi-card">
          <span>{statusStats.Pendiente}</span>
        </Card>
        <Card title="Errores" className="kpi-card">
          <span>{statusStats.Error}</span>
        </Card>
      </div>

      <Card title="Detalle de sincronización">
        <DataTable
          value={registros}
          loading={loading}
          paginator
          rows={10}
          emptyMessage="No hay registros disponibles"
          responsiveLayout="scroll"
          sortMode="multiple"
        >
          <Column
            header="Estado"
            body={statusBodyTemplate}
            frozen
            alignFrozen="left"
            style={{ minWidth: "11rem" }}
          />
          {columns.map((field) => (
            <Column
              key={field}
              field={field}
              header={field}
              sortable
              style={{ minWidth: "12rem" }}
              body={(rowData) => formatValue(rowData[field])}
            />
          ))}
        </DataTable>
      </Card>
    </div>
  );
};

export default TomaTensionDashboard;
