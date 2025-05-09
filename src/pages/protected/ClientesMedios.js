// ClientesMedios.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import Config from "../../components/features/Config";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputSwitch } from "primereact/inputswitch";
import { Dropdown } from "primereact/dropdown";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { FilterMatchMode } from "primereact/api";
import { Toast } from "primereact/toast";

const ClientesMedios = ({ jwtToken }) => {
  const [clientes, setClientes] = useState([]);
  const [cliente, setCliente] = useState({
    id: null,
    nombre_completo: "",
    email: "",
    telefono: "",
    empresa: "",
    direccion: "",
    activo: true,
    vendedor: null,
  });
  const [vendedores, setVendedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });
  const toast = React.useRef(null);

  // Cargar clientes al iniciar el componente
  useEffect(() => {
    fetchClientes();
    fetchVendedores();
  }, [jwtToken]);

  // Manejo del filtro global
  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    let _filters = { ...filters };
    _filters["global"].value = value;

    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  // Encabezado con Input global
  const renderHeader = () => {
    return (
      <div className="flex justify-content-end">
        <IconField iconPosition="left">
          <InputIcon className="pi pi-search" />
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder="Buscar nombre..."
          />
        </IconField>
      </div>
    );
  };

  const header = renderHeader();

  // Función para cargar clientes desde el backend
  const fetchClientes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${Config.apiUrl}/api/clientes-medios`, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      setClientes(response.data);
    } catch (err) {
      console.error(err);
      setError("Error al cargar los clientes.");
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar los clientes",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar los vendedores desde el backend
  const fetchVendedores = async () => {
    try {
      const response = await axios.get(`${Config.apiUrl}/api/vendedores`, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      setVendedores(response.data);
    } catch (err) {
      console.error("Error al cargar los vendedores:", err.message);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar los vendedores",
        life: 3000,
      });
    }
  };

  // Función para abrir el diálogo de creación/edición
  const openDialog = (clienteSeleccionado = null) => {
    if (clienteSeleccionado) {
      setCliente(clienteSeleccionado);
      setIsEditMode(true);
    } else {
      setCliente({
        id: null,
        nombre_completo: "",
        email: "",
        telefono: "",
        empresa: "",
        direccion: "",
        activo: true,
        vendedor: null,
      });
      setIsEditMode(false);
    }
    setShowDialog(true);
  };

  // Función para cerrar el diálogo
  const closeDialog = () => {
    setShowDialog(false);
    setCliente({
      id: null,
      nombre_completo: "",
      email: "",
      telefono: "",
      empresa: "",
      direccion: "",
      activo: true,
      vendedor: null,
    });
  };

  // Función para crear o actualizar un cliente
  const saveCliente = async () => {
    if (
      !cliente.nombre_completo.trim() ||
      !cliente.email.trim() ||
      !cliente.telefono.trim()
    ) {
      setError("Por favor ingresa todos los campos obligatorios.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isEditMode) {
        // Actualizar cliente existente
        await axios.put(
          `${Config.apiUrl}/api/clientes-medios/${cliente.id}`,
          cliente,
          { headers: { Authorization: `Bearer ${jwtToken}` } }
        );
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Cliente actualizado exitosamente",
          life: 3000,
        });
      } else {
        // Crear nuevo cliente
        console.log("cliente", cliente);
        await axios.post(`${Config.apiUrl}/api/clientes-medios`, cliente, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Cliente creado exitosamente",
          life: 3000,
        });
      }

      closeDialog();
      fetchClientes(); // Recargar la lista de clientes
    } catch (err) {
      console.error(err);
      setError("Error al guardar el cliente.");
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al guardar el cliente",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar un cliente
  const deleteCliente = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este cliente?")) {
      setLoading(true);
      setError(null);

      try {
        await axios.delete(`${Config.apiUrl}/api/clientes-medios/${id}`, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Cliente eliminado exitosamente",
          life: 3000,
        });
        fetchClientes(); // Recargar la lista de clientes
      } catch (err) {
        console.error(err);
        setError("Error al eliminar el cliente.");
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "Error al eliminar el cliente",
          life: 3000,
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // Renderizar el diálogo de creación/edición
  const renderDialog = () => {
    return (
      <Dialog
        visible={showDialog}
        header={isEditMode ? "Editar Cliente" : "Nuevo Cliente"}
        onHide={closeDialog}
        style={{ width: "400px" }}
      >
        <div style={{ marginBottom: "12px" }}>
          <label
            htmlFor="nombre_completo"
            style={{ display: "block", marginBottom: "6px" }}
          >
            Nombre Completo:
          </label>
          <InputText
            id="nombre_completo"
            value={cliente.nombre_completo}
            onChange={(e) =>
              setCliente({ ...cliente, nombre_completo: e.target.value })
            }
            placeholder="Nombre completo del cliente"
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ marginBottom: "12px" }}>
          <label
            htmlFor="email"
            style={{ display: "block", marginBottom: "6px" }}
          >
            Email:
          </label>
          <InputText
            id="email"
            value={cliente.email}
            onChange={(e) => setCliente({ ...cliente, email: e.target.value })}
            placeholder="Email del cliente"
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
            value={cliente.telefono}
            onChange={(e) =>
              setCliente({ ...cliente, telefono: e.target.value })
            }
            placeholder="Teléfono del cliente"
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ marginBottom: "12px" }}>
          <label
            htmlFor="empresa"
            style={{ display: "block", marginBottom: "6px" }}
          >
            Empresa:
          </label>
          <InputText
            id="empresa"
            value={cliente.empresa}
            onChange={(e) =>
              setCliente({ ...cliente, empresa: e.target.value })
            }
            placeholder="Empresa del cliente"
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ marginBottom: "12px" }}>
          <label
            htmlFor="direccion"
            style={{ display: "block", marginBottom: "6px" }}
          >
            Dirección:
          </label>
          <InputText
            id="direccion"
            value={cliente.direccion}
            onChange={(e) =>
              setCliente({ ...cliente, direccion: e.target.value })
            }
            placeholder="Dirección del cliente"
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ marginBottom: "12px" }}>
          <label
            htmlFor="vendedor_id"
            style={{ display: "block", marginBottom: "6px" }}
          >
            Vendedor
          </label>
          <Dropdown
            id="vendedor_id"
            value={cliente.vendedor_id || null}
            options={vendedores}
            onChange={(e) => setCliente({ ...cliente, vendedor_id: e.value })}
            optionLabel="nombre"
            optionValue="id"
            placeholder="Selecciona un vendedor"
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
          <InputSwitch
            checked={cliente.activo}
            onChange={(e) => setCliente({ ...cliente, activo: e.value })}
          />
        </div>
        <Button
          label="Guardar"
          onClick={saveCliente}
          disabled={loading}
          className="p-button-raised p-button-primary"
        />
        {error && <p style={{ color: "red", marginTop: "12px" }}>{error}</p>}
      </Dialog>
    );
  };

  // Renderizar el DataTable
  const renderDataTable = () => {
    return (
      <div className="card">
        <DataTable
          value={clientes}
          loading={loading}
          paginator
          rows={10}
          dataKey="id"
          rowsPerPageOptions={[5, 10, 20]}
          emptyMessage="No se encontraron clientes."
          stripedRows
          filters={filters}
          globalFilterFields={["nombre_completo", "vendedor.nombre"]}
          header={header}
          filterDisplay="row"
        >
          <Column field="id" header="ID" />
          <Column field="nombre_completo" header="Nombre" sortable />
          <Column field="email" header="Email" />
          <Column field="telefono" header="Teléfono" />
          <Column
            field="vendedor.nombre"
            header="Vendedor"
            body={(rowData) => (
              <span>
                {rowData.vendedor ? rowData.vendedor.nombre : "Sin vendedor"}
              </span>
            )}
          />
          <Column field="empresa" header="Empresa" hidden={true} />
          <Column field="direccion" header="Dirección" hidden={true} />
          <Column
            field="activo"
            header="Activo"
            body={(rowData) => (
              <span
                style={{
                  color: rowData.activo ? "#28a745" : "#dc3545", // Verde para activo, rojo para inactivo
                  fontWeight: "bold", // Texto en negrita para mayor énfasis
                }}
              >
                {rowData.activo ? "Sí" : "No"}
              </span>
            )}
            sortable
          />
          <Column
            header="Acciones"
            body={(rowData) => (
              <div style={{ display: "flex", gap: "8px" }}>
                <Button
                  icon="pi pi-pencil"
                  rounded
                  text
                  severity="info"
                  onClick={() => openDialog(rowData)}
                  size="small"
                />
                <Button
                  icon="pi pi-trash"
                  rounded
                  text
                  severity="danger"
                  onClick={() => deleteCliente(rowData.id)}
                  size="small"
                />
              </div>
            )}
          />
        </DataTable>
      </div>
    );
  };

  return (
    <div>
      <Toast ref={toast} />
      <div className="card">
        <h2>Clientes Medios</h2>
        <Button
          label="Agregar Cliente"
          icon="pi pi-plus"
          onClick={() => openDialog()}
          className="p-button-raised p-button-success"
          style={{ marginBottom: "20px" }}
        />
        {error && <p style={{ color: "red", marginTop: "12px" }}>{error}</p>}
      </div>
      {renderDataTable()}
      {renderDialog()}
    </div>
  );
};

export default ClientesMedios;
