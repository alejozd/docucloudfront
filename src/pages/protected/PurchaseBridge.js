import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import Config from "../../components/features/Config";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import "../../styles/Clientes.css";

const LIST_ENDPOINTS = ["/api/licencias", "/api/licencias/listado", "/api/licencia/estado"];
const CREATE_ENDPOINT = "/api/licencias/crear";
const CONVERT_ENDPOINT = "/api/licencias/convertir";
const EDIT_ENDPOINTS = [
  (id) => ({ method: "put", url: `/api/licencias/${id}` }),
  (id) => ({ method: "put", url: `/api/licencias/editar/${id}` }),
  (id) => ({ method: "post", url: "/api/licencias/editar", payload: { idlicencia: id } }),
];

const INITIAL_FORM = {
  idlicencia: "",
  licencia: "",
  estado: "",
  tipo: "",
  cliente: "",
  fecha_vencimiento: "",
};

const getApiMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;

const toArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.licencias)) return payload.licencias;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const getId = (row) => row?.idlicencia ?? row?.id ?? row?.licencia_id ?? "";

const PurchaseBridge = ({ jwtToken }) => {
  const [licencias, setLicencias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [convertDialogVisible, setConvertDialogVisible] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [convertData, setConvertData] = useState({ idlicencia: "", tipoDestino: "" });
  const toast = useRef(null);

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${jwtToken}` } }),
    [jwtToken]
  );

  const notify = useCallback((severity, detail) => {
    toast.current?.show({
      severity,
      summary: severity === "success" ? "Éxito" : severity === "warn" ? "Advertencia" : "Error",
      detail,
      life: 3500,
    });
  }, []);

  const fetchLicencias = useCallback(async () => {
    setLoading(true);

    try {
      let loaded = [];
      let lastError = null;

      for (const endpoint of LIST_ENDPOINTS) {
        try {
          const response = await axios.get(`${Config.apiUrl}${endpoint}`, authHeaders);
          loaded = toArray(response.data);
          if (loaded.length || endpoint === LIST_ENDPOINTS[LIST_ENDPOINTS.length - 1]) {
            break;
          }
        } catch (error) {
          lastError = error;
        }
      }

      if (!loaded.length && lastError) {
        throw lastError;
      }

      setLicencias(loaded);
    } catch (error) {
      console.error("Error al consultar licencias:", error);
      notify("error", getApiMessage(error, "No fue posible cargar las licencias"));
    } finally {
      setLoading(false);
    }
  }, [authHeaders, notify]);

  useEffect(() => {
    if (!jwtToken) return;
    fetchLicencias();
  }, [jwtToken, fetchLicencias]);

  const resetDialogs = () => {
    setFormData(INITIAL_FORM);
    setConvertData({ idlicencia: "", tipoDestino: "" });
    setCreateDialogVisible(false);
    setEditDialogVisible(false);
    setConvertDialogVisible(false);
  };

  const handleCreate = async () => {
    if (!formData.licencia.trim()) {
      notify("warn", "Debes ingresar el valor de la licencia");
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${Config.apiUrl}${CREATE_ENDPOINT}`, formData, authHeaders);
      notify("success", "Licencia creada correctamente");
      resetDialogs();
      fetchLicencias();
    } catch (error) {
      console.error("Error al crear licencia:", error);
      notify("error", getApiMessage(error, "No fue posible crear la licencia"));
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = async () => {
    if (!convertData.idlicencia || !convertData.tipoDestino.trim()) {
      notify("warn", "Selecciona una licencia y el tipo destino");
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        `${Config.apiUrl}${CONVERT_ENDPOINT}`,
        {
          idlicencia: convertData.idlicencia,
          tipoDestino: convertData.tipoDestino,
        },
        authHeaders
      );
      notify("success", "Licencia convertida correctamente");
      resetDialogs();
      fetchLicencias();
    } catch (error) {
      console.error("Error al convertir licencia:", error);
      notify("error", getApiMessage(error, "No fue posible convertir la licencia"));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    const licenciaId = formData.idlicencia || formData.id;

    if (!licenciaId) {
      notify("warn", "No se pudo identificar la licencia a editar");
      return;
    }

    let updated = false;
    let lastError = null;

    try {
      setLoading(true);
      for (const endpointFactory of EDIT_ENDPOINTS) {
        const endpoint = endpointFactory(licenciaId);
        try {
          await axios({
            method: endpoint.method,
            url: `${Config.apiUrl}${endpoint.url}`,
            data: {
              ...formData,
              ...endpoint.payload,
            },
            ...authHeaders,
          });
          updated = true;
          break;
        } catch (error) {
          lastError = error;
        }
      }

      if (!updated && lastError) {
        throw lastError;
      }

      notify("success", "Licencia editada correctamente");
      resetDialogs();
      fetchLicencias();
    } catch (error) {
      console.error("Error al editar licencia:", error);
      notify("error", getApiMessage(error, "No fue posible editar la licencia"));
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setFormData(INITIAL_FORM);
    setCreateDialogVisible(true);
  };

  const openEdit = (row) => {
    setFormData({
      ...row,
      idlicencia: getId(row),
      licencia: row?.licencia ?? row?.codigo ?? "",
      estado: row?.estado ?? "",
      tipo: row?.tipo ?? "",
      cliente: row?.cliente ?? row?.cliente_nombre ?? "",
      fecha_vencimiento: row?.fecha_vencimiento ?? row?.fechaVencimiento ?? "",
    });
    setEditDialogVisible(true);
  };

  const openConvert = (row) => {
    setConvertData({
      idlicencia: getId(row),
      tipoDestino: row?.tipo ?? "",
    });
    setConvertDialogVisible(true);
  };

  const header = (
    <div className="clientes-table-header">
      <IconField iconPosition="left">
        <InputIcon className="pi pi-search" />
        <InputText
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
          placeholder="Buscar por licencia, cliente o estado"
        />
      </IconField>
      <span>{licencias.length} registros</span>
    </div>
  );

  const actionTemplate = (row) => (
    <div style={{ display: "flex", gap: 8 }}>
      <Button icon="pi pi-pencil" rounded text severity="info" onClick={() => openEdit(row)} />
      <Button
        icon="pi pi-sync"
        rounded
        text
        severity="warning"
        onClick={() => openConvert(row)}
      />
    </div>
  );

  return (
    <div className="clientes-page">
      <Toast ref={toast} />

      <div className="clientes-header">
        <h2>PurchaseBridge - Gestión de Licencias</h2>
        <div className="clientes-actions">
          <Button label="Crear Licencia" icon="pi pi-plus" onClick={openCreate} />
          <Button
            label="Actualizar"
            icon="pi pi-refresh"
            severity="secondary"
            onClick={fetchLicencias}
            loading={loading}
          />
        </div>
      </div>

      <Card className="clientes-table-card">
        <DataTable
          value={licencias}
          paginator
          rows={10}
          loading={loading}
          header={header}
          globalFilter={globalFilter}
          globalFilterFields={["idlicencia", "licencia", "estado", "tipo", "cliente", "cliente_nombre"]}
          emptyMessage="No se encontraron licencias"
          stripedRows
          showGridlines
          responsiveLayout="scroll"
        >
          <Column field="idlicencia" header="ID" body={(row) => getId(row) || "N/A"} sortable />
          <Column field="licencia" header="Licencia" body={(row) => row?.licencia ?? row?.codigo ?? "N/A"} />
          <Column field="estado" header="Estado" body={(row) => row?.estado ?? "N/A"} />
          <Column field="tipo" header="Tipo" body={(row) => row?.tipo ?? "N/A"} />
          <Column
            field="cliente"
            header="Cliente"
            body={(row) => row?.cliente ?? row?.cliente_nombre ?? "N/A"}
          />
          <Column
            field="fecha_vencimiento"
            header="Vencimiento"
            body={(row) => row?.fecha_vencimiento ?? row?.fechaVencimiento ?? "N/A"}
          />
          <Column header="Acciones" body={actionTemplate} />
        </DataTable>
      </Card>

      <Dialog
        visible={createDialogVisible}
        header="Crear Licencia"
        style={{ width: "100%", maxWidth: "640px" }}
        onHide={resetDialogs}
        modal
        className="p-fluid"
      >
        <div className="field">
          <label htmlFor="create_licencia">Licencia *</label>
          <InputText
            id="create_licencia"
            value={formData.licencia}
            onChange={(event) => setFormData({ ...formData, licencia: event.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="create_tipo">Tipo</label>
          <InputText
            id="create_tipo"
            value={formData.tipo}
            onChange={(event) => setFormData({ ...formData, tipo: event.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="create_estado">Estado</label>
          <InputText
            id="create_estado"
            value={formData.estado}
            onChange={(event) => setFormData({ ...formData, estado: event.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="create_cliente">Cliente</label>
          <InputText
            id="create_cliente"
            value={formData.cliente}
            onChange={(event) => setFormData({ ...formData, cliente: event.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="create_vencimiento">Fecha vencimiento</label>
          <InputText
            id="create_vencimiento"
            value={formData.fecha_vencimiento}
            onChange={(event) =>
              setFormData({ ...formData, fecha_vencimiento: event.target.value })
            }
            placeholder="YYYY-MM-DD"
          />
        </div>
        <div className="flex justify-content-end gap-2 mt-3">
          <Button label="Cancelar" severity="secondary" onClick={resetDialogs} text />
          <Button label="Crear" icon="pi pi-check" onClick={handleCreate} loading={loading} />
        </div>
      </Dialog>

      <Dialog
        visible={editDialogVisible}
        header="Editar Licencia"
        style={{ width: "100%", maxWidth: "640px" }}
        onHide={resetDialogs}
        modal
        className="p-fluid"
      >
        <div className="field">
          <label htmlFor="edit_licencia">Licencia</label>
          <InputText
            id="edit_licencia"
            value={formData.licencia || ""}
            onChange={(event) => setFormData({ ...formData, licencia: event.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="edit_tipo">Tipo</label>
          <InputText
            id="edit_tipo"
            value={formData.tipo || ""}
            onChange={(event) => setFormData({ ...formData, tipo: event.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="edit_estado">Estado</label>
          <InputText
            id="edit_estado"
            value={formData.estado || ""}
            onChange={(event) => setFormData({ ...formData, estado: event.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="edit_cliente">Cliente</label>
          <InputText
            id="edit_cliente"
            value={formData.cliente || ""}
            onChange={(event) => setFormData({ ...formData, cliente: event.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="edit_vencimiento">Fecha vencimiento</label>
          <InputText
            id="edit_vencimiento"
            value={formData.fecha_vencimiento || ""}
            onChange={(event) =>
              setFormData({ ...formData, fecha_vencimiento: event.target.value })
            }
            placeholder="YYYY-MM-DD"
          />
        </div>
        <div className="flex justify-content-end gap-2 mt-3">
          <Button label="Cancelar" severity="secondary" onClick={resetDialogs} text />
          <Button label="Guardar" icon="pi pi-save" onClick={handleEdit} loading={loading} />
        </div>
      </Dialog>

      <Dialog
        visible={convertDialogVisible}
        header="Convertir Licencia"
        style={{ width: "100%", maxWidth: "560px" }}
        onHide={resetDialogs}
        modal
        className="p-fluid"
      >
        <div className="field">
          <label htmlFor="convert_idlicencia">ID Licencia</label>
          <InputText
            id="convert_idlicencia"
            value={convertData.idlicencia}
            onChange={(event) =>
              setConvertData({ ...convertData, idlicencia: event.target.value })
            }
          />
        </div>
        <div className="field">
          <label htmlFor="convert_tipo">Tipo destino *</label>
          <InputText
            id="convert_tipo"
            value={convertData.tipoDestino}
            onChange={(event) =>
              setConvertData({ ...convertData, tipoDestino: event.target.value })
            }
          />
        </div>
        <div className="flex justify-content-end gap-2 mt-3">
          <Button label="Cancelar" severity="secondary" onClick={resetDialogs} text />
          <Button
            label="Convertir"
            icon="pi pi-sync"
            severity="warning"
            onClick={handleConvert}
            loading={loading}
          />
        </div>
      </Dialog>
    </div>
  );
};

export default PurchaseBridge;
