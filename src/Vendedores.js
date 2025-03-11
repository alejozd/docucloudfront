import React, { useState, useEffect } from "react";
import axios from "axios";
import Config from "./Config";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";

const Vendedores = ({ jwtToken }) => {
  const [vendedores, setVendedores] = useState([]);
  const [vendedor, setVendedor] = useState({
    id: null,
    nombre: "",
    activo: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const toast = React.useRef(null);

  // Cargar vendedores al iniciar el componente
  useEffect(() => {
    fetchVendedores();
  }, [jwtToken]);

  // Función para cargar vendedores desde el backend
  const fetchVendedores = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${Config.apiUrl}/api/vendedores`, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      setVendedores(response.data);
    } catch (err) {
      console.error(err);
      setError("Error al cargar los vendedores.");
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar los vendedores",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para abrir el diálogo de creación/edición
  const openDialog = (vendedorSeleccionado = null) => {
    if (vendedorSeleccionado) {
      setVendedor(vendedorSeleccionado);
      setIsEditMode(true);
    } else {
      setVendedor({ id: null, nombre: "", activo: true });
      setIsEditMode(false);
    }
    setShowDialog(true);
  };

  // Función para cerrar el diálogo
  const closeDialog = () => {
    setShowDialog(false);
    setVendedor({ id: null, nombre: "", activo: true });
  };

  // Función para guardar un vendedor
  const saveVendedor = async () => {
    if (!vendedor.nombre.trim()) {
      setError("Por favor ingresa todos los campos obligatorios.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (isEditMode) {
        // Actualizar vendedor existente
        await axios.put(
          `${Config.apiUrl}/api/vendedores/${vendedor.id}`,
          vendedor,
          { headers: { Authorization: `Bearer ${jwtToken}` } }
        );
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Vendedor actualizado exitosamente",
          life: 3000,
        });
      } else {
        // Crear nuevo vendedor
        await axios.post(`${Config.apiUrl}/api/vendedores`, vendedor, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Vendedor creado exitosamente",
          life: 3000,
        });
      }
      closeDialog();
      fetchVendedores(); // Recargar la lista de vendedores
    } catch (err) {
      console.error(err);
      setError("Error al guardar el vendedor.");
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al guardar el vendedor",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar un vendedor
  const deleteVendedor = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este vendedor?")) {
      setLoading(true);
      setError(null);
      try {
        await axios.delete(`${Config.apiUrl}/api/vendedores/${id}`, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Vendedor eliminado exitosamente",
          life: 3000,
        });
        fetchVendedores(); // Recargar la lista de vendedores
      } catch (err) {
        console.error(err);
        setError("Error al eliminar el vendedor.");
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "Error al eliminar el vendedor",
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
        header={isEditMode ? "Editar Vendedor" : "Nuevo Vendedor"}
        onHide={closeDialog}
        style={{ width: "400px" }}
      >
        <div style={{ marginBottom: "12px" }}>
          <label
            htmlFor="nombre"
            style={{ display: "block", marginBottom: "6px" }}
          >
            Nombre:
          </label>
          <InputText
            id="nombre"
            value={vendedor.nombre}
            onChange={(e) =>
              setVendedor({ ...vendedor, nombre: e.target.value })
            }
            placeholder="Nombre del vendedor"
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ marginBottom: "12px" }}>
          <label
            htmlFor="telefono"
            style={{ display: "block", marginBottom: "6px" }}
          >
            Telefono:
          </label>
          <InputText
            id="telefono"
            value={vendedor.telefono}
            onChange={(e) =>
              setVendedor({ ...vendedor, telefono: e.target.value })
            }
            placeholder="Telefono del vendedor"
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ marginBottom: "12px" }}>
          <label
            htmlFor="activo"
            style={{ display: "block", marginBottom: "6px" }}
          >
            Activo:
          </label>
          <input
            type="checkbox"
            checked={vendedor.activo}
            onChange={(e) =>
              setVendedor({ ...vendedor, activo: e.target.checked })
            }
          />
        </div>
        <Button
          label="Guardar"
          onClick={saveVendedor}
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
        value={vendedores}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 20]}
        emptyMessage="No se encontraron vendedores."
      >
        <Column field="id" header="ID" />
        <Column field="nombre" header="Nombre" sortable />
        <Column
          field="activo"
          header="Activo"
          body={(rowData) => <span>{rowData.activo ? "Sí" : "No"}</span>}
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
                onClick={() => deleteVendedor(rowData.id)}
              />
            </div>
          )}
        />
      </DataTable>
    );
  };

  return (
    <div>
      <h2>Vendedores</h2>
      <Button
        label="Agregar Vendedor"
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

export default Vendedores;
