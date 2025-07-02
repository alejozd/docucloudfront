import { useEffect, useState } from "react";
import axios from "axios";

import "../../styles/GrabacionesPage.css"; // Opcional: estilos personalizados

const GrabacionesPage = () => {
  const [grabaciones, setGrabaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGrabaciones = async () => {
      try {
        const res = await axios.get(
          "https://zetamini.ddns.net/api/grabacion/lista "
        );
        setGrabaciones(res.data);
        setLoading(false);
      } catch (err) {
        console.error("Error al cargar grabaciones:", err);
        setError("No se pudieron cargar las grabaciones.");
        setLoading(false);
      }
    };

    fetchGrabaciones();
  }, []);

  if (loading) return <div>Cargando grabaciones...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="grabaciones-container">
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
