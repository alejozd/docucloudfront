import React, { useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";

const ProductoDialog = ({
  visible,
  producto,
  submitted,
  hideDialog,
  saveProducto,
  onInputChange,
}) => {
  const [formattedPrecio, setFormattedPrecio] = useState(producto.precio || 0);

  const handlePrecioChange = (event) => {
    const newValue = event.value;
    setFormattedPrecio(newValue);
    onInputChange({ target: { value: newValue } }, "precio");
  };

  const productoDialogFooter = (
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
        onClick={saveProducto}
      />
    </React.Fragment>
  );

  return (
    <Dialog
      visible={visible}
      header={`${producto.idproducto ? "Editar" : "Nuevo"} Producto`}
      modal
      className="p-fluid"
      footer={productoDialogFooter}
      onHide={hideDialog}
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
        <InputNumber
          id="precio"
          value={formattedPrecio}
          onValueChange={handlePrecioChange}
          mode="currency"
          currency="COP"
          locale="es-CO"
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
    </Dialog>
  );
};

export default ProductoDialog;
