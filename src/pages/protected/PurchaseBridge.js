import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import Config from "../../components/features/Config";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Message } from "primereact/message";
import "../../styles/Clientes.css";

const LICENCIAS_ENDPOINT = "/api/licencias/listado";

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("es-CO");
};

const normalizeLicencias = (payload) => {
  const rows = Array.isArray(payload?.licencias) ? payload.licencias : [];

  return rows.map((licencia) => ({
    id: licencia.id ?? licencia.idlicencia ?? "",
    nit: licencia.nit ?? "N/A",
    estado: licencia.estado ?? "N/A",
    tipo_licencia: licencia.tipo_licencia ?? licencia.tipoLicencia ?? "N/A",
    fecha_activacion: formatDate(licencia.fecha_activacion ?? licencia.fechaActivacion),
    fecha_expiracion: formatDate(licencia.fecha_expiracion ?? licencia.fechaExpiracion),
    dias_demo:
      licencia.dias_demo !== undefined && licencia.dias_demo !== null ? licencia.dias_demo : "N/A",
    instalacion_hash: licencia.instalacion_hash ?? licencia.instalacionHash ?? "N/A",
  }));
};

const PurchaseBridge = ({ jwtToken }) => {
  const [licencias, setLicencias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const toastRef = useRef(null);

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${jwtToken}` } }),
    [jwtToken]
  );

  const fetchLicencias = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(`${Config.apiUrl}${LICENCIAS_ENDPOINT}`, authHeaders);
      setLicencias(normalizeLicencias(response.data));
    } catch (requestError) {
      const detail =
        requestError?.response?.data?.message ||
        requestError?.response?.data?.error ||
        "No se pudieron cargar las licencias.";
      setError(detail);
      toastRef.current?.show({
        severity: "error",
        summary: "Error",
        detail,
        life: 3500,
      });
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    if (!jwtToken) return;
    fetchLicencias();
  }, [jwtToken, fetchLicencias]);

  return (
    <div className="clientes-page">
      <Toast ref={toastRef} />

      <div className="clientes-header">
        <h2>PurchaseBridge - Licencias</h2>
        <div className="clientes-actions">
          <Button
            label="Actualizar"
            icon="pi pi-refresh"
            onClick={fetchLicencias}
            loading={loading}
            severity="secondary"
          />
        </div>
      </div>

      {error ? <Message severity="error" text={error} /> : null}

      <Card className="clientes-table-card">
        <DataTable
          value={licencias}
          dataKey="id"
          loading={loading}
          paginator
          rows={10}
          responsiveLayout="scroll"
          emptyMessage="No hay licencias para mostrar."
        >
          <Column field="id" header="ID" sortable />
          <Column field="nit" header="NIT" sortable />
          <Column field="estado" header="Estado" sortable />
          <Column field="tipo_licencia" header="Tipo Licencia" sortable />
          <Column field="fecha_activacion" header="Fecha Activación" sortable />
          <Column field="fecha_expiracion" header="Fecha Expiración" sortable />
          <Column field="dias_demo" header="Días Demo" sortable />
          <Column field="instalacion_hash" header="Instalación Hash" />
        </DataTable>
      </Card>
    </div>
  );
};

export default PurchaseBridge;
