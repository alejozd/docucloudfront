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
    <div className="zam-air-dashboard p-4 surface-ground">
      <div className="flex align-items-center justify-content-center mb-5">
        <i className="pi pi-send text-4xl text-primary mr-3"></i>
        <h2 className="text-4xl font-bold m-0 text-900">Dashboard ZAM-AIR</h2>
      </div>

      <div className="grid mb-5">
        <div className="col-12 md:col-6 lg:col-3">
          <Card className="h-full shadow-2 hover:shadow-6 transition-all transition-duration-300 cursor-pointer border-round-xl">
            <div className="flex flex-column align-items-center justify-content-center h-full py-4">
              <div className="w-4rem h-4rem bg-blue-50 border-circle flex align-items-center justify-content-center mb-3">
                <i className="pi pi-clock text-3xl text-blue-600"></i>
              </div>
              <h3 className="text-3xl font-bold m-0 text-900">{Number(stats?.totalHours || 0).toFixed(1)}h</h3>
              <span className="text-600 font-medium mt-2">Horas Voladas</span>
            </div>
          </Card>
        </div>

        <div className="col-12 md:col-6 lg:col-3">
          <Card className="h-full shadow-2 hover:shadow-6 transition-all transition-duration-300 cursor-pointer border-round-xl">
            <div className="flex flex-column align-items-center justify-content-center h-full py-4">
              <div className="w-4rem h-4rem bg-green-50 border-circle flex align-items-center justify-content-center mb-3">
                <i className="pi pi-wallet text-3xl text-green-600"></i>
              </div>
              <div className="w-full px-3">
                <div className="flex justify-content-between align-items-center mb-2">
                  <span className="text-600 font-medium">Personal</span>
                  <span className="text-xl font-bold text-blue-600">
                    ${Number(stats?.personalBalance || 0).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-content-between align-items-center border-top-1 surface-border pt-2">
                  <span className="text-600 font-medium">Banco</span>
                  <span className="text-xl font-bold text-green-600">
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
            <div className="flex flex-column align-items-center justify-content-center h-full py-4">
              <div className="w-4rem h-4rem bg-orange-50 border-circle flex align-items-center justify-content-center mb-3">
                <i className="pi pi-send text-3xl text-orange-600"></i>
              </div>
              <h3 className="text-3xl font-bold m-0 text-900">{Number(stats?.totalFlights || 0)}</h3>
              <span className="text-600 font-medium mt-2">Vuelos</span>
            </div>
          </Card>
        </div>

        <div className="col-12 md:col-6 lg:col-3">
          <Card className="h-full shadow-2 hover:shadow-6 transition-all transition-duration-300 cursor-pointer border-round-xl">
            <div className="flex flex-column align-items-center justify-content-center h-full py-4">
              <div className="w-4rem h-4rem bg-purple-50 border-circle flex align-items-center justify-content-center mb-3">
                <i className="pi pi-map text-3xl text-purple-600"></i>
              </div>
              <h3 className="text-3xl font-bold m-0 text-900">{(Number(stats?.totalDistance || 0) / 1000).toFixed(1)}k nm</h3>
              <span className="text-600 font-medium mt-2">Distancia</span>
            </div>
          </Card>
        </div>
      </div>

      <Card title="🏢 Mis FBOs" className="mb-5 shadow-2 border-round-xl">
        <DataTable value={fbos} paginator rows={7} responsiveLayout="scroll" className="p-datatable-sm">
          <Column field="icao" header="ICAO" sortable className="font-bold" />
          <Column field="name" header="Nombre" />
          <Column field="supplies" header="Supplies (kg)" sortable />
          <Column body={suppliesBadge} header="Autonomía" />
          <Column field="fuelJetA" header="Jet-A" body={(r) => Number(r.fuelJetA || 0).toLocaleString()} />
          <Column field="fuel100LL" header="100LL" body={(r) => Number(r.fuel100LL || 0).toLocaleString()} />
        </DataTable>
      </Card>

      <Card title="✈️ Mi Flota" className="mb-5 shadow-2 border-round-xl">
        <DataTable value={aircraft} paginator rows={5} responsiveLayout="scroll">
          <Column field="registration" header="Registro" className="font-bold text-primary" />
          <Column field="makeModel" header="Modelo" />
          <Column field="location" header="Ubicación" />
          <Column field="fuelLevel" header="Combustible" body={(r) => `${Number(r.fuelLevel || 0)}%`} />
          <Column
            field="hoursTo100Hr"
            header="Mantenimiento"
            body={(r) => (r.hoursTo100Hr ? `${r.hoursTo100Hr}h` : "N/A")}
          />
        </DataTable>
      </Card>

      <Card title="⛽ Combustible por FBO" className="mb-5 shadow-2 border-round-xl">
        <div style={{ height: "300px" }}>
          <Chart type="bar" data={fuelChartData} options={fuelChartOptions} />
        </div>
      </Card>
    </div>
  );
}
