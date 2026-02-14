import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toolbar } from "primereact/toolbar";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import Config from "../components/features/Config";
import ClienteDialog from "../pages/ClienteDialog";
import ComprobantePDF from "./ComprobantePDF";

const initialClienteState = {
  idcliente: null,
  nombres: "",
  identidad: "",
  direccion: "",
  telefono: "",
  email: "",
};

const getClientesPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.clientes)) return payload.clientes;
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

const CLIENTES_ENDPOINT = "/api/clientes";

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [clienteDialog, setClienteDialog] = useState(false);
  const [deleteClienteDialog, setDeleteClienteDialog] = useState(false);
  const [cliente, setCliente] = useState({});
  const [selectedClientes, setSelectedClientes] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showComprobante, setShowComprobante] = useState(null);
  const [autoGeneratePDF, setAutoGeneratePDF] = useState(false); // Estado para auto-generar PDF
  const [nombreArchivo, setNombreArchivo] = useState(null); //nombre del archivo a generar
  const toast = useRef(null);

  const requestClientes = async (method, payload = null, id = null) => {
    const url = `${Config.apiUrl}${CLIENTES_ENDPOINT}${id ? `/${id}` : ""}`;

    if (method === "get") {
      return await axios.get(url);
    }

    if (method === "post") {
      return await axios.post(url, payload);
    }

    if (method === "put") {
      return await axios.put(url, payload);
    }

    if (method === "delete") {
      return await axios.delete(url);
    }

    throw new Error(`Método no soportado: ${method}`);
  };

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const response = await requestClientes("get");
      const payload = getClientesPayload(response.data);
      setClientes(payload);
      setLoading(false);
      console.log("Clientes recuperados:", payload);
    } catch (error) {
      console.error("Error recuperando clientes", error);
      console.error(
        "Diagnóstico fetchClientes:",
        {
          url: `${Config.apiUrl}${CLIENTES_ENDPOINT}`,
          status: error?.response?.status,
          data: error?.response?.data,
        }
      );
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: getApiMessage(error, "No se pudieron recuperar los clientes"),
        life: 5000,
      });
      setLoading(false);
    }
  };

  const openNew = () => {
    setCliente(initialClienteState);
    setSubmitted(false);
    setClienteDialog(true);
  };

  const hideDialog = () => {
    setSubmitted(false);
    setClienteDialog(false);
  };

  const hideDeleteClienteDialog = () => {
    setDeleteClienteDialog(false);
  };

  const saveCliente = async () => {
    setSubmitted(true);

    if (cliente.nombres && cliente.email) {
      let _clientes = [...clientes];
      try {
        if (cliente.idcliente) {
          setLoading(true);
          const response = await requestClientes(
            "put",
            cliente,
            cliente.idcliente
          );
          const index = _clientes.findIndex(
            (c) => c.idcliente === cliente.idcliente
          );
          setLoading(false);
          _clientes[index] = response.data;
          toast.current.show({
            severity: "success",
            summary: "Realizado",
            detail: "Cliente Actualizado",
            life: 3000,
          });
          console.log("Cliente actualizado:", response.data);
        } else {
          console.log("cliente: ", cliente);
          const response = await requestClientes("post", cliente);
          _clientes.push(response.data);
          toast.current.show({
            severity: "success",
            summary: "Realizado",
            detail: "Cliente Creado",
            life: 3000,
          });
          console.log("Cliente creado:", response.data);
        }

        // setClientes(_clientes);
        setClienteDialog(false);
        setCliente(initialClienteState);
        setLoading(false);
        fetchClientes();
      } catch (error) {
        console.error("Error guardando cliente:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: getApiMessage(error, "No se pudo guardar el cliente"),
          life: 5000,
        });
        setLoading(false);
      }
    }
  };

  const editCliente = (cliente) => {
    setCliente({ ...cliente });
    setClienteDialog(true);
  };

  const confirmDeleteCliente = (cliente) => {
    setCliente(cliente);
    setDeleteClienteDialog(true);
  };

  const deleteCliente = async () => {
    try {
      await requestClientes("delete", null, cliente.idcliente);
      let _clientes = clientes.filter(
        (val) => val.idcliente !== cliente.idcliente
      );
      setClientes(_clientes);
      setDeleteClienteDialog(false);
      setCliente(initialClienteState);
      toast.current.show({
        severity: "success",
        summary: "Realizado",
        detail: "Cliente Eliminado",
        life: 3000,
      });
      console.log("Cliente eliminado:", cliente);
    } catch (error) {
      console.error("Error eliminando cliente:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: getApiMessage(error, "No se pudo eliminar el cliente"),
        life: 5000,
      });
    }
  };

  const onInputChange = (e, name) => {
    const val = (e.target && e.target.value) || "";
    let _cliente = { ...cliente };
    _cliente[`${name}`] = val;
    setCliente(_cliente);
  };

  const handleWhatsAppClick = (phone) => {
    window.open(`https://wa.me/${phone}`, "_blank");
  };

  const handleEmailClick = (email) => {
    window.open(`mailto:${email}`, "_blank");
  };

  const onPhoneChange = (value, name) => {
    let _cliente = { ...cliente };
    _cliente[`${name}`] = value;
    setCliente(_cliente);
  };

  //Para mostrar el dialogo del comprobante
  const handleShowComprobante = (cliente, autoGenerate = false) => {
    // console.log("quotation:", quotation);
    // Datos ficticios de productos
    const productosFicticios = [
      {
        nombre: "Producto 1",
        referencia: "REF001",
        precio: 10.0,
        cantidad: 2,
        total: 20.0,
      },
      {
        nombre: "Producto 2",
        referencia: "REF002",
        precio: 15.0,
        cantidad: 1,
        total: 15.0,
      },
      {
        nombre: "Producto 3",
        referencia: "REF003",
        precio: 5.0,
        cantidad: 5,
        total: 25.0,
      },
    ];

    //Se construye el objeto para enviarlo al dialogo
    const datosCli = {
      numerocotizacion: cliente.idcliente || "",
      fecha: cliente.fechacotizacion || "",
      cliente: {
        nombre: cliente.nombres || "",
        identidad: cliente.identidad || "",
        direccion: cliente.direccion || "",
        telmovil: cliente.telefono || "",
        email: cliente.email || "",
        notas: cliente.notas || "Prueba de notas",
      },
      productos: productosFicticios.map((producto) => ({
        nombre: producto.nombre,
        referencia: producto.referencia,
        precio: producto.precio,
        cantidad: producto.cantidad,
        total: producto.total,
      })),
      total: cliente.idcliente,
    };
    console.log("datosCli:", datosCli);

    // Restablecer el estado antes de actualizarlo
    setAutoGeneratePDF(false);
    setShowComprobante(null);
    setNombreArchivo(cliente.nombres + "-" + cliente.identidad);
    // Usar un timeout para asegurar que el estado se restablezca antes de actualizarlo
    setTimeout(() => {
      setAutoGeneratePDF(autoGenerate);
      setShowComprobante(datosCli);
    }, 0);
  };

  useEffect(() => {
    if (autoGeneratePDF && showComprobante) {
      // Aquí puedes manejar la lógica para generar el PDF automáticamente
      // Por ejemplo, llamar a una función en ComprobantePDF para generar el PDF
    }
  }, [autoGeneratePDF, showComprobante]);

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
          onClick={fetchClientes}
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
          onClick={() => editCliente(rowData)}
        />
        <Button
          icon="pi pi-trash"
          rounded
          text
          severity="danger"
          onClick={() => confirmDeleteCliente(rowData)}
        />
        <Button
          icon="pi pi-whatsapp"
          severity="success"
          rounded
          text
          onClick={() => handleWhatsAppClick(rowData.telefono)}
        />
        <Button
          icon="pi pi-envelope"
          severity="info"
          rounded
          text
          onClick={() => handleEmailClick(rowData.email)}
        />
        <Button
          icon="pi pi-external-link"
          rounded
          text
          severity="info"
          onClick={() => handleShowComprobante(rowData)}
        />
        <Button
          icon="pi pi-file-pdf"
          rounded
          text
          className="p-button-danger"
          onClick={() => handleShowComprobante(rowData, true)}
        />
      </React.Fragment>
    );
  };

  const deleteClienteDialogFooter = (
    <React.Fragment>
      <Button
        label="No"
        icon="pi pi-times"
        className="p-button-text"
        onClick={hideDeleteClienteDialog}
      />
      <Button
        label="Si"
        icon="pi pi-check"
        className="p-button-text"
        onClick={deleteCliente}
      />
    </React.Fragment>
  );

  return (
    <div className="flex-column">
      <h1>Clientes</h1>
      <Toast ref={toast} />
      <div className="card">
        <Toolbar className="mb-4" start={leftToolbarTemplate}></Toolbar>
      </div>
      <div className="card">
        <DataTable
          value={clientes}
          selection={selectedClientes}
          onSelectionChange={(e) => setSelectedClientes(e.value)}
          dataKey="idcliente"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          scrollable
          size="small"
          loading={loading}
          emptyMessage="No hay registros"
        >
          <Column field="idcliente" header="ID" hidden />
          <Column
            field="nombres"
            header="Nombre"
            frozen
            alignFrozen="left"
            sortable
          />
          <Column field="identidad" header="Identidad" sortable />
          <Column field="direccion" header="Dirección" sortable />
          <Column field="telefono" header="Teléfono" sortable />
          <Column field="email" header="Email" sortable />
          <Column body={actionBodyTemplate} frozen alignFrozen="right" />
        </DataTable>
      </div>

      <ClienteDialog
        visible={clienteDialog}
        cliente={cliente}
        submitted={submitted}
        hideDialog={hideDialog}
        saveCliente={saveCliente}
        onInputChange={onInputChange}
        onPhoneChange={onPhoneChange}
        loading={loading}
      />

      <Dialog
        visible={deleteClienteDialog}
        style={{ width: "450px" }}
        header="Confirm"
        modal
        footer={deleteClienteDialogFooter}
        onHide={hideDeleteClienteDialog}
      >
        <div className="confirmation-content">
          <i
            className="pi pi-exclamation-triangle mr-3"
            style={{ fontSize: "2rem" }}
          />
          {cliente && (
            <span>
              Esta seguro que desea eliminar <b>{cliente.nombres}</b>?
            </span>
          )}
        </div>
      </Dialog>
      {/* Diálogo para mostrar el comprobante */}
      <Dialog
        visible={!!showComprobante && !autoGeneratePDF}
        onHide={() => setShowComprobante(null)}
        maximizable
        style={{ width: "80vw", minHeight: "60vh" }}
      >
        {showComprobante && (
          <ComprobantePDF
            datos={showComprobante}
            autoGenerate={autoGeneratePDF}
          />
        )}
      </Dialog>

      {/* Componente oculto para generar PDF automáticamente */}
      {autoGeneratePDF && (
        <ComprobantePDF
          datos={showComprobante}
          autoGenerate={autoGeneratePDF}
          nombreArchivo={nombreArchivo}
        />
      )}
    </div>
  );
};

export default Clientes;
