// ClavesGeneradas.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import Config from "./Config";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";

const ClavesGeneradas = ({ jwtToken }) => {
  const [claves, setClaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const toast = React.useRef(null);

  // Función para cargar las claves generadas desde el backend
  const fetchClaves = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${Config.apiUrl}/api/claves-medios-generadas`,
        {
          headers: { Authorization: `Bearer ${jwtToken}` },
        }
      );
      setClaves(response.data);
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
  };

  // Cargar las claves al iniciar el componente
  useEffect(() => {
    fetchClaves();
  }, [jwtToken]);

  // Renderizar el DataTable
  const renderDataTable = () => {
    return (
      <DataTable
        value={claves}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 20]}
        emptyMessage="No se encontraron claves generadas."
        style={{ marginTop: "20px" }}
      >
        <Column field="id" header="ID" style={{ width: "10%" }} />
        <Column
          field="serial_erp"
          header="Serial ERP"
          body={(rowData) => rowData.serial?.serial_erp || "N/A"}
        />
        <Column field="mac_servidor" header="MAC" />
        <Column
          field="clave_generada"
          header="Clave"
          style={{ width: "60%" }}
        />
        <Column
          field="generado_en"
          header="Fecha de Generación"
          style={{ width: "40%" }}
          body={(rowData) => new Date(rowData.generado_en).toLocaleString()}
        />
      </DataTable>
    );
  };

  return (
    <div>
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

      {/* Renderizar el DataTable */}
      {renderDataTable()}

      {/* Componente Toast para notificaciones */}
      <Toast ref={toast} />
    </div>
  );
};

export default ClavesGeneradas;
