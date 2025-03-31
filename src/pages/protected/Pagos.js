import React, { useState, useEffect } from "react";
import axios from "axios";
import Config from "../../components/features/Config";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { RadioButton } from "primereact/radiobutton";

const Pagos = ({ jwtToken }) => {
  const [pagos, setPagos] = useState([]);
  const [pago, setPago] = useState({
    id: null,
    venta_id: "",
    fecha_pago: new Date().toISOString().split("T")[0],
    monto_pagado: "",
    metodo_pago: "transferencia",
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
        monto_pagado: "",
        metodo_pago: "transferencia",
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
      monto_pagado: "",
      metodo_pago: "transferencia",
    });
  };

  // Función para guardar un pago
  const savePago = async () => {
    if (
      !pago.venta_id ||
      !pago.fecha_pago ||
      !pago.monto_pagado ||
      !pago.metodo_pago
    ) {
      setError("Por favor ingresa todos los campos obligatorios.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (isEditMode) {
        // Actualizar pago existente
        console.log("Actualizando pago:", pago);
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
            value={ventas.find((v) => v.id === pago.venta_id) || null}
            options={ventas}
            onChange={(e) => setPago({ ...pago, venta_id: e.value.id })}
            optionLabel="id"
            placeholder="Selecciona una venta"
            itemTemplate={(option) => (
              <div className="p-2">
                {/* Línea superior: ID y Fecha en extremos opuestos */}
                <div className="flex justify-between w-full">
                  <div className="font-semibold text-left flex-1">
                    #{option.id}
                  </div>
                  <div className="font-semibold text-right flex-1">
                    {new Date(option.fecha_venta).toLocaleDateString("es-CO")}
                  </div>
                </div>

                {/* Valor total */}
                <div className="text-primary-600 text-sm font-medium my-1 text-left">
                  <strong>Valor:</strong>{" "}
                  {new Intl.NumberFormat("es-CO", {
                    style: "currency",
                    currency: "COP",
                    minimumFractionDigits: 0,
                  }).format(option.valor_total)}
                </div>

                {/* Cliente y Vendedor */}
                <div className="text-sm text-gray-700 text-left">
                  <span className="text-gray-500">
                    <strong>Cliente:</strong>
                  </span>{" "}
                  {option.cliente_medio?.nombre_completo || "N/A"}
                </div>
                <div className="text-sm text-gray-700 text-left">
                  <span className="text-gray-500">
                    <strong>Vendedor:</strong>
                  </span>{" "}
                  {option.vendedor?.nombre || "N/A"}
                </div>
              </div>
            )}
            valueTemplate={(selectedOption) => {
              if (!selectedOption) return "Selecciona una venta";
              return (
                <div className="flex justify-between w-full">
                  <div className="font-semibold text-left flex-1">
                    #{selectedOption.id}
                  </div>
                  <div className="text-gray-600 text-center flex-1">
                    {new Date(selectedOption.fecha_venta).toLocaleDateString(
                      "es-CO"
                    )}
                  </div>
                  {/* Valor total */}
                  <div className="text-primary-600 font-medium text-right">
                    <strong>Valor:</strong>{" "}
                    {new Intl.NumberFormat("es-CO", {
                      style: "currency",
                      currency: "COP",
                      minimumFractionDigits: 0,
                    }).format(selectedOption.valor_total)}
                  </div>
                </div>
              );
            }}
            style={{ width: "100%" }}
            panelClassName="min-w-[350px]"
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
            value={pago.fecha_pago ? new Date(pago.fecha_pago) : null}
            onChange={(e) =>
              setPago({
                ...pago,
                fecha_pago: e.value.toISOString().split("T")[0],
              })
            }
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
            value={pago.monto_pagado}
            onValueChange={(e) => setPago({ ...pago, monto_pagado: e.value })}
            mode="currency"
            currency="COP"
            locale="es-CO"
            minFractionDigits={0} // Sin decimales
            maxFractionDigits={0} // Sin decimales
            placeholder="Monto del pago"
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ marginBottom: "12px" }}>
          <label
            htmlFor="metodo_pago"
            style={{ display: "block", marginBottom: "6px" }}
          >
            Método de Pago:
          </label>
          <div>
            <RadioButton
              inputId="efectivo"
              name="metodo_pago"
              value="efectivo"
              checked={pago.metodo_pago === "efectivo"}
              onChange={(e) => setPago({ ...pago, metodo_pago: e.value })}
            />
            <label htmlFor="efectivo" style={{ marginLeft: "8px" }}>
              Efectivo
            </label>
          </div>
          <div>
            <RadioButton
              inputId="transferencia"
              name="metodo_pago"
              value="transferencia"
              checked={pago.metodo_pago === "transferencia"}
              onChange={(e) => setPago({ ...pago, metodo_pago: e.value })}
            />
            <label htmlFor="transferencia" style={{ marginLeft: "8px" }}>
              Transferencia
            </label>
          </div>
          <div>
            <RadioButton
              inputId="tarjeta"
              name="metodo_pago"
              value="tarjeta"
              checked={pago.metodo_pago === "tarjeta"}
              onChange={(e) => setPago({ ...pago, metodo_pago: e.value })}
            />
            <label htmlFor="tarjeta" style={{ marginLeft: "8px" }}>
              Tarjeta
            </label>
          </div>
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
          field="monto_pagado"
          header="Monto"
          body={(rowData) => {
            const formattedValue = new Intl.NumberFormat("es-CO", {
              style: "currency",
              currency: "COP",
            }).format(rowData.monto_pagado);
            return <span>{formattedValue}</span>;
          }}
        />
        <Column field="metodo_pago" header="Método de Pago" />
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
      <Toast ref={toast} />
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
    </div>
  );
};

export default Pagos;
