// ClavesGeneradas.js
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import axios from "axios";
import Config from "../../components/features/Config";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";

const ClavesGeneradas = ({ jwtToken }) => {
  const [claves, setClaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const toast = useRef(null);

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${jwtToken}` } }),
    [jwtToken]
  );

  const notify = useCallback((severity, detail) => {
    toast.current?.show({
      severity,
      summary: severity === "success" ? "Éxito" : "Error",
      detail,
      life: 3000,
    });
  }, []);

  const formatDate = (value) => {
    if (!value) return "-";
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return "-";
    return parsedDate.toLocaleString();
  };

  const fetchClaves = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${Config.apiUrl}/api/claves-medios-generadas`,
        authHeaders
      );

      const transformedData = response.data.map((item) => ({
        ...item,
        serial_erp: item.serial?.serial_erp || "N/A",
        cliente_nombre: item.serial?.cliente?.nombre_completo || "Sin cliente",
      }));

      setClaves(transformedData);
    } catch (err) {
      console.error(err);
      setError("Error al cargar las claves generadas.");
      notify("error", "Error al cargar las claves generadas");
    } finally {
      setLoading(false);
    }
  }, [authHeaders, notify]);

  useEffect(() => {
    fetchClaves();
  }, [fetchClaves]);

  const kpis = useMemo(
    () => [
      { label: "Total", value: claves.length },
      { label: "Con serial", value: claves.filter((item) => item.serial_erp !== "N/A").length },
      { label: "Con cliente", value: claves.filter((item) => item.cliente_nombre !== "Sin cliente").length },
    ],
    [claves]
  );

  const tableHeader = (
    <div className="clientes-table-header">
      <IconField iconPosition="left">
        <InputIcon className="pi pi-search" />
        <InputText
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Buscar por serial, cliente, MAC, IP o clave"
        />
      </IconField>
      <span>{claves.length} registros</span>
    </div>
  );

  return (
    <div className="clientes-page">
      <Toast ref={toast} />

      <div className="clientes-header">
        <h2>Claves Generadas</h2>
        <div className="clientes-actions">
          <Button
            label="Actualizar"
            icon="pi pi-refresh"
            severity="secondary"
            onClick={fetchClaves}
            loading={loading}
          />
        </div>
      </div>

      <div className="clientes-kpis">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="clientes-kpi">
            <p className="clientes-kpi-label">{kpi.label}</p>
            <p className="clientes-kpi-value">{kpi.value}</p>
          </Card>
        ))}
      </div>

      {error && <p style={{ color: "red", marginBottom: "12px" }}>{error}</p>}

      <Card className="clientes-table-card">
        <DataTable
          value={claves}
          loading={loading}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 20]}
          emptyMessage="No se encontraron claves generadas."
          stripedRows
          globalFilter={globalFilter}
          header={tableHeader}
          dataKey="id"
          sortOrder={-1}
          sortField="generado_en"
          globalFilterFields={[
            "serial_erp",
            "cliente_nombre",
            "mac_servidor",
            "iporigen",
            "clave_generada",
          ]}
        >
          <Column field="id" header="ID" hidden />
          <Column field="serial_erp" header="Serial ERP" sortable />
          <Column field="cliente_nombre" header="Cliente" sortable />
          <Column field="mac_servidor" header="MAC" sortable />
          <Column field="iporigen" header="IP-Origen" sortable />
          <Column field="clave_generada" header="Clave" />
          <Column
            field="generado_en"
            header="Fecha de Generación"
            body={(rowData) => formatDate(rowData.generado_en)}
            sortable
          />
        </DataTable>
      </Card>
    </div>
  );
};

export default ClavesGeneradas;
