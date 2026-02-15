// SerialesERP.js
import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import Config from "../../components/features/Config";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputSwitch } from "primereact/inputswitch";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";

const INITIAL_SERIAL = {
  id: null,
  serial_erp: "",
  ano_medios: "",
  cliente_id: "",
  activo: true,
};

const SerialesERP = ({ jwtToken }) => {
  const [seriales, setSeriales] = useState([]);
  const [serial, setSerial] = useState(INITIAL_SERIAL);
  const [showDialog, setShowDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const toast = React.useRef(null);

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${jwtToken}` } }),
    [jwtToken]
  );

  const notify = useCallback((severity, detail) => {
    toast.current?.show({
      severity,
      summary: severity === "success" ? "Éxito" : "Error",
      detail,
      life: 3000,
    });
  }, []);

  const normalizeSerial = useCallback(
    (serialData = INITIAL_SERIAL) => ({
      id: serialData.id ?? null,
      serial_erp: serialData.serial_erp ?? "",
      ano_medios: serialData.ano_medios ?? "",
      cliente_id: serialData.cliente_id ?? "",
      activo: serialData.activo ?? true,
    }),
    []
  );

  const fetchSeriales = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${Config.apiUrl}/api/seriales-erp`, authHeaders);
      setSeriales(response.data);
    } catch (err) {
      console.error(err);
      setError("Error al cargar los seriales ERP.");
      notify("error", "Error al cargar los seriales ERP");
    } finally {
      setLoading(false);
    }
  }, [authHeaders, notify]);

  const fetchClientes = useCallback(async () => {
    try {
      const response = await axios.get(`${Config.apiUrl}/api/clientes-medios`, authHeaders);
      setClientes(response.data);
    } catch (err) {
      console.error("Error al cargar los clientes:", err.message);
      notify("error", "Error al cargar los clientes");
    }
  }, [authHeaders, notify]);

  useEffect(() => {
    fetchSeriales();
    fetchClientes();
  }, [fetchSeriales, fetchClientes]);

  const openDialog = (serialSeleccionado = null) => {
    if (serialSeleccionado) {
      setSerial(normalizeSerial(serialSeleccionado));
      setIsEditMode(true);
    } else {
      setSerial(INITIAL_SERIAL);
      setIsEditMode(false);
    }
    setError(null);
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setSerial(INITIAL_SERIAL);
  };

  const saveSerial = async () => {
    if (!serial.serial_erp.trim() || !serial.ano_medios.trim() || !serial.cliente_id) {
      setError("Por favor ingresa todos los campos.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isEditMode) {
        await axios.put(`${Config.apiUrl}/api/seriales-erp/${serial.id}`, serial, authHeaders);
        notify("success", "Serial ERP actualizado exitosamente");
      } else {
        await axios.post(`${Config.apiUrl}/api/seriales-erp`, serial, authHeaders);
        notify("success", "Serial ERP creado exitosamente");
      }

      closeDialog();
      fetchSeriales();
    } catch (err) {
      console.error(err);
      setError("Error al guardar el serial ERP.");
      notify("error", "Error al guardar el serial ERP");
    } finally {
      setLoading(false);
    }
  };

  const deleteSerial = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este serial ERP?")) {
      setLoading(true);
      setError(null);

      try {
        await axios.delete(`${Config.apiUrl}/api/seriales-erp/${id}`, authHeaders);
        notify("success", "Serial ERP eliminado exitosamente");
        fetchSeriales();
      } catch (err) {
        console.error(err);
        setError("Error al eliminar el serial ERP.");
        notify("error", "Error al eliminar el serial ERP");
      } finally {
        setLoading(false);
      }
    }
  };

  const kpis = useMemo(
    () => [
      { label: "Total", value: seriales.length },
      { label: "Activos", value: seriales.filter((row) => row.activo).length },
      { label: "Clientes vinculados", value: seriales.filter((row) => !!row.cliente).length },
    ],
    [seriales]
  );

  const tableHeader = (
    <div className="clientes-table-header">
      <IconField iconPosition="left">
        <InputIcon className="pi pi-search" />
        <InputText
          value={globalFilterValue}
          onChange={(e) => setGlobalFilterValue(e.target.value)}
          placeholder="Buscar serial o cliente"
        />
      </IconField>
      <span>{seriales.length} registros</span>
    </div>
  );

  const actionsTemplate = (rowData) => (
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
        onClick={() => deleteSerial(rowData.id)}
        size="small"
      />
    </div>
  );

  return (
    <div className="clientes-page">
      <Toast ref={toast} />

      <div className="clientes-header">
        <h2>Seriales ERP</h2>
        <div className="clientes-actions">
          <Button label="Agregar" icon="pi pi-plus" onClick={() => openDialog()} />
          <Button
            label="Actualizar"
            icon="pi pi-refresh"
            severity="secondary"
            onClick={fetchSeriales}
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
          value={seriales}
          loading={loading}
          paginator
          rows={10}
          dataKey="id"
          rowsPerPageOptions={[5, 10, 20]}
          emptyMessage="No se encontraron seriales ERP."
          stripedRows
          header={tableHeader}
          globalFilter={globalFilterValue}
          globalFilterFields={["serial_erp", "ano_medios", "cliente.nombre_completo"]}
        >
          <Column field="id" header="ID" hidden />
          <Column field="serial_erp" header="Serial ERP" sortable />
          <Column field="ano_medios" header="Año" sortable />
          <Column
            field="nombre_completo"
            header="Cliente"
            body={(rowData) => <span>{rowData.cliente?.nombre_completo ?? "-"}</span>}
            sortable
          />
          <Column
            field="activo"
            header="Activo"
            body={(rowData) => (
              <span
                style={{
                  color: rowData.activo ? "#28a745" : "#dc3545",
                  fontWeight: "bold",
                }}
              >
                {rowData.activo ? "Sí" : "No"}
              </span>
            )}
            sortable
          />
          <Column header="Acciones" body={actionsTemplate} />
        </DataTable>
      </Card>

      <Dialog
        visible={showDialog}
        header={isEditMode ? "Editar Serial ERP" : "Nuevo Serial ERP"}
        onHide={closeDialog}
        style={{ width: "430px" }}
        modal
      >
        <div className="p-fluid">
          <div className="p-field" style={{ marginBottom: "12px" }}>
            <label htmlFor="serial_erp">Serial ERP *</label>
            <InputText
              id="serial_erp"
              value={serial.serial_erp}
              onChange={(e) => setSerial({ ...serial, serial_erp: e.target.value })}
              placeholder="Serial ERP"
            />
          </div>
          <div className="p-field" style={{ marginBottom: "12px" }}>
            <label htmlFor="ano_medios">Año Medios *</label>
            <InputText
              id="ano_medios"
              value={serial.ano_medios}
              onChange={(e) => setSerial({ ...serial, ano_medios: e.target.value })}
              placeholder="Año Medios"
            />
          </div>
          <div className="p-field" style={{ marginBottom: "12px" }}>
            <label htmlFor="cliente_id">Cliente *</label>
            <Dropdown
              id="cliente_id"
              value={serial.cliente_id}
              options={clientes}
              onChange={(e) => setSerial({ ...serial, cliente_id: e.value })}
              optionLabel="nombre_completo"
              optionValue="id"
              placeholder="Selecciona un cliente"
              filter
            />
          </div>
          <div className="p-field" style={{ marginBottom: "14px" }}>
            <label htmlFor="activo" style={{ marginRight: "10px" }}>
              Activo
            </label>
            <InputSwitch
              id="activo"
              checked={serial.activo}
              onChange={(e) => setSerial({ ...serial, activo: e.value })}
            />
          </div>
          <Button
            label={loading ? "Guardando..." : "Guardar"}
            icon={loading ? "pi pi-spin pi-spinner" : "pi pi-save"}
            onClick={saveSerial}
            disabled={loading}
            className="p-button-raised p-button-primary"
          />
          {error && <p style={{ color: "red", marginTop: "12px" }}>{error}</p>}
        </div>
      </Dialog>
    </div>
  );
};

export default SerialesERP;
