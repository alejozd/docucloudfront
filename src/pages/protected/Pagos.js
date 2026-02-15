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
import { RadioButton } from "primereact/radiobutton";
import { InputText } from "primereact/inputtext";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { Card } from "primereact/card";

const INITIAL_PAGO = {
  id: null,
  venta_id: "",
  fecha_pago: new Date(),
  monto_pagado: null,
  metodo_pago: "transferencia",
};

const METODOS_PAGO = ["efectivo", "transferencia", "tarjeta"];

const formatCurrency = (value) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const Pagos = ({ jwtToken }) => {
  const [pagos, setPagos] = useState([]);
  const [pago, setPago] = useState(INITIAL_PAGO);
  const [showDialog, setShowDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ventas, setVentas] = useState([]);
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

  const fetchPagos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${Config.apiUrl}/api/pagos`, authHeaders);
      setPagos(response.data);
    } catch (err) {
      console.error(err);
      setError("Error al cargar los pagos.");
      notify("error", "Error al cargar los pagos");
    } finally {
      setLoading(false);
    }
  }, [authHeaders, notify]);

  const fetchVentas = useCallback(async () => {
    try {
      const response = await axios.get(`${Config.apiUrl}/api/ventas`, authHeaders);
      setVentas(response.data);
    } catch (err) {
      console.error("Error al cargar las ventas:", err.message);
      notify("error", "Error al cargar las ventas");
    }
  }, [authHeaders, notify]);

  useEffect(() => {
    fetchPagos();
    fetchVentas();
  }, [fetchPagos, fetchVentas]);

  const normalizePagoForForm = (pagoData = INITIAL_PAGO) => ({
    id: pagoData.id ?? null,
    venta_id: pagoData.venta_id ?? pagoData.venta?.id ?? "",
    fecha_pago: pagoData.fecha_pago ? new Date(pagoData.fecha_pago) : new Date(),
    monto_pagado: pagoData.monto_pagado ?? null,
    metodo_pago: pagoData.metodo_pago ?? "transferencia",
  });

  const openDialog = (pagoSeleccionado = null) => {
    if (pagoSeleccionado) {
      setPago(normalizePagoForForm(pagoSeleccionado));
      setIsEditMode(true);
    } else {
      setPago(INITIAL_PAGO);
      setIsEditMode(false);
    }
    setError(null);
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setPago(INITIAL_PAGO);
  };

  const toDateOnlyISO = (dateValue) => {
    if (!dateValue) return null;
    const date = new Date(dateValue);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .split("T")[0];
  };

  const savePago = async () => {
    if (!pago.venta_id || !pago.fecha_pago || pago.monto_pagado === null || !pago.metodo_pago) {
      setError("Por favor ingresa todos los campos obligatorios.");
      notify("warn", "Completa los campos obligatorios");
      return;
    }

    setLoading(true);
    setError(null);

    const pagoParaEnviar = {
      ...pago,
      fecha_pago: toDateOnlyISO(pago.fecha_pago),
    };

    try {
      if (isEditMode) {
        await axios.put(`${Config.apiUrl}/api/pagos/${pago.id}`, pagoParaEnviar, authHeaders);
        notify("success", "Pago actualizado exitosamente");
      } else {
        await axios.post(`${Config.apiUrl}/api/pagos`, pagoParaEnviar, authHeaders);
        notify("success", "Pago creado exitosamente");
      }
      closeDialog();
      fetchPagos();
    } catch (err) {
      console.error(err);
      setError("Error al guardar el pago.");
      notify("error", "Error al guardar el pago");
    } finally {
      setLoading(false);
    }
  };

  const deletePago = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este pago?")) {
      setLoading(true);
      setError(null);
      try {
        await axios.delete(`${Config.apiUrl}/api/pagos/${id}`, authHeaders);
        notify("success", "Pago eliminado exitosamente");
        fetchPagos();
      } catch (err) {
        console.error(err);
        setError("Error al eliminar el pago.");
        notify("error", "Error al eliminar el pago");
      } finally {
        setLoading(false);
      }
    }
  };

  const ventaOptionTemplate = (option) => {
    if (!option) return null;
    return (
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", width: "100%" }}>
        <strong>#{option.id}</strong>
        <span>{new Date(option.fecha_venta).toLocaleDateString("es-CO")}</span>
        <span>{formatCurrency(option.valor_total)}</span>
      </div>
    );
  };

  const kpis = useMemo(
    () => [
      { label: "Total pagos", value: pagos.length },
      { label: "Monto recaudado", value: formatCurrency(pagos.reduce((acc, item) => acc + Number(item.monto_pagado || 0), 0)) },
      { label: "Transferencias", value: pagos.filter((item) => item.metodo_pago === "transferencia").length },
    ],
    [pagos]
  );

  const tableHeader = (
    <div className="clientes-table-header">
      <IconField iconPosition="left">
        <InputIcon className="pi pi-search" />
        <InputText
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
          placeholder="Buscar por venta, cliente, vendedor o método"
        />
      </IconField>
      <span>{pagos.length} registros</span>
    </div>
  );

  return (
    <div className="clientes-page">
      <Toast ref={toast} />

      <div className="clientes-header">
        <h2>Pagos</h2>
        <div className="clientes-actions">
          <Button label="Agregar" icon="pi pi-plus" onClick={() => openDialog()} />
          <Button
            label="Actualizar"
            icon="pi pi-refresh"
            severity="secondary"
            onClick={fetchPagos}
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
          value={pagos}
          loading={loading}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 20]}
          emptyMessage="No se encontraron pagos."
          stripedRows
          dataKey="id"
          globalFilter={globalFilter}
          header={tableHeader}
          globalFilterFields={[
            "venta.id",
            "venta.cliente_medio.nombre_completo",
            "venta.vendedor.nombre",
            "metodo_pago",
          ]}
        >
          <Column field="id" header="ID" hidden />
          <Column field="venta.id" header="Venta" body={(rowData) => rowData.venta?.id || "Sin venta"} sortable />
          <Column
            field="fecha_pago"
            header="Fecha de Pago"
            body={(rowData) => new Date(rowData.fecha_pago).toLocaleDateString("es-CO")}
            sortable
          />
          <Column
            field="monto_pagado"
            header="Monto"
            body={(rowData) => formatCurrency(rowData.monto_pagado)}
            sortable
          />
          <Column field="metodo_pago" header="Método de Pago" sortable />
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
                  onClick={() => deletePago(rowData.id)}
                />
              </div>
            )}
          />
        </DataTable>
      </Card>

      <Dialog
        visible={showDialog}
        header={isEditMode ? "Editar Pago" : "Nuevo Pago"}
        onHide={closeDialog}
        style={{ width: "460px" }}
        modal
      >
        <div className="p-fluid">
          <div className="p-field" style={{ marginBottom: "12px" }}>
            <label htmlFor="venta_id">Venta *</label>
            <Dropdown
              id="venta_id"
              value={pago.venta_id}
              options={ventas}
              onChange={(e) => setPago({ ...pago, venta_id: e.value })}
              optionLabel="id"
              optionValue="id"
              optionTemplate={ventaOptionTemplate}
              valueTemplate={(selectedOption) => {
                if (!selectedOption) return "Selecciona una venta";
                return ventaOptionTemplate(selectedOption);
              }}
              placeholder="Selecciona una venta"
              filter
            />
          </div>

          <div className="p-field" style={{ marginBottom: "12px" }}>
            <label htmlFor="fecha_pago">Fecha de Pago *</label>
            <Calendar
              id="fecha_pago"
              value={pago.fecha_pago}
              onChange={(e) => setPago({ ...pago, fecha_pago: e.value })}
              dateFormat="dd/mm/yy"
              showIcon
            />
          </div>

          <div className="p-field" style={{ marginBottom: "12px" }}>
            <label htmlFor="monto_pagado">Monto *</label>
            <InputNumber
              id="monto_pagado"
              value={pago.monto_pagado}
              onValueChange={(e) => setPago({ ...pago, monto_pagado: e.value })}
              mode="currency"
              currency="COP"
              locale="es-CO"
              minFractionDigits={0}
              maxFractionDigits={0}
              placeholder="Monto del pago"
            />
          </div>

          <div className="p-field" style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", marginBottom: "8px" }}>Método de Pago *</label>
            {METODOS_PAGO.map((metodo) => (
              <div key={metodo} style={{ marginBottom: "8px" }}>
                <RadioButton
                  inputId={metodo}
                  name="metodo_pago"
                  value={metodo}
                  checked={pago.metodo_pago === metodo}
                  onChange={(e) => setPago({ ...pago, metodo_pago: e.value })}
                />
                <label htmlFor={metodo} style={{ marginLeft: "8px", textTransform: "capitalize" }}>
                  {metodo}
                </label>
              </div>
            ))}
          </div>

          <Button
            label={loading ? "Guardando..." : "Guardar"}
            icon={loading ? "pi pi-spin pi-spinner" : "pi pi-save"}
            onClick={savePago}
            disabled={loading}
            className="p-button-raised p-button-primary"
          />
          {error && <p style={{ color: "red", marginTop: "12px" }}>{error}</p>}
        </div>
      </Dialog>
    </div>
  );
};

export default Pagos;
