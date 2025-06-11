import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import Config from "../../components/features/Config";
import { convertToLocalDate } from "./../../utils/dateUtils";
import { formatDate } from "./../../utils/dateUtils";

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [usuario, setUsuario] = useState({ id: null, nombre: "", email: "" });
  const [usuarioDialog, setUsuarioDialog] = useState(false);
  const [editando, setEditando] = useState(false);
  const toast = useRef(null);

  // Cargar usuarios
  const fetchUsuarios = useCallback(async () => {
    try {
      const response = await axios.get(`${Config.apiUrl}/api/usuarios`, {});
      setUsuarios(response.data);
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar la lista de usuarios",
      });
    }
  }, []);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  const abrirNuevo = () => {
    setUsuario({ id: null, nombre: "", email: "" });
    setEditando(false);
    setUsuarioDialog(true);
  };

  const editarUsuario = (usuario) => {
    setUsuario({ ...usuario });
    setEditando(true);
    setUsuarioDialog(true);
  };

  const ocultarDialogo = () => {
    setUsuarioDialog(false);
  };

  const guardarUsuario = async () => {
    try {
      if (editando) {
        await axios.put(`${Config.apiUrl}/api/usuarios/${usuario.id}`, usuario);
        toast.current.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Usuario actualizado con éxito",
        });
      } else {
        await axios.post(`${Config.apiUrl}/api/usuarios`, usuario);
        toast.current.show({
          severity: "success",
          summary: "Creado",
          detail: "Usuario creado con éxito",
        });
      }
      setUsuarioDialog(false);
      fetchUsuarios();
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo guardar el usuario",
      });
    }
  };

  const eliminarUsuario = async (usuarioId) => {
    try {
      await axios.delete(`${Config.apiUrl}/api/usuarios/${usuarioId}`);
      toast.current.show({
        severity: "success",
        summary: "Eliminado",
        detail: "Usuario eliminado con éxito",
      });
      fetchUsuarios();
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo eliminar el usuario",
      });
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

  return (
    <div>
      <Toast ref={toast} />
      <div className="card">
        <h2>Gestión de Usuarios</h2>
        <h3>El backend es un microservicio desarrollado con Spring Boot.</h3>
        <Button
          label="Nuevo Usuario"
          icon="pi pi-plus"
          severity="success"
          onClick={abrirNuevo}
          style={{ marginBottom: "20px" }}
        />
      </div>
      <div className="card">
        <DataTable
          value={usuarios}
          stripedRows
          paginator
          rows={5}
          header="Usuarios registrados"
        >
          <Column field="id" header="ID" />
          <Column field="nombre" header="Nombre" />
          <Column field="email" header="Email" />
          <Column
            field="creado_en"
            header="Creado En."
            body={(rowData) => {
              const fechaLocal = convertToLocalDate(rowData.creado_en);
              return formatDate(fechaLocal);
            }}
          />
          <Column
            body={accionesTemplate}
            header="Acciones"
            style={{ width: "150px" }}
          />
        </DataTable>

        <Dialog
          visible={usuarioDialog}
          style={{ width: "400px" }}
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
                onChange={(e) =>
                  setUsuario({ ...usuario, nombre: e.target.value })
                }
              />
            </div>
            <div className="p-field">
              <label htmlFor="email">Email</label>
              <InputText
                id="email"
                value={usuario.email}
                onChange={(e) =>
                  setUsuario({ ...usuario, email: e.target.value })
                }
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "20px",
            }}
          >
            <Button
              label="Cancelar"
              icon="pi pi-times"
              // className="p-button-text"
              severity="secondary"
              onClick={ocultarDialogo}
            />
            <Button
              label="Guardar"
              icon="pi pi-check"
              severity="success"
              // className="p-button-text"
              onClick={guardarUsuario}
            />
          </div>
        </Dialog>
      </div>
    </div>
  );
};

export default Usuarios;
