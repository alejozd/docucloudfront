import React, { useState } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button"; // Librería para enviar correos electrónicos
// import { InputMask } from "primereact/inputmask";
import PhoneInput from "react-phone-number-input";
import { TabView, TabPanel } from "primereact/tabview";
import ClienteDialogAdicional from "./ClienteDialogAdicional";
import ClienteDialogFE from "./ClienteDialogFE";
import "react-phone-number-input/style.css"; // Importa los estilos de la librería
import "./ClienteDialog.css";
import es from "react-phone-number-input/locale/es";

const ClienteDialog = ({
  visible,
  cliente,
  submitted,
  hideDialog,
  saveCliente,
  onInputChange,
  onPhoneChange,
  loading,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);

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

  // const telefonoInicial = cliente.telefono ? cliente.telefono : "(57) ";
  // const handlePhoneChange = (value) => {
  //   const event = {
  //     target: {
  //       name: "telefono",
  //       value,
  //     },
  //   };
  //   onInputChange(event, "telefono");
  // };

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
      <div className="card">
        <div className="flex mb-2 gap-2 justify-content-end">
          <Button
            onClick={() => setActiveIndex(0)}
            className="w-2rem h-2rem p-0"
            rounded
            outlined={activeIndex !== 0}
            label="1"
          />
          <Button
            onClick={() => setActiveIndex(1)}
            className="w-2rem h-2rem p-0"
            rounded
            outlined={activeIndex !== 1}
            label="2"
          />
          <Button
            onClick={() => setActiveIndex(2)}
            className="w-2rem h-2rem p-0"
            rounded
            outlined={activeIndex !== 2}
            label="3"
          />
        </div>
        <TabView
          activeIndex={activeIndex}
          onTabChange={(e) => setActiveIndex(e.index)}
        >
          <TabPanel header="Basicos">
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
                {/* <InputMask
            id="telefono"
            mask="(99) 999-9999999"
            placeholder="(57) 999-9999999"
            // value={cliente.telefono}
            value={telefonoInicial}
            onChange={(e) => onInputChange(e, "telefono")}
            required
            className={submitted && !cliente.telefono ? "p-invalid" : ""}
          /> */}
                <PhoneInput
                  id="telefono"
                  international
                  defaultCountry="CO"
                  labels={es} //
                  value={cliente.telefono}
                  onChange={(value) => onPhoneChange(value, "telefono")}
                  className="phone-input"
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
          </TabPanel>
          <TabPanel header="Adicionales">
            <ClienteDialogAdicional> </ClienteDialogAdicional>
          </TabPanel>
          <TabPanel header="FE">
            <ClienteDialogFE> </ClienteDialogFE>
          </TabPanel>
        </TabView>
      </div>
    </Dialog>
  );
};

export default ClienteDialog;
