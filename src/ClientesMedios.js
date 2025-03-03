// ClientesMedios.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import Config from "./Config";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";

const ClientesMedios = ({ jwtToken }) => {
  const [clientes, setClientes] = useState([]);
  const [cliente, setCliente] = useState({ id: null, nombre: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const toast = React.useRef(null);

  // Cargar clientes al iniciar el componente
  useEffect(() => {
    fetchClientes();
  }, []);

  // Función para cargar clientes desde el backend
  const fetchClientes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${Config.apiUrl}/api/clientes-medios`, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      setClientes(response.data);
    } catch (err) {
      console.error(err);
      setError("Error al cargar los clientes.");
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar los clientes",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para abrir el diálogo de creación/edición
  const openDialog = (clienteSeleccionado = null) => {
    if (clienteSeleccionado) {
      setCliente(clienteSeleccionado);
      setIsEditMode(true);
    } else {
      setCliente({ id: null, nombre: "" });
      setIsEditMode(false);
    }
    setShowDialog(true);
  };

  // Función para cerrar el diálogo
  const closeDialog = () => {
    setShowDialog(false);
    setCliente({ id: null, nombre: "" });
  };

  // Función para crear o actualizar un cliente
  const saveCliente = async () => {
    if (!cliente.nombre.trim()) {
      setError("Por favor ingresa un nombre de cliente válido.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isEditMode) {
        // Actualizar cliente existente
        await axios.put(
          `${Config.apiUrl}/api/clientes-medios/${cliente.id}`,
          cliente,
          { headers: { Authorization: `Bearer ${jwtToken}` } }
        );
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Cliente actualizado exitosamente",
          life: 3000,
        });
      } else {
        // Crear nuevo cliente
        await axios.post(`${Config.apiUrl}/api/clientes-medios`, cliente, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Cliente creado exitosamente",
          life: 3000,
        });
      }

      closeDialog();
      fetchClientes(); // Recargar la lista de clientes
    } catch (err) {
      console.error(err);
      setError("Error al guardar el cliente.");
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al guardar el cliente",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar un cliente
  const deleteCliente = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este cliente?")) {
      setLoading(true);
      setError(null);

      try {
        await axios.delete(`${Config.apiUrl}/api/clientes-medios/${id}`, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Cliente eliminado exitosamente",
          life: 3000,
        });
        fetchClientes(); // Recargar la lista de clientes
      } catch (err) {
        console.error(err);
        setError("Error al eliminar el cliente.");
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "Error al eliminar el cliente",
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
        header={isEditMode ? "Editar Cliente" : "Nuevo Cliente"}
        onHide={closeDialog}
        style={{ width: "400px" }}
      >
        <div style={{ marginBottom: "12px" }}>
          <label
            htmlFor="nombre"
            style={{ display: "block", marginBottom: "6px" }}
          >
            Nombre del Cliente:
          </label>
          <InputText
            id="nombre"
            value={cliente.nombre}
            onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })}
            placeholder="Nombre del cliente"
            style={{ width: "100%" }}
          />
        </div>
        <Button
          label="Guardar"
          onClick={saveCliente}
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
      <DataTable
        value={clientes}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 20]}
        emptyMessage="No se encontraron clientes."
        style={{ marginTop: "20px" }}
      >
        <Column field="id" header="ID" style={{ width: "10%" }} />
        <Column
          field="nombre_completo"
          header="Nombre"
          style={{ width: "70%" }}
        />
        <Column
          header="Acciones"
          body={(rowData) => (
            <div style={{ display: "flex", gap: "8px" }}>
              <Button
                icon="pi pi-pencil"
                className="p-button-rounded p-button-warning"
                onClick={() => openDialog(rowData)}
              />
              <Button
                icon="pi pi-trash"
                className="p-button-rounded p-button-danger"
                onClick={() => deleteCliente(rowData.id)}
              />
            </div>
          )}
          style={{ width: "20%" }}
        />
      </DataTable>
    );
  };

  return (
    <div>
      <h2>Clientes Medios</h2>
      <Button
        label="Agregar Cliente"
        icon="pi pi-plus"
        onClick={() => openDialog()}
        className="p-button-raised p-button-success"
        style={{ marginBottom: "20px" }}
      />
      {renderDataTable()}
      {renderDialog()}
      {error && <p style={{ color: "red", marginTop: "12px" }}>{error}</p>}
      <Toast ref={toast} />
    </div>
  );
};

export default ClientesMedios;
