import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import PhoneInput from "react-phone-number-input";
import { TabView, TabPanel } from "primereact/tabview";
import ClienteDialogAdicional from "././ClienteDialogAdicional";
import ClienteDialogFE from "././ClienteDialogFE";
import "react-phone-number-input/style.css";
// import "./ClienteDialog.css";
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
  const [completedTabs, setCompletedTabs] = useState({
    basicos: false,
    adicionales: false,
    fe: false,
  });

  const [selectedRegimen, setSelectedRegimen] = useState(null);
  const [checkedAreaICA, setCheckedAreaICA] = useState(false);
  const [selectedRegimenFEL, setSelectedRegimenFEL] = useState(null);
  const [selectedResponsabilidadFEL, setSelectedResponsabilidadFEL] =
    useState(null);

  const resetForm = () => {
    setActiveIndex(0);
    setSelectedRegimen(null);
    setCheckedAreaICA(false);
    setSelectedRegimenFEL(null);
    setSelectedResponsabilidadFEL(null);
    setCompletedTabs({
      basicos: false,
      adicionales: false,
      fe: false,
    });
  };

  const handleHideDialog = () => {
    resetForm();
    hideDialog();
  };

  const clienteDialogFooter = (
    <React.Fragment>
      <Button
        label="Cancelar"
        icon="pi pi-times"
        outlined
        severity="danger"
        onClick={handleHideDialog}
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

  useEffect(() => {
    const isBasicosComplete =
      cliente.nombres &&
      cliente.identidad &&
      cliente.email &&
      cliente.telefono &&
      cliente.direccion;
    const isAdicionalesComplete = selectedRegimen !== null && checkedAreaICA;
    const isFEComplete =
      selectedRegimenFEL !== null && selectedResponsabilidadFEL !== null;

    setCompletedTabs({
      basicos: isBasicosComplete,
      adicionales: isAdicionalesComplete,
      fe: isFEComplete,
    });
  }, [
    cliente,
    selectedRegimen,
    checkedAreaICA,
    selectedRegimenFEL,
    selectedResponsabilidadFEL,
  ]);

  const getTabHeader = (title, isComplete) => (
    <span style={{ color: isComplete ? "var(--green-500)" : "inherit" }}>
      {isComplete && (
        <i className="pi pi-check-circle" style={{ marginRight: "0.5em" }}></i>
      )}
      {title}
    </span>
  );

  const getButtonClass = (isComplete, isActive) => {
    if (isComplete) {
      return "p-button-success";
    } else if (isActive) {
      return "p-button-primary";
    } else {
      return "p-button-outlined";
    }
  };

  return (
    <Dialog
      visible={visible}
      style={{ width: "60vw", maxWidth: "650px", minHeight: "400px" }}
      header="Detalle - Cliente"
      modal
      footer={clienteDialogFooter}
      onHide={handleHideDialog}
      className="p-fluid"
    >
      <div className="card" style={{ minHeight: "350px" }}>
        <div className="flex mb-2 gap-2 justify-content-end">
          {[0, 1, 2].map((index) => (
            <Button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`w-2rem h-2rem p-0 ${getButtonClass(
                completedTabs[Object.keys(completedTabs)[index]],
                activeIndex === index
              )}`}
              rounded
              outlined={activeIndex !== index}
              label={(index + 1).toString()}
            />
          ))}
        </div>

        <TabView
          activeIndex={activeIndex}
          onTabChange={(e) => setActiveIndex(e.index)}
        >
          <TabPanel header={getTabHeader("Basicos", completedTabs.basicos)}>
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
                <PhoneInput
                  id="telefono"
                  international
                  defaultCountry="CO"
                  labels={es}
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
          <TabPanel
            header={getTabHeader("Adicionales", completedTabs.adicionales)}
          >
            <ClienteDialogAdicional
              selectedRegimen={selectedRegimen}
              setSelectedRegimen={setSelectedRegimen}
              checkedAreaICA={checkedAreaICA}
              setCheckedAreaICA={setCheckedAreaICA}
            />
          </TabPanel>
          <TabPanel header={getTabHeader("FE", completedTabs.fe)}>
            <ClienteDialogFE
              selectedRegimenFEL={selectedRegimenFEL}
              setSelectedRegimenFEL={setSelectedRegimenFEL}
              selectedResponsabilidadFEL={selectedResponsabilidadFEL}
              setSelectedResponsabilidadFEL={setSelectedResponsabilidadFEL}
            />
          </TabPanel>
        </TabView>
      </div>
    </Dialog>
  );
};

export default ClienteDialog;
