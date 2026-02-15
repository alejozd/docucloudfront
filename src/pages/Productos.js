import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import Config from "../components/features/Config";
import ProductoDialog from "./ProductoDialog";

const initialProductoState = {
  idproducto: null,
  nombre: "",
  referencia: "",
  precio: 0,
  codigoBarras: "",
};

const PRODUCTOS_ENDPOINT = "/api/productos";

const getProductosPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.productos)) return payload.productos;
  return [];
};

const getApiMessage = (error, fallbackMessage) => {
  return (
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    fallbackMessage
  );
};

const Productos = () => {
  const [productos, setProductos] = useState([]);
  const [productoDialog, setProductoDialog] = useState(false);
  const [deleteProductoDialog, setDeleteProductoDialog] = useState(false);
  const [producto, setProducto] = useState(initialProductoState);
  const [selectedProductos, setSelectedProductos] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const toast = useRef(null);

  const requestProductos = useCallback(async (method, payload = null, id = null) => {
    const url = `${Config.apiUrl}${PRODUCTOS_ENDPOINT}${id ? `/${id}` : ""}`;

    if (method === "get") return await axios.get(url);
    if (method === "post") return await axios.post(url, payload);
    if (method === "put") return await axios.put(url, payload);
    if (method === "delete") return await axios.delete(url);

    throw new Error(`Método no soportado: ${method}`);
  }, []);

  const fetchProductos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await requestProductos("get");
      setProductos(getProductosPayload(response.data));
    } catch (error) {
      console.error("Error recuperando productos", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: getApiMessage(error, "No se pudieron recuperar los productos"),
        life: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, [requestProductos]);

  const openNew = () => {
    setProducto(initialProductoState);
    setSubmitted(false);
    setProductoDialog(true);
  };

  const hideDialog = () => {
    setSubmitted(false);
    setProductoDialog(false);
  };

  const hideDeleteProductoDialog = () => {
    setDeleteProductoDialog(false);
  };

  const saveProducto = async () => {
    setSubmitted(true);

    if (producto.nombre && producto.referencia && producto.precio && producto.codigoBarras) {
      try {
        setLoading(true);

        if (producto.idproducto) {
          await requestProductos("put", producto, producto.idproducto);
          toast.current?.show({
            severity: "success",
            summary: "Realizado",
            detail: "Producto actualizado",
            life: 3000,
          });
        } else {
          await requestProductos("post", producto);
          toast.current?.show({
            severity: "success",
            summary: "Realizado",
            detail: "Producto creado",
            life: 3000,
          });
        }

        setProductoDialog(false);
        setProducto(initialProductoState);
        fetchProductos();
      } catch (error) {
        console.error("Error guardando producto:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: getApiMessage(error, "No se pudo guardar el producto"),
          life: 5000,
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const editProducto = (rowProducto) => {
    setProducto({ ...rowProducto });
    setSubmitted(false);
    setProductoDialog(true);
  };

  const confirmDeleteProducto = (rowProducto) => {
    setProducto(rowProducto);
    setDeleteProductoDialog(true);
  };

  const deleteProducto = async () => {
    try {
      await requestProductos("delete", null, producto.idproducto);
      setProductos((prev) =>
        prev.filter((rowProducto) => rowProducto.idproducto !== producto.idproducto)
      );
      setDeleteProductoDialog(false);
      setProducto(initialProductoState);
      toast.current?.show({
        severity: "success",
        summary: "Realizado",
        detail: "Producto eliminado",
        life: 3000,
      });
    } catch (error) {
      console.error("Error eliminando producto:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: getApiMessage(error, "No se pudo eliminar el producto"),
        life: 5000,
      });
    }
  };

  const onInputChange = (event, name) => {
    const value = (event.target && event.target.value) || "";
    setProducto((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    fetchProductos();
  }, [fetchProductos]);

  const tableHeader = (
    <div className="clientes-table-header">
      <IconField iconPosition="left">
        <InputIcon className="pi pi-search" />
        <InputText
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
          placeholder="Buscar por nombre, referencia o código de barras"
        />
      </IconField>
      <span>{productos.length} registros</span>
    </div>
  );

  const kpis = useMemo(
    () => [
      { label: "Total productos", value: productos.length },
      { label: "Seleccionados", value: selectedProductos?.length || 0 },
      {
        label: "Con precio",
        value: productos.filter((rowProducto) => Number(rowProducto.precio) > 0).length,
      },
    ],
    [productos, selectedProductos]
  );

  const actionBodyTemplate = (rowData) => {
    return (
      <>
        <Button icon="pi pi-pencil" rounded text onClick={() => editProducto(rowData)} />
        <Button
          icon="pi pi-trash"
          rounded
          text
          severity="danger"
          onClick={() => confirmDeleteProducto(rowData)}
        />
      </>
    );
  };

  const deleteProductoDialogFooter = (
    <>
      <Button
        label="No"
        icon="pi pi-times"
        className="p-button-text"
        onClick={hideDeleteProductoDialog}
      />
      <Button label="Si" icon="pi pi-check" className="p-button-text" onClick={deleteProducto} />
    </>
  );

  const precioBodyTemplate = (rowData) => {
    return Number(rowData.precio || 0).toLocaleString("es-CO", {
      style: "currency",
      currency: "COP",
    });
  };

  return (
    <div className="clientes-page">
      <div className="clientes-header">
        <h1>Productos</h1>
        <div className="clientes-actions">
          <Button label="Nuevo" icon="pi pi-plus" onClick={openNew} />
          <Button
            label="Actualizar"
            icon="pi pi-refresh"
            severity="secondary"
            onClick={fetchProductos}
            loading={loading}
          />
        </div>
      </div>

      <div className="clientes-kpis">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="clientes-kpi">
            <p className="clientes-kpi-label">{kpi.label}</p>
            <p className="clientes-kpi-value">{kpi.value}</p>
          </Card>
        ))}
      </div>

      <Toast ref={toast} />

      <Card className="clientes-table-card">
        <DataTable
          value={productos}
          selection={selectedProductos}
          onSelectionChange={(event) => setSelectedProductos(event.value)}
          dataKey="idproducto"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          scrollable
          size="small"
          loading={loading}
          emptyMessage="No hay registros"
          header={tableHeader}
          globalFilter={globalFilter}
          globalFilterFields={["nombre", "referencia", "codigoBarras"]}
        >
          <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
          <Column field="idproducto" header="ID" hidden />
          <Column field="nombre" header="Nombre" frozen alignFrozen="left" sortable />
          <Column field="referencia" header="Referencia" sortable />
          <Column field="precio" header="Precio" body={precioBodyTemplate} sortable />
          <Column field="codigoBarras" header="Código de barras" sortable />
          <Column body={actionBodyTemplate} frozen alignFrozen="right" />
        </DataTable>
      </Card>

      <ProductoDialog
        visible={productoDialog}
        producto={producto}
        submitted={submitted}
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
          <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: "2rem" }} />
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
