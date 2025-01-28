import React, { useState, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputMask } from "primereact/inputmask";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Toast } from "primereact/toast";
import axios from "axios";

const RegistroSolicitudesPage = () => {
  const [ipCliente, setIpCliente] = useState("");
  const [estado, setEstado] = useState("");
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(false);
  const toast = useRef(null);

  const estados = [
    { label: "Autorizado", value: "autorizado" },
    { label: "No autorizado", value: "no_autorizado" },
    // { label: "Pendiente", value: "pendiente" },
    { label: "Ninguno", value: "" },
  ];

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
      setRegistros(response.data);
    } catch (error) {
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-CO"); // Formato dd/mm/aaaa
  };

  return (
    <div className="p-4">
      <Toast ref={toast} />
      <Card title="Registro de Solicitudes" className="p-fluid">
        {/* Filtros */}
        <div className="p-grid p-align-center">
          <div className="p-col-12 p-md-6" style={{ marginBottom: "1em" }}>
            <label htmlFor="ipCliente">IP Cliente</label>
            <InputMask
              id="ipCliente"
              mask="999.999.999.999"
              value={ipCliente}
              onChange={(e) => setIpCliente(e.target.value)}
              placeholder="Ingrese IP"
              className="p-inputtext-lg"
              autoClear={false}
            />
          </div>
          <div className="p-col-12 p-md-6" style={{ marginBottom: "1em" }}>
            <label htmlFor="estado">Estado</label>
            <Dropdown
              id="estado"
              value={estado}
              options={estados}
              onChange={(e) => setEstado(e.value)}
              optionLabel="label"
              placeholder="Seleccione Estado"
              className="p-dropdown-lg"
            />
          </div>
        </div>

        {/* Botón de búsqueda */}
        <Button
          label="Buscar"
          icon="pi pi-search"
          onClick={fetchRegistros}
          className="p-button-primary p-mt-3"
        />

        {/* DataTable */}
        <div className="p-mt-5">
          <DataTable
            value={registros}
            paginator
            rows={10}
            loading={loading}
            responsiveLayout="scroll"
            className="p-datatable-sm"
          >
            <Column field="ip_cliente" header="IP Cliente" sortable />
            <Column field="estado" header="Estado" sortable />
            <Column
              field="fecha_solicitud"
              header="Fecha Solicitud"
              body={(rowData) => formatDate(rowData.fecha_solicitud)} // Formatear la fecha
              sortable
            />
          </DataTable>
        </div>
      </Card>
    </div>
  );
};

export default RegistroSolicitudesPage;
