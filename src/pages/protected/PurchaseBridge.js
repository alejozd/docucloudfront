import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import Config from "../../components/features/Config";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { Message } from "primereact/message";
import { Toast } from "primereact/toast";
import "../../styles/Clientes.css";

const ENDPOINTS = {
  listado: "/api/licencias/listado",
  editar: "/api/licencias/editar",
  crear: "/api/licencias/crear",
  activar: "/api/licencias/activar",
  activarOnline: "/api/licencias/activar-online",
  convertir: "/api/licencias/convertir",
  generarCodigo: "/api/licencias/generar-codigo",
};

const TIPOS_LICENCIA = [
  { label: "Demo", value: "demo" },
  { label: "Anual", value: "anual" },
  { label: "Permanente", value: "permanente" },
];

const APP_OPTIONS = [
  { label: "PurchaseBridge", value: "purchasebridge" },
  { label: "DocuCloud", value: "docucloud" },
];

const INITIAL_CREATE = {
  nit: "",
  app: "purchasebridge",
  dias_demo: 15,
};

const INITIAL_EDIT = {
  id: "",
  nit: "",
  estado: "",
  tipo_licencia: "demo",
  fecha_activacion: "",
  fecha_expiracion: "",
  dias_demo: 15,
  instalacion_hash: "",
};

const INITIAL_ACTIVATE = {
  nit: "",
  app: "purchasebridge",
  instalacion_hash: "",
  tipo_licencia: "demo",
  dias_demo: 15,
  dias_licencia: null,
  online: false,
};

const INITIAL_CONVERT = {
  nit: "",
  tipo_licencia: "anual",
  dias_licencia: 365,
  instalacion_hash: "",
};

const INITIAL_CODE = {
  nit: "",
  app: "purchasebridge",
  instalacion_hash: "",
  dias: 30,
};

const getMessage = (error, fallback) =>
  error?.response?.data?.mensaje ||
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("es-CO");
};

const normalizeLicencias = (payload) => {
  const rows = Array.isArray(payload?.licencias) ? payload.licencias : [];
  return rows.map((item) => ({
    id: item.id ?? item.idlicencia ?? "",
    nit: item.nit ?? "",
    estado: item.estado ?? "N/A",
    tipo_licencia: item.tipo_licencia ?? "N/A",
    fecha_activacion_raw: item.fecha_activacion ?? "",
    fecha_expiracion_raw: item.fecha_expiracion ?? "",
    fecha_activacion: formatDate(item.fecha_activacion),
    fecha_expiracion: formatDate(item.fecha_expiracion),
    dias_demo: item.dias_demo ?? 0,
    instalacion_hash: item.instalacion_hash ?? "",
    app: item.app ?? "purchasebridge",
  }));
};

