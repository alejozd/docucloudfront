import React, { useState, useRef, useMemo, useCallback } from "react";
import axios from "axios";
import InputMask from "react-input-mask";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Toast } from "primereact/toast";
import { InputText } from "primereact/inputtext";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import Config from "../components/features/Config";

const REGISTRO_SOLICITUDES_ENDPOINT = "/api/registro-solicitudes";

const estados = [
  { label: "Autorizado", value: "autorizado" },
  { label: "No autorizado", value: "no_autorizado" },
];

const getRegistrosPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.registros)) return payload.registros;
  return [];
};

const getApiMessage = (error, fallbackMessage) => {
  return (
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    fallbackMessage
  );
};

const sanitizeIpMask = (maskedValue = "") => maskedValue.replace(/_/g, "").trim();

const formatDate = (dateString) => {
  if (!dateString) return "-";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("es-CO", {
    dateStyle: "short",
    timeStyle: "medium",
    hour12: true,
  });
};

const RegistroSolicitudesPage = () => {
  const [ipCliente, setIpCliente] = useState("");
  const [estado, setEstado] = useState("");
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const toast = useRef(null);

  const fetchRegistros = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${Config.apiUrl}${REGISTRO_SOLICITUDES_ENDPOINT}`, {
        ip_cliente: sanitizeIpMask(ipCliente),
        estado,
      });

      setRegistros(getRegistrosPayload(response.data));
    } catch (error) {
      console.error("Error fetching registros:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: getApiMessage(error, "No se pudo cargar la información"),
        life: 4000,
      });
    } finally {
      setLoading(false);
    }
  }, [ipCliente, estado]);

  const clearFilters = () => {
    setIpCliente("");
    setEstado("");
    setGlobalFilter("");
    setRegistros([]);
  };

  const estadoBodyTemplate = (rowData) => {
    const isAutorizado = rowData?.estado === "autorizado";
    return (
      <span
        className={`p-tag ${isAutorizado ? "p-tag-success" : "p-tag-danger"}`}
        style={{ textTransform: "capitalize" }}
      >
        {rowData?.estado?.replace("_", " ") || "-"}
      </span>
    );
  };

  const tableHeader = (
    <div className="clientes-table-header">
      <IconField iconPosition="left">
        <InputIcon className="pi pi-search" />
        <InputText
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
          placeholder="Buscar en registros"
        />
      </IconField>
      <span>{registros.length} registros</span>
    </div>
  );

  const kpis = useMemo(
    () => [
      { label: "Total registros", value: registros.length },
      {
        label: "Autorizados",
        value: registros.filter((registro) => registro.estado === "autorizado").length,
      },
      {
        label: "No autorizados",
        value: registros.filter((registro) => registro.estado === "no_autorizado").length,
      },
    ],
    [registros]
  );

  return (
    <div className="clientes-page">
      <Toast ref={toast} />

      <div className="clientes-header">
        <h1>Registro de Solicitudes</h1>
        <div className="clientes-actions">
          <Button label="Buscar" icon="pi pi-search" onClick={fetchRegistros} loading={loading} />
          <Button
            label="Limpiar"
            icon="pi pi-filter-slash"
            severity="secondary"
            onClick={clearFilters}
            disabled={loading}
          />
        </div>
      </div>

      <Card className="clientes-table-card">
        <div className="p-fluid" style={{ marginBottom: "1rem" }}>
          <div className="p-formgrid p-grid">
            <div className="p-field p-col-12 p-md-6">
              <label htmlFor="ipCliente">IP Cliente</label>
              <InputMask
                id="ipCliente"
                value={ipCliente}
                onChange={(event) => setIpCliente(event.target.value)}
                mask="999.999.999.999"
                placeholder="Ingrese IP"
                className="p-inputtext p-component"
              />
            </div>

            <div className="p-field p-col-12 p-md-6">
              <label htmlFor="estado">Estado</label>
              <Dropdown
                id="estado"
                value={estado}
                options={estados}
                onChange={(event) => setEstado(event.value)}
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccione estado"
                showClear
              />
            </div>
          </div>
        </div>

        <div className="clientes-kpis" style={{ marginBottom: "1rem" }}>
          {kpis.map((kpi) => (
            <Card key={kpi.label} className="clientes-kpi">
              <p className="clientes-kpi-label">{kpi.label}</p>
              <p className="clientes-kpi-value">{kpi.value}</p>
            </Card>
          ))}
        </div>

        <DataTable
          value={registros}
          paginator
          rows={10}
          rowsPerPageOptions={[10, 20, 30, 50]}
          paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
          currentPageReportTemplate="{first} a {last} de {totalRecords} registros"
          sortField="fecha_solicitud"
          sortOrder={-1}
          loading={loading}
          emptyMessage="No hay registros"
          header={tableHeader}
          globalFilter={globalFilter}
          globalFilterFields={["ip_cliente", "autorizacion.nombre", "estado", "fecha_solicitud"]}
          showGridlines
          stripedRows
          className="p-datatable-sm"
        >
          <Column field="ip_cliente" header="IP Cliente" sortable />
          <Column field="id_autorizacion" header="ID Autorización" hidden />
          <Column field="autorizacion.nombre" header="Nombre" sortable />
          <Column field="estado" header="Estado" body={estadoBodyTemplate} sortable />
          <Column
            field="fecha_solicitud"
            header="Fecha solicitud"
            body={(rowData) => formatDate(rowData.fecha_solicitud)}
            sortable
          />
        </DataTable>
      </Card>
    </div>
  );
};

export default RegistroSolicitudesPage;
