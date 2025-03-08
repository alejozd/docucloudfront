// SerialesERP.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import Config from "./Config";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputSwitch } from "primereact/inputswitch";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";

const SerialesERP = ({ jwtToken }) => {
  const [seriales, setSeriales] = useState([]);
  const [serial, setSerial] = useState({
    id: null,
    serial_erp: "",
    ano_medios: "",
    cliente_id: "",
    activo: true,
  });
  const [showDialog, setShowDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const toast = React.useRef(null);

  // Cargar seriales al iniciar el componente
  useEffect(() => {
    fetchSeriales();
  }, []);

  // Función para cargar seriales desde el backend
  const fetchSeriales = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${Config.apiUrl}/api/seriales-erp`, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      setSeriales(response.data);
    } catch (err) {
      console.error(err);
      setError("Error al cargar los seriales ERP.");
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar los seriales ERP",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para abrir el diálogo de creación/edición
  const openDialog = (serialSeleccionado = null) => {
    if (serialSeleccionado) {
      setSerial({
        ...serialSeleccionado,
        activo: serialSeleccionado.activo || true, // Asegura el valor booleano
      });
      setIsEditMode(true);
    } else {
      setSerial({
        id: null,
        serial_erp: "",
        ano_medios: "",
        cliente_id: "",
        activo: true,
      });
      setIsEditMode(false);
    }
    setShowDialog(true);
  };

  // Función para cerrar el diálogo
  const closeDialog = () => {
    setShowDialog(false);
    setSerial({ id: null, serial_erp: "", ano_medios: "" });
  };

  // Función para guardar un serial ERP
  const saveSerial = async () => {
    if (
      !serial.serial_erp.trim() ||
      !serial.ano_medios.trim() ||
      !serial.cliente_id.trim()
    ) {
      setError("Por favor ingresa todos los campos.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isEditMode) {
        // Actualizar serial ERP existente
        await axios.put(
          `${Config.apiUrl}/api/seriales-erp/${serial.id}`,
          serial,
          { headers: { Authorization: `Bearer ${jwtToken}` } }
        );
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Serial ERP actualizado exitosamente",
          life: 3000,
        });
      } else {
        // Crear nuevo serial ERP
        await axios.post(`${Config.apiUrl}/api/seriales-erp`, serial, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Serial ERP creado exitosamente",
          life: 3000,
        });
      }

      closeDialog();
      fetchSeriales(); // Recargar la lista de seriales ERP
    } catch (err) {
      console.error(err);
      setError("Error al guardar el serial ERP.");
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al guardar el serial ERP",
        life: 3000,
      });
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
        await axios.delete(`${Config.apiUrl}/api/seriales-erp/${id}`, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Serial ERP eliminado exitosamente",
          life: 3000,
        });
        fetchSeriales(); // Recargar la lista de seriales ERP
      } catch (err) {
        console.error(err);
        setError("Error al eliminar el serial ERP.");
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "Error al eliminar el serial ERP",
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
            Cliente ID:
          </label>
          <InputText
            id="cliente_id"
            value={serial.cliente_id || ""}
            onChange={(e) =>
              setSerial({ ...serial, cliente_id: e.target.value })
            }
            placeholder="ID del cliente"
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
      <DataTable
        value={seriales}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 20]}
        emptyMessage="No se encontraron seriales ERP."
        style={{ marginTop: "20px" }}
      >
        <Column field="id" header="ID" style={{ width: "10%" }} />
        <Column
          field="serial_erp"
          header="Serial ERP"
          style={{ width: "50%" }}
        />
        <Column
          field="ano_medios"
          header="Año Medios"
          style={{ width: "30%" }}
        />
        <Column
          field="cliente_id"
          header="Cliente ID"
          style={{ width: "20%" }}
        />
        <Column
          field="nombre_completo"
          header="Cliente"
          body={(rowData) => <span>{rowData.cliente.nombre_completo}</span>}
        />
        <Column
          field="activo"
          header="Activo"
          body={(rowData) => <span>{rowData.activo ? "Sí" : "No"}</span>}
          style={{ width: "15%" }}
        />
        <Column
          header="Acciones"
          body={(rowData) => (
            <div style={{ display: "flex", gap: "8px" }}>
              <Button
                icon="pi pi-pencil"
                className="p-button-rounded p-button-warning"
                onClick={() => openDialog(rowData)}
              />
              <Button
                icon="pi pi-trash"
                className="p-button-rounded p-button-danger"
                onClick={() => deleteSerial(rowData.id)}
              />
            </div>
          )}
          style={{ width: "20%" }}
        />
      </DataTable>
    );
  };

  return (
    <div>
      <h2>Seriales ERP</h2>
      <Button
        label="Agregar Serial ERP"
        icon="pi pi-plus"
        onClick={() => openDialog()}
        className="p-button-raised p-button-success"
        style={{ marginBottom: "20px" }}
      />
      {renderDataTable()}
      {renderDialog()}
      {error && <p style={{ color: "red", marginTop: "12px" }}>{error}</p>}
      <Toast ref={toast} />
    </div>
  );
};

export default SerialesERP;