const PurchaseBridge = ({ jwtToken }) => {
  const [licencias, setLicencias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [activateDialog, setActivateDialog] = useState(false);
  const [convertDialog, setConvertDialog] = useState(false);
  const [codeDialog, setCodeDialog] = useState(false);

  const [createForm, setCreateForm] = useState(INITIAL_CREATE);
  const [editForm, setEditForm] = useState(INITIAL_EDIT);
  const [activateForm, setActivateForm] = useState(INITIAL_ACTIVATE);
  const [convertForm, setConvertForm] = useState(INITIAL_CONVERT);
  const [codeForm, setCodeForm] = useState(INITIAL_CODE);

  const [submitting, setSubmitting] = useState(false);
  const toastRef = useRef(null);

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${jwtToken}` } }),
    [jwtToken]
  );

  const notify = useCallback((severity, detail) => {
    toastRef.current?.show({
      severity,
      summary: severity === "success" ? "Éxito" : severity === "warn" ? "Validación" : "Error",
      detail,
      life: 3500,
    });
  }, []);

  const fetchLicencias = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(`${Config.apiUrl}${ENDPOINTS.listado}`, authHeaders);
      setLicencias(normalizeLicencias(response.data));
    } catch (requestError) {
      const detail = getMessage(requestError, "No se pudo cargar el listado de licencias");
      setError(detail);
      notify("error", detail);
    } finally {
      setLoading(false);
    }
  }, [authHeaders, notify]);

  useEffect(() => {
    if (!jwtToken) return;
    fetchLicencias();
  }, [jwtToken, fetchLicencias]);

  const validateCreate = () => {
    if (!createForm.nit.trim()) return "El NIT es obligatorio";
    if (!createForm.app) return "La aplicación es obligatoria";
    if (!createForm.dias_demo || createForm.dias_demo <= 0) return "días demo debe ser mayor que 0";
    return "";
  };

  const validateEdit = () => {
    if (!editForm.id) return "No se pudo identificar la licencia";
    if (!editForm.nit.trim()) return "El NIT es obligatorio";
    if (!editForm.tipo_licencia) return "El tipo de licencia es obligatorio";
    return "";
  };

  const validateActivate = () => {
    if (!activateForm.nit.trim()) return "El NIT es obligatorio";
    if (!activateForm.instalacion_hash.trim()) return "El hash de instalación es obligatorio";
    if (activateForm.online && !activateForm.tipo_licencia) return "El tipo de licencia es obligatorio";
    return "";
  };

  const validateConvert = () => {
    if (!convertForm.nit.trim()) return "El NIT es obligatorio";
    if (!convertForm.tipo_licencia) return "Selecciona tipo de licencia";
    if (convertForm.tipo_licencia === "anual" && (!convertForm.dias_licencia || convertForm.dias_licencia <= 0)) {
      return "Para anual, días licencia debe ser mayor que 0";
    }
    return "";
  };

  const validateCode = () => {
    if (!codeForm.nit.trim()) return "El NIT es obligatorio";
    if (!codeForm.app) return "La aplicación es obligatoria";
    if (!codeForm.instalacion_hash.trim()) return "El hash de instalación es obligatorio";
    if (!codeForm.dias || codeForm.dias <= 0) return "Días debe ser mayor que 0";
    return "";
  };

  const runAction = async (action, onSuccess) => {
    setSubmitting(true);
    try {
      await action();
      notify("success", onSuccess);
      await fetchLicencias();
    } catch (requestError) {
      notify("error", getMessage(requestError, "La operación falló"));
    } finally {
      setSubmitting(false);
    }
  };

  const submitCreate = async () => {
    const validation = validateCreate();
    if (validation) {
      notify("warn", validation);
      return;
    }

    await runAction(
      async () => {
        await axios.post(`${Config.apiUrl}${ENDPOINTS.crear}`, createForm, authHeaders);
        setCreateDialog(false);
        setCreateForm(INITIAL_CREATE);
      },
      "Licencia creada correctamente"
    );
  };

  const submitEdit = async () => {
    const validation = validateEdit();
    if (validation) {
      notify("warn", validation);
      return;
    }

    const payload = {
      nit: editForm.nit,
      estado: editForm.estado,
      tipo_licencia: editForm.tipo_licencia,
      fecha_activacion: editForm.fecha_activacion_raw || editForm.fecha_activacion || null,
      fecha_expiracion: editForm.fecha_expiracion_raw || editForm.fecha_expiracion || null,
      dias_demo: Number(editForm.dias_demo || 0),
      instalacion_hash: editForm.instalacion_hash,
      app: editForm.app || "purchasebridge",
    };

    await runAction(
      async () => {
        await axios.put(`${Config.apiUrl}${ENDPOINTS.editar}/${editForm.id}`, payload, authHeaders);
        setEditDialog(false);
        setEditForm(INITIAL_EDIT);
      },
      "Licencia actualizada correctamente"
    );
  };

  const submitActivate = async () => {
    const validation = validateActivate();
    if (validation) {
      notify("warn", validation);
      return;
    }

    const endpoint = activateForm.online ? ENDPOINTS.activarOnline : ENDPOINTS.activar;
    const payload = activateForm.online
      ? {
          nit: activateForm.nit,
          app: activateForm.app,
          instalacion_hash: activateForm.instalacion_hash,
          tipo_licencia: activateForm.tipo_licencia,
          dias_demo: Number(activateForm.dias_demo || 15),
          dias_licencia: activateForm.dias_licencia ? Number(activateForm.dias_licencia) : undefined,
        }
      : {
          nit: activateForm.nit,
          instalacion_hash: activateForm.instalacion_hash,
          app: activateForm.app,
        };

    await runAction(
      async () => {
        await axios.post(`${Config.apiUrl}${endpoint}`, payload, authHeaders);
        setActivateDialog(false);
        setActivateForm(INITIAL_ACTIVATE);
      },
      activateForm.online ? "Activación online ejecutada" : "Licencia activada correctamente"
    );
  };

  const submitConvert = async () => {
    const validation = validateConvert();
    if (validation) {
      notify("warn", validation);
      return;
    }

    const payload = {
      nit: convertForm.nit,
      tipo_licencia: convertForm.tipo_licencia,
      dias_licencia: convertForm.tipo_licencia === "anual" ? Number(convertForm.dias_licencia) : undefined,
      instalacion_hash: convertForm.instalacion_hash || undefined,
    };

    await runAction(
      async () => {
        await axios.post(`${Config.apiUrl}${ENDPOINTS.convertir}`, payload, authHeaders);
        setConvertDialog(false);
        setConvertForm(INITIAL_CONVERT);
      },
      "Licencia convertida correctamente"
    );
  };

  const submitCode = async () => {
    const validation = validateCode();
    if (validation) {
      notify("warn", validation);
      return;
    }

    await runAction(
      async () => {
        await axios.post(
          `${Config.apiUrl}${ENDPOINTS.generarCodigo}`,
          {
            nit: codeForm.nit,
            app: codeForm.app,
            instalacion_hash: codeForm.instalacion_hash,
            dias: Number(codeForm.dias),
          },
          authHeaders
        );
        setCodeDialog(false);
        setCodeForm(INITIAL_CODE);
      },
      "Código de licencia generado"
    );
  };

  const openEdit = (row) => {
    setEditForm({
      ...INITIAL_EDIT,
      ...row,
      id: row.id,
      fecha_activacion: row.fecha_activacion_raw || "",
      fecha_expiracion: row.fecha_expiracion_raw || "",
      fecha_activacion_raw: row.fecha_activacion_raw || "",
      fecha_expiracion_raw: row.fecha_expiracion_raw || "",
    });
    setEditDialog(true);
  };

  const openActivate = (row) => {
    setActivateForm({
      ...INITIAL_ACTIVATE,
      nit: row.nit || "",
      app: row.app || "purchasebridge",
      instalacion_hash: row.instalacion_hash || "",
      tipo_licencia: row.tipo_licencia === "N/A" ? "demo" : row.tipo_licencia,
      dias_demo: row.dias_demo || 15,
    });
    setActivateDialog(true);
  };

  const openConvert = (row) => {
    setConvertForm({
      ...INITIAL_CONVERT,
      nit: row.nit || "",
      tipo_licencia: row.tipo_licencia === "N/A" ? "anual" : row.tipo_licencia,
      instalacion_hash: row.instalacion_hash || "",
    });
    setConvertDialog(true);
  };

  const openCode = (row) => {
    setCodeForm({
      ...INITIAL_CODE,
      nit: row.nit || "",
      app: row.app || "purchasebridge",
      instalacion_hash: row.instalacion_hash || "",
    });
    setCodeDialog(true);
  };

  const actionsTemplate = (row) => (
    <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
      <Button icon="pi pi-pencil" rounded text severity="info" tooltip="Editar" onClick={() => openEdit(row)} />
      <Button
        icon="pi pi-bolt"
        rounded
        text
        severity="success"
        tooltip="Activar"
        onClick={() => openActivate(row)}
      />
      <Button
        icon="pi pi-refresh"
        rounded
        text
        severity="warning"
        tooltip="Convertir"
        onClick={() => openConvert(row)}
      />
      <Button
        icon="pi pi-qrcode"
        rounded
        text
        severity="secondary"
        tooltip="Generar código"
        onClick={() => openCode(row)}
      />
    </div>
  );

  return (
    <div className="clientes-page">
      <Toast ref={toastRef} />

      <div className="clientes-header">
        <h2>PurchaseBridge - Administración de Licencias</h2>
        <div className="clientes-actions">
          <Button label="Crear licencia" icon="pi pi-plus" onClick={() => setCreateDialog(true)} />
          <Button
            label="Actualizar"
            icon="pi pi-refresh"
            severity="secondary"
            onClick={fetchLicencias}
            loading={loading}
          />
        </div>
      </div>

      {error ? <Message severity="error" text={error} /> : null}

      <Card className="clientes-table-card">
        <DataTable
          value={licencias}
          dataKey="id"
          loading={loading}
          paginator
          rows={10}
          responsiveLayout="scroll"
          emptyMessage="No se encontraron licencias."
          showGridlines
          stripedRows
        >
          <Column field="nit" header="NIT" sortable />
          <Column field="estado" header="Estado" sortable />
          <Column field="tipo_licencia" header="Tipo Licencia" sortable />
          <Column field="fecha_activacion" header="Fecha Activación" sortable />
          <Column field="fecha_expiracion" header="Fecha Expiración" sortable />
          <Column field="dias_demo" header="Días Demo" sortable />
          <Column field="instalacion_hash" header="Instalación Hash" />
          <Column header="Acciones" body={actionsTemplate} />
        </DataTable>
      </Card>

      <Dialog
        header="Crear licencia"
        visible={createDialog}
        style={{ width: "100%", maxWidth: "540px" }}
        onHide={() => setCreateDialog(false)}
        modal
        className="p-fluid"
      >
        <div className="field">
          <label htmlFor="create_nit">NIT *</label>
          <InputText
            id="create_nit"
            value={createForm.nit}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, nit: e.target.value }))}
          />
        </div>
        <div className="field">
          <label htmlFor="create_app">App *</label>
          <Dropdown
            id="create_app"
            value={createForm.app}
            options={APP_OPTIONS}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, app: e.value }))}
          />
        </div>
        <div className="field">
          <label htmlFor="create_dias_demo">Días Demo *</label>
          <InputNumber
            id="create_dias_demo"
            value={createForm.dias_demo}
            onValueChange={(e) => setCreateForm((prev) => ({ ...prev, dias_demo: e.value || 0 }))}
            min={1}
          />
        </div>
        <div className="flex justify-content-end gap-2 mt-3">
          <Button label="Cancelar" text severity="secondary" onClick={() => setCreateDialog(false)} />
          <Button label="Crear" icon="pi pi-check" onClick={submitCreate} loading={submitting} />
        </div>
      </Dialog>

      <Dialog
        header="Editar licencia"
        visible={editDialog}
        style={{ width: "100%", maxWidth: "640px" }}
        onHide={() => setEditDialog(false)}
        modal
        className="p-fluid"
      >
        <div className="field">
          <label htmlFor="edit_nit">NIT *</label>
          <InputText
            id="edit_nit"
            value={editForm.nit}
            onChange={(e) => setEditForm((prev) => ({ ...prev, nit: e.target.value }))}
          />
        </div>
        <div className="field">
          <label htmlFor="edit_estado">Estado</label>
          <InputText
            id="edit_estado"
            value={editForm.estado}
            onChange={(e) => setEditForm((prev) => ({ ...prev, estado: e.target.value }))}
          />
        </div>
        <div className="field">
          <label htmlFor="edit_tipo">Tipo Licencia *</label>
          <Dropdown
            id="edit_tipo"
            value={editForm.tipo_licencia}
            options={TIPOS_LICENCIA}
            onChange={(e) => setEditForm((prev) => ({ ...prev, tipo_licencia: e.value }))}
          />
        </div>
        <div className="field">
          <label htmlFor="edit_dias_demo">Días Demo</label>
          <InputNumber
            id="edit_dias_demo"
            value={editForm.dias_demo}
            onValueChange={(e) => setEditForm((prev) => ({ ...prev, dias_demo: e.value || 0 }))}
            min={0}
          />
        </div>
        <div className="field">
          <label htmlFor="edit_hash">Instalación Hash</label>
          <InputText
            id="edit_hash"
            value={editForm.instalacion_hash}
            onChange={(e) => setEditForm((prev) => ({ ...prev, instalacion_hash: e.target.value }))}
          />
        </div>
        <div className="flex justify-content-end gap-2 mt-3">
          <Button label="Cancelar" text severity="secondary" onClick={() => setEditDialog(false)} />
          <Button label="Guardar" icon="pi pi-save" onClick={submitEdit} loading={submitting} />
        </div>
      </Dialog>

      <Dialog
        header="Activar licencia"
        visible={activateDialog}
        style={{ width: "100%", maxWidth: "640px" }}
        onHide={() => setActivateDialog(false)}
        modal
        className="p-fluid"
      >
        <div className="field">
          <label htmlFor="activate_nit">NIT *</label>
          <InputText
            id="activate_nit"
            value={activateForm.nit}
            onChange={(e) => setActivateForm((prev) => ({ ...prev, nit: e.target.value }))}
          />
        </div>
        <div className="field">
          <label htmlFor="activate_hash">Instalación Hash *</label>
          <InputText
            id="activate_hash"
            value={activateForm.instalacion_hash}
            onChange={(e) => setActivateForm((prev) => ({ ...prev, instalacion_hash: e.target.value }))}
          />
        </div>
        <div className="field-checkbox" style={{ marginTop: "0.6rem" }}>
          <input
            id="activate_online"
            type="checkbox"
            checked={activateForm.online}
            onChange={(e) => setActivateForm((prev) => ({ ...prev, online: e.target.checked }))}
          />
          <label htmlFor="activate_online" style={{ marginLeft: "0.5rem" }}>
            Usar activación online
          </label>
        </div>
        {activateForm.online ? (
          <>
            <div className="field">
              <label htmlFor="activate_tipo">Tipo Licencia</label>
              <Dropdown
                id="activate_tipo"
                value={activateForm.tipo_licencia}
                options={TIPOS_LICENCIA}
                onChange={(e) => setActivateForm((prev) => ({ ...prev, tipo_licencia: e.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="activate_dias_demo">Días Demo</label>
              <InputNumber
                id="activate_dias_demo"
                value={activateForm.dias_demo}
                onValueChange={(e) => setActivateForm((prev) => ({ ...prev, dias_demo: e.value || 0 }))}
                min={1}
              />
            </div>
            <div className="field">
              <label htmlFor="activate_dias_licencia">Días Licencia (para anual)</label>
              <InputNumber
                id="activate_dias_licencia"
                value={activateForm.dias_licencia}
                onValueChange={(e) =>
                  setActivateForm((prev) => ({ ...prev, dias_licencia: e.value || null }))
                }
                min={1}
              />
            </div>
          </>
        ) : null}
        <div className="flex justify-content-end gap-2 mt-3">
          <Button label="Cancelar" text severity="secondary" onClick={() => setActivateDialog(false)} />
          <Button label="Activar" icon="pi pi-bolt" onClick={submitActivate} loading={submitting} />
        </div>
      </Dialog>

      <Dialog
        header="Convertir licencia"
        visible={convertDialog}
        style={{ width: "100%", maxWidth: "580px" }}
        onHide={() => setConvertDialog(false)}
        modal
        className="p-fluid"
      >
        <div className="field">
          <label htmlFor="convert_nit">NIT *</label>
          <InputText
            id="convert_nit"
            value={convertForm.nit}
            onChange={(e) => setConvertForm((prev) => ({ ...prev, nit: e.target.value }))}
          />
        </div>
        <div className="field">
          <label htmlFor="convert_tipo">Tipo Licencia *</label>
          <Dropdown
            id="convert_tipo"
            value={convertForm.tipo_licencia}
            options={TIPOS_LICENCIA}
            onChange={(e) => setConvertForm((prev) => ({ ...prev, tipo_licencia: e.value }))}
          />
        </div>
        {convertForm.tipo_licencia === "anual" ? (
          <div className="field">
            <label htmlFor="convert_dias">Días Licencia *</label>
            <InputNumber
              id="convert_dias"
              value={convertForm.dias_licencia}
              onValueChange={(e) => setConvertForm((prev) => ({ ...prev, dias_licencia: e.value || 0 }))}
              min={1}
            />
          </div>
        ) : null}
        <div className="field">
          <label htmlFor="convert_hash">Instalación Hash</label>
          <InputText
            id="convert_hash"
            value={convertForm.instalacion_hash}
            onChange={(e) => setConvertForm((prev) => ({ ...prev, instalacion_hash: e.target.value }))}
          />
        </div>
        <div className="flex justify-content-end gap-2 mt-3">
          <Button label="Cancelar" text severity="secondary" onClick={() => setConvertDialog(false)} />
          <Button
            label="Convertir"
            icon="pi pi-refresh"
            severity="warning"
            onClick={submitConvert}
            loading={submitting}
          />
        </div>
      </Dialog>

      <Dialog
        header="Generar código de licencia"
        visible={codeDialog}
        style={{ width: "100%", maxWidth: "580px" }}
        onHide={() => setCodeDialog(false)}
        modal
        className="p-fluid"
      >
        <div className="field">
          <label htmlFor="code_nit">NIT *</label>
          <InputText
            id="code_nit"
            value={codeForm.nit}
            onChange={(e) => setCodeForm((prev) => ({ ...prev, nit: e.target.value }))}
          />
        </div>
        <div className="field">
          <label htmlFor="code_app">App *</label>
          <Dropdown
            id="code_app"
            value={codeForm.app}
            options={APP_OPTIONS}
            onChange={(e) => setCodeForm((prev) => ({ ...prev, app: e.value }))}
          />
        </div>
        <div className="field">
          <label htmlFor="code_hash">Instalación Hash *</label>
          <InputText
            id="code_hash"
            value={codeForm.instalacion_hash}
            onChange={(e) => setCodeForm((prev) => ({ ...prev, instalacion_hash: e.target.value }))}
          />
        </div>
        <div className="field">
          <label htmlFor="code_dias">Días *</label>
          <InputNumber
            id="code_dias"
            value={codeForm.dias}
            onValueChange={(e) => setCodeForm((prev) => ({ ...prev, dias: e.value || 0 }))}
            min={1}
          />
        </div>
        <div className="flex justify-content-end gap-2 mt-3">
          <Button label="Cancelar" text severity="secondary" onClick={() => setCodeDialog(false)} />
          <Button label="Generar" icon="pi pi-qrcode" onClick={submitCode} loading={submitting} />
        </div>
      </Dialog>
    </div>
  );
};

export default PurchaseBridge;
