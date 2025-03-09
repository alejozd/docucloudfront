// SerialesERP.js
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Config from "./Config";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputSwitch } from "primereact/inputswitch";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";

const SerialesERP = ({ jwtToken }) => {
  const [seriales, setSeriales] = useState([]);
  const [serial, setSerial] = useState({
    id: null,
    serial_erp: "",
    ano_medios: "",
    cliente_id: "",
    activo: true,
  });
  const [showDialog, setShowDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clientes, setClientes] = useState([]);
  const toast = React.useRef(null);

  // Función para cargar seriales desde el backend
  const fetchSeriales = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${Config.apiUrl}/api/seriales-erp`, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      setSeriales(response.data);
    } catch (err) {
      console.error(err);
      setError("Error al cargar los seriales ERP.");
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar los seriales ERP",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [jwtToken]);

  // Función para cargar clientes desde el backend
  const fetchClientes = useCallback(async () => {
    try {
      const response = await axios.get(`${Config.apiUrl}/api/clientes-medios`, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      setClientes(response.data);
    } catch (err) {
      console.error("Error al cargar los clientes:", err.message);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar los clientes",
        life: 3000,
      });
    }
  }, [jwtToken]);

  // Cargar seriales y clientes al iniciar el componente
  useEffect(() => {
    fetchSeriales();
    fetchClientes();
  }, [fetchSeriales, fetchClientes]); // Las funciones están memoizadas con useCallback

  // Función para abrir el diálogo de creación/edición
  const openDialog = (serialSeleccionado = null) => {
    if (serialSeleccionado) {
      setSerial({
        ...serialSeleccionado,
        activo: serialSeleccionado.activo || true, // Asegura el valor booleano
      });
      setIsEditMode(true);
    } else {
      setSerial({
        id: null,
        serial_erp: "",
        ano_medios: "",
        cliente_id: "",
        activo: true,
      });
      setIsEditMode(false);
    }
    setShowDialog(true);
  };

  // Función para cerrar el diálogo
  const closeDialog = () => {
    setShowDialog(false);
    setSerial({ id: null, serial_erp: "", ano_medios: "" });
  };

  // Función para guardar un serial ERP
  const saveSerial = async () => {
    if (
      !serial.serial_erp.trim() ||
      !serial.ano_medios.trim() ||
      !serial.cliente_id
    ) {
      setError("Por favor ingresa todos los campos.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isEditMode) {
        // Actualizar serial ERP existente
        await axios.put(
          `${Config.apiUrl}/api/seriales-erp/${serial.id}`,
          serial,
          { headers: { Authorization: `Bearer ${jwtToken}` } }
        );
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Serial ERP actualizado exitosamente",
          life: 3000,
        });
      } else {
        // Crear nuevo serial ERP
        console.log("Serial a guardar:", serial);
        await axios.post(`${Config.apiUrl}/api/seriales-erp`, serial, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Serial ERP creado exitosamente",
          life: 3000,
        });
      }

      closeDialog();
      fetchSeriales(); // Recargar la lista de seriales ERP
    } catch (err) {
      console.error(err);
      setError("Error al guardar el serial ERP.");
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al guardar el serial ERP",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar un serial ERP
  const deleteSerial = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este serial ERP?")) {
      setLoading(true);
      setError(null);

      try {
        await axios.delete(`${Config.apiUrl}/api/seriales-erp/${id}`, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Serial ERP eliminado exitosamente",
          life: 3000,
        });
        fetchSeriales(); // Recargar la lista de seriales ERP
      } catch (err) {
        console.error(err);
        setError("Error al eliminar el serial ERP.");
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "Error al eliminar el serial ERP",
          life: 3000,
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // Renderizar el diálogo de creación/edición
  const renderDialog = () => {
    return (
      <Dialog
        visible={showDialog}
        header={isEditMode ? "Editar Serial ERP" : "Nuevo Serial ERP"}
        onHide={closeDialog}
        style={{ width: "400px" }}
      >
        <div style={{ marginBottom: "12px" }}>
          <label
            htmlFor="serial_erp"
            style={{ display: "block", marginBottom: "6px" }}
          >
            Serial ERP:
          </label>
          <InputText
            id="serial_erp"
            value={serial.serial_erp}
            onChange={(e) =>
              setSerial({ ...serial, serial_erp: e.target.value })
            }
            placeholder="Serial ERP"
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ marginBottom: "12px" }}>
          <label
            htmlFor="ano_medios"
            style={{ display: "block", marginBottom: "6px" }}
          >
            Año Medios:
          </label>
          <InputText
            id="ano_medios"
            value={serial.ano_medios}
            onChange={(e) =>
              setSerial({ ...serial, ano_medios: e.target.value })
            }
            placeholder="Año Medios"
            style={{ width: "100%" }}
          />
        </div>
        {/* Campo cliente_id */}
        <div style={{ marginBottom: "12px" }}>
          <label
            htmlFor="cliente_id"
            style={{ display: "block", marginBottom: "6px" }}
          >
            Cliente:
          </label>
          <Dropdown
            id="cliente_id"
            value={serial.cliente_id}
            options={clientes}
            onChange={(e) => setSerial({ ...serial, cliente_id: e.value })}
            optionLabel="nombre_completo" // Mostrar el nombre completo del cliente
            optionValue="id" // Guardar el ID del cliente en el estado
            placeholder="Selecciona un cliente"
            style={{ width: "100%" }}
          />
        </div>
        {/* Campo activo */}
        <div style={{ marginBottom: "12px" }}>
          <label
            htmlFor="activo"
            style={{ display: "block", marginBottom: "6px" }}
          >
            Activo:
          </label>
          <InputSwitch
            checked={serial.activo}
            onChange={(e) => setSerial({ ...serial, activo: e.value })}
          />
        </div>
        <Button
          label="Guardar"
          onClick={saveSerial}
          disabled={loading}
          className="p-button-raised p-button-primary"
        />
        {error && <p style={{ color: "red", marginTop: "12px" }}>{error}</p>}
      </Dialog>
    );
  };

  // Renderizar el DataTable
  const renderDataTable = () => {
    return (
      <div className="card">
        <DataTable
          value={seriales}
          loading={loading}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 20]}
          emptyMessage="No se encontraron seriales ERP."
          stripedRows
        >
          <Column field="id" header="ID" />
          <Column field="serial_erp" header="Serial ERP" />
          <Column field="ano_medios" header="Año" />
          <Column field="cliente_id" header="Cliente ID" hidden={true} />
          <Column
            field="nombre_completo"
            header="Cliente"
            body={(rowData) => <span>{rowData.cliente.nombre_completo}</span>}
          />
          <Column
            field="activo"
            header="Activo"
            body={(rowData) => (
              <span
                style={{
                  color: rowData.activo ? "#28a745" : "#dc3545", // Verde para activo, rojo para inactivo
                  fontWeight: "bold", // Texto en negrita para mayor énfasis
                }}
              >
                {rowData.activo ? "Sí" : "No"}
              </span>
            )}
          />
          <Column
            header="Acciones"
            body={(rowData) => (
              <div style={{ display: "flex", gap: "8px" }}>
                <Button
                  icon="pi pi-pencil"
                  rounded
                  severity="warning"
                  size="small"
                  onClick={() => openDialog(rowData)}
                />
                <Button
                  icon="pi pi-trash"
                  rounded
                  severity="danger"
                  size="small"
                  onClick={() => deleteSerial(rowData.id)}
                />
              </div>
            )}
          />
        </DataTable>
      </div>
    );
  };

  return (
    <div>
      <div className="card">
        <h2>Seriales ERP</h2>
        <Button
          label="Agregar Serial ERP"
          icon="pi pi-plus"
          onClick={() => openDialog()}
          className="p-button-raised p-button-success"
          style={{ marginBottom: "20px" }}
        />
        {error && <p style={{ color: "red", marginTop: "12px" }}>{error}</p>}
      </div>
      {renderDataTable()}
      {renderDialog()}
      <Toast ref={toast} />
    </div>
  );
};

export default SerialesERP;
