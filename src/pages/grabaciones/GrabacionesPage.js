import { useEffect, useState } from "react";
import axios from "axios";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import "../../styles/GrabacionesPage.css"; // Opcional: estilos personalizados

const GrabacionesPage = () => {
  const [grabaciones, setGrabaciones] = useState([]);
  const [activo, setActivo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) return <div>Cargando grabaciones...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="grabaciones-container">
      {/* Panel de control */}
      <Card title="Configuración de grabación">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>
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
            icon={activo ? "pi pi-power-off" : "pi pi-power-off"}
            className={activo ? "p-button-warning" : "p-button-success"}
            onClick={() => cambiarEstado(!activo)}
          />
        </div>
      </Card>

      <h2>Programas Grabados</h2>

      {grabaciones.length === 0 ? (
        <p>No hay grabaciones disponibles.</p>
      ) : (
        grabaciones.map((grupo, index) => (
          <div key={index} className="grabaciones-bloque">
            <h3>{grupo.fecha}</h3>
            <ul className="grabaciones-lista">
              {grupo.archivos.map((archivo, idx) => (
                <li key={idx} className="grabaciones-item">
                  <strong>{archivo}</strong>
                  <audio
                    className="grabaciones-audio"
                    controls
                    src={`https://zetamini.ddns.net/grabaciones/ ${grupo.fecha.replace(
                      /-/g,
                      "/"
                    )}/${archivo}`}
                    style={{ width: "100%", marginTop: "1rem" }}
                  >
                    Tu navegador no soporta este formato de audio.
                  </audio>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
};

export default GrabacionesPage;
