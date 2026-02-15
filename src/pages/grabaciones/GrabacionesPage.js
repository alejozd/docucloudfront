import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import axios from "axios";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Slider } from "primereact/slider";
import { InputText } from "primereact/inputtext";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { Toast } from "primereact/toast";
import Config from "./../../components/features/Config";
import "../../styles/GrabacionesPage.css"; // Opcional: estilos personalizados
import AudioPlayer from "../../components/audio/AudioPlayer"; // Importa el nuevo componente

const GrabacionesPage = () => {
  const [grabaciones, setGrabaciones] = useState([]);
  const [activo, setActivo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [globalVolume, setGlobalVolume] = useState(100);
  const [activeAudioRef, setActiveAudioRef] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const toast = useRef(null);

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

  const getAudioSrc = useCallback(
    (fecha, nombreArchivo) =>
      `${Config.apiUrl}/grabaciones/${fecha.replace(/-/g, "/")}/${nombreArchivo}`,
    []
  );

  // Cargar datos iniciales
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resEstado, resLista] = await Promise.all([
        axios.get(`${Config.apiUrl}/api/grabacion/estado`),
        axios.get(`${Config.apiUrl}/api/grabacion/lista`),
      ]);

      setActivo(!!resEstado.data.activo);
      setGrabaciones(resLista.data || []);
    } catch (err) {
      console.error("Error al cargar datos:", err);
      setError("No se pudieron cargar las grabaciones.");
      notify("error", "No se pudieron cargar las grabaciones");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Efecto para aplicar el volumen global al audio activo
  useEffect(() => {
    if (activeAudioRef && activeAudioRef.current) {
      activeAudioRef.current.volume = globalVolume / 100;
    }
  }, [globalVolume, activeAudioRef]); // Se ejecuta cuando el volumen o el audio activo cambian

  // Manejar cambio de estado
  const cambiarEstado = async (nuevoEstado) => {
    try {
      await axios.post(`${Config.apiUrl}/api/grabacion/estado`, {
        activo: nuevoEstado,
      });
      setActivo(nuevoEstado);
      notify(
        "success",
        nuevoEstado
          ? "Grabación automática activada"
          : "Grabación automática desactivada"
      );
    } catch (err) {
      console.error("Error al cambiar estado:", err);
      notify("error", "No se pudo actualizar el estado de grabación");
    }
  };

  // Función que el AudioPlayer llamará cuando empiece a reproducir
  const handlePlay = (audioRef) => {
    // Pausar cualquier otro audio que esté sonando
    if (
      activeAudioRef &&
      activeAudioRef.current &&
      activeAudioRef.current !== audioRef.current
    ) {
      activeAudioRef.current.pause();
    }
    setActiveAudioRef(audioRef); // Establecer el nuevo audio activo
    audioRef.current.volume = globalVolume / 100; // Aplicar el volumen global al nuevo audio
  };

  const filteredGrabaciones = useMemo(() => {
    const search = globalFilter.trim().toLowerCase();
    if (!search) return grabaciones;

    return grabaciones
      .map((grupo) => ({
        ...grupo,
        archivos: (grupo.archivos || []).filter((archivo) => {
          const title = archivo.titulo?.toLowerCase() || "";
          const artist = archivo.artista?.toLowerCase() || "";
          const fileName = archivo.nombreArchivo?.toLowerCase() || "";
          return (
            grupo.fecha?.toLowerCase().includes(search) ||
            title.includes(search) ||
            artist.includes(search) ||
            fileName.includes(search)
          );
        }),
      }))
      .filter((grupo) => grupo.archivos.length > 0);
  }, [grabaciones, globalFilter]);

  const totalArchivos = useMemo(
    () => grabaciones.reduce((acc, grupo) => acc + (grupo.archivos?.length || 0), 0),
    [grabaciones]
  );

  if (loading) return <div>Cargando grabaciones...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="grabaciones-container">
      <Toast ref={toast} />
      <Card title="Configuración de grabación" className="config-card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <span className="status-text">
            Estado actual:{" "}
            <strong>
              {activo
                ? "Activado (la grabación automática está habilitada)"
                : "Desactivado (la grabación automática no se iniciará a las 7pm)"}
            </strong>
          </span>

          <Button
            label={
              activo
                ? "Desactivar grabación automática"
                : "Activar grabación automática"
            }
            icon={activo ? "pi pi-power-off" : "pi pi-power-on"}
            className={activo ? "p-button-warning" : "p-button-success"}
            onClick={() => cambiarEstado(!activo)}
          />

          <Button
            label="Actualizar"
            icon="pi pi-refresh"
            severity="secondary"
            onClick={fetchData}
            loading={loading}
          />
        </div>
      </Card>

      <Card className="global-volume-card">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <span>
            <strong>Grabaciones:</strong> {grabaciones.length} fechas / {totalArchivos} archivos
          </span>
          <IconField iconPosition="left">
            <InputIcon className="pi pi-search" />
            <InputText
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              placeholder="Buscar por fecha, título o artista"
            />
          </IconField>
        </div>
      </Card>

      <Card className="global-volume-card">
        <div className="global-volume-controls">
          <i className="pi pi-volume-up global-volume-icon" />
          <Slider
            value={globalVolume}
            onChange={(e) => setGlobalVolume(e.value)}
            min={0}
            max={100}
            step={1}
            className="global-volume-slider"
          />
          <span className="global-volume-percentage">{globalVolume}%</span>
        </div>
      </Card>

      <Card title="Programas Grabados" className="grabaciones-list-card">
        {filteredGrabaciones.length === 0 ? (
          <p>No hay grabaciones disponibles.</p>
        ) : (
          filteredGrabaciones.map((grupo, index) => (
            <div key={index} className="grabaciones-bloque">
              <h3>{grupo.fecha}</h3>
              <ul className="grabaciones-lista">
                {grupo.archivos.map((archivo, idx) => (
                  <li key={idx} className="grabaciones-item">
                    <AudioPlayer
                      // CAMBIO: Ahora archivo es un objeto, no solo un string
                      title={archivo.titulo}
                      artist={archivo.artista} // NUEVO PROP
                      src={getAudioSrc(grupo.fecha, archivo.nombreArchivo)}
                      globalVolume={globalVolume}
                      onPlay={handlePlay}
                      // Si la duración ya viene del backend, la puedes pasar aquí
                      // durationFromBackend={archivo.duracion_segundos}
                      isActive={
                        activeAudioRef &&
                        activeAudioRef.current &&
                        activeAudioRef.current.src === getAudioSrc(grupo.fecha, archivo.nombreArchivo)
                      }
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </Card>
    </div>
  );
};

export default GrabacionesPage;
