import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Calendar } from "primereact/calendar";
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

      <Card title="Filtros" className="toma-tension-filters-card">
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
                setFilters((prev) => {
                  const nextStartDate = toIsoDate(event.value);

                  if (
                    prev.fecha_fin &&
                    nextStartDate &&
                    nextStartDate > prev.fecha_fin
                  ) {
                    return {
                      ...prev,
                      fecha_inicio: nextStartDate,
                      fecha_fin: nextStartDate,
                      page: 1,
                    };
                  }

                  return {
                    ...prev,
                    fecha_inicio: nextStartDate,
                    page: 1,
                  };
                });
              }}
              dateFormat="yy-mm-dd"
              showIcon
              placeholder="YYYY-MM-DD"
              maxDate={
                filters.fecha_fin ? new Date(filters.fecha_fin) : undefined
              }
            />
          </div>

          <div className="filter-field">
            <label htmlFor="fecha_fin">Fecha fin</label>
            <Calendar
              inputId="fecha_fin"
              value={filters.fecha_fin ? new Date(filters.fecha_fin) : null}
              onChange={(event) => {
                setSelectedPreset(null);
                setFilters((prev) => {
                  const nextEndDate = toIsoDate(event.value);

                  if (
                    prev.fecha_inicio &&
                    nextEndDate &&
                    nextEndDate < prev.fecha_inicio
                  ) {
                    return {
                      ...prev,
                      fecha_inicio: nextEndDate,
                      fecha_fin: nextEndDate,
                      page: 1,
                    };
                  }

                  return {
                    ...prev,
                    fecha_fin: nextEndDate,
                    page: 1,
                  };
                });
              }}
              dateFormat="yy-mm-dd"
              showIcon
              placeholder="YYYY-MM-DD"
              minDate={
                filters.fecha_inicio
                  ? new Date(filters.fecha_inicio)
                  : undefined
              }
            />
          </div>

          <div className="filter-actions">
            <Button
              label="Limpiar filtros"
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
            />
          </div>

          <div className="filter-field filter-presets">
            <label>Filtros rápidos</label>
            <div className="preset-buttons">
              {DATE_PRESETS.map((days) => (
                <Button
                  key={days}
                  type="button"
                  label={`Últimos ${days} días`}
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
                />
              ))}
            </div>
          </div>
        </div>
      </Card>

      {error && <div className="toma-tension-error">{error}</div>}

      <div className="toma-tension-kpis">
        <Card title="Total de registros" className="kpi-card kpi-card-total">
          <div className="kpi-card-content">
            <i className="pi pi-database kpi-icon" aria-hidden="true" />
            <span>{totalRegistros}</span>
          </div>
        </Card>
        <Card title="Errores" className="kpi-card kpi-card-error">
          <div className="kpi-card-content">
            <i className="pi pi-exclamation-circle kpi-icon" aria-hidden="true" />
            <span>{statusStats.Error}</span>
          </div>
        </Card>
        <Card title="Promedios" className="kpi-card kpi-card-avg">
          <div className="kpi-card-content">
            <i className="pi pi-chart-line kpi-icon" aria-hidden="true" />
          </div>
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
          <div className="kpi-card-content">
            <i className="pi pi-sort-alt kpi-icon" aria-hidden="true" />
          </div>
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
          lazy
          first={(pagination.page - 1) * pagination.limit}
          rows={pagination.limit}
          totalRecords={pagination.total}
          rowsPerPageOptions={[10, 20, 50, 100]}
          paginatorTemplate="RowsPerPageDropdown CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
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
        >
          <Column
            header="Estado"
            body={statusBodyTemplate}
            frozen
            alignFrozen="left"
            style={{ minWidth: "11rem" }}
          />
          <Column
            field="id"
            header="ID"
            sortable
            style={{ minWidth: "8rem" }}
            body={(rowData) => formatValue(rowData.id)}
            hidden={true}
          />
          <Column
            field="paciente_id"
            header="Paciente"
            sortable
            style={{ minWidth: "14rem" }}
            body={(rowData) => formatValue(rowData.paciente_id)}
          />
          <Column
            field="sistole"
            header="Sístole"
            sortable
            style={{ minWidth: "10rem" }}
            body={(rowData) => formatValue(rowData.sistole)}
          />
          <Column
            field="diastole"
            header="Diástole"
            sortable
            style={{ minWidth: "10rem" }}
            body={(rowData) => formatValue(rowData.diastole)}
          />
          <Column
            field="ritmoCardiaco"
            header="Ritmo Cardíaco"
            sortable
            style={{ minWidth: "12rem" }}
            body={(rowData) => formatValue(rowData.ritmoCardiaco)}
          />
          <Column
            field="fecha_registro"
            header="Fecha registro"
            sortable
            style={{ minWidth: "12rem" }}
            body={(rowData) => formatDate(rowData.fecha_registro)}
          />
          <Column
            field="created_at"
            header="Actualizado"
            sortable
            style={{ minWidth: "12rem" }}
            hidden={true}
          />
        </DataTable>
      </Card>
    </div>
  );
};

export default TomaTensionDashboard;
