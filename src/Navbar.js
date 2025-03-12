import React from "react";
import { Menubar } from "primereact/menubar";
import { Avatar } from "primereact/avatar";

const Navbar = () => {
  const items = [
    {
      label: "Inicio",
      icon: "pi pi-home",
      url: "/",
      id: "inicio",
    },
    {
      label: "Alejo",
      icon: "pi pi-key",
      items: [
        {
          label: "Serial Reportes",
          icon: "pi pi-address-book",
          url: "/SerialReportes",
          id: "SerialReportes",
        },
        {
          label: "Medios",
          icon: "pi pi-folder",
          items: [
            {
              label: "Clientes Medios",
              icon: "pi pi-users",
              url: "/clientes-medios",
              id: "clientes-medios",
            },
            {
              label: "Seriales ERP",
              icon: "pi pi-key",
              url: "/seriales-erp",
              id: "seriales-erp",
            },
            {
              label: "Claves Generadas",
              icon: "pi pi-lock",
              url: "/claves-generadas",
              id: "claves-generadas",
            },
            {
              label: "Generar Clave",
              icon: "pi pi-key",
              url: "/generar-clave",
              id: "generar-clave",
            },
            {
              label: "Vendedores",
              icon: "pi pi-users",
              url: "/vendedores",
              id: "vendedores",
            },
            {
              label: "Ventas",
              icon: "pi pi-shopping-cart",
              url: "/ventas",
              id: "ventas",
            },
            {
              label: "Pagos",
              icon: "pi pi-dollar",
              url: "/pagos",
              id: "pagos",
            },
          ],
        },
      ],
    },

    {
      label: "Utilidades",
      icon: "pi pi-cog",
      items: [
        {
          label: "WorkTimeCalculator",
          icon: "pi pi-calculator",
          url: "/WorkTimeCalculator",
          id: "WorkTimeCalculator",
        },
        {
          label: "BatteryStatus",
          icon: "pi pi-battery pi-bolt",
          url: "/BatteryStatus",
          id: "BatteryStatus",
        },
      ],
    },
    {
      label: "RegistroSolicitudespage",
      icon: "pi pi-list",
      url: "/RegistroSolicitudespage",
      id: "RegistroSolicitudespage",
    },
    {
      label: "Reportes",
      icon: "pi pi-chart-line",
      items: [
        {
          label: "Dashboard de Ventas",
          icon: "pi pi-chart-bar",
          url: "/SalesDashboard",
          id: "SalesDashboard",
        },
      ],
    },
    {
      label: "Otros",
      icon: "pi pi-other",
      items: [
        {
          label: "Contactar",
          icon: "pi pi-envelope",
          url: "/contactar",
          id: "contactar",
        },
        {
          label: "Weather",
          icon: "pi pi-sun",
          url: "/weather",
          id: "weather",
        },
      ],
    },
    {
      label: "Administrar",
      icon: "pi pi-cog",
      items: [
        {
          label: "Clientes",
          icon: "pi pi-users",
          url: "/clientes",
          id: "clientes",
        },
        {
          label: "Contactos",
          icon: "pi pi-user-plus",
          url: "/contactos",
          id: "contactos",
        },
        {
          label: "Cliente-Contacto",
          icon: "pi pi-sitemap",
          url: "/AsociarClienteContacto",
          id: "AsociarClienteContacto",
        },
        {
          label: "Productos",
          icon: "pi pi-th-large",
          url: "/productos",
          id: "productos",
        },
      ],
    },
  ];

  const start = (
    <img
      alt="logo"
      src="https://primefaces.org/cdn/primereact/images/logo.png"
      height="40"
      className="mr-2"
    ></img>
  );

  const end = (
    <div className="flex align-items-center gap-2">
      <Avatar
        // image="https://primefaces.org/cdn/primevue/images/avatar/amyelsner.png"
        image="https://i.annihil.us/u/prod/marvel/i/mg/9/c0/527bb7b37ff55/landscape_medium.jpg"
        shape="circle"
      />
    </div>
  );

  return (
    <div className="card">
      <Menubar model={items} start={start} end={end} />
    </div>
  );
};

export default Navbar;
