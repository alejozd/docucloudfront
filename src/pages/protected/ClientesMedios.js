import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import Config from "../../components/features/Config";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputSwitch } from "primereact/inputswitch";
import { Dropdown } from "primereact/dropdown";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";

const CLIENTES_MEDIOS_ENDPOINT = "/api/clientes-medios";
const VENDEDORES_ENDPOINT = "/api/vendedores";

const initialClienteState = {
  id: null,
  nombre_completo: "",
  email: "",
  telefono: "",
  empresa: "",
  direccion: "",
  activo: true,
  vendedor_id: null,
};

const getPayloadArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const getApiMessage = (error, fallbackMessage) => {
  return (
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    fallbackMessage
  );
};

const ClientesMedios = ({ jwtToken }) => {
  const [clientes, setClientes] = useState([]);
  const [cliente, setCliente] = useState(initialClienteState);
  const [vendedores, setVendedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const toast = useRef(null);

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${jwtToken}` } }),
    [jwtToken]
  );

  const requestClientes = useCallback(
    async (method, payload = null, id = null) => {
      const url = `${Config.apiUrl}${CLIENTES_MEDIOS_ENDPOINT}${id ? `/${id}` : ""}`;
      if (method === "get") return await axios.get(url, authHeaders);
      if (method === "post") return await axios.post(url, payload, authHeaders);
      if (method === "put") return await axios.put(url, payload, authHeaders);
      if (method === "delete") return await axios.delete(url, authHeaders);
      throw new Error(`Método no soportado: ${method}`);
    },
    [authHeaders]
  );

  const fetchClientes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await requestClientes("get");
      setClientes(getPayloadArray(response.data));
    } catch (error) {
      console.error("Error al cargar clientes:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: getApiMessage(error, "Error al cargar los clientes"),
        life: 4000,
      });
    } finally {
      setLoading(false);
    }
  }, [requestClientes]);

  const fetchVendedores = useCallback(async () => {
    try {
      const response = await axios.get(`${Config.apiUrl}${VENDEDORES_ENDPOINT}`, authHeaders);
      setVendedores(getPayloadArray(response.data));
    } catch (error) {
      console.error("Error al cargar vendedores:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: getApiMessage(error, "Error al cargar los vendedores"),
        life: 4000,
      });
    }
  }, [authHeaders]);

  useEffect(() => {
    if (!jwtToken) return;
    fetchClientes();
    fetchVendedores();
  }, [jwtToken, fetchClientes, fetchVendedores]);

  const openNew = () => {
    setSubmitted(false);
    setCliente(initialClienteState);
    setShowDialog(true);
  };

  const editCliente = (rowCliente) => {
    setSubmitted(false);
    setCliente({
      ...initialClienteState,
      ...rowCliente,
      vendedor_id: rowCliente?.vendedor_id ?? rowCliente?.vendedor?.id ?? null,
    });
    setShowDialog(true);
  };

  const hideDialog = () => {
    setShowDialog(false);
    setSubmitted(false);
    setCliente(initialClienteState);
  };

  const confirmDeleteCliente = (rowCliente) => {
    setCliente(rowCliente);
    setDeleteDialog(true);
  };

  const hideDeleteDialog = () => {
    setDeleteDialog(false);
  };

  const onInputChange = (event, name) => {
    const value = (event.target && event.target.value) || "";
    setCliente((prev) => ({ ...prev, [name]: value }));
  };

  const saveCliente = async () => {
    setSubmitted(true);

    if (!cliente.nombre_completo?.trim() || !cliente.email?.trim() || !cliente.telefono?.trim()) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Nombre, email y teléfono son obligatorios",
        life: 3500,
      });
      return;
    }

    try {
      setLoading(true);
      if (cliente.id) {
        await requestClientes("put", cliente, cliente.id);
        toast.current?.show({
          severity: "success",
          summary: "Realizado",
          detail: "Cliente actualizado",
          life: 3000,
        });
      } else {
        await requestClientes("post", cliente);
        toast.current?.show({
          severity: "success",
          summary: "Realizado",
          detail: "Cliente creado",
          life: 3000,
        });
      }

      hideDialog();
      fetchClientes();
    } catch (error) {
      console.error("Error guardando cliente:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: getApiMessage(error, "Error al guardar el cliente"),
        life: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteCliente = async () => {
    try {
      setLoading(true);
      await requestClientes("delete", null, cliente.id);
      setClientes((prev) => prev.filter((rowCliente) => rowCliente.id !== cliente.id));
      setDeleteDialog(false);
      setCliente(initialClienteState);
      toast.current?.show({
        severity: "success",
        summary: "Realizado",
        detail: "Cliente eliminado",
        life: 3000,
      });
    } catch (error) {
      console.error("Error eliminando cliente:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: getApiMessage(error, "Error al eliminar el cliente"),
        life: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  const header = (
    <div className="clientes-table-header">
      <IconField iconPosition="left">
        <InputIcon className="pi pi-search" />
        <InputText
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
          placeholder="Buscar cliente o vendedor"
        />
      </IconField>
      <span>{clientes.length} registros</span>
    </div>
  );

  const kpis = useMemo(
    () => [
      { label: "Total", value: clientes.length },
      { label: "Activos", value: clientes.filter((rowCliente) => !!rowCliente.activo).length },
      { label: "Con vendedor", value: clientes.filter((rowCliente) => !!rowCliente.vendedor).length },
    ],
    [clientes]
  );

  const activoTemplate = (rowData) => (
    <span style={{ color: rowData.activo ? "#28a745" : "#dc3545", fontWeight: "bold" }}>
      {rowData.activo ? "Sí" : "No"}
    </span>
  );

  const vendedorTemplate = (rowData) => rowData?.vendedor?.nombre || "Sin vendedor";

  const actionTemplate = (rowData) => (
    <div style={{ display: "flex", gap: "8px" }}>
      <Button icon="pi pi-pencil" rounded text severity="info" onClick={() => editCliente(rowData)} />
      <Button
        icon="pi pi-trash"
        rounded
        text
        severity="danger"
        onClick={() => confirmDeleteCliente(rowData)}
      />
    </div>
  );

  const deleteDialogFooter = (
    <>
      <Button label="No" icon="pi pi-times" text onClick={hideDeleteDialog} />
      <Button label="Sí" icon="pi pi-check" text onClick={deleteCliente} />
    </>
  );

  return (
    <div className="clientes-page">
      <Toast ref={toast} />

      <div className="clientes-header">
        <h2>Clientes Medios</h2>
        <div className="clientes-actions">
          <Button label="Agregar" icon="pi pi-plus" onClick={openNew} />
          <Button
            label="Actualizar"
            icon="pi pi-refresh"
            severity="secondary"
            onClick={fetchClientes}
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

      <Card className="clientes-table-card">
        <DataTable
          value={clientes}
          loading={loading}
          paginator
          rows={10}
          dataKey="id"
          rowsPerPageOptions={[5, 10, 20]}
          emptyMessage="No se encontraron clientes"
          stripedRows
          header={header}
          globalFilter={globalFilter}
          globalFilterFields={["nombre_completo", "email", "telefono", "empresa", "vendedor.nombre"]}
        >
          <Column field="id" header="ID" hidden />
          <Column field="nombre_completo" header="Nombre" sortable />
          <Column field="email" header="Email" sortable />
          <Column field="telefono" header="Teléfono" sortable />
          <Column field="vendedor.nombre" header="Vendedor" body={vendedorTemplate} sortable />
          <Column field="empresa" header="Empresa" sortable />
          <Column field="activo" header="Activo" body={activoTemplate} sortable />
          <Column body={actionTemplate} header="Acciones" />
        </DataTable>
      </Card>

      <Dialog
        visible={showDialog}
        header={cliente.id ? "Editar Cliente" : "Nuevo Cliente"}
        onHide={hideDialog}
        style={{ width: "450px" }}
        modal
      >
        <div className="p-fluid">
          <div className="p-field" style={{ marginBottom: "12px" }}>
            <label htmlFor="nombre_completo">Nombre completo *</label>
            <InputText
              id="nombre_completo"
              value={cliente.nombre_completo}
              onChange={(event) => onInputChange(event, "nombre_completo")}
              className={submitted && !cliente.nombre_completo ? "p-invalid" : ""}
            />
          </div>

          <div className="p-field" style={{ marginBottom: "12px" }}>
            <label htmlFor="email">Email *</label>
            <InputText
              id="email"
              value={cliente.email}
              onChange={(event) => onInputChange(event, "email")}
              className={submitted && !cliente.email ? "p-invalid" : ""}
            />
          </div>

          <div className="p-field" style={{ marginBottom: "12px" }}>
            <label htmlFor="telefono">Teléfono *</label>
            <InputText
              id="telefono"
              value={cliente.telefono}
              onChange={(event) => onInputChange(event, "telefono")}
              className={submitted && !cliente.telefono ? "p-invalid" : ""}
            />
          </div>

          <div className="p-field" style={{ marginBottom: "12px" }}>
            <label htmlFor="empresa">Empresa</label>
            <InputText
              id="empresa"
              value={cliente.empresa}
              onChange={(event) => onInputChange(event, "empresa")}
            />
          </div>

          <div className="p-field" style={{ marginBottom: "12px" }}>
            <label htmlFor="direccion">Dirección</label>
            <InputText
              id="direccion"
              value={cliente.direccion}
              onChange={(event) => onInputChange(event, "direccion")}
            />
          </div>

          <div className="p-field" style={{ marginBottom: "12px" }}>
            <label htmlFor="vendedor_id">Vendedor</label>
            <Dropdown
              id="vendedor_id"
              value={cliente.vendedor_id}
              options={vendedores}
              onChange={(event) => setCliente((prev) => ({ ...prev, vendedor_id: event.value }))}
              optionLabel="nombre"
              optionValue="id"
              placeholder="Selecciona un vendedor"
              showClear
            />
          </div>

          <div className="p-field" style={{ marginBottom: "12px" }}>
            <label htmlFor="activo">Activo</label>
            <div>
              <InputSwitch
                id="activo"
                checked={!!cliente.activo}
                onChange={(event) => setCliente((prev) => ({ ...prev, activo: event.value }))}
              />
            </div>
          </div>

          <Button label="Guardar" icon="pi pi-check" onClick={saveCliente} loading={loading} />
        </div>
      </Dialog>

      <Dialog
        visible={deleteDialog}
        header="Confirmar"
        style={{ width: "450px" }}
        modal
        onHide={hideDeleteDialog}
        footer={deleteDialogFooter}
      >
        <div className="confirmation-content">
          <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: "2rem" }} />
          {cliente && (
            <span>
              ¿Seguro que deseas eliminar a <b>{cliente.nombre_completo}</b>?
            </span>
          )}
        </div>
      </Dialog>
    </div>
  );
};

export default ClientesMedios;
