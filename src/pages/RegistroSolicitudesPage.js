import React, { useState, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import InputMask from "react-input-mask"; // Importamos la biblioteca de máscaras
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
  ];

  const fetchRegistros = async () => {
    setLoading(true);

    // Limpiar la IP antes de enviarla
    const cleanedIp = ipCliente.replace(/_/g, "").trim(); // Elimina guiones bajos y espacios
    try {
      const response = await axios.post(
        "http://Localhost:3100/api/registro-solicitudes",
        {
          ip_cliente: cleanedIp, // Usa la IP limpiada
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
    return date.toLocaleString("es-CO", {
      dateStyle: "short", // Fecha corta (dd/mm/aaaa)
      timeStyle: "medium", // Hora con minutos y segundos (hh:mm:ss AM/PM)
      hour12: true, // Formato de 12 horas
    });
  };

  return (
    <div>
      <Toast ref={toast} />
      <Card title="Registro de Solicitudes" className="p-fluid">
        <div className="p-grid p-align-center">
          <div className="p-col-12 p-md-6" style={{ marginBottom: "1em" }}>
            <label
              htmlFor="ipCliente"
              style={{
                fontWeight: "bold",
                fontSize: "1.2em",
              }}
            >
              IP Cliente
            </label>
            {/* Aquí usamos InputMask para aplicar la máscara */}
            <InputMask
              id="ipCliente"
              value={ipCliente}
              onChange={(e) => setIpCliente(e.target.value)}
              mask="999.999.999.999"
              placeholder="Ingrese IP"
              className="p-inputtext p-component"
            />
          </div>
          <div className="p-col-12 p-md-6" style={{ marginBottom: "1em" }}>
            <label
              htmlFor="estado"
              style={{ fontWeight: "bold", fontSize: "1.2em" }}
            >
              Estado
            </label>
            <Dropdown
              id="estado"
              value={estado}
              options={estados}
              onChange={(e) => setEstado(e.value)}
              optionLabel="label"
              placeholder="Seleccione Estado"
              showClear
              className="p-dropdown-lg"
            />
          </div>
        </div>
        <Button
          label="Buscar"
          icon="pi pi-search"
          onClick={fetchRegistros}
          // className="p-button-primary p-button-lg"
          raised
          style={{ marginBottom: "1em" }}
        />
        <div className="p-mt-5">
          <DataTable
            value={registros}
            paginator
            rows={10}
            rowsPerPageOptions={[10, 20, 30, 50]}
            paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
            currentPageReportTemplate="{first} a {last} de {totalRecords} registros"
            // size="small"
            showGridlines
            stripedRows
            sortField="fecha_solicitud"
            sortOrder={-1}
            loading={loading}
            className="p-datatable-sm"
          >
            <Column field="ip_cliente" header="IP Cliente" sortable filter />
            <Column
              field="id_autorizacion"
              header="ID Autorización"
              sortable
              hidden={true}
            />
            <Column field="autorizacion.nombre" header="Nombre" sortable />
            <Column field="estado" header="Estado" sortable />
            <Column
              field="fecha_solicitud"
              header="Fecha Solicitud"
              body={(rowData) => formatDate(rowData.fecha_solicitud)}
              sortable
              filter
            />
          </DataTable>
        </div>
      </Card>
    </div>
  );
};

export default RegistroSolicitudesPage;
