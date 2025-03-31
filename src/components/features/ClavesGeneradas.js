// ClavesGeneradas.js
import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import Config from "././Config";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { Toast } from "primereact/toast";

const ClavesGeneradas = ({ jwtToken }) => {
  const [claves, setClaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [globalFilter, setGlobalFilter] = useState(""); // Estado para el filtro global
  const toast = useRef(null);
  const dt = useRef(null); // Referencia al DataTable

  // Función para cargar las claves generadas desde el backend
  const fetchClaves = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${Config.apiUrl}/api/claves-medios-generadas`,
        {
          headers: { Authorization: `Bearer ${jwtToken}` },
        }
      );
      const transformedData = response.data.map((item) => ({
        ...item,
        serial_erp: item.serial?.serial_erp || "N/A", // Transformar los datos
      }));
      setClaves(transformedData);
    } catch (err) {
      console.error(err);
      setError("Error al cargar las claves generadas.");
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar las claves generadas",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [jwtToken]);

  // Cargar las claves al iniciar el componente
  useEffect(() => {
    fetchClaves();
  }, [fetchClaves]);

  // Renderizar el DataTable
  const renderDataTable = () => {
    return (
      <div className="card">
        {/* Campo de filtro global */}
        <div
          className="flex flex-wrap gap-2 justify-content-between align-items-center"
          style={{ marginBottom: "15px" }}
        >
          <h4 className="m-0">Buscar por Serial ERP, MAC o IP-Origen</h4>
          <IconField iconPosition="left">
            <InputIcon className="pi pi-search" />
            <InputText
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Busqueda Global"
            />
          </IconField>
        </div>

        {/* DataTable */}
        <DataTable
          ref={dt}
          value={claves}
          loading={loading}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 20]}
          emptyMessage="No se encontraron claves generadas."
          stripedRows
          globalFilter={globalFilter} // Vincular el filtro global
          globalFilterFields={[
            "serial_erp",
            "mac_servidor",
            "iporigen",
            "clave_generada",
          ]}
          filterMatchMode="contains"
          sortOrder={-1}
          sortField="generado_en"
        >
          <Column field="id" header="ID" />
          <Column field="serial_erp" header="Serial ERP" />
          <Column field="serial.cliente.nombre_completo" header="Cliente" />
          <Column field="mac_servidor" header="MAC" />
          <Column field="iporigen" header="IP-Origen" />
          <Column field="clave_generada" header="Clave" />
          <Column
            field="generado_en"
            header="Fecha de Generación"
            body={(rowData) => new Date(rowData.generado_en).toLocaleString()}
            sortable
          />
        </DataTable>
      </div>
    );
  };

  return (
    <div>
      {/* Componente Toast para notificaciones */}
      <Toast ref={toast} />

      <div className="card">
        <h2>Claves Generadas</h2>

        {/* Botón para refrescar la lista */}
        <Button
          label="Refrescar"
          icon="pi pi-refresh"
          onClick={fetchClaves}
          className="p-button-raised p-button-secondary"
          style={{ marginBottom: "20px" }}
        />

        {/* Mostrar mensaje de error si ocurre uno */}
        {error && <p style={{ color: "red", marginBottom: "12px" }}>{error}</p>}
      </div>
      {/* Renderizar el DataTable */}
      {renderDataTable()}
    </div>
  );
};

export default ClavesGeneradas;
