import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Slider } from "primereact/slider";
import { InputText } from "primereact/inputtext";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import Config from "../../components/features/Config";
import AudioPlayer from "../../components/audio/AudioPlayer";
import "../../styles/GrabacionesPage.css";

const DEFAULT_ERROR_MESSAGE = "No se pudieron cargar las grabaciones.";

const toastSummaryBySeverity = {
  success: "Éxito",
  warn: "Advertencia",
  error: "Error",
};

const getAudioSrc = (fecha, nombreArchivo) =>
  `${Config.apiUrl}/grabaciones/${fecha.replace(/-/g, "/")}/${nombreArchivo}`;

const normalizeText = (value) => (value || "").toString().toLowerCase();

const GrabacionesPage = () => {
  const [grabaciones, setGrabaciones] = useState([]);
  const [activo, setActivo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [globalVolume, setGlobalVolume] = useState(100);
  const [activeAudioRef, setActiveAudioRef] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const toast = useRef(null);

  const notify = useCallback((severity, detail) => {
    toast.current?.show({
      severity,
      summary: toastSummaryBySeverity[severity] || "Información",
      detail,
      life: 3000,
    });
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [statusResponse, listResponse] = await Promise.all([
        axios.get(`${Config.apiUrl}/api/grabacion/estado`),
        axios.get(`${Config.apiUrl}/api/grabacion/lista`),
      ]);

      setActivo(Boolean(statusResponse.data?.activo));
      setGrabaciones(Array.isArray(listResponse.data) ? listResponse.data : []);
    } catch (requestError) {
      console.error("Error al cargar datos:", requestError);
      setError(DEFAULT_ERROR_MESSAGE);
      notify("error", DEFAULT_ERROR_MESSAGE);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (activeAudioRef?.current) {
      activeAudioRef.current.volume = globalVolume / 100;
    }
  }, [globalVolume, activeAudioRef]);

  const changeStatus = useCallback(
    async (nextStatus) => {
      setUpdatingStatus(true);
      try {
        await axios.post(`${Config.apiUrl}/api/grabacion/estado`, { activo: nextStatus });
        setActivo(nextStatus);
        notify(
          "success",
          nextStatus
            ? "Grabación automática activada"
            : "Grabación automática desactivada"
        );
      } catch (requestError) {
        console.error("Error al cambiar estado:", requestError);
        notify("error", "No se pudo actualizar el estado de grabación");
      } finally {
        setUpdatingStatus(false);
      }
    },
    [notify]
  );

  const handlePlay = useCallback(
    (audioRef) => {
      if (
        activeAudioRef?.current &&
        activeAudioRef.current !== audioRef.current
      ) {
        activeAudioRef.current.pause();
      }

      setActiveAudioRef(audioRef);

      if (audioRef?.current) {
        audioRef.current.volume = globalVolume / 100;
      }
    },
    [activeAudioRef, globalVolume]
  );

  const filteredGrabaciones = useMemo(() => {
    const search = normalizeText(globalFilter.trim());
    if (!search) return grabaciones;

    return grabaciones
      .map((group) => {
        const matchesDate = normalizeText(group.fecha).includes(search);
        const archivos = (group.archivos || []).filter((archivo) => {
          if (matchesDate) return true;

          return (
            normalizeText(archivo.titulo).includes(search) ||
            normalizeText(archivo.artista).includes(search) ||
            normalizeText(archivo.nombreArchivo).includes(search)
          );
        });

        return {
          ...group,
          archivos,
        };
      })
      .filter((group) => group.archivos.length > 0);
  }, [grabaciones, globalFilter]);

  const totalFechas = grabaciones.length;

  const totalArchivos = useMemo(
    () => grabaciones.reduce((total, group) => total + (group.archivos?.length || 0), 0),
    [grabaciones]
  );

  const archivosFiltrados = useMemo(
    () => filteredGrabaciones.reduce((total, group) => total + (group.archivos?.length || 0), 0),
    [filteredGrabaciones]
  );

  if (loading) {
    return <div className="loading-message">Cargando grabaciones...</div>;
  }

  if (error) {
    return (
      <div className="grabaciones-container">
        <Card className="grabaciones-feedback-card">
          <p className="error-message">{error}</p>
          <div className="grabaciones-feedback-actions">
            <Button label="Reintentar" icon="pi pi-refresh" onClick={fetchData} />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="grabaciones-container">
      <Toast ref={toast} />

      <Card title="Configuración de grabación" className="config-card">
        <div className="grabaciones-toolbar">
          <div className="grabaciones-toolbar-status">
            <p className="status-text">Estado actual</p>
            <Tag
              severity={activo ? "success" : "warning"}
              value={activo ? "Activado" : "Desactivado"}
            />
          </div>

          <div className="grabaciones-toolbar-actions">
            <Button
              label={activo ? "Desactivar" : "Activar"}
              icon={activo ? "pi pi-power-off" : "pi pi-power-on"}
              severity={activo ? "warning" : "success"}
              onClick={() => changeStatus(!activo)}
              loading={updatingStatus}
            />
            <Button
              label="Actualizar"
              icon="pi pi-refresh"
              severity="secondary"
              onClick={fetchData}
              loading={loading}
            />
          </div>
        </div>
      </Card>

      <Card className="grabaciones-kpi-card">
        <div className="grabaciones-kpi-grid">
          <div className="grabaciones-kpi-item">
            <p className="grabaciones-kpi-label">Fechas</p>
            <p className="grabaciones-kpi-value">{totalFechas}</p>
          </div>
          <div className="grabaciones-kpi-item">
            <p className="grabaciones-kpi-label">Archivos totales</p>
            <p className="grabaciones-kpi-value">{totalArchivos}</p>
          </div>
          <div className="grabaciones-kpi-item">
            <p className="grabaciones-kpi-label">Resultados filtrados</p>
            <p className="grabaciones-kpi-value">{archivosFiltrados}</p>
          </div>
        </div>

        <div className="grabaciones-search-wrap">
          <IconField iconPosition="left">
            <InputIcon className="pi pi-search" />
            <InputText
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              placeholder="Buscar por fecha, título, artista o archivo"
            />
          </IconField>
        </div>
      </Card>

      <Card className="global-volume-card">
        <div className="global-volume-controls">
          <i className="pi pi-volume-up global-volume-icon" />
          <Slider
            value={globalVolume}
            onChange={(event) => setGlobalVolume(event.value)}
            min={0}
            max={100}
            step={1}
            className="global-volume-slider"
          />
          <span className="global-volume-percentage">{globalVolume}%</span>
        </div>
      </Card>

      <Card title="Programas grabados" className="grabaciones-list-card">
        {filteredGrabaciones.length === 0 ? (
          <div className="grabaciones-empty-state">
            <i className="pi pi-inbox" aria-hidden="true" />
            <p>No hay grabaciones disponibles para el filtro actual.</p>
          </div>
        ) : (
          filteredGrabaciones.map((group) => (
            <section key={group.fecha} className="grabaciones-bloque">
              <h3>{group.fecha}</h3>
              <ul className="grabaciones-lista">
                {group.archivos.map((archivo) => {
                  const src = getAudioSrc(group.fecha, archivo.nombreArchivo);
                  const isActive = Boolean(
                    activeAudioRef?.current?.src &&
                      activeAudioRef.current.src.endsWith(src)
                  );

                  return (
                    <li
                      key={`${group.fecha}-${archivo.nombreArchivo}`}
                      className="grabaciones-item"
                    >
                      <AudioPlayer
                        title={archivo.titulo}
                        artist={archivo.artista}
                        src={src}
                        globalVolume={globalVolume}
                        onPlay={handlePlay}
                        isActive={isActive}
                      />
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
      </Card>
    </div>
  );
};

export default GrabacionesPage;
