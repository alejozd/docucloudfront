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
import ClienteDialog from "../pages/ClienteDialog";
import ComprobantePDF from "./ComprobantePDF";
import "../styles/Clientes.css";

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
  const [autoGeneratePDF, setAutoGeneratePDF] = useState(false);
  const [nombreArchivo, setNombreArchivo] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const toast = useRef(null);

  const requestClientes = useCallback(async (method, payload = null, id = null) => {
    const url = `${Config.apiUrl}${CLIENTES_ENDPOINT}${id ? `/${id}` : ""}`;

    if (method === "get") return await axios.get(url);
    if (method === "post") return await axios.post(url, payload);
    if (method === "put") return await axios.put(url, payload);
    if (method === "delete") return await axios.delete(url);

    throw new Error(`Método no soportado: ${method}`);
  }, []);

  const fetchClientes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await requestClientes("get");
      setClientes(getClientesPayload(response.data));
    } catch (error) {
      console.error("Error recuperando clientes", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: getApiMessage(error, "No se pudieron recuperar los clientes"),
        life: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, [requestClientes]);

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
      try {
        setLoading(true);

        if (cliente.idcliente) {
          await requestClientes("put", cliente, cliente.idcliente);
          toast.current.show({
            severity: "success",
            summary: "Realizado",
            detail: "Cliente actualizado",
            life: 3000,
          });
        } else {
          await requestClientes("post", cliente);
          toast.current.show({
            severity: "success",
            summary: "Realizado",
            detail: "Cliente creado",
            life: 3000,
          });
        }

        setClienteDialog(false);
        setCliente(initialClienteState);
        fetchClientes();
      } catch (error) {
        console.error("Error guardando cliente:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: getApiMessage(error, "No se pudo guardar el cliente"),
          life: 5000,
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const editCliente = (rowCliente) => {
    setCliente({ ...rowCliente });
    setClienteDialog(true);
  };

  const confirmDeleteCliente = (rowCliente) => {
    setCliente(rowCliente);
    setDeleteClienteDialog(true);
  };

  const deleteCliente = async () => {
    try {
      await requestClientes("delete", null, cliente.idcliente);
      setClientes((prev) =>
        prev.filter((rowCliente) => rowCliente.idcliente !== cliente.idcliente)
      );
      setDeleteClienteDialog(false);
      setCliente(initialClienteState);
      toast.current.show({
        severity: "success",
        summary: "Realizado",
        detail: "Cliente eliminado",
        life: 3000,
      });
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

  const onInputChange = (event, name) => {
    const value = (event.target && event.target.value) || "";
    setCliente((prev) => ({ ...prev, [name]: value }));
  };

  const handleWhatsAppClick = (phone) => {
    window.open(`https://wa.me/${phone}`, "_blank");
  };

  const handleEmailClick = (email) => {
    window.open(`mailto:${email}`, "_blank");
  };

  const onPhoneChange = (value, name) => {
    setCliente((prev) => ({ ...prev, [name]: value }));
  };

  const handleShowComprobante = (rowCliente, autoGenerate = false) => {
    const productosFicticios = [
      { nombre: "Producto 1", referencia: "REF001", precio: 10.0, cantidad: 2, total: 20.0 },
      { nombre: "Producto 2", referencia: "REF002", precio: 15.0, cantidad: 1, total: 15.0 },
      { nombre: "Producto 3", referencia: "REF003", precio: 5.0, cantidad: 5, total: 25.0 },
    ];

    const datosCli = {
      numerocotizacion: rowCliente.idcliente || "",
      fecha: rowCliente.fechacotizacion || "",
      cliente: {
        nombre: rowCliente.nombres || "",
        identidad: rowCliente.identidad || "",
        direccion: rowCliente.direccion || "",
        telmovil: rowCliente.telefono || "",
        email: rowCliente.email || "",
        notas: rowCliente.notas || "Prueba de notas",
      },
      productos: productosFicticios,
      total: rowCliente.idcliente,
    };

    setAutoGeneratePDF(false);
    setShowComprobante(null);
    setNombreArchivo(`${rowCliente.nombres}-${rowCliente.identidad}`);

    setTimeout(() => {
      setAutoGeneratePDF(autoGenerate);
      setShowComprobante(datosCli);
    }, 0);
  };

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  useEffect(() => {
    if (autoGeneratePDF && showComprobante) {
      // hook reservado para acciones adicionales al autogenerar PDF
    }
  }, [autoGeneratePDF, showComprobante]);

  const tableHeader = (
    <div className="clientes-table-header">
      <IconField iconPosition="left">
        <InputIcon className="pi pi-search" />
        <InputText
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
          placeholder="Buscar por nombre, identidad, teléfono o email"
        />
      </IconField>
      <span>{clientes.length} registros</span>
    </div>
  );

  const kpis = useMemo(
    () => [
      { label: "Total clientes", value: clientes.length },
      { label: "Seleccionados", value: selectedClientes?.length || 0 },
      {
        label: "Con correo",
        value: clientes.filter((rowCliente) => !!rowCliente.email).length,
      },
    ],
    [clientes, selectedClientes]
  );

  const actionBodyTemplate = (rowData) => {
    return (
      <>
        <Button icon="pi pi-pencil" rounded text onClick={() => editCliente(rowData)} />
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
      </>
    );
  };

  const deleteClienteDialogFooter = (
    <>
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
    </>
  );

  return (
    <div className="clientes-page">
      <div className="clientes-header">
        <h1>Clientes</h1>
        <div className="clientes-actions">
          <Button label="Nuevo" icon="pi pi-plus" onClick={openNew} />
          <Button
            label="Actualizar"
            icon="pi pi-refresh"
            severity="secondary"
            onClick={fetchClientes}
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
          value={clientes}
          selection={selectedClientes}
          onSelectionChange={(event) => setSelectedClientes(event.value)}
          dataKey="idcliente"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          scrollable
          size="small"
          loading={loading}
          emptyMessage="No hay registros"
          header={tableHeader}
          globalFilter={globalFilter}
          globalFilterFields={["nombres", "identidad", "direccion", "telefono", "email"]}
        >
          <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
          <Column field="idcliente" header="ID" hidden />
          <Column field="nombres" header="Nombre" frozen alignFrozen="left" sortable />
          <Column field="identidad" header="Identidad" sortable />
          <Column field="direccion" header="Dirección" sortable />
          <Column field="telefono" header="Teléfono" sortable />
          <Column field="email" header="Email" sortable />
          <Column body={actionBodyTemplate} frozen alignFrozen="right" />
        </DataTable>
      </Card>

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
          <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: "2rem" }} />
          {cliente && (
            <span>
              Esta seguro que desea eliminar <b>{cliente.nombres}</b>?
            </span>
          )}
        </div>
      </Dialog>

      <Dialog
        visible={!!showComprobante && !autoGeneratePDF}
        onHide={() => setShowComprobante(null)}
        maximizable
        style={{ width: "80vw", minHeight: "60vh" }}
      >
        {showComprobante && (
          <ComprobantePDF datos={showComprobante} autoGenerate={autoGeneratePDF} />
        )}
      </Dialog>

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
