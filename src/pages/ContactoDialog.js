import React from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button"; // Librería para enviar correos electrónicos
import { Dropdown } from "primereact/dropdown";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css"; // Importa los estilos de la librería
import "../styles/ClienteDialog.css";
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
  segmentos,
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
      <div className="card flex flex-column md:flex-row gap-3">
        <div className="field">
          <label htmlFor="segmento">Segmento</label>
          <Dropdown
            id="segmento"
            // value={contacto.idsegmento}
            value={segmentos.find(
              (seg) => seg.idsegmento === contacto.idsegmento
            )}
            options={segmentos} // Usar segmentos pasados como prop
            onChange={(e) => onInputChange(e, "idsegmento")}
            optionLabel="nombresegmento"
            placeholder="Seleccionar Segmento"
            className={submitted && !contacto.segmento ? "p-invalid" : ""}
          />
          {submitted && !contacto.idsegmento && (
            <small className="p-error">Segmento is required.</small>
          )}
        </div>
      </div>
    </Dialog>
  );
};

export default ContactoDialog;
