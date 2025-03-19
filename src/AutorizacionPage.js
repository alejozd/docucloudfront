import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Config from "./Config"; // Asegúrate de importar tu configuración de API
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";

const AutorizacionPage = () => {
  const [autorizaciones, setAutorizaciones] = useState([]);
  const [selectedAutorizacion, setSelectedAutorizacion] = useState(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState("");
  const [nuevaAutorizacion, setNuevaAutorizacion] = useState({
    estado: "no_autorizado",
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false); // Estado para verificar acceso
  const [claveIngresada, setClaveIngresada] = useState(""); // Estado para la clave ingresada
  const [loading, setLoading] = useState(false);
  const toast = useRef(null);

  // Clave de acceso válida (puedes cambiarla según tus necesidades)
  //   const CLAVE_ACCESO_VALIDA = "clave-secreta";
  const CLAVE_ACCESO_VALIDA = process.env.REACT_APP_ACCESS_KEY;

  // Estados posibles para el dropdown
  const estados = [
    { label: "Autorizado", value: "autorizado" },
    { label: "No Autorizado", value: "no_autorizado" },
    { label: "Bloqueado", value: "bloqueado" },
  ];

  // Manejador de eventos para detectar la tecla Enter
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      verificarClave(); // Ejecutar la función de verificación
    }
  };

  // Verificar la clave de acceso
  const verificarClave = () => {
    setLoading(true);
    try {
      if (claveIngresada === CLAVE_ACCESO_VALIDA) {
        setAccessGranted(true);
      } else {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "Clave de acceso incorrecta",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Cargar el listado de autorizaciones
  useEffect(() => {
    if (!accessGranted) return; // No cargar datos si no se ha otorgado acceso

    const fetchAutorizaciones = async () => {
      try {
        const response = await axios.get(
          `${Config.apiUrl}/api/autorizacion/listado`
        );
        setAutorizaciones(response.data.autorizaciones);
      } catch (error) {
        console.error("Error al cargar autorizaciones:", error);
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudieron cargar las autorizaciones",
        });
      }
    };
    fetchAutorizaciones();
  }, [accessGranted]);

  // Acción para abrir el diálogo de edición
  const editarAutorizacion = (autorizacion) => {
    setSelectedAutorizacion(autorizacion);
    setNuevoEstado(autorizacion.estado); // Actualizar el estado
    setNuevaAutorizacion({
      ...nuevaAutorizacion,
      estado: autorizacion.estado,
      intentos_envio: autorizacion.intentos_envio || 0, // Asegurar que tenga un valor predeterminado
    });
    setIsEditMode(true);
    setDialogVisible(true);
  };

  // Acción para guardar cambios en una autorización
  const guardarCambios = async () => {
    try {
      const datosActualizados = isEditMode
        ? {
            nuevo_estado: nuevoEstado,
            nuevos_intentos: nuevaAutorizacion.intentos_envio,
          }
        : nuevaAutorizacion;

      if (isEditMode) {
        await axios.put(
          `${Config.apiUrl}/api/autorizacion/cambiar-estado/${selectedAutorizacion.idautorizacion}`, // Usar idautorizacion
          datosActualizados
        );
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Estado actualizado correctamente",
        });
      } else {
        await axios.post(
          `${Config.apiUrl}/api/autorizacion`,
          datosActualizados
        );
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Autorización creada correctamente",
        });
      }
      setDialogVisible(false);
      // Recargar los datos después de guardar
      const response = await axios.get(
        `${Config.apiUrl}/api/autorizacion/listado`
      );
      setAutorizaciones(response.data.autorizaciones);
    } catch (error) {
      console.error("Error al guardar cambios:", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Ocurrió un error al guardar los cambios",
      });
    }
  };

  // Acción para crear una nueva autorización
  const crearNuevaAutorizacion = () => {
    setSelectedAutorizacion(null);
    setNuevaAutorizacion({ estado: "no_autorizado" });
    setIsEditMode(false);
    setDialogVisible(true);
  };

  // Renderizar el footer del diálogo
  const renderDialogFooter = () => (
    <div>
      <Button
        label="Cancelar"
        icon="pi pi-times"
        onClick={() => setDialogVisible(false)}
        outlined
        severity="danger"
      />
      <Button
        label="Guardar"
        icon="pi pi-check"
        onClick={guardarCambios}
        severity="success"
      />
    </div>
  );

  // Renderizar el cuerpo del diálogo
  const renderDialogContent = () => (
    <div className="p-fluid">
      {isEditMode ? (
        <>
          <Dropdown
            value={nuevoEstado}
            options={estados}
            onChange={(e) => setNuevoEstado(e.value)}
            placeholder="Seleccionar estado"
            style={{ width: "100%", marginBottom: "16px" }}
          />
          {/* InputNumber para modificar los intentos */}
          <div className="pfluid">
            <label
              htmlFor="intentos-envio"
              style={{ display: "block", marginBottom: "8px" }}
            >
              Intentos de Envío:
            </label>
            <InputNumber
              id="intentos-envio"
              value={nuevaAutorizacion.intentos_envio}
              onValueChange={(e) =>
                setNuevaAutorizacion({
                  ...nuevaAutorizacion,
                  intentos_envio: e.value,
                })
              }
              min={0} // Los intentos no pueden ser negativos
              placeholder="Ingresa los intentos"
              style={{ width: "100%" }}
            />
          </div>
        </>
      ) : (
        <>
          <Dropdown
            value={nuevaAutorizacion.estado}
            options={estados}
            onChange={(e) =>
              setNuevaAutorizacion({ ...nuevaAutorizacion, estado: e.value })
            }
            placeholder="Seleccionar estado"
            style={{ width: "100%" }}
          />
          {/* InputNumber para modificar los intentos */}
          <label
            htmlFor="intentos-envio"
            style={{ display: "block", marginBottom: "8px" }}
          >
            Intentos de Envío:
          </label>
          <InputNumber
            id="intentos-envio"
            value={nuevaAutorizacion.intentos_envio}
            onValueChange={(e) =>
              setNuevaAutorizacion({
                ...nuevaAutorizacion,
                intentos_envio: e.value,
              })
            }
            min={0} // Los intentos no pueden ser negativos
            placeholder="Ingresa los intentos"
            style={{ width: "100%" }}
          />
        </>
      )}
    </div>
  );

  const cerrarDialog = () => {
    setClaveIngresada(""); // Limpiar la clave ingresada
  };

  // Diálogo para ingresar la clave de acceso
  const renderAccessDialog = () => (
    <Dialog
      header="Acceso Restringido"
      visible={!accessGranted}
      onHide={cerrarDialog}
      style={{ width: "100%", maxWidth: "400px" }}
      closable={true}
      modal={false}
      className="p-fluid"
    >
      <div style={{ marginBottom: "16px" }}>
        <label
          htmlFor="clave-acceso"
          style={{ display: "block", marginBottom: "8px" }}
        >
          Ingresa la clave de acceso:
        </label>
        <InputText
          id="clave-acceso"
          type="password"
          value={claveIngresada}
          onChange={(e) => setClaveIngresada(e.target.value)}
          onKeyDown={handleKeyPress} // Agregar el manejador de eventos
          style={{ width: "100%", marginBottom: "16px" }}
        />
        <div className="flex justify-content-end gap-2">
          <Button
            label="Cancelar"
            onClick={cerrarDialog}
            severity="danger"
            outlined
          />
          <Button
            label={loading ? "Autenticando..." : "Ingresar"}
            onClick={verificarClave}
            icon={loading ? "pi pi-spin pi-spinner" : "pi pi-sign-in"}
            severity="success"
            disabled={loading}
          />
        </div>
      </div>
    </Dialog>
  );

  // Mostrar el diálogo de acceso si no se ha otorgado acceso
  if (!accessGranted) {
    return (
      <div>
        <Toast ref={toast} />
        {renderAccessDialog()}
      </div>
    );
  }

  return (
    <div>
      <Toast ref={toast} />
      <h2>Gestión de Autorizaciones</h2>

      <Button
        label="Crear Nueva Autorización"
        icon="pi pi-plus"
        onClick={crearNuevaAutorizacion}
        severity="primary"
        style={{ marginBottom: "1rem" }}
      />

      <DataTable value={autorizaciones} paginator rows={5}>
        <Column
          field="idautorizacion"
          header="ID"
          style={{ minWidth: "5rem" }}
        />
        <Column field="nombre" header="Nombre" style={{ minWidth: "10rem" }} />
        <Column field="estado" header="Estado" style={{ minWidth: "10rem" }} />
        <Column
          header="Acciones"
          body={(rowData) => (
            <Button
              icon="pi pi-pencil"
              rounded
              text
              severity="info"
              onClick={() => editarAutorizacion(rowData)}
            />
          )}
          style={{ minWidth: "8rem" }}
        />
        <Column field="intentos_envio" header="Intentos" />
      </DataTable>

      <Dialog
        header={isEditMode ? "Editar Autorización" : "Crear Nueva Autorización"}
        visible={dialogVisible}
        onHide={() => setDialogVisible(false)}
        footer={renderDialogFooter()}
      >
        {renderDialogContent()}
      </Dialog>
    </div>
  );
};

export default AutorizacionPage;
