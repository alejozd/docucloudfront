// Ventas.js
import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import { InputText } from "primereact/inputtext";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { Card } from "primereact/card";
import { convertToLocalDate, formatDate } from "./../../utils/dateUtils";

const INITIAL_VENTA = {
  id: null,
  vendedor_id: "",
  cliente_medio_id: "",
  fecha_venta: new Date(),
  valor_total: null,
  estado_pago: "pendiente",
  estado_instalacion: "pendiente",
};

const OPCIONES_ESTADO_PAGO = [
  { label: "Pendiente", value: "pendiente" },
  { label: "Parcial", value: "parcial" },
  { label: "Completo", value: "completo" },
];

const OPCIONES_ESTADO_INSTALACION = [
  { label: "Pendiente", value: "pendiente" },
  { label: "Instalado", value: "instalado" },
];

const Ventas = ({ jwtToken }) => {
  const [ventas, setVentas] = useState([]);
  const [venta, setVenta] = useState(INITIAL_VENTA);
  const [showDialog, setShowDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clientesMedios, setClientesMedios] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const toast = React.useRef(null);

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${jwtToken}` } }),
    [jwtToken]
  );

  const notify = useCallback((severity, detail) => {
    const summary =
      severity === "success"
        ? "Éxito"
        : severity === "warn"
          ? "Advertencia"
          : "Error";

    toast.current?.show({
      severity,
      summary,
      detail,
      life: 3000,
    });
  }, []);

  const fetchVentas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${Config.apiUrl}/api/ventas`, authHeaders);
      setVentas(response.data);
    } catch (err) {
      console.error(err);
      setError("Error al cargar las ventas.");
      notify("error", "Error al cargar las ventas");
    } finally {
      setLoading(false);
    }
  }, [authHeaders, notify]);

  const fetchClientesMedios = useCallback(async () => {
    try {
      const response = await axios.get(`${Config.apiUrl}/api/clientes-medios`, authHeaders);
      setClientesMedios(response.data);
    } catch (err) {
      console.error("Error al cargar los clientes medios:", err.message);
      notify("error", "Error al cargar los clientes medios");
    }
  }, [authHeaders, notify]);

  const fetchVendedores = useCallback(async () => {
    try {
      const response = await axios.get(`${Config.apiUrl}/api/vendedores`, authHeaders);
      setVendedores(response.data);
    } catch (err) {
      console.error("Error al cargar los vendedores:", err.message);
      notify("error", "Error al cargar los vendedores");
    }
  }, [authHeaders, notify]);

  useEffect(() => {
    fetchVentas();
    fetchClientesMedios();
    fetchVendedores();
  }, [fetchVentas, fetchClientesMedios, fetchVendedores]);

  const openDialog = (ventaSeleccionada = null) => {
    if (ventaSeleccionada) {
      setVenta({
        ...INITIAL_VENTA,
        ...ventaSeleccionada,
        fecha_venta: convertToLocalDate(ventaSeleccionada.fecha_venta),
      });
      setIsEditMode(true);
    } else {
      setVenta(INITIAL_VENTA);
      setIsEditMode(false);
    }
    setError(null);
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setVenta(INITIAL_VENTA);
  };

  const toDateOnlyISO = (dateValue) => {
    if (!dateValue) return null;
    const date = new Date(dateValue);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .split("T")[0];
  };

  const saveVenta = async () => {
    if (
      !venta.vendedor_id ||
      !venta.cliente_medio_id ||
      !venta.fecha_venta ||
      venta.valor_total === null ||
      venta.valor_total === undefined ||
      !venta.estado_pago ||
      !venta.estado_instalacion
    ) {
      setError("Por favor ingresa todos los campos obligatorios.");
      notify("warn", "Completa los campos obligatorios");
      return;
    }

    setLoading(true);
    setError(null);

    const ventaParaEnviar = {
      ...venta,
      fecha_venta: toDateOnlyISO(venta.fecha_venta),
    };

    try {
      if (isEditMode) {
        await axios.put(`${Config.apiUrl}/api/ventas/${venta.id}`, ventaParaEnviar, authHeaders);
        notify("success", "Venta actualizada exitosamente");
      } else {
        await axios.post(`${Config.apiUrl}/api/ventas`, ventaParaEnviar, authHeaders);
        notify("success", "Venta creada exitosamente");
      }

      closeDialog();
      fetchVentas();
    } catch (err) {
      console.error(err);
      setError("Error al guardar la venta.");
      notify("error", "Error al guardar la venta");
    } finally {
      setLoading(false);
    }
  };

  const deleteVenta = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar esta venta?")) {
      setLoading(true);
      setError(null);
      try {
        await axios.delete(`${Config.apiUrl}/api/ventas/${id}`, authHeaders);
        notify("success", "Venta eliminada exitosamente");
        fetchVentas();
      } catch (err) {
        console.error(err);
        setError("Error al eliminar la venta.");
        notify("error", "Error al eliminar la venta");
      } finally {
        setLoading(false);
      }
    }
  };

  const kpis = useMemo(
    () => [
      { label: "Total", value: ventas.length },
      {
        label: "Valor total",
        value: new Intl.NumberFormat("es-CO", {
          style: "currency",
          currency: "COP",
          maximumFractionDigits: 0,
        }).format(ventas.reduce((acc, item) => acc + Number(item.valor_total || 0), 0)),
      },
      {
        label: "Pagos completos",
        value: ventas.filter((item) => item.estado_pago === "completo").length,
      },
    ],
    [ventas]
  );

  const tableHeader = (
    <div className="clientes-table-header">
      <IconField iconPosition="left">
        <InputIcon className="pi pi-search" />
        <InputText
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Buscar por cliente, vendedor o estado"
        />
      </IconField>
      <span>{ventas.length} registros</span>
    </div>
  );

  return (
    <div className="clientes-page">
      <Toast ref={toast} />

      <div className="clientes-header">
        <h2>Ventas</h2>
        <div className="clientes-actions">
          <Button label="Agregar" icon="pi pi-plus" onClick={() => openDialog()} />
          <Button
            label="Actualizar"
            icon="pi pi-refresh"
            severity="secondary"
            onClick={fetchVentas}
            loading={loading}
          />
        </div>
      </div>

      <div className="clientes-kpis">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="clientes-kpi">
            <p className="clientes-kpi-label">{kpi.label}</p>
            <p className="clientes-kpi-value">{kpi.value}</p>
          </Card>
        ))}
      </div>

      {error && <p style={{ color: "red", marginTop: "12px" }}>{error}</p>}

      <Card className="clientes-table-card">
        <DataTable
          value={ventas}
          loading={loading}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 20]}
          emptyMessage="No se encontraron ventas."
          stripedRows
          dataKey="id"
          globalFilter={globalFilter}
          globalFilterFields={[
            "cliente_medio.nombre_completo",
            "vendedor.nombre",
            "estado_pago",
            "estado_instalacion",
          ]}
          header={tableHeader}
        >
          <Column field="id" header="ID" hidden />
          <Column
            field="fecha_venta"
            header="Fecha de Venta"
            body={(rowData) => formatDate(convertToLocalDate(rowData.fecha_venta))}
            sortable
          />
          <Column
            field="valor_total"
            header="Valor Total"
            body={(rowData) =>
              new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(
                rowData.valor_total || 0
              )
            }
            sortable
          />
          <Column
            field="cliente_medio.nombre_completo"
            header="Cliente Medio"
            body={(rowData) => rowData.cliente_medio?.nombre_completo || "Sin cliente"}
            sortable
          />
          <Column
            field="vendedor.nombre"
            header="Vendedor"
            body={(rowData) => rowData.vendedor?.nombre || "Sin vendedor"}
            sortable
          />
          <Column
            field="estado_pago"
            header="Estado Pago"
            body={(rowData) => (
              <span
                style={{
                  color:
                    rowData.estado_pago === "completo"
                      ? "#28a745"
                      : rowData.estado_pago === "parcial"
                        ? "#f59e0b"
                        : "#dc3545",
                  fontWeight: "bold",
                }}
              >
                {rowData.estado_pago}
              </span>
            )}
            sortable
          />
          <Column
            field="estado_instalacion"
            header="Estado Instalación"
            body={(rowData) => (
              <span
                style={{
                  color: rowData.estado_instalacion === "instalado" ? "#28a745" : "#dc3545",
                  fontWeight: "bold",
                }}
              >
                {rowData.estado_instalacion}
              </span>
            )}
            sortable
          />
          <Column
            header="Acciones"
            body={(rowData) => (
              <div style={{ display: "flex", gap: "8px" }}>
                <Button icon="pi pi-pencil" rounded text severity="info" onClick={() => openDialog(rowData)} />
                <Button
                  icon="pi pi-trash"
                  rounded
                  text
                  severity="danger"
                  onClick={() => deleteVenta(rowData.id)}
                />
              </div>
            )}
          />
        </DataTable>
      </Card>

      <Dialog
        visible={showDialog}
        header={isEditMode ? "Editar Venta" : "Nueva Venta"}
        onHide={closeDialog}
        style={{ width: "430px" }}
        modal
      >
        <div className="p-fluid">
          <div className="p-field" style={{ marginBottom: "12px" }}>
            <label htmlFor="fecha_venta">Fecha de Venta *</label>
            <Calendar
              id="fecha_venta"
              value={venta.fecha_venta}
              onChange={(e) => setVenta({ ...venta, fecha_venta: e.value })}
              dateFormat="dd/mm/yy"
              showIcon
            />
          </div>

          <div className="p-field" style={{ marginBottom: "12px" }}>
            <label htmlFor="valor_total">Valor Total *</label>
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
            />
          </div>

          <div className="p-field" style={{ marginBottom: "12px" }}>
            <label htmlFor="cliente_medio_id">Cliente Medio *</label>
            <Dropdown
              id="cliente_medio_id"
              value={venta.cliente_medio_id}
              options={clientesMedios}
              onChange={(e) => setVenta({ ...venta, cliente_medio_id: e.value })}
              optionLabel="nombre_completo"
              optionValue="id"
              placeholder="Selecciona un cliente medio"
              filter
            />
          </div>

          <div className="p-field" style={{ marginBottom: "12px" }}>
            <label htmlFor="vendedor_id">Vendedor *</label>
            <Dropdown
              id="vendedor_id"
              value={venta.vendedor_id}
              options={vendedores}
              onChange={(e) => setVenta({ ...venta, vendedor_id: e.value })}
              optionLabel="nombre"
              optionValue="id"
              placeholder="Selecciona un vendedor"
              filter
            />
          </div>

          <div className="p-field" style={{ marginBottom: "12px" }}>
            <label htmlFor="estado_pago">Estado de Pago *</label>
            <Dropdown
              id="estado_pago"
              value={venta.estado_pago}
              options={OPCIONES_ESTADO_PAGO}
              onChange={(e) => setVenta({ ...venta, estado_pago: e.value })}
            />
          </div>

          <div className="p-field" style={{ marginBottom: "12px" }}>
            <label htmlFor="estado_instalacion">Estado de Instalación *</label>
            <Dropdown
              id="estado_instalacion"
              value={venta.estado_instalacion}
              options={OPCIONES_ESTADO_INSTALACION}
              onChange={(e) => setVenta({ ...venta, estado_instalacion: e.value })}
            />
          </div>

          <Button
            label={loading ? "Guardando..." : "Guardar"}
            icon={loading ? "pi pi-spin pi-spinner" : "pi pi-save"}
            onClick={saveVenta}
            disabled={loading}
            className="p-button-raised p-button-primary"
          />
          {error && <p style={{ color: "red", marginTop: "12px" }}>{error}</p>}
        </div>
      </Dialog>
    </div>
  );
};

export default Ventas;
