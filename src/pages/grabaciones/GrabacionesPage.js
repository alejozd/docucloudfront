import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Slider } from "primereact/slider";
import "../../styles/GrabacionesPage.css"; // Opcional: estilos personalizados
import AudioPlayer from "../../components/audio/AudioPlayer"; // Importa el nuevo componente

const GrabacionesPage = () => {
  const [grabaciones, setGrabaciones] = useState([]);
  const [activo, setActivo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [globalVolume, setGlobalVolume] = useState(100);
  const [activeAudioRef, setActiveAudioRef] = useState(null);

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        const resEstado = await axios.get(
          "https://zetamini.ddns.net/api/grabacion/estado "
        );
        const resLista = await axios.get(
          "https://zetamini.ddns.net/api/grabacion/lista "
        );

        setActivo(resEstado.data.activo);
        setGrabaciones(resLista.data);
      } catch (err) {
        console.error("Error al cargar datos:", err);
        setError("No se pudieron cargar las grabaciones.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Efecto para aplicar el volumen global al audio activo
  useEffect(() => {
    if (activeAudioRef && activeAudioRef.current) {
      activeAudioRef.current.volume = globalVolume / 100;
    }
  }, [globalVolume, activeAudioRef]); // Se ejecuta cuando el volumen o el audio activo cambian

  // Manejar cambio de estado
  const cambiarEstado = async (nuevoEstado) => {
    try {
      await axios.post("https://zetamini.ddns.net/api/grabacion/estado ", {
        activo: nuevoEstado,
      });
      setActivo(nuevoEstado);
    } catch (err) {
      alert("No se pudo actualizar el estado.");
      console.error("Error al cambiar estado:", err);
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

  if (loading) return <div>Cargando grabaciones...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="grabaciones-container">
      {/* Panel de control (se mantiene en su Card actual) */}
      <Card title="Configuración de grabación" className="config-card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap:
              "wrap" /* Permite que los elementos se envuelvan en móviles */,
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
        </div>
      </Card>

      {/* NUEVO: Contenedor para el control de volumen global */}
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

      {/* NUEVO: Card para "Programas Grabados" */}
      <Card title="Programas Grabados" className="grabaciones-list-card">
        {grabaciones.length === 0 ? (
          <p>No hay grabaciones disponibles.</p>
        ) : (
          grabaciones.map((grupo, index) => (
            <div key={index} className="grabaciones-bloque">
              <h3>{grupo.fecha}</h3>
              <ul className="grabaciones-lista">
                {grupo.archivos.map((archivo, idx) => (
                  <li key={idx} className="grabaciones-item">
                    <AudioPlayer
                      title={archivo}
                      src={`https://zetamini.ddns.net/grabaciones/${grupo.fecha.replace(
                        /-/g,
                        "/"
                      )}/${archivo}`}
                      // PASAMOS EL VOLUMEN GLOBAL Y EL MANEJADOR DE PLAY
                      globalVolume={globalVolume}
                      onPlay={handlePlay}
                      // También podrías pasar el activeAudioRef para que el player sepa si es el activo
                      isActive={
                        activeAudioRef &&
                        activeAudioRef.current &&
                        activeAudioRef.current.src ===
                          `https://zetamini.ddns.net/grabaciones/${grupo.fecha.replace(
                            /-/g,
                            "/"
                          )}/${archivo}`
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
