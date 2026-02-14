import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import axios from "axios";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import Config from "../../components/features/Config";
import { convertToLocalDate, formatDate } from "./../../utils/dateUtils";
import "../../styles/Usuarios.css";

const getApiMessage = (error, fallback) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
};

const getNormalizedUsuarios = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.usuarios)) return payload.usuarios;
  return [];
};

const initialUsuario = { id: null, nombre: "", email: "" };
const USUARIOS_ENDPOINT = "/api/usuarios";

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [usuario, setUsuario] = useState(initialUsuario);
  const [usuarioDialog, setUsuarioDialog] = useState(false);
  const [editando, setEditando] = useState(false);
  const [loading, setLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const toast = useRef(null);

  const requestUsuarios = useCallback(async (method, payload = null, id = null) => {
    const url = `${Config.usuarioApiUrl}${USUARIOS_ENDPOINT}${id ? `/${id}` : ""}`;

    if (method === "get") return await axios.get(url);
    if (method === "post") return await axios.post(url, payload);
    if (method === "put") return await axios.put(url, payload);
    if (method === "delete") return await axios.delete(url);

    throw new Error(`Método no soportado: ${method}`);
  }, []);

  const fetchUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      const response = await requestUsuarios("get");
      setUsuarios(getNormalizedUsuarios(response.data));
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: getApiMessage(error, "No se pudo cargar la lista de usuarios"),
      });
    } finally {
      setLoading(false);
    }
  }, [requestUsuarios]);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  const abrirNuevo = () => {
    setUsuario(initialUsuario);
    setEditando(false);
    setUsuarioDialog(true);
  };

  const editarUsuario = (rowUsuario) => {
    setUsuario({ ...rowUsuario });
    setEditando(true);
    setUsuarioDialog(true);
  };

  const ocultarDialogo = () => {
    setUsuarioDialog(false);
  };

  const guardarUsuario = async () => {
    if (!usuario.nombre || !usuario.email) {
      toast.current?.show({
        severity: "warn",
        summary: "Atención",
        detail: "Nombre y correo son obligatorios",
      });
      return;
    }

    try {
      setLoading(true);
      if (editando) {
        await requestUsuarios("put", usuario, usuario.id);
        toast.current?.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Usuario actualizado con éxito",
        });
      } else {
        await requestUsuarios("post", usuario);
        toast.current?.show({
          severity: "success",
          summary: "Creado",
          detail: "Usuario creado con éxito",
        });
      }

      setUsuarioDialog(false);
      setUsuario(initialUsuario);
      fetchUsuarios();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: getApiMessage(error, "No se pudo guardar el usuario"),
      });
    } finally {
      setLoading(false);
    }
  };

  const eliminarUsuario = async (usuarioId) => {
    try {
      setLoading(true);
      await requestUsuarios("delete", null, usuarioId);
      toast.current?.show({
        severity: "success",
        summary: "Eliminado",
        detail: "Usuario eliminado con éxito",
      });
      setUsuarios((prev) => prev.filter((item) => item.id !== usuarioId));
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: getApiMessage(error, "No se pudo eliminar el usuario"),
      });
    } finally {
      setLoading(false);
    }
  };

  const accionesTemplate = (rowData) => (
    <>
      <Button
        icon="pi pi-pencil"
        rounded
        text
        severity="info"
        onClick={() => editarUsuario(rowData)}
      />
      <Button
        icon="pi pi-trash"
        rounded
        text
        severity="danger"
        onClick={() => eliminarUsuario(rowData.id)}
      />
    </>
  );

  const kpis = useMemo(
    () => [
      { label: "Total usuarios", value: usuarios.length },
      {
        label: "Con email corporativo",
        value: usuarios.filter((row) => row.email?.includes("@")).length,
      },
      {
        label: "Creados hoy",
        value: usuarios.filter((row) => {
          if (!row.creado_en) return false;
          const d = new Date(convertToLocalDate(row.creado_en));
          const now = new Date();
          return d.toDateString() === now.toDateString();
        }).length,
      },
    ],
    [usuarios]
  );

  const tableHeader = (
    <div className="usuarios-table-header">
      <IconField iconPosition="left">
        <InputIcon className="pi pi-search" />
        <InputText
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
          placeholder="Buscar por nombre o email"
        />
      </IconField>
      <span>{usuarios.length} registros</span>
    </div>
  );

  return (
    <div className="usuarios-page">
      <Toast ref={toast} />

      <div className="usuarios-header">
        <div>
          <h1>Gestión de Usuarios</h1>
          <p>Microservicio Spring Boot para administración de usuarios.</p>
        </div>
        <div className="usuarios-actions">
          <Button label="Nuevo Usuario" icon="pi pi-plus" onClick={abrirNuevo} />
          <Button
            label="Actualizar"
            icon="pi pi-refresh"
            severity="secondary"
            onClick={fetchUsuarios}
            loading={loading}
          />
        </div>
      </div>

      <div className="usuarios-kpis">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="usuarios-kpi-card">
            <p className="usuarios-kpi-label">{kpi.label}</p>
            <p className="usuarios-kpi-value">{kpi.value}</p>
          </Card>
        ))}
      </div>

      <Card className="usuarios-table-card">
        <DataTable
          value={usuarios}
          stripedRows
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          loading={loading}
          header={tableHeader}
          globalFilter={globalFilter}
          globalFilterFields={["nombre", "email"]}
          emptyMessage="No hay usuarios registrados"
        >
          <Column field="id" header="ID" sortable style={{ width: "6rem" }} />
          <Column field="nombre" header="Nombre" sortable />
          <Column field="email" header="Email" sortable />
          <Column
            field="creado_en"
            header="Creado"
            body={(rowData) => {
              const fechaLocal = convertToLocalDate(rowData.creado_en);
              return formatDate(fechaLocal);
            }}
            sortable
          />
          <Column body={accionesTemplate} header="Acciones" style={{ width: "140px" }} />
        </DataTable>
      </Card>

      <Dialog
        visible={usuarioDialog}
        style={{ width: "420px" }}
        header={editando ? "Editar Usuario" : "Nuevo Usuario"}
        modal
        onHide={ocultarDialogo}
      >
        <div className="p-fluid">
          <div className="p-field">
            <label htmlFor="nombre">Nombre</label>
            <InputText
              id="nombre"
              value={usuario.nombre}
              onChange={(event) => setUsuario((prev) => ({ ...prev, nombre: event.target.value }))}
            />
          </div>
          <div className="p-field">
            <label htmlFor="email">Email</label>
            <InputText
              id="email"
              value={usuario.email}
              onChange={(event) => setUsuario((prev) => ({ ...prev, email: event.target.value }))}
            />
          </div>
        </div>

        <div className="usuarios-dialog-actions">
          <Button label="Cancelar" icon="pi pi-times" severity="secondary" onClick={ocultarDialogo} />
          <Button
            label="Guardar"
            icon="pi pi-check"
            severity="success"
            onClick={guardarUsuario}
            loading={loading}
          />
        </div>
      </Dialog>
    </div>
  );
};

export default Usuarios;
