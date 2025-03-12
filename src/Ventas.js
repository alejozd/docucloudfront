// Ventas.js
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

const Ventas = ({ jwtToken }) => {
  const [ventas, setVentas] = useState([]);
  const [venta, setVenta] = useState({
    id: null,
    vendedor_id: "",
    cliente_medio_id: "",
    fecha_venta: new Date().toISOString().split("T")[0],
    valor_total: "",
    estado_pago: "pendiente",
    estado_instalacion: "pendiente",
  });
  const [showDialog, setShowDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clientesMedios, setClientesMedios] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const toast = React.useRef(null);

  // Cargar ventas, clientes medios y vendedores al iniciar el componente
  useEffect(() => {
    fetchVentas();
    fetchClientesMedios();
    fetchVendedores();
  }, []);

  // Función para cargar ventas desde el backend
  const fetchVentas = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${Config.apiUrl}/api/ventas`, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      setVentas(response.data);
    } catch (err) {
      console.error(err);
      setError("Error al cargar las ventas.");
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar las ventas",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar clientes medios desde el backend
  const fetchClientesMedios = async () => {
    try {
      const response = await axios.get(`${Config.apiUrl}/api/clientes-medios`, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      setClientesMedios(response.data);
    } catch (err) {
      console.error("Error al cargar los clientes medios:", err.message);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar los clientes medios",
        life: 3000,
      });
    }
  };

  // Función para cargar vendedores desde el backend
  const fetchVendedores = async () => {
    try {
      const response = await axios.get(`${Config.apiUrl}/api/vendedores`, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      setVendedores(response.data);
    } catch (err) {
      console.error("Error al cargar los vendedores:", err.message);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar los vendedores",
        life: 3000,
      });
    }
  };

  // Función para abrir el diálogo de creación/edición
  const openDialog = (ventaSeleccionada = null) => {
    if (ventaSeleccionada) {
      const fechaUtc = new Date(ventaSeleccionada.fecha_venta);
      const fechaLocal = new Date(
        fechaUtc.getUTCFullYear(),
        fechaUtc.getUTCMonth(),
        fechaUtc.getUTCDate()
      );

      setVenta({
        ...ventaSeleccionada,
        fecha_venta: fechaLocal,
      });
      setIsEditMode(true);
    } else {
      setVenta({
        id: null,
        vendedor_id: "",
        cliente_medio_id: "",
        fecha_venta: new Date(),
        valor_total: "",
        estado_pago: "pendiente",
        estado_instalacion: "pendiente",
      });
      setIsEditMode(false);
    }
    setShowDialog(true);
  };

  // Función para cerrar el diálogo
  const closeDialog = () => {
    setShowDialog(false);
    setVenta({
      id: null,
      vendedor_id: "",
      cliente_medio_id: "",
      fecha_venta: new Date().toISOString().split("T")[0],
      valor_total: "",
      estado_pago: "pendiente",
      estado_instalacion: "pendiente",
    });
  };

  // Función para guardar una venta
  const saveVenta = async () => {
    if (
      !venta.vendedor_id ||
      !venta.cliente_medio_id ||
      !venta.fecha_venta ||
      !venta.valor_total
    ) {
      setError("Por favor ingresa todos los campos obligatorios.");
      return;
    }
    setLoading(true);
    setError(null);

    const fechaVentaISO = venta.fecha_venta
      ? new Date(
          venta.fecha_venta.getTime() -
            venta.fecha_venta.getTimezoneOffset() * 60000
        ) // Ajusta la zona horaria
          .toISOString()
          .split("T")[0]
      : null;

    const ventaParaEnviar = {
      ...venta,
      fecha_venta: fechaVentaISO,
    };
    try {
      if (isEditMode) {
        // Actualizar venta existente
        await axios.put(
          `${Config.apiUrl}/api/ventas/${venta.id}`,
          ventaParaEnviar,
          {
            headers: { Authorization: `Bearer ${jwtToken}` },
          }
        );
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Venta actualizada exitosamente",
          life: 3000,
        });
      } else {
        // Crear nueva venta
        await axios.post(`${Config.apiUrl}/api/ventas`, ventaParaEnviar, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Venta creada exitosamente",
          life: 3000,
        });
      }
      closeDialog();
      fetchVentas(); // Recargar la lista de ventas
    } catch (err) {
      console.error(err);
      setError("Error al guardar la venta.");
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al guardar la venta",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar una venta
  const deleteVenta = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar esta venta?")) {
      setLoading(true);
      setError(null);
      try {
        await axios.delete(`${Config.apiUrl}/api/ventas/${id}`, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Venta eliminada exitosamente",
          life: 3000,
        });
        fetchVentas(); // Recargar la lista de ventas
      } catch (err) {
        console.error(err);
        setError("Error al eliminar la venta.");
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "Error al eliminar la venta",
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
        header={isEditMode ? "Editar Venta" : "Nueva Venta"}
        onHide={closeDialog}
        style={{ width: "400px" }}
      >
        <div style={{ marginBottom: "12px" }}>
          <label
            htmlFor="fecha_venta"
            style={{ display: "block", marginBottom: "6px" }}
          >
            Fecha de Venta:
          </label>
          <Calendar
            id="fecha_venta"
            value={venta.fecha_venta}
            onChange={(e) => setVenta({ ...venta, fecha_venta: e.value })}
            dateFormat="dd/mm/yy" // Formato de fecha personalizado
            showIcon // Muestra el icono de calendario
            placeholder="Selecciona una fecha"
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ marginBottom: "12px" }}>
          <label
            htmlFor="valor_total"
            style={{ display: "block", marginBottom: "6px" }}
          >
            Valor Total:
          </label>
          <InputNumber
            id="valor_total"
            value={venta.valor_total}
            onValueChange={(e) => setVenta({ ...venta, valor_total: e.value })}
            mode="currency"
            currency="COP"
            locale="es-CO"
            minFractionDigits={0}
            maxFractionDigits={0}
            placeholder="Ingrese el valor total"
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ marginBottom: "12px" }}>
          <label
            htmlFor="cliente_medio_id"
            style={{ display: "block", marginBottom: "6px" }}
          >
            Cliente Medio:
          </label>
          <Dropdown
            id="cliente_medio_id"
            value={venta.cliente_medio_id}
            options={clientesMedios}
            onChange={(e) => setVenta({ ...venta, cliente_medio_id: e.value })}
            optionLabel="nombre_completo"
            optionValue="id"
            placeholder="Selecciona un cliente medio"
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ marginBottom: "12px" }}>
          <label
            htmlFor="vendedor_id"
            style={{ display: "block", marginBottom: "6px" }}
          >
            Vendedor:
          </label>
          <Dropdown
            id="vendedor_id"
            value={venta.vendedor_id}
            options={vendedores}
            onChange={(e) => setVenta({ ...venta, vendedor_id: e.value })}
            optionLabel="nombre"
            optionValue="id"
            placeholder="Selecciona un vendedor"
            style={{ width: "100%" }}
          />
        </div>
        <Button
          label="Guardar"
          onClick={saveVenta}
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
        value={ventas}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 20]}
        emptyMessage="No se encontraron ventas."
      >
        <Column field="id" header="ID" />
        <Column
          field="fecha_venta"
          header="Fecha de Venta"
          // body={(rowData) =>
          //   new Date(rowData.fecha_venta).toLocaleDateString("es-CO")
          // }
        />
        <Column
          field="valor_total"
          header="Valor Total"
          body={(rowData) => {
            const formattedValue = new Intl.NumberFormat("es-CO", {
              style: "currency",
              currency: "COP",
            }).format(rowData.valor_total);
            return <span>{formattedValue}</span>;
          }}
        />
        <Column
          field="cliente_medio.nombre_completo"
          header="Cliente Medio"
          body={(rowData) =>
            rowData.cliente_medio?.nombre_completo || "Sin cliente"
          }
        />
        <Column
          field="vendedor.nombre"
          header="Vendedor"
          body={(rowData) => rowData.vendedor?.nombre || "Sin vendedor"}
        />
        <Column
          field="estado_pago"
          header="Estado Pago"
          body={(rowData) => (
            <span
              style={{
                color:
                  rowData.estado_pago === "completo" ? "#28a745" : "#dc3545",
              }}
            >
              {rowData.estado_pago}
            </span>
          )}
        />
        <Column
          field="estado_instalacion"
          header="Estado Instalación"
          body={(rowData) => (
            <span
              style={{
                color:
                  rowData.estado_instalacion === "instalado"
                    ? "#28a745"
                    : "#dc3545",
              }}
            >
              {rowData.estado_instalacion}
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
                text
                severity="info"
                onClick={() => openDialog(rowData)}
                size="small"
              />
              <Button
                icon="pi pi-trash"
                rounded
                text
                severity="danger"
                onClick={() => deleteVenta(rowData.id)}
                size="small"
              />
            </div>
          )}
        />
      </DataTable>
    );
  };

  return (
    <div>
      <h2>Ventas</h2>
      <Button
        label="Agregar Venta"
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

export default Ventas;
