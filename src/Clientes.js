// Clientes.js
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Toolbar } from "primereact/toolbar";
import { Toast } from "primereact/toast";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "./Clientes.css";
import Config from "./Config";

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [clienteDialog, setClienteDialog] = useState(false);
  const [deleteClienteDialog, setDeleteClienteDialog] = useState(false);
  const [cliente, setCliente] = useState({});
  const [selectedClientes, setSelectedClientes] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const toast = useRef(null);

  const fetchClientes = async () => {
    try {
      const response = await axios.get(`${Config.apiUrl}/api/clientes`);
      setClientes(response.data);
    } catch (error) {
      console.error("Error fetching clientes", error);
    }
  };

  const openNew = () => {
    setCliente({});
    setSubmitted(false);
    setClienteDialog(true);
  };

  const hideDialog = () => {
    setSubmitted(false);
    setClienteDialog(false);
  };

  const hideDeleteClienteDialog = () => {
    setDeleteClienteDialog(false);
  };

  const saveCliente = async () => {
    setSubmitted(true);

    if (cliente.nombres && cliente.email) {
      let _clientes = [...clientes];
      if (cliente.idcliente) {
        const response = await axios.put(
          `/api/clientes/${cliente.idcliente}`,
          cliente
        );
        const index = _clientes.findIndex(
          (c) => c.idcliente === cliente.idcliente
        );
        _clientes[index] = response.data;
        toast.current.show({
          severity: "success",
          summary: "Successful",
          detail: "Cliente Updated",
          life: 3000,
        });
      } else {
        const response = await axios.post(
          `${Config.apiUrl}/api/clientes`,
          cliente
        );
        _clientes.push(response.data);
        toast.current.show({
          severity: "success",
          summary: "Successful",
          detail: "Cliente Created",
          life: 3000,
        });
      }

      setClientes(_clientes);
      setClienteDialog(false);
      setCliente({});
    }
  };

  const editCliente = (cliente) => {
    setCliente({ ...cliente });
    setClienteDialog(true);
  };

  const confirmDeleteCliente = (cliente) => {
    setCliente(cliente);
    setDeleteClienteDialog(true);
  };

  const deleteCliente = async () => {
    await axios.delete(`${Config.apiUrl}/api/clientes/${cliente.idcliente}`);
    let _clientes = clientes.filter(
      (val) => val.idcliente !== cliente.idcliente
    );
    setClientes(_clientes);
    setDeleteClienteDialog(false);
    setCliente({});
    toast.current.show({
      severity: "success",
      summary: "Successful",
      detail: "Cliente Deleted",
      life: 3000,
    });
  };

  const onInputChange = (e, name) => {
    const val = (e.target && e.target.value) || "";
    let _cliente = { ...cliente };
    _cliente[`${name}`] = val;
    setCliente(_cliente);
  };

  const leftToolbarTemplate = () => {
    return (
      <React.Fragment>
        <Button
          label="New"
          icon="pi pi-plus"
          className="p-button-success mr-2"
          onClick={openNew}
        />
        <Button
          label="Show"
          icon="pi pi-refresh"
          className="p-button-help"
          onClick={fetchClientes}
        />
      </React.Fragment>
    );
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <React.Fragment>
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-success mr-2"
          onClick={() => editCliente(rowData)}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-warning"
          onClick={() => confirmDeleteCliente(rowData)}
        />
      </React.Fragment>
    );
  };

  const clienteDialogFooter = (
    <React.Fragment>
      <Button
        label="Cancel"
        icon="pi pi-times"
        className="p-button-text"
        onClick={hideDialog}
      />
      <Button
        label="Save"
        icon="pi pi-check"
        className="p-button-text"
        onClick={saveCliente}
      />
    </React.Fragment>
  );

  const deleteClienteDialogFooter = (
    <React.Fragment>
      <Button
        label="No"
        icon="pi pi-times"
        className="p-button-text"
        onClick={hideDeleteClienteDialog}
      />
      <Button
        label="Yes"
        icon="pi pi-check"
        className="p-button-text"
        onClick={deleteCliente}
      />
    </React.Fragment>
  );

  return (
    <div className="clientes-container">
      <Toast ref={toast} />
      <Toolbar className="mb-4" left={leftToolbarTemplate}></Toolbar>
      <DataTable
        // Continuación del componente Clientes.js

        value={clientes}
        selection={selectedClientes}
        onSelectionChange={(e) => setSelectedClientes(e.value)}
        dataKey="idcliente"
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25]}
      >
        <Column field="idcliente" header="ID" />
        <Column field="nombres" header="Nombre" />
        <Column field="identidad" header="Identidad" />
        <Column field="direccion" header="Dirección" />
        <Column field="telefono" header="Teléfono" />
        <Column field="email" header="Email" />
        <Column field="contacto1" header="Contacto 1" />
        <Column field="telefonoc1" header="Teléfono C1" />
        <Column field="emailc1" header="Email C1" />
        <Column field="contacto2" header="Contacto 2" />
        <Column field="telefonoc2" header="Teléfono C2" />
        <Column field="emailc2" header="Email C2" />
        <Column body={actionBodyTemplate} header="Actions" />
      </DataTable>

      <Dialog
        visible={clienteDialog}
        style={{ width: "450px" }}
        header="Cliente Details"
        modal
        className="p-fluid"
        footer={clienteDialogFooter}
        onHide={hideDialog}
      >
        <div className="field">
          <label htmlFor="nombres">Nombre</label>
          <InputText
            id="nombres"
            value={cliente.nombres}
            onChange={(e) => onInputChange(e, "nombres")}
            required
            autoFocus
            className={submitted && !cliente.nombres ? "p-invalid" : ""}
          />
          {submitted && !cliente.nombres && (
            <small className="p-error">Nombre is required.</small>
          )}
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <InputText
            id="email"
            value={cliente.email}
            onChange={(e) => onInputChange(e, "email")}
            required
            className={submitted && !cliente.email ? "p-invalid" : ""}
          />
          {submitted && !cliente.email && (
            <small className="p-error">Email is required.</small>
          )}
        </div>
        {/* Agregar otros campos de entrada aquí */}
      </Dialog>

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
              Are you sure you want to delete <b>{cliente.nombres}</b>?
            </span>
          )}
        </div>
      </Dialog>
    </div>
  );
};

export default Clientes;
