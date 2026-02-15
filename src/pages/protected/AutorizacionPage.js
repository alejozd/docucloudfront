import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import axios from "axios";
import Config from "../../components/features/Config";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { Card } from "primereact/card";

const ACCESS_KEY = process.env.REACT_APP_ACCESS_KEY;

const ESTADOS = [
  { label: "Autorizado", value: "autorizado" },
  { label: "No Autorizado", value: "no_autorizado" },
  { label: "Bloqueado", value: "bloqueado" },
];

const INITIAL_AUTORIZACION = {
  estado: "no_autorizado",
  intentos_envio: 0,
};

const AutorizacionPage = () => {
  const [autorizaciones, setAutorizaciones] = useState([]);
  const [selectedAutorizacion, setSelectedAutorizacion] = useState(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState("");
  const [nuevaAutorizacion, setNuevaAutorizacion] = useState(INITIAL_AUTORIZACION);
  const [isEditMode, setIsEditMode] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);
  const [claveIngresada, setClaveIngresada] = useState("");
  const [loading, setLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [error, setError] = useState(null);
  const toast = useRef(null);

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

  const fetchAutorizaciones = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${Config.apiUrl}/api/autorizacion/listado`);
      setAutorizaciones(response.data?.autorizaciones || []);
    } catch (fetchError) {
      console.error("Error al cargar autorizaciones:", fetchError);
      setError("No se pudieron cargar las autorizaciones.");
      notify("error", "No se pudieron cargar las autorizaciones");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    if (!accessGranted) return;
    fetchAutorizaciones();
  }, [accessGranted, fetchAutorizaciones]);

  const verificarClave = useCallback(() => {
    setLoading(true);
    try {
      if (!ACCESS_KEY) {
        notify("warn", "No hay clave de acceso configurada en el entorno");
        return;
      }

      if (claveIngresada.trim() === ACCESS_KEY) {
        setAccessGranted(true);
        setClaveIngresada("");
        notify("success", "Acceso concedido");
      } else {
        notify("error", "Clave de acceso incorrecta");
      }
    } finally {
      setLoading(false);
    }
  }, [claveIngresada, notify]);

  const handleAccessKeyDown = (event) => {
    if (event.key === "Enter") {
      verificarClave();
    }
  };

  const editarAutorizacion = (autorizacion) => {
    setSelectedAutorizacion(autorizacion);
    setNuevoEstado(autorizacion.estado || "no_autorizado");
    setNuevaAutorizacion({
      estado: autorizacion.estado || "no_autorizado",
      intentos_envio: autorizacion.intentos_envio ?? 0,
    });
    setIsEditMode(true);
    setDialogVisible(true);
  };

  const crearNuevaAutorizacion = () => {
    setSelectedAutorizacion(null);
    setNuevoEstado("no_autorizado");
    setNuevaAutorizacion(INITIAL_AUTORIZACION);
    setIsEditMode(false);
    setError(null);
    setDialogVisible(true);
  };

  const closeFormDialog = () => {
    setDialogVisible(false);
    setSelectedAutorizacion(null);
    setNuevoEstado("");
    setNuevaAutorizacion(INITIAL_AUTORIZACION);
  };

  const guardarCambios = async () => {
    const intentos = Number(nuevaAutorizacion.intentos_envio ?? 0);

    if ((isEditMode && !nuevoEstado) || (!isEditMode && !nuevaAutorizacion.estado)) {
      notify("warn", "Selecciona un estado válido");
      return;
    }

    if (Number.isNaN(intentos) || intentos < 0) {
      notify("warn", "Los intentos deben ser un número mayor o igual a cero");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isEditMode) {
        await axios.put(
          `${Config.apiUrl}/api/autorizacion/cambiar-estado/${selectedAutorizacion.idautorizacion}`,
          {
            nuevo_estado: nuevoEstado,
            nuevos_intentos: intentos,
          }
        );
        notify("success", "Estado actualizado correctamente");
      } else {
        await axios.post(`${Config.apiUrl}/api/autorizacion`, {
          estado: nuevaAutorizacion.estado,
          intentos_envio: intentos,
        });
        notify("success", "Autorización creada correctamente");
      }

      closeFormDialog();
      fetchAutorizaciones();
    } catch (saveError) {
      console.error("Error al guardar cambios:", saveError);
      setError("Ocurrió un error al guardar los cambios.");
      notify("error", "Ocurrió un error al guardar los cambios");
    } finally {
      setLoading(false);
    }
  };

  const kpis = useMemo(
    () => [
      { label: "Total", value: autorizaciones.length },
      {
        label: "Autorizados",
        value: autorizaciones.filter((item) => item.estado === "autorizado").length,
      },
      {
        label: "Bloqueados",
        value: autorizaciones.filter((item) => item.estado === "bloqueado").length,
      },
    ],
    [autorizaciones]
  );

  const tableHeader = (
    <div className="clientes-table-header">
      <IconField iconPosition="left">
        <InputIcon className="pi pi-search" />
        <InputText
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
          placeholder="Buscar por nombre o estado"
        />
      </IconField>
      <span>{autorizaciones.length} registros</span>
    </div>
  );

  if (!accessGranted) {
    return (
      <div className="clientes-page">
        <Toast ref={toast} />
        <Dialog
          header="Acceso Restringido"
          visible
          style={{ width: "100%", maxWidth: "420px" }}
          closable={false}
          modal
          className="p-fluid"
        >
          <div style={{ marginBottom: "16px" }}>
            <label htmlFor="clave-acceso" style={{ display: "block", marginBottom: "8px" }}>
              Ingresa la clave de acceso
            </label>
            <InputText
              id="clave-acceso"
              type="password"
              value={claveIngresada}
              onChange={(e) => setClaveIngresada(e.target.value)}
              onKeyDown={handleAccessKeyDown}
              placeholder="Clave"
              style={{ width: "100%", marginBottom: "16px" }}
            />
            <Button
              label={loading ? "Verificando..." : "Ingresar"}
              onClick={verificarClave}
              icon={loading ? "pi pi-spin pi-spinner" : "pi pi-sign-in"}
              severity="success"
              disabled={loading}
            />
          </div>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="clientes-page">
      <Toast ref={toast} />

      <div className="clientes-header">
        <h2>Gestión de Autorizaciones</h2>
        <div className="clientes-actions">
          <Button label="Crear" icon="pi pi-plus" onClick={crearNuevaAutorizacion} />
          <Button
            label="Actualizar"
            icon="pi pi-refresh"
            severity="secondary"
            onClick={fetchAutorizaciones}
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

      {error && <p style={{ color: "red", marginBottom: "12px" }}>{error}</p>}

      <Card className="clientes-table-card">
        <DataTable
          value={autorizaciones}
          loading={loading}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 20]}
          dataKey="idautorizacion"
          emptyMessage="No se encontraron autorizaciones"
          stripedRows
          globalFilter={globalFilter}
          globalFilterFields={["nombre", "estado"]}
          header={tableHeader}
        >
          <Column field="idautorizacion" header="ID" sortable />
          <Column field="nombre" header="Nombre" sortable />
          <Column field="estado" header="Estado" sortable />
          <Column field="intentos_envio" header="Intentos" sortable />
          <Column
            header="Acciones"
            body={(rowData) => (
              <Button
                icon="pi pi-pencil"
                rounded
                text
                severity="info"
                onClick={() => editarAutorizacion(rowData)}
              />
            )}
          />
        </DataTable>
      </Card>

      <Dialog
        header={isEditMode ? "Editar Autorización" : "Crear Nueva Autorización"}
        visible={dialogVisible}
        onHide={closeFormDialog}
        style={{ width: "430px" }}
        modal
      >
        <div className="p-fluid">
          <div className="p-field" style={{ marginBottom: "12px" }}>
            <label htmlFor="estado">Estado *</label>
            <Dropdown
              id="estado"
              value={isEditMode ? nuevoEstado : nuevaAutorizacion.estado}
              options={ESTADOS}
              onChange={(e) => {
                if (isEditMode) {
                  setNuevoEstado(e.value);
                } else {
                  setNuevaAutorizacion((prev) => ({ ...prev, estado: e.value }));
                }
              }}
              placeholder="Seleccionar estado"
            />
          </div>

          <div className="p-field" style={{ marginBottom: "14px" }}>
            <label htmlFor="intentos-envio">Intentos de Envío *</label>
            <InputNumber
              id="intentos-envio"
              value={nuevaAutorizacion.intentos_envio}
              onValueChange={(e) =>
                setNuevaAutorizacion((prev) => ({
                  ...prev,
                  intentos_envio: e.value,
                }))
              }
              min={0}
              placeholder="Ingresa los intentos"
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
            <Button label="Cancelar" icon="pi pi-times" onClick={closeFormDialog} text severity="danger" />
            <Button
              label={loading ? "Guardando..." : "Guardar"}
              icon={loading ? "pi pi-spin pi-spinner" : "pi pi-check"}
              onClick={guardarCambios}
              disabled={loading}
              severity="success"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default AutorizacionPage;
