import React from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";

const ProductoDialog = ({
  visible,
  producto,
  submitted,
  hideDialog,
  saveProducto,
  onInputChange,
}) => {
  return (
    <Dialog
      visible={visible}
      onHide={hideDialog}
      header={`${producto.idproducto ? "Editar" : "Nuevo"} Producto`}
      modal
      className="p-fluid"
    >
      <div className="p-field">
        <label htmlFor="nombre">Nombre</label>
        <InputText
          id="nombre"
          value={producto.nombre || ""}
          onChange={(e) => onInputChange(e, "nombre")}
        />
      </div>
      <div className="p-field">
        <label htmlFor="referencia">Referencia</label>
        <InputText
          id="referencia"
          value={producto.referencia || ""}
          onChange={(e) => onInputChange(e, "referencia")}
        />
      </div>
      <div className="p-field">
        <label htmlFor="precio">Precio</label>
        <InputText
          id="precio"
          value={producto.precio || ""}
          onChange={(e) => onInputChange(e, "precio")}
        />
      </div>
      <div className="p-field">
        <label htmlFor="codigoBarras">Código de Barras</label>
        <InputText
          id="codigoBarras"
          value={producto.codigoBarras || ""}
          onChange={(e) => onInputChange(e, "codigoBarras")}
        />
      </div>

      <div className="p-dialog-footer">
        <Button
          label="Cancelar"
          icon="pi pi-times"
          className="p-button-text"
          onClick={hideDialog}
        />
        <Button
          label="Guardar"
          icon="pi pi-check"
          className="p-button-text"
          onClick={saveProducto}
        />
      </div>
    </Dialog>
  );
};

export default ProductoDialog;
