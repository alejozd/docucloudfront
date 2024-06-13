import React, { useState, useRef } from "react";
import axios from "axios";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toolbar } from "primereact/toolbar";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import Config from "./Config";
import ProductoDialog from "./ProductoDialog";
// import "./Productos.css";

const initialProductoState = {
  idproducto: null,
  nombre: "",
  referencia: "",
  precio: 0,
  codigoBarras: "",
};

const Productos = () => {
  const [productos, setProductos] = useState([]);
  const [productoDialog, setProductoDialog] = useState(false);
  const [deleteProductoDialog, setDeleteProductoDialog] = useState(false);
  const [producto, setProducto] = useState({});
  const [selectedProductos, setSelectedProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const toast = useRef(null);

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${Config.apiUrl}/api/productos`);
      setProductos(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error recuperando productos", error);
      setLoading(false);
    }
  };

  const openNew = () => {
    const newPrecio = producto.idproducto ? producto.precio : 0;
    setProducto({
      ...initialProductoState,
      precio: newPrecio,
    });
    setProductoDialog(true);
  };

  const hideDialog = () => {
    setProductoDialog(false);
    setProducto(initialProductoState);
  };

  const hideDeleteProductoDialog = () => {
    setDeleteProductoDialog(false);
  };

  const saveProducto = async () => {
    if (
      producto.nombre &&
      producto.referencia &&
      producto.precio &&
      producto.codigoBarras
    ) {
      let _productos = [...productos];
      try {
        if (producto.idproducto) {
          setLoading(true);
          const response = await axios.put(
            `${Config.apiUrl}/api/productos/${producto.idproducto}`,
            producto
          );
          const index = _productos.findIndex(
            (p) => p.idproducto === producto.idproducto
          );
          setLoading(false);
          _productos[index] = response.data;
          toast.current.show({
            severity: "success",
            summary: "Realizado",
            detail: "Producto Actualizado",
            life: 3000,
          });
        } else {
          const response = await axios.post(
            `${Config.apiUrl}/api/productos`,
            producto
          );
          _productos.push(response.data);
          toast.current.show({
            severity: "success",
            summary: "Realizado",
            detail: "Producto Creado",
            life: 3000,
          });
        }

        // setProductos(_productos);
        setProductoDialog(false);
        setProducto(initialProductoState);
        setLoading(false);
        fetchProductos();
      } catch (error) {
        console.error("Error guardando producto:", error.response.data.error);
        setLoading(false);
      }
    }
  };

  const editProducto = (producto) => {
    setProducto({ ...producto });
    setProductoDialog(true);
  };

  const confirmDeleteProducto = (producto) => {
    setProducto(producto);
    setDeleteProductoDialog(true);
  };

  const deleteProducto = async () => {
    await axios.delete(`${Config.apiUrl}/api/productos/${producto.idproducto}`);
    let _productos = productos.filter(
      (val) => val.idproducto !== producto.idproducto
    );
    setProductos(_productos);
    setDeleteProductoDialog(false);
    setProducto(initialProductoState);
    toast.current.show({
      severity: "success",
      summary: "Realizado",
      detail: "Producto Eliminado",
      life: 3000,
    });
  };

  const onInputChange = (e, name) => {
    const val = (e.target && e.target.value) || "";
    let _producto = { ...producto };
    _producto[`${name}`] = val;
    setProducto(_producto);
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
          onClick={fetchProductos}
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
          onClick={() => editProducto(rowData)}
        />
        <Button
          icon="pi pi-trash"
          rounded
          text
          severity="danger"
          onClick={() => confirmDeleteProducto(rowData)}
        />
      </React.Fragment>
    );
  };

  const deleteProductoDialogFooter = (
    <React.Fragment>
      <Button
        label="No"
        icon="pi pi-times"
        className="p-button-text"
        onClick={hideDeleteProductoDialog}
      />
      <Button
        label="Si"
        icon="pi pi-check"
        className="p-button-text"
        onClick={deleteProducto}
      />
    </React.Fragment>
  );

  const precioBodyTemplate = (rowData) => {
    return rowData.precio.toLocaleString("es-CO", {
      style: "currency",
      currency: "COP",
    });
  };

  return (
    <div className="productos-container">
      <h1>Productos</h1>
      <Toast ref={toast} />
      <Toolbar className="mb-4" start={leftToolbarTemplate}></Toolbar>
      <DataTable
        value={productos}
        selection={selectedProductos}
        onSelectionChange={(e) => setSelectedProductos(e.value)}
        dataKey="idproducto"
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25]}
        scrollable
        size="small"
        loading={loading}
        emptyMessage="No hay registros"
      >
        <Column field="idproducto" header="ID" hidden />
        <Column
          field="nombre"
          header="Nombre"
          frozen
          alignFrozen="left"
          sortable
        />
        <Column field="referencia" header="Referencia" sortable />
        <Column field="precio" header="Precio" body={precioBodyTemplate} />
        <Column field="codigoBarras" header="Código de Barras" />
        <Column body={actionBodyTemplate} frozen alignFrozen="right" />
      </DataTable>

      <ProductoDialog
        visible={productoDialog}
        producto={producto}
        hideDialog={hideDialog}
        saveProducto={saveProducto}
        onInputChange={onInputChange}
        loading={loading}
      />

      <Dialog
        visible={deleteProductoDialog}
        style={{ width: "450px" }}
        header="Confirm"
        modal
        footer={deleteProductoDialogFooter}
        onHide={hideDeleteProductoDialog}
      >
        <div className="confirmation-content">
          <i
            className="pi pi-exclamation-triangle mr-3"
            style={{ fontSize: "2rem" }}
          />
          {producto && (
            <span>
              Esta seguro que desea eliminar <b>{producto.nombre}</b>?
            </span>
          )}
        </div>
      </Dialog>
    </div>
  );
};

export default Productos;
