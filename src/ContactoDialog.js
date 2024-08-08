import React from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button"; // Librería para enviar correos electrónicos
// import { InputMask } from "primereact/inputmask";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css"; // Importa los estilos de la librería
import "./ClienteDialog.css";
import es from "react-phone-number-input/locale/es";

const ContactoDialog = ({
  visible,
  contacto,
  submitted,
  hideDialog,
  saveContacto,
  onInputChange,
  onPhoneChange,
  loading,
}) => {
  const contactoDialogFooter = (
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
        onClick={saveContacto}
        loading={loading}
      />
    </React.Fragment>
  );

  // const telefonoInicial = contacto.telefonoca ? contacto.telefonoca : "(57) ";
  // const handlePhoneChange = (value) => {
  //   const event = {
  //     target: {
  //       name: "telefono",
  //       value,
  //     },
  //   };
  //   onInputChange(event, "telefonoca");
  // };

  return (
    <Dialog
      visible={visible}
      style={{ width: "450px" }}
      header="Detalle - Contacto"
      modal
      className="p-fluid"
      footer={contactoDialogFooter}
      onHide={hideDialog}
    >
      <div className="card flex flex-column md:flex-row gap-3">
        <div className="field">
          <label htmlFor="nombres">Nombre</label>
          <InputText
            id="nombres"
            value={contacto.nombresca}
            onChange={(e) => onInputChange(e, "nombresca")}
            required
            autoFocus
            className={submitted && !contacto.nombresca ? "p-invalid" : ""}
          />
          {submitted && !contacto.nombresca && (
            <small className="p-error">Nombre is required.</small>
          )}
        </div>
        <div className="field">
          <label htmlFor="identidad">Identidad</label>
          <InputText
            id="identidad"
            value={contacto.identidadca}
            onChange={(e) => onInputChange(e, "identidadca")}
            required
            className={submitted && !contacto.identidadca ? "p-invalid" : ""}
          />
          {submitted && !contacto.identidadca && (
            <small className="p-error">Identidad is required.</small>
          )}
        </div>
      </div>
      <div className="card flex flex-column md:flex-row gap-3">
        <div className="field">
          <label htmlFor="email">Email</label>
          <InputText
            id="email"
            value={contacto.emailca}
            onChange={(e) => onInputChange(e, "emailca")}
            required
            className={submitted && !contacto.emailca ? "p-invalid" : ""}
          />
          {submitted && !contacto.emailca && (
            <small className="p-error">Email is required.</small>
          )}
        </div>
        <div className="field">
          <label htmlFor="telefono">Teléfono</label>
          {/* <InputMask
            id="telefono"
            mask="(99) 999-9999999"
            placeholder="(57) 999-9999999"
            // value={contacto.telefonoca}
            value={telefonoInicial}
            onChange={(e) => onInputChange(e, "telefonoca")}
            required
            className={submitted && !contacto.telefonoca ? "p-invalid" : ""}
          /> */}
          <PhoneInput
            id="telefono"
            international
            defaultCountry="CO"
            labels={es} //
            value={contacto.telefonoca}
            onChange={(value) => onPhoneChange(value, "telefonoca")}
            className="phone-input"
          />
          {submitted && !contacto.telefonoca && (
            <small className="p-error">Teléfono is required.</small>
          )}
        </div>
      </div>
      <div className="card flex flex-column md:flex-row gap-3">
        <div className="field">
          <label htmlFor="direccion">Dirección</label>
          <InputText
            id="direccion"
            value={contacto.direccionca}
            onChange={(e) => onInputChange(e, "direccionca")}
            required
            className={submitted && !contacto.direccionca ? "p-invalid" : ""}
          />
          {submitted && !contacto.direccionca && (
            <small className="p-error">Dirección is required.</small>
          )}
        </div>
      </div>
    </Dialog>
  );
};

export default ContactoDialog;
