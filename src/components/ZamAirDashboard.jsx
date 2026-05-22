import React, { useEffect, useMemo, useState } from "react";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Chart } from "primereact/chart";

export default function ZamAirDashboard() {
  const [fbos, setFbos] = useState([]);
  const [aircraft, setAircraft] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_BASE = process.env.REACT_APP_API_URL || "";
  const API_KEY = process.env.REACT_APP_ZAM_API_KEY;

  useEffect(() => {
    const fetchData = async () => {
      // Fallback explícito para desarrollo local
      const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3100";
      const KEY = process.env.REACT_APP_ZAM_API_KEY;

      if (!KEY) {
        setError(
          "No se encontró la API Key de ZAM-AIR. Configura REACT_APP_ZAM_API_KEY en tu .env.local para visualizar datos."
        );
        setLoading(false);
        return;
      }

      try {
        const headers = { "x-api-key": KEY, Accept: "application/json" };
        const endpoints = ["fbos", "aircraft", "stats"];
        const urls = endpoints.map((ep) => `${BASE_URL}/api/${ep}`);

        console.log("🔍 [ZAM-AIR] Fetching from:", urls);

        const responses = await Promise.all(urls.map((url) => fetch(url, { headers })));

        // Validar que TODAS las respuestas sean HTTP 2xx
        const failed = responses.find((res) => !res.ok);
        if (failed) {
          const preview = await failed.text();
          console.error(
            "❌ [ZAM-AIR] HTTP Error:",
            failed.status,
            failed.statusText,
            "Preview:",
            preview.substring(0, 200)
          );
          throw new Error(`Error HTTP ${failed.status} al consultar API`);
        }

        // Validar content-type ANTES de llamar a .json()
        const jsonPromises = responses.map(async (res) => {
          const contentType = res.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            const text = await res.text();
            console.error(
              "❌ [ZAM-AIR] Expected JSON, got:",
              contentType,
              "Body:",
              text.substring(0, 150)
            );
            throw new Error(
              "La API no devolvió JSON. Verifica que el backend esté corriendo en " + BASE_URL
            );
          }
          return res.json();
        });

        const [fbosData, aircraftData, statsData] = await Promise.all(jsonPromises);

        if (fbosData?.ok) setFbos(fbosData.data || []);
        if (aircraftData?.ok) setAircraft(aircraftData.data || []);
        if (statsData?.ok) setStats(statsData.data || {});
      } catch (err) {
        setError(`Error cargando datos: ${err.message}. Revisa la consola (F12) para detalles.`);
        console.error("🔍 [ZAM-AIR] Fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Dependencias vacías: se ejecuta solo al montar el componente

  const suppliesBadge = (row) => {
    const days = Number(row?.daysOfSupplies || 0);
    const colorClass =
      days < 30 ? "p-badge-danger" : days < 60 ? "p-badge-warning" : "p-badge-success";

    return <span className={`p-badge ${colorClass}`}>{days.toFixed(0)} días</span>;
  };

  const fuelChartData = useMemo(
    () => ({
      labels: fbos.map((f) => f.icao),
      datasets: [
        {
          label: "Jet-A (gal)",
          data: fbos.map((f) => Number(f.fuelJetA || 0)),
          backgroundColor: "rgba(54, 162, 235, 0.5)",
        },
        {
          label: "100LL (gal)",
          data: fbos.map((f) => Number(f.fuel100LL || 0)),
          backgroundColor: "rgba(255, 99, 132, 0.5)",
        },
      ],
    }),
    [fbos]
  );

  const fuelChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { stacked: true },
      y: { stacked: true, beginAtZero: true },
    },
  };

  if (loading) return <div className="p-4">⏳ Cargando datos de ZAM-AIR...</div>;
  if (error) return <div className="p-4 text-red-500">❌ {error}</div>;

  return (
    <div className="zam-air-dashboard p-4">
      <h2 className="mb-4">🛫 Dashboard ZAM-AIR</h2>

      <div className="grid mb-5">
        <div className="col-12 md:col-6 lg:col-3">
          <Card className="h-full shadow-2 hover:shadow-6 transition-all transition-duration-300 cursor-pointer border-round-xl">
            <div className="flex flex-column align-items-center justify-content-center h-full py-2">
              <div className="w-3rem h-3rem bg-blue-50 border-circle flex align-items-center justify-content-center mb-2">
                <i className="pi pi-clock text-2xl text-blue-600"></i>
              </div>
              <h3 className="text-2xl font-bold m-0 text-900">{Number(stats?.totalHours || 0).toFixed(1)}h</h3>
              <span className="text-600 font-medium mt-1">Horas Voladas</span>
            </div>
          </Card>
        </div>

        <div className="col-12 md:col-6 lg:col-3">
          <Card className="h-full shadow-2 hover:shadow-6 transition-all transition-duration-300 cursor-pointer border-round-xl">
            <div className="flex flex-column align-items-center justify-content-center h-full py-2">
              <div className="w-3rem h-3rem bg-green-50 border-circle flex align-items-center justify-content-center mb-2">
                <i className="pi pi-wallet text-2xl text-green-600"></i>
              </div>
              <div className="w-full px-3">
                <div className="flex justify-content-between align-items-center mb-1">
                  <span className="text-600 font-medium text-sm">Personal</span>
                  <span className="text-lg font-bold text-blue-600">
                    ${Number(stats?.personalBalance || 0).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-content-between align-items-center border-top-1 surface-border pt-1">
                  <span className="text-600 font-medium text-sm">Banco</span>
                  <span className="text-lg font-bold text-green-600">
                    ${Number(stats?.bankBalance || 0).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="col-12 md:col-6 lg:col-3">
          <Card className="h-full shadow-2 hover:shadow-6 transition-all transition-duration-300 cursor-pointer border-round-xl">
            <div className="flex flex-column align-items-center justify-content-center h-full py-2">
              <div className="w-3rem h-3rem bg-orange-50 border-circle flex align-items-center justify-content-center mb-2">
                <i className="pi pi-send text-2xl text-orange-600"></i>
              </div>
              <h3 className="text-2xl font-bold m-0 text-900">{Number(stats?.totalFlights || 0)}</h3>
              <span className="text-600 font-medium mt-1">Vuelos</span>
            </div>
          </Card>
        </div>

        <div className="col-12 md:col-6 lg:col-3">
          <Card className="h-full shadow-2 hover:shadow-6 transition-all transition-duration-300 cursor-pointer border-round-xl">
            <div className="flex flex-column align-items-center justify-content-center h-full py-2">
              <div className="w-3rem h-3rem bg-purple-50 border-circle flex align-items-center justify-content-center mb-2">
                <i className="pi pi-map text-2xl text-purple-600"></i>
              </div>
              <h3 className="text-2xl font-bold m-0 text-900">{(Number(stats?.totalDistance || 0) / 1000).toFixed(1)}k nm</h3>
              <span className="text-600 font-medium mt-1">Distancia</span>
            </div>
          </Card>
        </div>
      </div>

      <Card title="🏢 Mis FBOs" className="mb-4">
        <DataTable value={fbos} paginator rows={7} responsiveLayout="scroll" className="p-datatable-sm">
          <Column field="icao" header="ICAO" sortable />
          <Column field="name" header="Nombre" />
          <Column field="supplies" header="Supplies (kg)" sortable />
          <Column body={suppliesBadge} header="Autonomía" />
          <Column field="fuelJetA" header="Jet-A" body={(r) => Number(r.fuelJetA || 0).toLocaleString()} />
          <Column field="fuel100LL" header="100LL" body={(r) => Number(r.fuel100LL || 0).toLocaleString()} />
        </DataTable>
      </Card>

      <Card title="✈️ Mi Flota" className="mb-4">
        {/* Helpers para badges de combustible */}
        {(() => {
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
            const colorClass = hours < 10 ? "danger" : hours < 25 ? "warning" : "success";
            return <span className={`p-badge p-badge-${colorClass}`}>{hours.toFixed(1)}h</span>;
          };

          const statusBadge = (row) => {
            if (row?.rentedBy && row.rentedBy !== "Not rented." && row.rentedBy !== row.owner) {
              return <span className="p-badge p-badge-info">Alquilado</span>;
            }
            if (row?.needsRepair) {
              return <span className="p-badge p-badge-danger">Reparación</span>;
            }
            return <span className="p-badge p-badge-success">Disponible</span>;
          };

          return (
            <DataTable
              value={aircraft}
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
                body={(row) => (row.engineHours ? `${row.engineHours.toFixed(1)}h` : "N/A")}
                sortable
              />

              {/* Fee mensual */}
              <Column
                field="monthlyFee"
                header="Fee Mensual"
                body={(row) =>
                  row.monthlyFee ? `$${Number(row.monthlyFee).toLocaleString()}` : "-"
                }
                sortable
              />
            </DataTable>
          );
        })()}
      </Card>

      <Card title="⛽ Combustible por FBO" className="mb-4">
        <div style={{ height: "300px" }}>
          <Chart type="bar" data={fuelChartData} options={fuelChartOptions} />
        </div>
      </Card>
    </div>
  );
}
