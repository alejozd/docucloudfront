import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { MultiSelect } from "primereact/multiselect";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import Config from "./../components/features/Config";
import ContactoDialog from "././ContactoDialog";
import ComprobantePDF from "././ComprobantePDF";
import "../styles/Contactos.css";

const initialContactoState = {
  idcontacto: null,
  nombresca: "",
  identidadca: "",
  direccionca: "",
  telefonoca: "",
  emailca: "",
  segmento: null,
};

const getContactosPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.contactos)) return payload.contactos;
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

const CONTACTOS_ENDPOINT = "/api/contactos";

const Contactos = () => {
  const [contactos, setContactos] = useState([]);
  const [contactoDialog, setContactoDialog] = useState(false);
  const [deleteContactoDialog, setDeleteContactoDialog] = useState(false);
  const [contacto, setContacto] = useState({});
  const [selectedContactos, setSelectedContactos] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showComprobante, setShowComprobante] = useState(null);
  const [autoGeneratePDF, setAutoGeneratePDF] = useState(false);
  const [nombreArchivo, setNombreArchivo] = useState(null);
  const [segmentos, setSegmentos] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const toast = useRef(null);

  const requestContactos = useCallback(async (method, payload = null, id = null) => {
    const url = `${Config.apiUrl}${CONTACTOS_ENDPOINT}${id ? `/${id}` : ""}`;

    if (method === "get") return await axios.get(url);
    if (method === "post") return await axios.post(url, payload);
    if (method === "put") return await axios.put(url, payload);
    if (method === "delete") return await axios.delete(url);

    throw new Error(`Método no soportado: ${method}`);
  }, []);

  const fetchContactos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await requestContactos("get");
      setContactos(getContactosPayload(response.data));
    } catch (error) {
      console.error("Error recuperando contactos", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: getApiMessage(error, "No se pudieron recuperar los contactos"),
        life: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, [requestContactos]);

  const fetchSegmentos = useCallback(async () => {
    try {
      const response = await axios.get(`${Config.apiUrl}/api/segmentos`);
      setSegmentos(response.data);
    } catch (error) {
      console.error("Error recuperando segmentos", error);
    }
  }, []);

  const openNew = () => {
    setContacto(initialContactoState);
    setSubmitted(false);
    setContactoDialog(true);
  };

  const hideDialog = () => {
    setSubmitted(false);
    setContactoDialog(false);
  };

  const hideDeleteContactoDialog = () => {
    setDeleteContactoDialog(false);
  };

  const saveContacto = async () => {
    setSubmitted(true);

    if (contacto.nombresca && contacto.emailca) {
      try {
        setLoading(true);

        if (contacto.idcontacto) {
          await requestContactos("put", contacto, contacto.idcontacto);
          toast.current.show({
            severity: "success",
            summary: "Realizado",
            detail: "Contacto actualizado",
            life: 3000,
          });
        } else {
          await requestContactos("post", contacto);
          toast.current.show({
            severity: "success",
            summary: "Realizado",
            detail: "Contacto creado",
            life: 3000,
          });
        }

        setContactoDialog(false);
        setContacto(initialContactoState);
        fetchContactos();
      } catch (error) {
        console.error("Error guardando contacto:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: getApiMessage(error, "No se pudo guardar el contacto"),
          life: 5000,
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const editContacto = (rowContacto) => {
    setContacto({ ...rowContacto });
    setContactoDialog(true);
  };

  const confirmDeleteContacto = (rowContacto) => {
    setContacto(rowContacto);
    setDeleteContactoDialog(true);
  };

  const deleteContacto = async () => {
    try {
      await requestContactos("delete", null, contacto.idcontacto);
      setContactos((prev) =>
        prev.filter((rowContacto) => rowContacto.idcontacto !== contacto.idcontacto)
      );
      setDeleteContactoDialog(false);
      setContacto(initialContactoState);
      toast.current.show({
        severity: "success",
        summary: "Realizado",
        detail: "Contacto eliminado",
        life: 3000,
      });
    } catch (error) {
      console.error("Error eliminando contacto:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: getApiMessage(error, "No se pudo eliminar el contacto"),
        life: 5000,
      });
    }
  };

  const onInputChange = (event, name) => {
    if (name === "idsegmento") {
      const selectedSegmento = event.value;
      setContacto((prev) => ({
        ...prev,
        idsegmento: selectedSegmento ? selectedSegmento.idsegmento : null,
      }));
      return;
    }

    const value = (event.target && event.target.value) || "";
    setContacto((prev) => ({ ...prev, [name]: value }));
  };

  const handleWhatsAppClick = (phone) => {
    window.open(`https://wa.me/${phone}`, "_blank");
  };

  const handleEmailClick = (email) => {
    window.open(`mailto:${email}`, "_blank");
  };

  const onPhoneChange = (value, name) => {
    setContacto((prev) => ({ ...prev, [name]: value }));
  };

  const handleShowComprobante = (rowContacto, autoGenerate = false) => {
    const productosFicticios = [
      { nombre: "Producto 1", referencia: "REF001", precio: 10.0, cantidad: 2, total: 20.0 },
      { nombre: "Producto 2", referencia: "REF002", precio: 15.0, cantidad: 1, total: 15.0 },
      { nombre: "Producto 3", referencia: "REF003", precio: 5.0, cantidad: 5, total: 25.0 },
    ];

    const datosContacto = {
      numerocotizacion: rowContacto.idcontacto || "",
      fecha: rowContacto.fechacotizacion || "",
      contacto: {
        nombre: rowContacto.nombresca || "",
        identidad: rowContacto.identidadca || "",
        direccion: rowContacto.direccionca || "",
        telmovil: rowContacto.telefonoca || "",
        email: rowContacto.emailca || "",
        notas: rowContacto.notas || "Prueba de notas",
      },
      productos: productosFicticios,
      total: rowContacto.idcontacto,
    };

    setAutoGeneratePDF(false);
    setShowComprobante(null);
    setNombreArchivo(`${rowContacto.nombresca}-${rowContacto.identidadca}`);

    setTimeout(() => {
      setAutoGeneratePDF(autoGenerate);
      setShowComprobante(datosContacto);
    }, 0);
  };

  useEffect(() => {
    fetchContactos();
    fetchSegmentos();
  }, [fetchContactos, fetchSegmentos]);

  useEffect(() => {
    if (autoGeneratePDF && showComprobante) {
      // hook reservado para acciones adicionales al autogenerar PDF
    }
  }, [autoGeneratePDF, showComprobante]);

  const segmentoFilterTemplate = (options) => {
    return (
      <MultiSelect
        value={options.value}
        options={segmentos}
        onChange={(event) => options.filterApplyCallback(event.value)}
        optionLabel="nombresegmento"
        placeholder="Seleccionar Segmento"
        className="p-column-filter"
        showClear
        style={{ minWidth: "14rem" }}
      />
    );
  };

  const customFilter = (value, filter) => {
    if (!filter || filter.length === 0) return true;
    return filter.some((segmento) => segmento.nombresegmento === value);
  };

  const tableHeader = (
    <div className="contactos-table-header">
      <IconField iconPosition="left">
        <InputIcon className="pi pi-search" />
        <InputText
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
          placeholder="Buscar por nombre, identidad, teléfono, email o segmento"
        />
      </IconField>
      <span>{contactos.length} registros</span>
    </div>
  );

  const kpis = useMemo(
    () => [
      { label: "Total contactos", value: contactos.length },
      { label: "Seleccionados", value: selectedContactos?.length || 0 },
      {
        label: "Con segmento",
        value: contactos.filter((rowContacto) => !!rowContacto.nombresegmento).length,
      },
    ],
    [contactos, selectedContactos]
  );

  const actionBodyTemplate = (rowData) => {
    return (
      <>
        <Button icon="pi pi-pencil" rounded text onClick={() => editContacto(rowData)} />
        <Button
          icon="pi pi-trash"
          rounded
          text
          severity="danger"
          onClick={() => confirmDeleteContacto(rowData)}
        />
        <Button
          icon="pi pi-whatsapp"
          severity="success"
          rounded
          text
          onClick={() => handleWhatsAppClick(rowData.telefonoca)}
        />
        <Button
          icon="pi pi-envelope"
          severity="info"
          rounded
          text
          onClick={() => handleEmailClick(rowData.emailca)}
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

  const deleteContactoDialogFooter = (
    <>
      <Button
        label="No"
        icon="pi pi-times"
        className="p-button-text"
        onClick={hideDeleteContactoDialog}
      />
      <Button
        label="Si"
        icon="pi pi-check"
        className="p-button-text"
        onClick={deleteContacto}
      />
    </>
  );

  return (
    <div className="contactos-page">
      <div className="contactos-header">
        <h1>Contactos</h1>
        <div className="contactos-actions">
          <Button label="Nuevo" icon="pi pi-plus" onClick={openNew} />
          <Button
            label="Actualizar"
            icon="pi pi-refresh"
            severity="secondary"
            onClick={fetchContactos}
            loading={loading}
          />
        </div>
      </div>

      <div className="contactos-kpis">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="contactos-kpi">
            <p className="contactos-kpi-label">{kpi.label}</p>
            <p className="contactos-kpi-value">{kpi.value}</p>
          </Card>
        ))}
      </div>

      <Toast ref={toast} />

      <Card className="contactos-table-card">
        <DataTable
          value={contactos}
          selection={selectedContactos}
          onSelectionChange={(event) => setSelectedContactos(event.value)}
          dataKey="idcontacto"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          scrollable
          size="small"
          loading={loading}
          emptyMessage="No hay registros"
          filterDisplay="menu"
          header={tableHeader}
          globalFilter={globalFilter}
          globalFilterFields={[
            "nombresca",
            "identidadca",
            "direccionca",
            "telefonoca",
            "emailca",
            "nombresegmento",
          ]}
        >
          <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
          <Column field="idcontacto" header="ID" hidden />
          <Column field="nombresca" header="Nombre" frozen alignFrozen="left" sortable />
          <Column field="identidadca" header="Identidad" sortable />
          <Column field="direccionca" header="Dirección" sortable />
          <Column field="telefonoca" header="Teléfono" sortable />
          <Column field="emailca" header="Email" sortable />
          <Column
            field="nombresegmento"
            header="Segmento"
            sortable
            filterField="nombresegmento"
            filter
            filterElement={segmentoFilterTemplate}
            showFilterMenuOptions={false}
            filterMatchMode="custom"
            filterFunction={customFilter}
            showClearButton={false}
            showApplyButton={false}
            showAddButton={false}
            filterMenuStyle={{ width: "12rem" }}
            style={{ minWidth: "12rem" }}
          />
          <Column body={actionBodyTemplate} frozen alignFrozen="right" />
        </DataTable>
      </Card>

      <ContactoDialog
        visible={contactoDialog}
        contacto={contacto}
        submitted={submitted}
        hideDialog={hideDialog}
        saveContacto={saveContacto}
        onInputChange={onInputChange}
        onPhoneChange={onPhoneChange}
        loading={loading}
        segmentos={segmentos}
      />

      <Dialog
        visible={deleteContactoDialog}
        style={{ width: "450px" }}
        header="Confirm"
        modal
        footer={deleteContactoDialogFooter}
        onHide={hideDeleteContactoDialog}
      >
        <div className="confirmation-content">
          <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: "2rem" }} />
          {contacto && (
            <span>
              Esta seguro que desea eliminar <b>{contacto.nombresca}</b>?
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

export default Contactos;
