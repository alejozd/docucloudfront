import { useState } from "react";
import { Dropdown } from "primereact/dropdown";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Sidebar } from "primereact/sidebar";
import { Button } from "primereact/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
const SalesDashboard = () => {
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const segments = [
    { label: "Arquitecto", value: "Arquitecto" },
    { label: "Maestro", value: "Maestro" },
    { label: "Constructora", value: "Constructora" },
  ];
  const clients = [
    { id: 1, nombre: "Cliente A", compras: 10, ultimaCompra: "2024-02-01" },
    { id: 2, nombre: "Cliente B", compras: 15, ultimaCompra: "2024-01-15" },
  ];
  const salesData = [
    { segment: "Arquitecto", sales: 12000 },
    { segment: "Maestro", sales: 9000 },
    { segment: "Constructora", sales: 15000 },
  ];
  const openSidebar = (client) => {
    setSelectedClient(client);
    setShowSidebar(true);
  };
  const productsData = [
    { name: "Cemento", value: 40 },
    { name: "Piso", value: 30 },
    { name: "Sanitario", value: 20 },
    { name: "Lavamanos", value: 10 },
  ];
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];
  return (
    <div className="p-6 space-y-6">
      <h2 className="mb-4">Dashboard de Ventas</h2>
      {/* Filtros */}
      <Card className="p-4 flex gap-4 mb-2">
        <Dropdown
          value={selectedSegment}
          options={segments}
          onChange={(e) => setSelectedSegment(e.value)}
          placeholder="Selecciona un segmento"
          className="w-60"
        />
        <Button label="Buscar" icon="pi pi-search" />
      </Card>
      {/* KPIs */}
      <Card className="p-4 mb-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card title="Total Facturas">
            <h2>1,200</h2>
          </Card>
          <Card title="Ticket Promedio">
            <h2>$2,350</h2>
          </Card>
          <Card title="Clientes Activos">
            <h2>85</h2>
          </Card>
        </div>
      </Card>
      {/* Tabla de Clientes */}
      <Card className="p-4 mb-2">
        <h3 className="mt-6">Clientes del Segmento</h3>
        <DataTable value={clients} paginator rows={5} className="mt-3">
          <Column
            field="nombre"
            header="Cliente"
            sortable
            body={(rowData) => (
              <span
                className="cursor-pointer text-blue-500"
                onClick={() => openSidebar(rowData)}
              >
                {rowData.nombre}
              </span>
            )}
          />
          <Column field="compras" header="Total Compras" sortable />
          <Column field="ultimaCompra" header="Última Compra" sortable />
        </DataTable>
      </Card>
      {/* Gráfica de Ventas por Segmento */}
      <Card className="p-4 mb-2">
        <h2 className="text-xl font-bold mb-4">Ventas por Segmento</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={salesData}>
            <XAxis dataKey="segment" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="sales" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
      {/* Gráfica de Productos Más Vendidos */}
      <Card className="p-4 mb-2">
        <h2 className="text-xl font-bold mb-4">Productos Más Vendidos</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={productsData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
            >
              {productsData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Card>
      {/* Sidebar con Detalle del Cliente */}
      <Sidebar
        visible={showSidebar}
        position="right"
        onHide={() => setShowSidebar(false)}
      >
        {selectedClient && (
          <>
            <h3>{selectedClient.nombre}</h3>
            <p>Total Compras: {selectedClient.compras}</p>
            <p>Última Compra: {selectedClient.ultimaCompra}</p>
          </>
        )}
      </Sidebar>
    </div>
  );
};
export default SalesDashboard;
