import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column"; // Importar Column desde 'primereact/column'
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import axios from "axios";

const RegistroSolicitudesPage = () => {
  const [ipCliente, setIpCliente] = useState("");
  const [estado, setEstado] = useState("");
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(false);

  const toast = useRef(null); // Referencia al componente Toast

  // Definir las opciones para el estado (autorizado, no autorizado, ninguno)
  const estadoOptions = [
    { label: "Autorizado", value: "autorizado" },
    { label: "No autorizado", value: "no_autorizado" },
    { label: "Ninguno", value: "" }, // Para obtener todos los registros sin filtrar por estado
  ];

  // Función para obtener los registros de solicitudes desde el backend
  const fetchRegistros = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        "https://zetamini.ddns.net/api/registro-solicitudes",
        {
          ip_cliente: ipCliente,
          estado: estado,
        }
      );
      setRegistros(response.data); // Guardamos los registros obtenidos
    } catch (error) {
      // Mostrar mensaje de error con Toast
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar la información",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Función que se ejecuta cuando el usuario presiona el botón de "Filtrar"
  const handleFilter = () => {
    fetchRegistros();
  };

  return (
    <div className="registro-solicitudes-page" style={{ padding: "2em" }}>
      {/* Componente Toast para mensajes */}
      <Toast ref={toast} />

      {/* Filtro de búsqueda */}
      <div className="p-grid">
        <div className="p-col-12 p-md-4">
          <span className="p-float-label">
            <InputText
              id="ipCliente"
              value={ipCliente}
              onChange={(e) => setIpCliente(e.target.value)}
            />
            <label htmlFor="ipCliente">IP Cliente</label>
          </span>
        </div>
        <div className="p-col-12 p-md-4">
          <span className="p-float-label">
            <Dropdown
              id="estado"
              value={estado}
              options={estadoOptions}
              onChange={(e) => setEstado(e.value)}
              placeholder="Seleccionar Estado"
              showClear
            />
            <label htmlFor="estado">Estado</label>
          </span>
        </div>
        <div
          className="p-col-12 p-md-4"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Button label="Filtrar" icon="pi pi-filter" onClick={handleFilter} />
        </div>
      </div>

      {/* Tabla de resultados */}
      <div className="datatable-responsive">
        <DataTable
          value={registros}
          paginator
          rows={10}
          loading={loading}
          responsiveLayout="scroll"
        >
          <Column field="ip_cliente" header="IP Cliente" sortable />
          <Column field="estado" header="Estado" sortable />
          <Column field="fecha_solicitud" header="Fecha Solicitud" sortable />
        </DataTable>
      </div>
    </div>
  );
};

export default RegistroSolicitudesPage;
