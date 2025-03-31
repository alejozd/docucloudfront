import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toolbar } from "primereact/toolbar";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { MultiSelect } from "primereact/multiselect";
import Config from "./../components/features/Config";
import ContactoDialog from "././ContactoDialog";
import ComprobantePDF from "././ComprobantePDF";
// import "./Clientes.css"; // Importa el archivo CSS

const initialContactoState = {
  idcontacto: null,
  nombresca: "",
  identidadca: "",
  direccionca: "",
  telefonoca: "",
  emailca: "",
  segmento: null, // Añadir el campo para el segmento
};

const Contactos = () => {
  const [contactos, setContactos] = useState([]);
  const [contactoDialog, setContactoDialog] = useState(false);
  const [deleteContactoDialog, setDeleteContactoDialog] = useState(false);
  const [contacto, setContacto] = useState({});
  const [selectedContactos, setSelectedContactos] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showComprobante, setShowComprobante] = useState(null);
  const [autoGeneratePDF, setAutoGeneratePDF] = useState(false); // Estado para auto-generar PDF
  const [nombreArchivo, setNombreArchivo] = useState(null); //nombre del archivo a generar
  const [segmentos, setSegmentos] = useState([]);
  const toast = useRef(null);

  const fetchContactos = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${Config.apiUrl}/api/contactos`);
      setContactos(response.data);
      setLoading(false);
      console.log("Contactos recuperados:", response.data);
    } catch (error) {
      console.error("Error recuperando contactos", error);
      setLoading(false);
    }
  };

  const fetchSegmentos = async () => {
    try {
      const response = await axios.get(`${Config.apiUrl}/api/segmentos`);
      // console.log("Segmentos recuperados:", response.data);
      setSegmentos(response.data);
    } catch (error) {
      console.error("Error recuperando segmentos", error);
    }
  };

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
      let _contactos = [...contactos];
      try {
        if (contacto.idcontacto) {
          console.log("contacto actaulizar: ", contacto);
          setLoading(true);
          const response = await axios.put(
            `${Config.apiUrl}/api/contactos/${contacto.idcontacto}`,
            contacto
          );
          const index = _contactos.findIndex(
            (c) => c.idcontacto === contacto.idcontacto
          );
          setLoading(false);
          _contactos[index] = response.data;
          toast.current.show({
            severity: "success",
            summary: "Realizado",
            detail: "Contacto Actualizado",
            life: 3000,
          });
          console.log("Contacto actualizado:", response.data);
        } else {
          console.log("contacto crear: ", contacto);
          const response = await axios.post(
            `${Config.apiUrl}/api/contactos`,
            contacto
          );
          _contactos.push(response.data);
          toast.current.show({
            severity: "success",
            summary: "Realizado",
            detail: "Contacto Creado",
            life: 3000,
          });
          console.log("Contacto creado:", response.data);
        }

        // setContactos(_contactos);
        setContactoDialog(false);
        setContacto(initialContactoState);
        setLoading(false);
        fetchContactos();
      } catch (error) {
        console.error("Error guardando contacto:", error.response.data.error);
        setLoading(false);
      }
    }
  };

  const editContacto = (contacto) => {
    setContacto({ ...contacto });
    setContactoDialog(true);
  };

  const confirmDeleteContacto = (contacto) => {
    setContacto(contacto);
    setDeleteContactoDialog(true);
  };

  const deleteContacto = async () => {
    try {
      await axios.delete(
        `${Config.apiUrl}/api/contacto/${contacto.idcontacto}`
      );
      let _contactos = contacto.filter(
        (val) => val.idcontacto !== contacto.idcontacto
      );
      setContactos(_contactos);
      setDeleteContactoDialog(false);
      setContacto(initialContactoState);
      toast.current.show({
        severity: "success",
        summary: "Realizado",
        detail: "Contacto Eliminado",
        life: 3000,
      });
      console.log("Contacto eliminado:", contacto);
    } catch (error) {
      console.error("Error eliminando contacto:", error);
    }
  };

  const onInputChange = (e, name) => {
    if (name === "idsegmento") {
      // Si es el campo idsegmento, extraemos el idsegmento del objeto
      const selectedSegmento = e.value;
      setContacto((prevContacto) => ({
        ...prevContacto,
        idsegmento: selectedSegmento ? selectedSegmento.idsegmento : null,
      }));
    } else {
      // Para otros campos, simplemente actualizamos con el valor del campo
      const val = e.target.value;
      setContacto((prevContacto) => ({
        ...prevContacto,
        [name]: val,
      }));
    }
  };

  const handleWhatsAppClick = (phone) => {
    window.open(`https://wa.me/${phone}`, "_blank");
  };

  const handleEmailClick = (email) => {
    window.open(`mailto:${email}`, "_blank");
  };

  const onPhoneChange = (value, name) => {
    let _contacto = { ...contacto };
    _contacto[`${name}`] = value;
    setContacto(_contacto);
  };

  //Para mostrar el dialogo del comprobante
  const handleShowComprobante = (contacto, autoGenerate = false) => {
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
    const datosContacto = {
      numerocotizacion: contacto.idcontacto || "",
      fecha: contacto.fechacotizacion || "",
      contacto: {
        nombre: contacto.nombresca || "",
        identidad: contacto.identidadca || "",
        direccion: contacto.direccionca || "",
        telmovil: contacto.telefonoca || "",
        email: contacto.emailca || "",
        notas: contacto.notas || "Prueba de notas",
      },
      productos: productosFicticios.map((producto) => ({
        nombre: producto.nombre,
        referencia: producto.referencia,
        precio: producto.precio,
        cantidad: producto.cantidad,
        total: producto.total,
      })),
      total: contacto.idcontacto,
    };
    console.log("datosCli:", datosContacto);

    // Restablecer el estado antes de actualizarlo
    setAutoGeneratePDF(false);
    setShowComprobante(null);
    setNombreArchivo(contacto.nombresca + "-" + contacto.identidadca);
    // Usar un timeout para asegurar que el estado se restablezca antes de actualizarlo
    setTimeout(() => {
      setAutoGeneratePDF(autoGenerate);
      setShowComprobante(datosContacto);
    }, 0);
  };

  useEffect(() => {
    if (autoGeneratePDF && showComprobante) {
      // Aquí puedes manejar la lógica para generar el PDF automáticamente
      // Por ejemplo, llamar a una función en ComprobantePDF para generar el PDF
    }
    fetchSegmentos();
  }, [autoGeneratePDF, showComprobante]);

  const segmentoFilterTemplate = (options) => {
    return (
      <MultiSelect
        value={options.value}
        options={segmentos} // Usamos los segmentos recuperados del backend
        onChange={(e) => options.filterApplyCallback(e.value)}
        optionLabel="nombresegmento" // Campo a mostrar en el dropdown
        placeholder="Seleccionar Segmento"
        className="p-column-filter"
        showClear
        style={{ minWidth: "14px" }}
      />
    );
  };

  const customFilter = (value, filter) => {
    // console.log("value:", value);
    // console.log("filter:", filter);
    if (!filter || filter.length === 0) {
      return true; // No hay filtro aplicado
    }
    return filter.some((segmento) => segmento.nombresegmento === value);
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
          onClick={fetchContactos}
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
          onClick={() => editContacto(rowData)}
        />
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
      </React.Fragment>
    );
  };

  const deleteContactoDialogFooter = (
    <React.Fragment>
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
    </React.Fragment>
  );

  return (
    <div className="flex-column">
      <h1>Contactos</h1>
      <Toast ref={toast} />
      <div className="card">
        <Toolbar className="mb-4" start={leftToolbarTemplate}></Toolbar>
      </div>
      <div className="card">
        <DataTable
          value={contactos}
          selection={selectedContactos}
          onSelectionChange={(e) => setSelectedContactos(e.value)}
          dataKey="idcontacto"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          scrollable
          size="small"
          loading={loading}
          emptyMessage="No hay registros"
          filterDisplay="menu"
        >
          <Column field="idcontacto" header="ID" hidden />
          <Column
            field="nombresca"
            header="Nombre"
            frozen
            alignFrozen="left"
            sortable
          />
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
            showFilterMenuOptions={false} // No mostrar iconos de filtro
            filterMatchMode="custom"
            filterFunction={customFilter}
            // showFilterMenu={false}  // No mostrar menu de filtro
            showClearButton={false}
            showApplyButton={false}
            showAddButton={false}
            filterMenuStyle={{ width: "12rem" }}
            style={{ minWidth: "12rem" }}
          />
          <Column body={actionBodyTemplate} frozen alignFrozen="right" />
        </DataTable>
      </div>

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
          <i
            className="pi pi-exclamation-triangle mr-3"
            style={{ fontSize: "2rem" }}
          />
          {contacto && (
            <span>
              Esta seguro que desea eliminar <b>{contacto.nombresca}</b>?
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

export default Contactos;
