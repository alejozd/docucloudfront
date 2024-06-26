import React, { useState, useRef } from "react";
import axios from "axios";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toolbar } from "primereact/toolbar";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import Config from "./Config";
import ClienteDialog from "./ClienteDialog";
// import "./Clientes.css"; // Importa el archivo CSS

const initialClienteState = {
  idcliente: null,
  nombres: "",
  identidad: "",
  direccion: "",
  telefono: "",
  email: "",
  contacto1: "",
  telefonoc1: "",
  emailc1: "",
  contacto2: "",
  telefonoc2: "",
  emailc2: "",
};

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [clienteDialog, setClienteDialog] = useState(false);
  const [deleteClienteDialog, setDeleteClienteDialog] = useState(false);
  const [cliente, setCliente] = useState({});
  const [selectedClientes, setSelectedClientes] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useRef(null);

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${Config.apiUrl}/api/clientes`);
      setClientes(response.data);
      setLoading(false);
      console.log("Clientes recuperados:", response.data);
    } catch (error) {
      console.error("Error recuperando clientes", error);
      setLoading(false);
    }
  };

  const openNew = () => {
    setCliente(initialClienteState);
    setSubmitted(false);
    setClienteDialog(true);
    console.log("Nuevo cliente abierto");
  };

  const hideDialog = () => {
    setSubmitted(false);
    setClienteDialog(false);
    console.log("Dialogo de cliente oculto");
  };

  const hideDeleteClienteDialog = () => {
    setDeleteClienteDialog(false);
    console.log("Dialogo de eliminación de cliente oculto");
  };

  const saveCliente = async () => {
    setSubmitted(true);

    if (cliente.nombres && cliente.email) {
      let _clientes = [...clientes];
      try {
        if (cliente.idcliente) {
          setLoading(true);
          const response = await axios.put(
            `${Config.apiUrl}/api/clientes/${cliente.idcliente}`,
            cliente
          );
          const index = _clientes.findIndex(
            (c) => c.idcliente === cliente.idcliente
          );
          setLoading(false);
          _clientes[index] = response.data;
          toast.current.show({
            severity: "success",
            summary: "Realizado",
            detail: "Cliente Actualizado",
            life: 3000,
          });
          console.log("Cliente actualizado:", response.data);
        } else {
          console.log("cliente: ", cliente);
          const response = await axios.post(
            `${Config.apiUrl}/api/clientes`,
            cliente
          );
          _clientes.push(response.data);
          toast.current.show({
            severity: "success",
            summary: "Realizado",
            detail: "Cliente Creado",
            life: 3000,
          });
          console.log("Cliente creado:", response.data);
        }

        // setClientes(_clientes);
        setClienteDialog(false);
        setCliente(initialClienteState);
        setLoading(false);
        fetchClientes();
      } catch (error) {
        console.error("Error guardando cliente:", error.response.data.error);
        setLoading(false);
      }
    }
  };

  const editCliente = (cliente) => {
    setCliente({ ...cliente });
    setClienteDialog(true);
    console.log("Editando cliente:", cliente);
  };

  const confirmDeleteCliente = (cliente) => {
    setCliente(cliente);
    setDeleteClienteDialog(true);
    console.log("Confirmación de eliminación de cliente:", cliente);
  };

  const deleteCliente = async () => {
    try {
      await axios.delete(`${Config.apiUrl}/api/clientes/${cliente.idcliente}`);
      let _clientes = clientes.filter(
        (val) => val.idcliente !== cliente.idcliente
      );
      setClientes(_clientes);
      setDeleteClienteDialog(false);
      setCliente(initialClienteState);
      toast.current.show({
        severity: "success",
        summary: "Realizado",
        detail: "Cliente Eliminado",
        life: 3000,
      });
      console.log("Cliente eliminado:", cliente);
    } catch (error) {
      console.error("Error eliminando cliente:", error);
    }
  };

  const onInputChange = (e, name) => {
    const val = (e.target && e.target.value) || "";
    let _cliente = { ...cliente };
    _cliente[`${name}`] = val;
    setCliente(_cliente);
    console.log("Cambio en el input:", name, val);
  };

  const handleWhatsAppClick = (phone) => {
    window.open(`https://wa.me/${phone}`, "_blank");
  };

  const handleEmailClick = (email) => {
    window.open(`mailto:${email}`, "_blank");
  };

  const leftToolbarTemplate = () => {
    return (
      <React.Fragment>
        <Button
          label="Nuevo"
          icon="pi pi-plus"
          className="p-button-success mr-2"
          onClick={openNew}
        />
        <Button
          label="Mostrar"
          icon="pi pi-refresh"
          className="p-button-help"
          onClick={fetchClientes}
          loading={loading}
        />
      </React.Fragment>
    );
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <React.Fragment>
        <Button
          icon="pi pi-pencil"
          rounded
          text
          onClick={() => editCliente(rowData)}
        />
        <Button
          icon="pi pi-trash"
          rounded
          text
          severity="danger"
          onClick={() => confirmDeleteCliente(rowData)}
        />
        <Button
          icon="pi pi-whatsapp"
          severity="success"
          rounded
          text
          onClick={() => handleWhatsAppClick(rowData.telefono)}
        />
        <Button
          icon="pi pi-envelope"
          severity="info"
          rounded
          text
          onClick={() => handleEmailClick(rowData.email)}
        />
      </React.Fragment>
    );
  };

  const deleteClienteDialogFooter = (
    <React.Fragment>
      <Button
        label="No"
        icon="pi pi-times"
        className="p-button-text"
        onClick={hideDeleteClienteDialog}
      />
      <Button
        label="Si"
        icon="pi pi-check"
        className="p-button-text"
        onClick={deleteCliente}
      />
    </React.Fragment>
  );

  return (
    <div className="flex-column">
      <h1>Clientes</h1>
      <Toast ref={toast} />
      <div className="card">
        <Toolbar className="mb-4" start={leftToolbarTemplate}></Toolbar>
      </div>
      <div className="card">
        <DataTable
          value={clientes}
          selection={selectedClientes}
          onSelectionChange={(e) => setSelectedClientes(e.value)}
          dataKey="idcliente"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          scrollable
          size="small"
          loading={loading}
          emptyMessage="No hay registros"
        >
          <Column field="idcliente" header="ID" hidden />
          <Column
            field="nombres"
            header="Nombre"
            frozen
            alignFrozen="left"
            sortable
          />
          <Column field="identidad" header="Identidad" sortable />
          <Column field="direccion" header="Dirección" sortable />
          <Column field="telefono" header="Teléfono" sortable />
          <Column field="email" header="Email" sortable />
          <Column field="contacto1" header="Contacto 1" hidden />
          <Column field="telefonoc1" header="Teléfono C1" hidden />
          <Column field="emailc1" header="Email C1" hidden />
          <Column field="contacto2" header="Contacto 2" hidden />
          <Column field="telefonoc2" header="Teléfono C2" hidden />
          <Column field="emailc2" header="Email C2" hidden />
          <Column body={actionBodyTemplate} frozen alignFrozen="right" />
        </DataTable>
      </div>

      <ClienteDialog
        visible={clienteDialog}
        cliente={cliente}
        submitted={submitted}
        hideDialog={hideDialog}
        saveCliente={saveCliente}
        onInputChange={onInputChange}
        loading={loading}
      />

      <Dialog
        visible={deleteClienteDialog}
        style={{ width: "450px" }}
        header="Confirm"
        modal
        footer={deleteClienteDialogFooter}
        onHide={hideDeleteClienteDialog}
      >
        <div className="confirmation-content">
          <i
            className="pi pi-exclamation-triangle mr-3"
            style={{ fontSize: "2rem" }}
          />
          {cliente && (
            <span>
              Esta seguro que desea eliminar <b>{cliente.nombres}</b>?
            </span>
          )}
        </div>
      </Dialog>
    </div>
  );
};

export default Clientes;
