import React, { useState, useEffect } from "react";
import axios from "axios";
import Config from "./Config";
import { Toast } from "primereact/toast";
import VendedoresTable from "./VendedoresTable";
import VendedorDialog from "./VendedorDialog";
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
      <button
        label="Agregar Vendedor"
        icon="pi pi-plus"
        onClick={() => openDialog()}
        className="p-button-raised p-button-success"
        style={{ marginBottom: "20px" }}
      >
        Agregar Vendedor
      </button>

      {/* Tabla de vendedores */}
      <VendedoresTable
        vendedores={vendedores}
        loading={loading}
        onViewCartera={viewCartera}
        onEdit={openDialog}
        onDelete={deleteVendedor}
      />

      {/* Diálogo para crear/editar vendedores */}
      <VendedorDialog
        showDialog={showDialog}
        isEditMode={isEditMode}
        vendedor={vendedor}
        onClose={closeDialog}
        onSave={saveVendedor}
        loading={loading}
        error={error}
      />

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
