import React, { useState, useEffect } from "react";
import axios from "axios";
import Config from "./Config";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";

const Pagos = ({ jwtToken }) => {
  const [pagos, setPagos] = useState([]);
  const [pago, setPago] = useState({
    id: null,
    venta_id: "",
    fecha_pago: new Date().toISOString().split("T")[0],
    monto: "",
    estado: "pendiente",
  });
  const [showDialog, setShowDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ventas, setVentas] = useState([]);
  const toast = React.useRef(null);

  // Cargar pagos y ventas al iniciar el componente
  useEffect(() => {
    fetchPagos();
    fetchVentas();
  }, []);

  // Función para cargar pagos desde el backend
  const fetchPagos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${Config.apiUrl}/api/pagos`, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      setPagos(response.data);
    } catch (err) {
      console.error(err);
      setError("Error al cargar los pagos.");
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar los pagos",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar ventas desde el backend
  const fetchVentas = async () => {
    try {
      const response = await axios.get(`${Config.apiUrl}/api/ventas`, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      setVentas(response.data);
    } catch (err) {
      console.error("Error al cargar las ventas:", err.message);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar las ventas",
        life: 3000,
      });
    }
  };

  // Función para abrir el diálogo de creación/edición
  const openDialog = (pagoSeleccionado = null) => {
    if (pagoSeleccionado) {
      setPago(pagoSeleccionado);
      setIsEditMode(true);
    } else {
      setPago({
        id: null,
        venta_id: "",
        fecha_pago: new Date().toISOString().split("T")[0],
        monto: "",
        estado: "pendiente",
      });
      setIsEditMode(false);
    }
    setShowDialog(true);
  };

  // Función para cerrar el diálogo
  const closeDialog = () => {
    setShowDialog(false);
    setPago({
      id: null,
      venta_id: "",
      fecha_pago: new Date().toISOString().split("T")[0],
      monto: "",
      estado: "pendiente",
    });
  };

  // Función para guardar un pago
  const savePago = async () => {
    if (!pago.venta_id || !pago.fecha_pago || !pago.monto || !pago.estado) {
      setError("Por favor ingresa todos los campos obligatorios.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (isEditMode) {
        // Actualizar pago existente
        await axios.put(`${Config.apiUrl}/api/pagos/${pago.id}`, pago, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Pago actualizado exitosamente",
          life: 3000,
        });
      } else {
        // Crear nuevo pago
        console.log("Creando pago:", pago);
        await axios.post(`${Config.apiUrl}/api/pagos`, pago, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Pago creado exitosamente",
          life: 3000,
        });
      }
      closeDialog();
      fetchPagos(); // Recargar la lista de pagos
    } catch (err) {
      console.error(err);
      setError("Error al guardar el pago.");
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al guardar el pago",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar un pago
  const deletePago = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este pago?")) {
      setLoading(true);
      setError(null);
      try {
        await axios.delete(`${Config.apiUrl}/api/pagos/${id}`, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Pago eliminado exitosamente",
          life: 3000,
        });
        fetchPagos(); // Recargar la lista de pagos
      } catch (err) {
        console.error(err);
        setError("Error al eliminar el pago.");
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "Error al eliminar el pago",
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
        header={isEditMode ? "Editar Pago" : "Nuevo Pago"}
        onHide={closeDialog}
        style={{ width: "400px" }}
      >
        {/* Campo venta */}
        <div style={{ marginBottom: "12px" }}>
          <label
            htmlFor="venta_id"
            style={{ display: "block", marginBottom: "6px" }}
          >
            Venta:
          </label>
          <Dropdown
            id="venta_id"
            value={pago.venta_id}
            options={ventas}
            onChange={(e) => setPago({ ...pago, venta_id: e.value })}
            optionLabel="id" // Usar el ID como valor interno
            itemTemplate={(option) => (
              <div>
                <strong>ID:</strong> {option.id} <br />
                <strong>Fecha:</strong>{" "}
                {new Date(option.fecha_venta).toLocaleDateString("es-CO")}{" "}
                <br />
                <strong>Valor Total:</strong>{" "}
                {new Intl.NumberFormat("es-CO", {
                  style: "currency",
                  currency: "COP",
                }).format(option.valor_total)}
              </div>
            )}
            valueTemplate={(selectedOption) => {
              if (!selectedOption) return "Selecciona una venta"; // Placeholder si no hay selección
              return (
                <div>
                  <strong>ID:</strong> {selectedOption.id} <br />
                  <strong>Fecha:</strong>{" "}
                  {new Date(selectedOption.fecha_venta).toLocaleDateString(
                    "es-CO"
                  )}{" "}
                  <br />
                  <strong>Valor Total:</strong>{" "}
                  {new Intl.NumberFormat("es-CO", {
                    style: "currency",
                    currency: "COP",
                  }).format(selectedOption.valor_total)}
                </div>
              );
            }}
            placeholder="Selecciona una venta"
            style={{ width: "100%" }}
          />
        </div>

        {/* Campo fecha_pago */}
        <div style={{ marginBottom: "12px" }}>
          <label
            htmlFor="fecha_pago"
            style={{ display: "block", marginBottom: "6px" }}
          >
            Fecha de Pago:
          </label>
          <Calendar
            id="fecha_pago"
            value={pago.fecha_pago}
            onChange={(e) => setPago({ ...pago, fecha_pago: e.value })}
            dateFormat="dd/mm/yy"
            showIcon
            placeholder="Selecciona una fecha"
            style={{ width: "100%" }}
          />
        </div>

        {/* Campo monto */}
        <div style={{ marginBottom: "12px" }}>
          <label
            htmlFor="monto"
            style={{ display: "block", marginBottom: "6px" }}
          >
            Monto:
          </label>
          <InputNumber
            id="monto"
            value={pago.monto}
            onValueChange={(e) => setPago({ ...pago, monto: e.value })}
            mode="currency"
            currency="COP"
            locale="es-CO"
            minFractionDigits={0} // Sin decimales
            maxFractionDigits={0} // Sin decimales
            placeholder="Monto del pago"
            style={{ width: "100%" }}
          />
        </div>

        {/* Campo estado */}
        <div style={{ marginBottom: "12px" }}>
          <label
            htmlFor="estado"
            style={{ display: "block", marginBottom: "6px" }}
          >
            Estado:
          </label>
          <Dropdown
            id="estado"
            value={pago.estado}
            options={[
              { label: "Completo", value: "completo" },
              { label: "Pendiente", value: "pendiente" },
            ]}
            onChange={(e) => setPago({ ...pago, estado: e.value })}
            placeholder="Selecciona un estado"
            style={{ width: "100%" }}
          />
        </div>

        <Button
          label="Guardar"
          onClick={savePago}
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
        value={pagos}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 20]}
        emptyMessage="No se encontraron pagos."
      >
        <Column field="id" header="ID" />
        <Column
          field="venta_id"
          header="Venta"
          body={(rowData) => <span>{rowData.venta?.id || "Sin venta"}</span>}
        />
        <Column
          field="fecha_pago"
          header="Fecha de Pago"
          body={(rowData) =>
            new Date(rowData.fecha_pago).toLocaleDateString("es-CO")
          }
        />
        <Column
          field="monto"
          header="Monto"
          body={(rowData) => {
            const formattedValue = new Intl.NumberFormat("es-CO", {
              style: "currency",
              currency: "COP",
            }).format(rowData.monto);
            return <span>{formattedValue}</span>;
          }}
        />
        <Column
          field="estado"
          header="Estado"
          body={(rowData) => (
            <span
              style={{
                color: rowData.estado === "completo" ? "#28a745" : "#dc3545",
              }}
            >
              {rowData.estado}
            </span>
          )}
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
                onClick={() => deletePago(rowData.id)}
              />
            </div>
          )}
        />
      </DataTable>
    );
  };

  return (
    <div>
      <h2>Pagos</h2>
      <Button
        label="Agregar Pago"
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

export default Pagos;
