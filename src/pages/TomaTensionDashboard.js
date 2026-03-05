import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Calendar } from "primereact/calendar";
// Importamos DataView para la vista móvil
import { DataView } from "primereact/dataview";
import Config from "../components/features/Config";
import "../styles/TomaTensionDashboard.css";

// --- Funciones Auxiliares (Sin cambios) ---
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

// Función formatDate actualizada para incluir segundos para mayor precisión en extremos
const formatDate = (value, includeSeconds = false) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  const options = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  };

  if (includeSeconds) options.second = "2-digit";

  return date.toLocaleString("es-CO", options);
};

const toIsoDate = (dateValue) => {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const getRangeFromToday = (days) => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - (days - 1));

  return {
    fecha_inicio: toIsoDate(startDate),
    fecha_fin: toIsoDate(endDate),
  };
};

const DEFAULT_PRESET_DAYS = 7;
const DATE_PRESETS = [7, 15, 30, 90];

const parseSyncStatus = (row) => {
  if (row && typeof row === "object") return "Sincronizado";
  return "Desconocido";
};

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
};

// --- Hook personalizado para detectar tamaño de pantalla ---
const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowSize;
};

const TomaTensionDashboard = () => {
  const { width } = useWindowSize();
  const isMobile = width < 768; // Definimos el punto de ruptura para móvil

  const defaultDateRange = useMemo(
    () => getRangeFromToday(DEFAULT_PRESET_DAYS),
    [],
  );
  const [registros, setRegistros] = useState([]);
  const [filters, setFilters] = useState({
    fecha_inicio: defaultDateRange.fecha_inicio,
    fecha_fin: defaultDateRange.fecha_fin,
    page: 1,
    limit: 20,
  });
  const [selectedPreset, setSelectedPreset] = useState(DEFAULT_PRESET_DAYS);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const queryParams = {
        page: filters.page,
        limit: filters.limit,
      };

      if (filters.fecha_inicio) queryParams.fecha_inicio = filters.fecha_inicio;
      if (filters.fecha_fin) queryParams.fecha_fin = filters.fecha_fin;

      const response = await axios.get(
        `${Config.apiUrl}/api/toma-tension/sync`,
        {
          params: queryParams,
        },
      );

      const data = getNormalizedData(response.data);
      const serverPagination = response?.data?.pagination;
      setRegistros(data);
      setPagination({
        page: serverPagination?.page || filters.page,
        limit: serverPagination?.limit || filters.limit,
        total: serverPagination?.total || data.length,
        totalPages: serverPagination?.totalPages || 1,
      });
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "No se pudo cargar la información de sincronización de toma de tensión.",
      );
      setRegistros([]);
      setPagination((prev) => ({ ...prev, total: 0, totalPages: 1 }));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const totalRegistros = pagination.total;

  // --- Memorización de Promedios ---
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

  // --- Memorización de Extremos (Sístole y Diástole) ---
  const Extremes = useMemo(() => {
    const rowsWithMetrics = registros
      .map((registro) => ({
        sistole: toNumber(registro?.sistole),
        diastole: toNumber(registro?.diastole),
        fecha: registro?.fecha_registro || registro?.created_at || null,
      }))
      .filter((row) => row.sistole !== null && row.diastole !== null);

    if (!rowsWithMetrics.length) {
      const empty = { max: "-", min: "-", maxValue: "-", minValue: "-" };
      return { sistole: empty, diastole: empty };
    }

    // Cálculos Sístole
    const maxRowSis = rowsWithMetrics.reduce((max, row) =>
      row.sistole > max.sistole ? row : max,
    );
    const minRowSis = rowsWithMetrics.reduce((min, row) =>
      row.sistole < min.sistole ? row : min,
    );

    // Cálculos Diástole
    const maxRowDia = rowsWithMetrics.reduce((max, row) =>
      row.diastole > max.diastole ? row : max,
    );
    const minRowDia = rowsWithMetrics.reduce((min, row) =>
      row.diastole < min.diastole ? row : min,
    );

    return {
      sistole: {
        max: formatDate(maxRowSis.fecha),
        min: formatDate(minRowSis.fecha),
        maxValue: maxRowSis.sistole,
        minValue: minRowSis.sistole,
      },
      diastole: {
        max: formatDate(maxRowDia.fecha),
        min: formatDate(minRowDia.fecha),
        maxValue: maxRowDia.diastole,
        minValue: minRowDia.diastole,
      },
    };
  }, [registros]);

  // --- Templates para la Tabla y Vista Móvil ---
  const statusBodyTemplate = (rowData) => {
    const status = parseSyncStatus(rowData);
    const severityMap = {
      Sincronizado: "success",
      Desconocido: "info",
    };
    return (
      <Tag
        value={status}
        severity={severityMap[status] || "info"}
        style={{ fontSize: "0.75rem" }}
      />
    );
  };

  // Template para el valor de Sístole con color
  const sistoleBodyTemplate = (rowData) => (
    <span
      style={{
        fontWeight: "bold",
        color: rowData.sistole >= 140 ? "var(--red-600)" : "inherit",
      }}
    >
      {formatValue(rowData.sistole)}
    </span>
  );

  // Template para el valor de Diástole con color
  const diastoleBodyTemplate = (rowData) => (
    <span
      style={{
        fontWeight: "bold",
        color: rowData.diastole >= 90 ? "var(--red-600)" : "inherit",
      }}
    >
      {formatValue(rowData.diastole)}
    </span>
  );

  // --- Template para la vista de tarjetas en Móvil ---
  const mobileRecordTemplate = (rowData) => {
    return (
      <div className="mobile-record-card">
        <div className="mobile-record-header">
          {statusBodyTemplate(rowData)}
          <span className="mobile-record-date">
            {formatDate(rowData.fecha_registro, true)}
          </span>
        </div>
        <div className="mobile-record-body">
          <div className="mobile-metric">
            <span className="metric-label">SÍSTOLE</span>
            {sistoleBodyTemplate(rowData)}
          </div>
          <div className="mobile-metric">
            <span className="metric-label">DIÁSTOLE</span>
            {diastoleBodyTemplate(rowData)}
          </div>
          <div className="mobile-metric">
            <span className="metric-label">RITMO</span>
            <span className="metric-value">
              {formatValue(rowData.ritmoCardiaco)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // --- JSX Principal ---
  return (
    <div className="toma-tension-dashboard">
      <div className="toma-tension-header">
        <h2>Dashboard de Toma de Tensión</h2>
        <Button
          icon="pi pi-refresh"
          label={isMobile ? "" : "Actualizar"} // Solo icono en móvil
          onClick={fetchDashboardData}
          loading={loading}
          className="p-button-sm"
        />
      </div>

      <Card title="Filtros" className="toma-tension-filters-card compact-card">
        <div className="toma-tension-filters">
          <div className="filter-field">
            <label htmlFor="fecha_inicio">Fecha inicio</label>
            <Calendar
              inputId="fecha_inicio"
              value={
                filters.fecha_inicio ? new Date(filters.fecha_inicio) : null
              }
              onChange={(event) => {
                setSelectedPreset(null);
                setFilters((prev) => ({
                  ...prev,
                  fecha_inicio: toIsoDate(event.value),
                  page: 1,
                }));
              }}
              dateFormat="yy-mm-dd"
              showIcon
              placeholder="YYYY-MM-DD"
              className="p-inputtext-sm"
            />
          </div>

          <div className="filter-field">
            <label htmlFor="fecha_fin">Fecha fin</label>
            <Calendar
              inputId="fecha_fin"
              value={filters.fecha_fin ? new Date(filters.fecha_fin) : null}
              onChange={(event) => {
                setSelectedPreset(null);
                setFilters((prev) => ({
                  ...prev,
                  fecha_fin: toIsoDate(event.value),
                  page: 1,
                }));
              }}
              dateFormat="yy-mm-dd"
              showIcon
              placeholder="YYYY-MM-DD"
              className="p-inputtext-sm"
            />
          </div>

          <div className="filter-actions">
            <Button
              label={isMobile ? "" : "Limpiar"}
              icon="pi pi-filter-slash"
              severity="secondary"
              outlined
              onClick={() => {
                setFilters((prev) => ({
                  ...prev,
                  ...defaultDateRange,
                  page: 1,
                }));
                setSelectedPreset(DEFAULT_PRESET_DAYS);
              }}
              className="p-button-sm"
            />
          </div>

          <div className="filter-field filter-presets">
            <label>Filtros rápidos</label>
            <div className="preset-buttons">
              {DATE_PRESETS.map((days) => (
                <Button
                  key={days}
                  type="button"
                  label={`${days} días`}
                  size="small"
                  outlined={selectedPreset !== days}
                  severity={selectedPreset === days ? "primary" : "secondary"}
                  onClick={() => {
                    setFilters((prev) => ({
                      ...prev,
                      ...getRangeFromToday(days),
                      page: 1,
                    }));
                    setSelectedPreset(days);
                  }}
                  className="preset-btn p-button-xs"
                />
              ))}
            </div>
          </div>
        </div>
      </Card>

      {error && <div className="toma-tension-error compact-error">{error}</div>}

      {/* --- SECCIÓN DE KPIs REESTRUCTURADA --- */}
      <div className={`toma-tension-kpis ${isMobile ? "mobile-kpis" : ""}`}>
        {/* 1. Total Registros */}
        <Card title="Total registros" className="kpi-card-total compact-kpi">
          <div className="compact-content">
            <i
              className="pi pi-database kpi-icon-sm"
              style={{ color: "var(--accent-total)" }}
            />
            <span className="kpi-value-lg">{totalRegistros}</span>
          </div>
        </Card>

        {/* 2. Promedios (Diseño Grid compacto) */}
        <Card title="Promedios" className="kpi-card-avg compact-kpi">
          <div className="compact-grid">
            <div className="kpi-stat">
              <span className="stat-label-sm">SIS</span>
              <span
                className="stat-value-md"
                style={{ color: "var(--accent-avg)" }}
              >
                {averages.sistole}
              </span>
            </div>
            <div className="kpi-stat">
              <span className="stat-label-sm">DIA</span>
              <span
                className="stat-value-md"
                style={{ color: "var(--accent-avg)" }}
              >
                {averages.diastole}
              </span>
            </div>
            <div className="kpi-stat">
              <span className="stat-label-sm">PUL</span>
              <span
                className="stat-value-md"
                style={{ color: "var(--accent-avg)" }}
              >
                {averages.ritmoCardiaco}
              </span>
            </div>
          </div>
        </Card>

        {/* 3. Extremos Sístole (Diseño Grid compacto) */}
        <Card
          title="Extremos Sístole"
          className="kpi-card-extremes-sis compact-kpi"
        >
          <div className="compact-grid">
            <div className="kpi-stat">
              <span className="stat-label-sm label-high">MÁX</span>
              <span className="stat-value-md val-high">
                {Extremes.sistole.maxValue}
              </span>
              <small className="stat-date">
                {Extremes.sistole.max.split(",")[0]}
              </small>
            </div>
            <div className="kpi-stat">
              <span className="stat-label-sm label-low">MÍN</span>
              <span className="stat-value-md val-low">
                {Extremes.sistole.minValue}
              </span>
              <small className="stat-date">
                {Extremes.sistole.min.split(",")[0]}
              </small>
            </div>
          </div>
        </Card>

        {/* 4. Extremos Diástole (NUEVO compact-kpi) */}
        <Card
          title="Extremos Diástole"
          className="kpi-card-extremes-dia compact-kpi"
        >
          <div className="compact-grid">
            <div className="kpi-stat">
              <span className="stat-label-sm label-high">MÁX</span>
              <span className="stat-value-md val-high">
                {Extremes.diastole.maxValue}
              </span>
              <small className="stat-date">
                {Extremes.diastole.max.split(",")[0]}
              </small>
            </div>
            <div className="kpi-stat">
              <span className="stat-label-sm label-low">MÍN</span>
              <span className="stat-value-md val-low">
                {Extremes.diastole.minValue}
              </span>
              <small className="stat-date">
                {Extremes.diastole.min.split(",")[0]}
              </small>
            </div>
          </div>
        </Card>
      </div>

      {/* --- SECCIÓN DETALLE (Responsiva) --- */}
      <Card
        title="Detalle de sincronización"
        className="compact-card Detail-card"
      >
        {isMobile ? (
          // --- VISTA MÓVIL: DataView (Tarjetas) ---
          <DataView
            value={registros}
            itemTemplate={mobileRecordTemplate}
            paginator
            lazy
            first={(pagination.page - 1) * pagination.limit}
            rows={pagination.limit}
            totalRecords={pagination.total}
            onPage={(event) => {
              setFilters((prev) => ({
                ...prev,
                page: event.page + 1,
                limit: event.rows,
              }));
            }}
            emptyMessage="No hay registros disponibles"
            className="mobile-dataview"
          />
        ) : (
          // --- VISTA PC: DataTable (Tabla estándar corregida) ---
          <DataTable
            value={registros}
            loading={loading}
            paginator
            lazy
            first={(pagination.page - 1) * pagination.limit}
            rows={pagination.limit}
            totalRecords={pagination.total}
            rowsPerPageOptions={[10, 20, 50, 100]}
            paginatorTemplate="RowsPerPageDropdown CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
            currentPageReportTemplate="Muestra {first} a {last} de {totalRecords}"
            onPage={(event) => {
              setFilters((prev) => ({
                ...prev,
                page: event.page + 1,
                limit: event.rows,
              }));
            }}
            emptyMessage="No hay registros disponibles"
            responsiveLayout="scroll"
            sortMode="multiple"
            className="p-datatable-sm corrected-datatable"
          >
            <Column
              header="Estado"
              body={statusBodyTemplate}
              frozen
              alignFrozen="left"
              style={{ minWidth: "9rem" }}
              headerStyle={{ justifyContent: "center" }}
              bodyStyle={{ textAlign: "center" }}
            />
            <Column
              field="paciente_id"
              header="Paci."
              sortable
              style={{ minWidth: "5rem" }}
              headerStyle={{ justifyContent: "center" }}
              bodyStyle={{ textAlign: "center" }}
            />
            <Column
              field="sistole"
              header="Sístole"
              sortable
              style={{ minWidth: "7rem" }}
              headerStyle={{ justifyContent: "center" }}
              bodyStyle={{ textAlign: "center" }}
              body={sistoleBodyTemplate}
            />
            <Column
              field="diastole"
              header="Diástole"
              sortable
              style={{ minWidth: "7rem" }}
              headerStyle={{ justifyContent: "center" }}
              bodyStyle={{ textAlign: "center" }}
              body={diastoleBodyTemplate}
            />
            {/* Corrección Ritmo Cardiaco: Centrado de header y body */}
            <Column
              field="ritmoCardiaco"
              header="Ritmo"
              sortable
              style={{ minWidth: "7rem" }}
              headerStyle={{ justifyContent: "center" }}
              bodyStyle={{ textAlign: "center" }}
            />
            <Column
              field="fecha_registro"
              header="Fecha registro"
              sortable
              style={{ minWidth: "14rem" }}
              headerStyle={{ justifyContent: "center" }}
              bodyStyle={{ textAlign: "center" }}
              body={(rowData) => formatDate(rowData.fecha_registro, true)}
            />
          </DataTable>
        )}
      </Card>
    </div>
  );
};

export default TomaTensionDashboard;
