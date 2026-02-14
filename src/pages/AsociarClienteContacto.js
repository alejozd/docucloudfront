import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import { Card } from "primereact/card";
import { PickList } from "primereact/picklist";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";
import Config from "./../components/features/Config";
import "../styles/AsociarClienteContacto.css";

const getNormalizedData = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const AsociarClienteContacto = () => {
  const [clientes, setClientes] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [contactos, setContactos] = useState([]);
  const [contactosAsociados, setContactosAsociados] = useState([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [loadingContactos, setLoadingContactos] = useState(false);
  const [saving, setSaving] = useState(false);
  const toast = useRef(null);

  const fetchClientes = useCallback(async () => {
    try {
      setLoadingClientes(true);
      const response = await axios.get(`${Config.apiUrl}/api/clientes`);
      setClientes(getNormalizedData(response.data));
    } catch (error) {
      console.error("Error fetching clientes:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los clientes.",
        life: 4000,
      });
    } finally {
      setLoadingClientes(false);
    }
  }, []);

  const fetchContactosCliente = useCallback(async (clienteId) => {
    try {
      setLoadingContactos(true);
      const [responseContactos, responseContactosAsociados] = await Promise.all([
        axios.get(`${Config.apiUrl}/api/contactos`),
        axios.get(`${Config.apiUrl}/api/clientes/${clienteId}/contactos`),
      ]);

      const allContactos = getNormalizedData(responseContactos.data);
      const asociados = getNormalizedData(responseContactosAsociados.data);

      const asociadosIds = new Set(asociados.map((contacto) => contacto.idcontacto));
      const disponibles = allContactos.filter(
        (contacto) => !asociadosIds.has(contacto.idcontacto)
      );

      setContactos(disponibles);
      setContactosAsociados(asociados);
    } catch (error) {
      console.error("Error fetching contactos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los contactos del cliente.",
        life: 4000,
      });
    } finally {
      setLoadingContactos(false);
    }
  }, []);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  useEffect(() => {
    if (!selectedCliente?.idcliente) {
      setContactos([]);
      setContactosAsociados([]);
      return;
    }

    fetchContactosCliente(selectedCliente.idcliente);
  }, [selectedCliente, fetchContactosCliente]);

  const onClienteChange = (event) => {
    setSelectedCliente(event.value);
  };

  const onMoveToTarget = (event) => {
    if (!event?.value) return;
    const movedItems = event.value;

    setContactos((prev) =>
      prev.filter(
        (item) => !movedItems.some((movedItem) => movedItem.idcontacto === item.idcontacto)
      )
    );
    setContactosAsociados((prev) => [...prev, ...movedItems]);
  };

  const onMoveToSource = (event) => {
    if (!event?.value) return;
    const movedItems = event.value;

    setContactos((prev) => [...prev, ...movedItems]);
    setContactosAsociados((prev) =>
      prev.filter(
        (item) => !movedItems.some((movedItem) => movedItem.idcontacto === item.idcontacto)
      )
    );
  };

  const handleSave = async () => {
    if (!selectedCliente?.idcliente) {
      toast.current?.show({
        severity: "warn",
        summary: "Atención",
        detail: "Por favor, selecciona un cliente.",
        life: 3000,
      });
      return;
    }

    const contactosAsociadosIds = contactosAsociados.map((contacto) => contacto.idcontacto);

    try {
      setSaving(true);
      await axios.post(
        `${Config.apiUrl}/api/clientes/${selectedCliente.idcliente}/asociar-contactos`,
        {
          contactos: contactosAsociadosIds,
        }
      );

      toast.current?.show({
        severity: "success",
        summary: "Realizado",
        detail: "Asociaciones guardadas correctamente.",
        life: 3000,
      });
    } catch (error) {
      console.error("Error guardando asociaciones:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron guardar las asociaciones.",
        life: 4000,
      });
    } finally {
      setSaving(false);
    }
  };

  const kpis = useMemo(
    () => [
      { label: "Disponibles", value: contactos.length },
      { label: "Asociados", value: contactosAsociados.length },
      {
        label: "Cliente seleccionado",
        value: selectedCliente?.nombres ? 1 : 0,
      },
    ],
    [contactos.length, contactosAsociados.length, selectedCliente]
  );

  return (
    <div className="asociar-cliente-contacto-page">
      <Toast ref={toast} />

      <div className="asociar-header">
        <h1>Asociar Cliente y Contacto</h1>
        <p>Selecciona un cliente y organiza sus contactos asociados.</p>
      </div>

      <div className="asociar-kpis">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="asociar-kpi-card">
            <p className="asociar-kpi-label">{kpi.label}</p>
            <p className="asociar-kpi-value">{kpi.value}</p>
          </Card>
        ))}
      </div>

      <Card className="asociar-card" title="Seleccionar Cliente">
        {loadingClientes ? (
          <div className="asociar-loading">
            <ProgressSpinner style={{ width: "40px", height: "40px" }} />
          </div>
        ) : (
          <Dropdown
            value={selectedCliente}
            onChange={onClienteChange}
            options={clientes}
            optionLabel="nombres"
            placeholder="Seleccione un cliente"
            filter
            className="asociar-dropdown"
          />
        )}
      </Card>

      <Card className="asociar-card" title="Asociar Contactos">
        {loadingContactos ? (
          <div className="asociar-loading">
            <ProgressSpinner style={{ width: "40px", height: "40px" }} />
          </div>
        ) : (
          <PickList
            dataKey="idcontacto"
            source={contactos}
            target={contactosAsociados}
            itemTemplate={(item) => (
              <div className="asociar-pick-item">
                <span>{item.nombresca}</span>
                <small>{item.emailca || item.telefonoca || "Sin dato"}</small>
              </div>
            )}
            filter
            filterBy="nombresca,emailca,telefonoca"
            sourceHeader="Contactos Disponibles"
            targetHeader="Contactos Asociados"
            sourceStyle={{ height: "260px" }}
            targetStyle={{ height: "260px" }}
            onMoveToTarget={onMoveToTarget}
            onMoveToSource={onMoveToSource}
            showSourceControls={false}
            showTargetControls={false}
            sourceFilterPlaceholder="Buscar contacto"
            targetFilterPlaceholder="Buscar asociado"
            pt={{
              moveAllToTargetButton: {
                root: { className: "hidden" },
              },
              moveAllToSourceButton: {
                root: { className: "hidden" },
              },
            }}
          />
        )}
      </Card>

      <div className="asociar-actions">
        <Button
          label="Guardar Asociaciones"
          icon="pi pi-save"
          onClick={handleSave}
          loading={saving}
          disabled={!selectedCliente}
        />
      </div>
    </div>
  );
};

export default AsociarClienteContacto;
