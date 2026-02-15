import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import Config from "../../components/features/Config";
import { Toast } from "primereact/toast";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { InputSwitch } from "primereact/inputswitch";
import { Card } from "primereact/card";
import CarteraDialog from "./CarteraDialog";

const INITIAL_VENDEDOR = {
  id: null,
  nombre: "",
  telefono: "",
  activo: true,
};

const Vendedores = ({ jwtToken }) => {
  const [vendedores, setVendedores] = useState([]);
  const [vendedor, setVendedor] = useState(INITIAL_VENDEDOR);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [cartera, setCartera] = useState(null);
  const [showCarteraDialog, setShowCarteraDialog] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const toast = React.useRef(null);

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${jwtToken}` } }),
    [jwtToken]
  );

  const notify = useCallback((severity, detail) => {
    const summary =
      severity === "success"
        ? "Éxito"
        : severity === "warn"
          ? "Advertencia"
          : "Error";

    toast.current?.show({
      severity,
      summary,
      detail,
      life: 3000,
    });
  }, []);

  const fetchVendedores = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${Config.apiUrl}/api/vendedores`, authHeaders);
      setVendedores(response.data);
    } catch (err) {
      console.error(err);
      setError("Error al cargar los vendedores.");
      notify("error", "Error al cargar los vendedores");
    } finally {
      setLoading(false);
    }
  }, [authHeaders, notify]);

  useEffect(() => {
    fetchVendedores();
  }, [fetchVendedores]);

  const openDialog = (vendedorSeleccionado = null) => {
    if (vendedorSeleccionado) {
      setVendedor({
        id: vendedorSeleccionado.id ?? null,
        nombre: vendedorSeleccionado.nombre ?? "",
        telefono: vendedorSeleccionado.telefono ?? "",
        activo: vendedorSeleccionado.activo ?? true,
      });
      setIsEditMode(true);
    } else {
      setVendedor(INITIAL_VENDEDOR);
      setIsEditMode(false);
    }
    setError(null);
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setVendedor(INITIAL_VENDEDOR);
  };

  const saveVendedor = async () => {
    if (!vendedor.nombre.trim()) {
      setError("Por favor ingresa todos los campos obligatorios.");
      notify("warn", "El nombre del vendedor es obligatorio");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (isEditMode) {
        await axios.put(`${Config.apiUrl}/api/vendedores/${vendedor.id}`, vendedor, authHeaders);
        notify("success", "Vendedor actualizado exitosamente");
      } else {
        await axios.post(`${Config.apiUrl}/api/vendedores`, vendedor, authHeaders);
        notify("success", "Vendedor creado exitosamente");
      }
      closeDialog();
      fetchVendedores();
    } catch (err) {
      console.error(err);
      setError("Error al guardar el vendedor.");
      notify("error", "Error al guardar el vendedor");
    } finally {
      setLoading(false);
    }
  };

  const deleteVendedor = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este vendedor?")) {
      setLoading(true);
      setError(null);
      try {
        await axios.delete(`${Config.apiUrl}/api/vendedores/${id}`, authHeaders);
        notify("success", "Vendedor eliminado exitosamente");
        fetchVendedores();
      } catch (err) {
        console.error(err);
        setError("Error al eliminar el vendedor.");
        notify("error", "Error al eliminar el vendedor");
      } finally {
        setLoading(false);
      }
    }
  };

  const viewCartera = async (vendedorId, vendedorNombre) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${Config.apiUrl}/api/vendedores/${vendedorId}/cartera`,
        authHeaders
      );
      setCartera({ ...response.data, nombre: vendedorNombre });
      setShowCarteraDialog(true);
    } catch (err) {
      console.error(err);
      setError("Error al cargar el detalle de cartera.");
      notify("error", "Error al cargar el detalle de cartera");
    } finally {
      setLoading(false);
    }
  };

  const kpis = useMemo(
    () => [
      { label: "Total", value: vendedores.length },
      { label: "Activos", value: vendedores.filter((row) => row.activo).length },
      { label: "Inactivos", value: vendedores.filter((row) => !row.activo).length },
    ],
    [vendedores]
  );

  const tableHeader = (
    <div className="clientes-table-header">
      <IconField iconPosition="left">
        <InputIcon className="pi pi-search" />
        <InputText
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
          placeholder="Buscar vendedor"
        />
      </IconField>
      <span>{vendedores.length} registros</span>
    </div>
  );

  const actionTemplate = (rowData) => (
    <div style={{ display: "flex", gap: "8px" }}>
      <Button icon="pi pi-pencil" rounded text severity="info" onClick={() => openDialog(rowData)} />
      <Button
        icon="pi pi-trash"
        rounded
        text
        severity="danger"
        onClick={() => deleteVendedor(rowData.id)}
      />
      <Button
        icon="pi pi-eye"
        rounded
        text
        severity="success"
        onClick={() => viewCartera(rowData.id, rowData.nombre)}
      />
    </div>
  );

  return (
    <div className="clientes-page">
      <Toast ref={toast} />

      <div className="clientes-header">
        <h2>Vendedores</h2>
        <div className="clientes-actions">
          <Button label="Agregar" icon="pi pi-plus" onClick={() => openDialog()} />
          <Button
            label="Actualizar"
            icon="pi pi-refresh"
            severity="secondary"
            onClick={fetchVendedores}
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

      <Card className="clientes-table-card">
        <DataTable
          value={vendedores}
          loading={loading}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 20]}
          emptyMessage="No se encontraron vendedores."
          stripedRows
          dataKey="id"
          header={tableHeader}
          globalFilter={globalFilter}
          globalFilterFields={["nombre", "telefono"]}
        >
          <Column field="id" header="ID" hidden />
          <Column field="nombre" header="Nombre" sortable />
          <Column field="telefono" header="Teléfono" body={(rowData) => rowData.telefono || "N/A"} />
          <Column
            field="activo"
            header="Activo"
            body={(rowData) => (
              <span style={{ color: rowData.activo ? "#28a745" : "#dc3545", fontWeight: "bold" }}>
                {rowData.activo ? "Sí" : "No"}
              </span>
            )}
          />
          <Column header="Acciones" body={actionTemplate} />
        </DataTable>
      </Card>

      <Dialog
        visible={showDialog}
        header={isEditMode ? "Editar Vendedor" : "Nuevo Vendedor"}
        onHide={closeDialog}
        style={{ width: "420px" }}
        modal
      >
        <div className="p-fluid">
          <div className="p-field" style={{ marginBottom: "12px" }}>
            <label htmlFor="nombre">Nombre *</label>
            <InputText
              id="nombre"
              value={vendedor.nombre}
              onChange={(e) => setVendedor({ ...vendedor, nombre: e.target.value })}
              placeholder="Nombre del vendedor"
            />
          </div>
          <div className="p-field" style={{ marginBottom: "12px" }}>
            <label htmlFor="telefono">Teléfono</label>
            <InputText
              id="telefono"
              value={vendedor.telefono}
              onChange={(e) => setVendedor({ ...vendedor, telefono: e.target.value })}
              placeholder="Teléfono del vendedor"
            />
          </div>
          <div className="p-field" style={{ marginBottom: "14px" }}>
            <label htmlFor="activo" style={{ marginRight: "10px" }}>
              Activo
            </label>
            <InputSwitch
              id="activo"
              checked={vendedor.activo}
              onChange={(e) => setVendedor({ ...vendedor, activo: e.value })}
            />
          </div>
          <Button
            label={loading ? "Guardando..." : "Guardar"}
            icon={loading ? "pi pi-spin pi-spinner" : "pi pi-save"}
            onClick={saveVendedor}
            disabled={loading}
            className="p-button-raised p-button-primary"
          />
          {error && <p style={{ color: "red", marginTop: "12px" }}>{error}</p>}
        </div>
      </Dialog>

      <CarteraDialog
        cartera={cartera}
        showCarteraDialog={showCarteraDialog}
        onClose={() => setShowCarteraDialog(false)}
      />
    </div>
  );
};

export default Vendedores;
