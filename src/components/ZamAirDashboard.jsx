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
      if (!API_KEY) {
        setError(
          "No se encontró la API Key de ZAM-AIR. Configura REACT_APP_ZAM_API_KEY para visualizar datos."
        );
        setLoading(false);
        return;
      }

      try {
        const headers = { "x-api-key": API_KEY };

        const [fbosRes, aircraftRes, statsRes] = await Promise.all([
          fetch(`${API_BASE}/api/fbos`, { headers }),
          fetch(`${API_BASE}/api/aircraft`, { headers }),
          fetch(`${API_BASE}/api/stats`, { headers }),
        ]);

        if (!fbosRes.ok || !aircraftRes.ok || !statsRes.ok) {
          throw new Error("Error HTTP al consultar endpoints");
        }

        const [fbosData, aircraftData, statsData] = await Promise.all([
          fbosRes.json(),
          aircraftRes.json(),
          statsRes.json(),
        ]);

        if (fbosData?.ok) setFbos(fbosData.data || []);
        if (aircraftData?.ok) setAircraft(aircraftData.data || []);
        if (statsData?.ok) setStats(statsData.data || {});
      } catch (err) {
        setError("Error cargando datos. Verifica conexión y API Key.");
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [API_BASE, API_KEY]);

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

      <div className="grid mb-4">
        <div className="col-12 md:col-3">
          <Card title="⏱️ Horas Voladas">
            <h3 className="text-2xl font-bold">{Number(stats?.totalHours || 0).toFixed(1)}h</h3>
          </Card>
        </div>
        <div className="col-12 md:col-3">
          <Card title="💰 Ingresos Totales">
            <h3 className="text-2xl font-bold">${Number(stats?.totalEarnings || 0).toLocaleString()}</h3>
          </Card>
        </div>
        <div className="col-12 md:col-3">
          <Card title="✈️ Vuelos">
            <h3 className="text-2xl font-bold">{Number(stats?.totalFlights || 0)}</h3>
          </Card>
        </div>
        <div className="col-12 md:col-3">
          <Card title="🗺️ Distancia">
            <h3 className="text-2xl font-bold">{(Number(stats?.totalDistance || 0) / 1000).toFixed(1)}k nm</h3>
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
        <DataTable value={aircraft} paginator rows={5} responsiveLayout="scroll">
          <Column field="registration" header="Registro" />
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

      <Card title="⛽ Combustible por FBO" className="mb-4">
        <div style={{ height: "300px" }}>
          <Chart type="bar" data={fuelChartData} options={fuelChartOptions} />
        </div>
      </Card>
    </div>
  );
}
