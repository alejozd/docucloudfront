import React, { useState, useEffect } from "react";
import axios from "axios";
import Config from "./Config";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { convertToLocalDate } from "./dateUtils";
import { formatDate } from "./dateUtils";

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
  const [cartera, setCartera] = useState(null); // Estado para almacenar el detalle de cartera
  const [showCarteraDialog, setShowCarteraDialog] = useState(false); // Estado para controlar el modal
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

  // Función para ver el detalle de cartera
  const viewCartera = async (vendedorId, vendedorNombre) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${Config.apiUrl}/api/vendedores/${vendedorId}/cartera`,
        {
          headers: { Authorization: `Bearer ${jwtToken}` },
        }
      );
      setCartera({ ...response.data, nombre: vendedorNombre }); // Almacena el detalle de cartera
      setShowCarteraDialog(true); // Muestra el modal
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

  // Función para cerrar el modal de detalle de cartera
  const closeCarteraDialog = () => {
    setShowCarteraDialog(false);
    setCartera(null);
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
              {/* Botón Ver Detalle de Cartera */}
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
    );
  };

  const renderCarteraDialog = () => {
    if (!cartera) return null;

    return (
      <Dialog
        visible={showCarteraDialog}
        header={`Detalle de Cartera - ${cartera.nombre}`}
        onHide={closeCarteraDialog}
        style={{ width: "600px" }}
      >
        {/* Totales */}
        <div style={{ marginBottom: "12px" }}>
          <strong>Total Ventas:</strong>{" "}
          {new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
          }).format(cartera.totales.totalVentas)}
        </div>
        <div style={{ marginBottom: "12px" }}>
          <strong>Total Pagos:</strong>{" "}
          {new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
          }).format(cartera.totales.totalPagos)}
        </div>
        <div style={{ marginBottom: "12px" }}>
          <strong>Saldo Total:</strong>{" "}
          <span
            style={{
              color: cartera.totales.saldoTotal >= 0 ? "#28a745" : "#dc3545",
              fontWeight: "bold",
            }}
          >
            {new Intl.NumberFormat("es-CO", {
              style: "currency",
              currency: "COP",
            }).format(cartera.totales.saldoTotal)}
          </span>
        </div>

        {/* Detalle por Venta */}
        <h4>Detalle por Venta</h4>
        <DataTable value={cartera.ventas} paginator rows={5}>
          <Column field="venta_id" header="ID Venta" />
          <Column
            field="fecha_venta"
            header="Fecha de Venta"
            body={(rowData) => {
              const fechaLocal = convertToLocalDate(rowData.fecha_venta);
              return formatDate(fechaLocal);
            }}
          />
          <Column
            field="valor_venta"
            header="Valor de Venta"
            body={(rowData) =>
              new Intl.NumberFormat("es-CO", {
                style: "currency",
                currency: "COP",
              }).format(rowData.valor_venta)
            }
          />
          <Column
            field="total_pagos"
            header="Total Pagos"
            body={(rowData) =>
              new Intl.NumberFormat("es-CO", {
                style: "currency",
                currency: "COP",
              }).format(rowData.total_pagos)
            }
          />
          <Column
            field="saldo"
            header="Saldo"
            body={(rowData) => (
              <span
                style={{
                  color: rowData.saldo >= 0 ? "#28a745" : "#dc3545",
                  fontWeight: "bold",
                }}
              >
                {new Intl.NumberFormat("es-CO", {
                  style: "currency",
                  currency: "COP",
                }).format(rowData.saldo)}
              </span>
            )}
          />
        </DataTable>
      </Dialog>
    );
  };

  return (
    <div>
      <Toast ref={toast} />
      <h2>Vendedores</h2>
      <Button
        label="Agregar Vendedor"
        icon="pi pi-plus"
        onClick={() => openDialog()}
        severity="success"
        style={{ marginBottom: "20px" }}
      />
      {renderDataTable()}
      {renderCarteraDialog()}
      {renderDialog()}
      {error && <p style={{ color: "red", marginTop: "12px" }}>{error}</p>}
    </div>
  );
};

export default Vendedores;
