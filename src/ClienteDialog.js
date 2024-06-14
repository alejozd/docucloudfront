import React from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button"; // Librería para enviar correos electrónicos

const ClienteDialog = ({
  visible,
  cliente,
  submitted,
  hideDialog,
  saveCliente,
  onInputChange,
  loading,
}) => {
  const clienteDialogFooter = (
    <React.Fragment>
      <Button
        label="Cancelar"
        icon="pi pi-times"
        outlined
        severity="danger"
        onClick={hideDialog}
      />
      <Button
        label="Guardar"
        icon="pi pi-check"
        severity="success"
        onClick={saveCliente}
        loading={loading}
      />
    </React.Fragment>
  );

  return (
    <Dialog
      visible={visible}
      style={{ width: "450px" }}
      header="Detalle - Cliente"
      modal
      className="p-fluid"
      footer={clienteDialogFooter}
      onHide={hideDialog}
    >
      <div className="card flex flex-column md:flex-row gap-3">
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
          <label htmlFor="identidad">Identidad</label>
          <InputText
            id="identidad"
            value={cliente.identidad}
            onChange={(e) => onInputChange(e, "identidad")}
            required
            className={submitted && !cliente.identidad ? "p-invalid" : ""}
          />
          {submitted && !cliente.identidad && (
            <small className="p-error">Identidad is required.</small>
          )}
        </div>
      </div>
      <div className="card flex flex-column md:flex-row gap-3">
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
        <div className="field">
          <label htmlFor="telefono">Teléfono</label>
          <InputText
            id="telefono"
            value={cliente.telefono}
            onChange={(e) => onInputChange(e, "telefono")}
            required
            className={submitted && !cliente.telefono ? "p-invalid" : ""}
          />
          {submitted && !cliente.telefono && (
            <small className="p-error">Teléfono is required.</small>
          )}
        </div>
      </div>
      <div className="card flex flex-column md:flex-row gap-3">
        <div className="field">
          <label htmlFor="direccion">Dirección</label>
          <InputText
            id="direccion"
            value={cliente.direccion}
            onChange={(e) => onInputChange(e, "direccion")}
            required
            className={submitted && !cliente.direccion ? "p-invalid" : ""}
          />
          {submitted && !cliente.direccion && (
            <small className="p-error">Dirección is required.</small>
          )}
        </div>
      </div>
    </Dialog>
  );
};

export default ClienteDialog;
