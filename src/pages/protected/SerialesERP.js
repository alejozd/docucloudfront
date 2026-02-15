// SerialesERP.js
import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import Config from "../../components/features/Config";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputSwitch } from "primereact/inputswitch";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { FilterMatchMode } from "primereact/api";
import { Toast } from "primereact/toast";

const INITIAL_SERIAL = {
  id: null,
  serial_erp: "",
  ano_medios: "",
  cliente_id: "",
  activo: true,
};

const INITIAL_FILTERS = {
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
};

const SerialesERP = ({ jwtToken }) => {
  const [seriales, setSeriales] = useState([]);
  const [serial, setSerial] = useState(INITIAL_SERIAL);
  const [showDialog, setShowDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const toast = React.useRef(null);
  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${jwtToken}` } }),
    [jwtToken]
  );

  const notify = useCallback((severity, detail) => {
    toast.current?.show({
      severity,
      summary: severity === "success" ? "Éxito" : "Error",
      detail,
      life: 3000,
    });
  }, []);

  const normalizeSerial = useCallback(
    (serialData = INITIAL_SERIAL) => ({
      id: serialData.id ?? null,
      serial_erp: serialData.serial_erp ?? "",
      ano_medios: serialData.ano_medios ?? "",
      cliente_id: serialData.cliente_id ?? "",
      activo: serialData.activo ?? true,
    }),
    []
  );

  // Función para cargar seriales desde el backend
  const fetchSeriales = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${Config.apiUrl}/api/seriales-erp`,
        authHeaders
      );
      setSeriales(response.data);
    } catch (err) {
      console.error(err);
      setError("Error al cargar los seriales ERP.");
      notify("error", "Error al cargar los seriales ERP");
    } finally {
      setLoading(false);
    }
  }, [authHeaders, notify]);

  // Función para cargar clientes desde el backend
  const fetchClientes = useCallback(async () => {
    try {
      const response = await axios.get(
        `${Config.apiUrl}/api/clientes-medios`,
        authHeaders
      );
      setClientes(response.data);
    } catch (err) {
      console.error("Error al cargar los clientes:", err.message);
      notify("error", "Error al cargar los clientes");
    }
  }, [authHeaders, notify]);

  // Cargar seriales y clientes al iniciar el componente
  useEffect(() => {
    fetchSeriales();
    fetchClientes();
  }, [fetchSeriales, fetchClientes]); // Las funciones están memoizadas con useCallback

  // Manejo del filtro global
  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    setFilters((currentFilters) => ({
      ...currentFilters,
      global: {
        ...currentFilters.global,
        value,
      },
    }));
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
            placeholder="Buscar serial..."
          />
        </IconField>
      </div>
    );
  };

  const header = renderHeader();

  // Función para abrir el diálogo de creación/edición
  const openDialog = (serialSeleccionado = null) => {
    if (serialSeleccionado) {
      setSerial(normalizeSerial(serialSeleccionado));
      setIsEditMode(true);
    } else {
      setSerial(INITIAL_SERIAL);
      setIsEditMode(false);
    }
    setError(null);
    setShowDialog(true);
  };

  // Función para cerrar el diálogo
  const closeDialog = () => {
    setShowDialog(false);
    setSerial(INITIAL_SERIAL);
  };

  // Función para guardar un serial ERP
  const saveSerial = async () => {
    if (
      !serial.serial_erp.trim() ||
      !serial.ano_medios.trim() ||
      !serial.cliente_id
    ) {
      setError("Por favor ingresa todos los campos.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isEditMode) {
        // Actualizar serial ERP existente
        await axios.put(`${Config.apiUrl}/api/seriales-erp/${serial.id}`, serial, authHeaders);
        notify("success", "Serial ERP actualizado exitosamente");
      } else {
        // Crear nuevo serial ERP
        await axios.post(`${Config.apiUrl}/api/seriales-erp`, serial, authHeaders);
        notify("success", "Serial ERP creado exitosamente");
      }

      closeDialog();
      fetchSeriales(); // Recargar la lista de seriales ERP
    } catch (err) {
      console.error(err);
      setError("Error al guardar el serial ERP.");
      notify("error", "Error al guardar el serial ERP");
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar un serial ERP
  const deleteSerial = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este serial ERP?")) {
      setLoading(true);
      setError(null);

      try {
        await axios.delete(`${Config.apiUrl}/api/seriales-erp/${id}`, authHeaders);
        notify("success", "Serial ERP eliminado exitosamente");
        fetchSeriales(); // Recargar la lista de seriales ERP
      } catch (err) {
        console.error(err);
        setError("Error al eliminar el serial ERP.");
        notify("error", "Error al eliminar el serial ERP");
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
        header={isEditMode ? "Editar Serial ERP" : "Nuevo Serial ERP"}
        onHide={closeDialog}
        style={{ width: "400px" }}
      >
        <div style={{ marginBottom: "12px" }}>
          <label
            htmlFor="serial_erp"
            style={{ display: "block", marginBottom: "6px" }}
          >
            Serial ERP:
          </label>
          <InputText
            id="serial_erp"
            value={serial.serial_erp}
            onChange={(e) =>
              setSerial({ ...serial, serial_erp: e.target.value })
            }
            placeholder="Serial ERP"
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ marginBottom: "12px" }}>
          <label
            htmlFor="ano_medios"
            style={{ display: "block", marginBottom: "6px" }}
          >
            Año Medios:
          </label>
          <InputText
            id="ano_medios"
            value={serial.ano_medios}
            onChange={(e) =>
              setSerial({ ...serial, ano_medios: e.target.value })
            }
            placeholder="Año Medios"
            style={{ width: "100%" }}
          />
        </div>
        {/* Campo cliente_id */}
        <div style={{ marginBottom: "12px" }}>
          <label
            htmlFor="cliente_id"
            style={{ display: "block", marginBottom: "6px" }}
          >
            Cliente:
          </label>
          <Dropdown
            id="cliente_id"
            value={serial.cliente_id}
            options={clientes}
            onChange={(e) => setSerial({ ...serial, cliente_id: e.value })}
            optionLabel="nombre_completo" // Mostrar el nombre completo del cliente
            optionValue="id" // Guardar el ID del cliente en el estado
            placeholder="Selecciona un cliente"
            style={{ width: "100%" }}
          />
        </div>
        {/* Campo activo */}
        <div style={{ marginBottom: "12px" }}>
          <label
            htmlFor="activo"
            style={{ display: "block", marginBottom: "6px" }}
          >
            Activo:
          </label>
          <InputSwitch
            checked={serial.activo}
            onChange={(e) => setSerial({ ...serial, activo: e.value })}
          />
        </div>
        <Button
          label="Guardar"
          onClick={saveSerial}
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
          value={seriales}
          loading={loading}
          paginator
          rows={10}
          dataKey="id"
          rowsPerPageOptions={[5, 10, 20]}
          emptyMessage="No se encontraron seriales ERP."
          stripedRows
          filters={filters}
          globalFilterFields={["serial_erp", "cliente.nombre_completo"]}
          header={header}
          filterDisplay="row"
        >
          <Column field="id" header="ID" />
          <Column field="serial_erp" header="Serial ERP" sortable />
          <Column field="ano_medios" header="Año" />
          <Column field="cliente_id" header="Cliente ID" hidden={true} />
          <Column
            field="nombre_completo"
            header="Cliente"
            body={(rowData) => <span>{rowData.cliente?.nombre_completo ?? "-"}</span>}
            sortable
          />
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
                  onClick={() => deleteSerial(rowData.id)}
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
        <h2>Seriales ERP</h2>
        <Button
          label="Agregar Serial ERP"
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

export default SerialesERP;
