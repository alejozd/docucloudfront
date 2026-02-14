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

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const parseSyncStatus = (row) => {
  // El endpoint /api/toma-tension/sync no devuelve un campo de estado.
  // Regla funcional acordada: si el registro existe en la respuesta, está sincronizado.
  if (row && typeof row === "object") return "Sincronizado";
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

      const response = await axios.get(
        `${Config.apiUrl}/api/toma-tension/sync`,
      );
      const data = getNormalizedData(response.data);
      setRegistros(data);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "No se pudo cargar la información de sincronización de toma de tensión.",
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

  const statusStats = useMemo(
    () => ({
      Sincronizado: totalRegistros,
      Pendiente: 0,
      Error: 0,
      Desconocido: 0,
    }),
    [totalRegistros],
  );

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

  const averages = useMemo(() => {
    const metrics = ["sistole", "diastole", "ritmoCardiaco"];

    return metrics.reduce((acc, metric) => {
      const values = registros
        .map((registro) => toNumber(registro?.[metric]))
        .filter((value) => value !== null);

      if (!values.length) {
        acc[metric] = "-";
        return acc;
      }

      const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
      acc[metric] = avg.toFixed(1);
      return acc;
    }, {});
  }, [registros]);

  const sistoleExtremes = useMemo(() => {
    const rowsWithSistole = registros
      .map((registro) => ({
        sistole: toNumber(registro?.sistole),
        fecha: registro?.fecha_registro || registro?.created_at || null,
      }))
      .filter((row) => row.sistole !== null);

    if (!rowsWithSistole.length) {
      return { max: "-", min: "-", maxValue: "-", minValue: "-" };
    }

    const maxRow = rowsWithSistole.reduce((max, row) =>
      row.sistole > max.sistole ? row : max,
    );
    const minRow = rowsWithSistole.reduce((min, row) =>
      row.sistole < min.sistole ? row : min,
    );

    return {
      max: formatDate(maxRow.fecha),
      min: formatDate(minRow.fecha),
      maxValue: maxRow.sistole,
      minValue: minRow.sistole,
    };
  }, [registros]);

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
        <Card title="Total de registros" className="kpi-card kpi-card-total">
          <span>{totalRegistros}</span>
        </Card>
        {/* <Card title="Sincronizados" className="kpi-card kpi-card-sync">
          <span>{statusStats.Sincronizado}</span>
        </Card>
        <Card title="Pendientes" className="kpi-card kpi-card-pending">
          <span>{statusStats.Pendiente}</span>
        </Card> */}
        <Card title="Errores" className="kpi-card kpi-card-error">
          <span>{statusStats.Error}</span>
        </Card>
        <Card title="Promedios" className="kpi-card kpi-card-avg">
          <div className="kpi-multiline">
            <p>Sístole: {averages.sistole}</p>
            <p>Diástole: {averages.diastole}</p>
            <p>Ritmo: {averages.ritmoCardiaco}</p>
          </div>
        </Card>
        <Card
          title="Extremos de Sístole"
          className="kpi-card kpi-card-extremes"
        >
          <div className="kpi-multiline">
            <p>
              Más alta: {sistoleExtremes.max} ({sistoleExtremes.maxValue})
            </p>
            <p>
              Más baja: {sistoleExtremes.min} ({sistoleExtremes.minValue})
            </p>
          </div>
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
