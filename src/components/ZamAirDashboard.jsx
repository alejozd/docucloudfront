import React, { useCallback, useEffect, useMemo, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Chart } from "primereact/chart";
import "../styles/ZamAirDashboard.css";

export default function ZamAirDashboard() {
  const [fbos, setFbos] = useState([]);
  const [aircraft, setAircraft] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fboSearch, setFboSearch] = useState("");
  const [aircraftSearch, setAircraftSearch] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");

    // Fallback explícito para desarrollo local
    const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3100";
    const KEY = process.env.REACT_APP_ZAM_API_KEY;

    if (!KEY) {
      setError(
        "No se encontró la API Key de ZAM-AIR. Configura REACT_APP_ZAM_API_KEY en tu .env.local para visualizar datos.",
      );
      setLoading(false);
      return;
    }

    try {
      const headers = { "x-api-key": KEY, Accept: "application/json" };
      const endpoints = ["fbos", "aircraft", "stats"];
      const urls = endpoints.map((ep) => `${BASE_URL}/api/${ep}`);

      console.log("🔍 [ZAM-AIR] Fetching from:", urls);

      // Fetch individual con manejo de errores por endpoint
      // para que si uno falla, los demás aún se muestren
      const fetchEndpoint = async (url) => {
        try {
          const res = await fetch(url, { headers });
          if (!res.ok) {
            const preview = await res.text();
            console.error(
              "❌ [ZAM-AIR] HTTP Error:",
              res.status,
              res.statusText,
              "Preview:",
              preview.substring(0, 200),
            );
            throw new Error(`Error HTTP ${res.status} al consultar API`);
          }

          const contentType = res.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            const text = await res.text();
            console.error(
              "❌ [ZAM-AIR] Expected JSON, got:",
              contentType,
              "Body:",
              text.substring(0, 150),
            );
            throw new Error(
              "La API no devolvió JSON. Verifica que el backend esté corriendo en " +
                BASE_URL,
            );
          }
          return res.json();
        } catch (err) {
          console.error(`❌ [ZAM-AIR] Endpoint ${url} failed:`, err);
          return { ok: false, error: err.message };
        }
      };

      const [fbosData, aircraftData, statsData] = await Promise.all(
        urls.map(fetchEndpoint),
      );

      if (fbosData?.ok) setFbos(fbosData.data || []);
      if (aircraftData?.ok) setAircraft(aircraftData.data || []);
      if (statsData?.ok) setStats(statsData.data || {});

      // Si TODOS fallaron, mostrar error general
      if (!fbosData?.ok && !aircraftData?.ok && !statsData?.ok) {
        setError(
          "No se pudieron cargar los datos. Verifica que el backend esté corriendo y revisa la consola (F12) para detalles.",
        );
      } else {
        setLastUpdated(new Date());
      }
    } catch (err) {
      setError(
        `Error cargando datos: ${err.message}. Revisa la consola (F12) para detalles.`,
      );
      console.error("🔍 [ZAM-AIR] Fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]); // Dependencias vacías: se ejecuta solo al montar el componente

  const suppliesBadge = (row) => {
    const days = Number(row?.daysOfSupplies || 0);
    const colorClass =
      days < 30
        ? "p-badge-danger"
        : days < 60
          ? "p-badge-warning"
          : "p-badge-success";

    return (
      <span className={`p-badge ${colorClass}`}>{days.toFixed(0)} días</span>
    );
  };

  // Helpers para badges de la tabla de aeronaves
  const fuelBadge = (row) => {
    const pct = Number(row?.fuelLevel || 0);
    const colorClass = pct > 50 ? "success" : pct > 20 ? "warning" : "danger";
    const label = pct > 0 ? `${pct}%` : "Vacío";
    return <span className={`p-badge p-badge-${colorClass}`}>{label}</span>;
  };

  const maintenanceBadge = (row) => {
    const hours = row?.hoursTo100Hr;
    if (hours === null || hours === undefined || hours < 0)
      return <span className="text-gray-500">N/A</span>;
    const colorClass =
      hours < 10 ? "danger" : hours < 25 ? "warning" : "success";
    return (
      <span className={`p-badge p-badge-${colorClass}`}>
        {hours.toFixed(1)}h
      </span>
    );
  };

  const statusBadge = (row) => {
    if (
      row?.rentedBy &&
      row.rentedBy !== "Not rented." &&
      row.rentedBy !== row.owner
    ) {
      return <span className="p-badge p-badge-info">Alquilado</span>;
    }
    if (row?.needsRepair) {
      return <span className="p-badge p-badge-danger">Reparación</span>;
    }
    return <span className="p-badge p-badge-success">Disponible</span>;
  };

  const fuelChartData = useMemo(
    () => ({
      labels: fbos.map((f) => f.icao),
      datasets: [
        {
          label: "Jet-A (gal)",
          data: fbos.map((f) => Number(f.fuelJetA || 0)),
          backgroundColor: "rgba(102, 126, 234, 0.8)",
          borderColor: "#667eea",
          borderWidth: 0,
          borderRadius: 6,
        },
        {
          label: "100LL (gal)",
          data: fbos.map((f) => Number(f.fuel100LL || 0)),
          backgroundColor: "rgba(245, 87, 108, 0.8)",
          borderColor: "#f5576c",
          borderWidth: 0,
          borderRadius: 6,
        },
      ],
    }),
    [fbos],
  );

  const fuelChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: { size: 12, weight: 600 },
          color: "#334155",
          padding: 15,
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.8)",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "#667eea",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        titleFont: { weight: 600 },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { color: "#f1f5f9", drawBorder: false },
        ticks: { color: "#64748b", font: { size: 11 } },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        grid: { color: "#f1f5f9", drawBorder: false },
        ticks: { color: "#64748b", font: { size: 11 } },
      },
    },
  };

  // Filtrar datos según búsqueda (memoizado para rendimiento)
  const filteredFbos = useMemo(
    () =>
      fbos.filter(
        (f) =>
          f.name?.toLowerCase().includes(fboSearch.toLowerCase()) ||
          f.icao?.toLowerCase().includes(fboSearch.toLowerCase()),
      ),
    [fbos, fboSearch],
  );

  const filteredAircraft = useMemo(
    () =>
      aircraft.filter(
        (a) =>
          a.registration
            ?.toLowerCase()
            .includes(aircraftSearch.toLowerCase()) ||
          a.makeModel?.toLowerCase().includes(aircraftSearch.toLowerCase()),
      ),
    [aircraft, aircraftSearch],
  );

  if (loading) {
    return (
      <div className="zam-air-dashboard">
        <div className="zam-air-loading">
          <div className="spinner"></div>
          <div>
            <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: 500 }}>
              ⏳ Cargando datos de ZAM-AIR...
            </p>
            <p
              style={{
                margin: "0.5rem 0 0 0",
                fontSize: "0.9rem",
                opacity: 0.7,
              }}
            >
              Conectando con el servidor
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="zam-air-dashboard">
        <div className="zam-air-error">
          <i className="pi pi-exclamation-circle"></i>
          <div className="zam-air-error-content">
            <p>{error}</p>
            <button
              className="zam-air-retry-btn"
              onClick={fetchData}
              disabled={loading}
            >
              <i className="pi pi-refresh"></i>
              {loading ? "Reintentando..." : "Reintentar"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="zam-air-dashboard">
      <div className="zam-air-header">
        <h2>🛫 ZAM-AIR DASHBOARD</h2>
        <p>Gestión de FBOs, flota y combustible en tiempo real</p>
        {lastUpdated && (
          <div className="zam-air-last-updated">
            <i className="pi pi-clock"></i>
            {lastUpdated.toLocaleTimeString("es-CO", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}
      </div>

      <div className="zam-air-stats">
        <div className="stat-card stat-hours">
          <div className="stat-icon">⏱️</div>
          <div className="stat-value">
            {Number(stats?.totalHours || 0).toFixed(1)}h
          </div>
          <div className="stat-label">Horas Voladas</div>
        </div>

        <div className="stat-card stat-balance">
          <div className="stat-icon">💰</div>
          <div className="stat-balance-values">
            <div className="stat-balance-row">
              <span className="stat-balance-label">Personal</span>
              <span className="stat-balance-amount">
                $
                {Number(stats?.personalBalance || 0).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="stat-balance-row">
              <span className="stat-balance-label">Banco</span>
              <span className="stat-balance-amount">
                $
                {Number(stats?.bankBalance || 0).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="stat-card stat-flights">
          <div className="stat-icon">✈️</div>
          <div className="stat-value">{Number(stats?.totalFlights || 0)}</div>
          <div className="stat-label">Vuelos</div>
        </div>

        <div className="stat-card stat-distance">
          <div className="stat-icon">🗺️</div>
          <div className="stat-value">
            {(Number(stats?.totalDistance || 0) / 1000).toFixed(1)}k nm
          </div>
          <div className="stat-label">Distancia</div>
        </div>
      </div>

      <div className="table-card">
        <div className="table-card-header">
          <h3 className="table-card-title">
            🏢 Mis FBOs ({filteredFbos.length})
          </h3>
          <div className="table-search">
            <i className="pi pi-search table-search-icon"></i>
            <input
              type="text"
              placeholder="Buscar por nombre o ICAO..."
              value={fboSearch}
              onChange={(e) => setFboSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="table-content">
          <DataTable
            value={filteredFbos}
            paginator
            rows={7}
            responsiveLayout="scroll"
            className="p-datatable-sm"
          >
            <Column
              field="icao"
              header="ICAO"
              sortable
              body={(row) => {
                // Extraer ciudad del campo location: "Aeropuerto, Ciudad, País"
                const locationParts = row.location?.split(",") || [];
                const city = locationParts[1]?.trim() || "";
                return (
                  <div>
                    <div className="font-semibold">{row.icao}</div>
                    {city && (
                      <small className="text-gray-500 block text-xs mt-1">
                        {city}
                      </small>
                    )}
                  </div>
                );
              }}
            />
            <Column field="name" header="Nombre" />
            <Column field="supplies" header="Supplies (kg)" sortable />
            <Column body={suppliesBadge} header="Autonomía" />
            <Column
              field="fuelJetA"
              header="Jet-A"
              body={(r) => Number(r.fuelJetA || 0).toLocaleString()}
            />
            <Column
              field="fuel100LL"
              header="100LL"
              body={(r) => Number(r.fuel100LL || 0).toLocaleString()}
            />
          </DataTable>
        </div>
      </div>

      <div className="table-card">
        <div className="table-card-header">
          <h3 className="table-card-title">
            ✈️ Mi Flota ({filteredAircraft.length})
          </h3>
          <div className="table-search">
            <i className="pi pi-search table-search-icon"></i>
            <input
              type="text"
              placeholder="Buscar por registro o modelo..."
              value={aircraftSearch}
              onChange={(e) => setAircraftSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="table-content">
          <DataTable
            value={filteredAircraft}
            paginator
            rows={5}
            responsiveLayout="scroll"
            className="p-datatable-sm"
            rowHover
          >
            {/* Registro + Estado */}
            <Column
              field="registration"
              header="Registro"
              body={(row) => (
                <div className="flex align-items-center gap-2">
                  <span className="font-semibold">{row.registration}</span>
                  {statusBadge(row)}
                </div>
              )}
              sortable
            />

            {/* Modelo */}
            <Column field="makeModel" header="Modelo" sortable />

            {/* Ubicación actual */}
            <Column
              field="location"
              header="Ubicación"
              body={(row) => (
                <div>
                  <div className="font-medium">{row.location}</div>
                  {row.locationName && (
                    <small className="text-gray-500 block text-xs mt-1">
                      {row.locationName.split(",")[0]}
                    </small>
                  )}
                </div>
              )}
            />

            {/* Base Home */}
            <Column field="homeBase" header="Base Home" sortable />

            {/* Combustible con badge de color */}
            <Column header="Combustible" body={fuelBadge} sortable />

            {/* Próximo mantenimiento 100h con badge de color */}
            <Column header="Próx. 100h" body={maintenanceBadge} sortable />

            {/* Horas de motor (opcional, útil) */}
            <Column
              field="engineHours"
              header="Horas Motor"
              body={(row) =>
                row.engineHours ? `${row.engineHours.toFixed(1)}h` : "N/A"
              }
              sortable
            />

            {/* Fee mensual */}
            <Column
              field="monthlyFee"
              header="Fee Mensual"
              body={(row) =>
                row.monthlyFee
                  ? `$${Number(row.monthlyFee).toLocaleString()}`
                  : "-"
              }
              sortable
            />
          </DataTable>
        </div>
      </div>

      <div className="chart-card">
        <h3 className="chart-title">⛽ Combustible por FBO</h3>
        <div style={{ height: "300px" }}>
          <Chart type="bar" data={fuelChartData} options={fuelChartOptions} />
        </div>
      </div>
    </div>
  );
}
