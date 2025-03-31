import React, { useState, useEffect } from "react";
import axios from "axios";
import Config from "../../components/features/Config";
import { Toast } from "primereact/toast";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import CarteraDialog from "./CarteraDialog";

const Vendedores = ({ jwtToken }) => {
  const [vendedores, setVendedores] = useState([]);
  const [vendedor, setVendedor] = useState({
    id: null,
    nombre: "",
    telefono: "",
    activo: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [cartera, setCartera] = useState(null);
  const [showCarteraDialog, setShowCarteraDialog] = useState(false);
  const toast = React.useRef(null);

  // Cargar vendedores al iniciar el componente
  useEffect(() => {
    fetchVendedores();
  }, []);

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

  const openDialog = (vendedorSeleccionado = null) => {
    if (vendedorSeleccionado) {
      setVendedor(vendedorSeleccionado);
      setIsEditMode(true);
    } else {
      setVendedor({ id: null, nombre: "", telefono: "", activo: true });
      setIsEditMode(false);
    }
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setVendedor({ id: null, nombre: "", telefono: "", activo: true });
  };

  const saveVendedor = async () => {
    if (!vendedor.nombre.trim()) {
      setError("Por favor ingresa todos los campos obligatorios.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (isEditMode) {
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
      fetchVendedores();
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
        fetchVendedores();
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

  const viewCartera = async (vendedorId, vendedorNombre) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${Config.apiUrl}/api/vendedores/${vendedorId}/cartera`,
        { headers: { Authorization: `Bearer ${jwtToken}` } }
      );
      setCartera({ ...response.data, nombre: vendedorNombre });
      setShowCarteraDialog(true);
    } catch (err) {
      console.error(err);
      setError("Error al cargar el detalle de cartera.");
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar el detalle de cartera",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Componente Toast para mostrar notificaciones */}
      <Toast ref={toast} />

      <h2>Vendedores</h2>

      {/* Botón para agregar un nuevo vendedor */}
      <Button
        label="Agregar Vendedor"
        icon="pi pi-plus"
        onClick={() => openDialog()}
        className="p-button-raised p-button-success"
        style={{ marginBottom: "20px" }}
      />

      {/* Tabla de vendedores */}
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
          field="telefono"
          header="Teléfono"
          body={(rowData) => rowData.telefono || "N/A"}
        />
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
                rounded
                text
                severity="info"
                onClick={() => openDialog(rowData)}
              />
              <Button
                icon="pi pi-trash"
                rounded
                text
                severity="danger"
                onClick={() => deleteVendedor(rowData.id)}
              />
              <Button
                icon="pi pi-eye"
                rounded
                text
                severity="success"
                onClick={() => viewCartera(rowData.id, rowData.nombre)}
              />
            </div>
          )}
        />
      </DataTable>

      {/* Diálogo para crear/editar vendedores */}
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
            Teléfono:
          </label>
          <InputText
            id="telefono"
            value={vendedor.telefono}
            onChange={(e) =>
              setVendedor({ ...vendedor, telefono: e.target.value })
            }
            placeholder="Teléfono del vendedor"
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

      {/* Diálogo para ver el detalle de cartera */}
      <CarteraDialog
        cartera={cartera}
        showCarteraDialog={showCarteraDialog}
        onClose={() => setShowCarteraDialog(false)}
      />

      {/* Mensaje de error general */}
      {error && <p style={{ color: "red", marginTop: "12px" }}>{error}</p>}
    </div>
  );
};

export default Vendedores;
