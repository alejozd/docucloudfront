import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import Config from "../../components/features/Config";

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [usuario, setUsuario] = useState({ id: null, nombre: "", email: "" });
  const [usuarioDialog, setUsuarioDialog] = useState(false);
  const [editando, setEditando] = useState(false);
  const toast = useRef(null);
  const jwtToken = localStorage.getItem("jwtToken"); // Asumiendo que así obtienes tu token

  const headers = { Authorization: `Bearer ${jwtToken}` };

  // Cargar usuarios
  const fetchUsuarios = async () => {
    try {
      const response = await axios.get(`${Config.apiUrl}/api/usuarios`, {
        headers,
      });
      setUsuarios(response.data);
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar la lista de usuarios",
      });
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

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
        await axios.put(
          `${Config.apiUrl}/api/usuarios/${usuario.id}`,
          usuario,
          { headers }
        );
        toast.current.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Usuario actualizado con éxito",
        });
      } else {
        await axios.post(`${Config.apiUrl}/api/usuarios`, usuario, { headers });
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
      await axios.delete(`${Config.apiUrl}/api/usuarios/${usuarioId}`, {
        headers,
      });
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
    <div className="p-grid p-justify-center p-mt-4">
      <Toast ref={toast} />
      <div className="p-col-12">
        <h2>Gestión de Usuarios</h2>
        <Button
          label="Nuevo Usuario"
          icon="pi pi-plus"
          className="p-mb-3"
          onClick={abrirNuevo}
        />

        <DataTable
          value={usuarios}
          paginator
          rows={5}
          header="Usuarios registrados"
        >
          <Column field="id" header="ID" />
          <Column field="nombre" header="Nombre" />
          <Column field="email" header="Email" />
          <Column field="creado_en" header="Creado En" />
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

          <div className="p-dialog-footer">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              className="p-button-text"
              onClick={ocultarDialogo}
            />
            <Button
              label="Guardar"
              icon="pi pi-check"
              className="p-button-text"
              onClick={guardarUsuario}
            />
          </div>
        </Dialog>
      </div>
    </div>
  );
};

export default Usuarios;
