import React from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";

const VendedorDialog = ({
  showDialog,
  isEditMode,
  vendedor,
  onClose,
  onSave,
  loading,
  error,
}) => {
  return (
    <Dialog
      visible={showDialog}
      header={isEditMode ? "Editar Vendedor" : "Nuevo Vendedor"}
      onHide={onClose}
      style={{ width: "400px" }}
    >
      <div style={{ marginBottom: "12px" }}>
        <label
          htmlFor="nombre"
          style={{ display: "block", marginBottom: "6px" }}
        >
          Nombre:
        </label>
        <InputText
          id="nombre"
          value={vendedor.nombre}
          onChange={(e) =>
            vendedor.setVendedor({ ...vendedor, nombre: e.target.value })
          }
          placeholder="Nombre del vendedor"
          style={{ width: "100%" }}
        />
      </div>
      <div style={{ marginBottom: "12px" }}>
        <label
          htmlFor="telefono"
          style={{ display: "block", marginBottom: "6px" }}
        >
          Teléfono:
        </label>
        <InputText
          id="telefono"
          value={vendedor.telefono}
          onChange={(e) =>
            vendedor.setVendedor({ ...vendedor, telefono: e.target.value })
          }
          placeholder="Teléfono del vendedor"
          style={{ width: "100%" }}
        />
      </div>
      <div style={{ marginBottom: "12px" }}>
        <label
          htmlFor="activo"
          style={{ display: "block", marginBottom: "6px" }}
        >
          Activo:
        </label>
        <input
          type="checkbox"
          checked={vendedor.activo}
          onChange={(e) =>
            vendedor.setVendedor({ ...vendedor, activo: e.target.checked })
          }
        />
      </div>
      <Button
        label="Guardar"
        onClick={onSave}
        disabled={loading}
        className="p-button-raised p-button-primary"
      />
      {error && <p style={{ color: "red", marginTop: "12px" }}>{error}</p>}
    </Dialog>
  );
};

export default VendedorDialog;
