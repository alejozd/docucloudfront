import React from "react";
import { Menubar } from "primereact/menubar";
import { Avatar } from "primereact/avatar"; //
import { icon } from "@fortawesome/fontawesome-svg-core";

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
      icon: "pi pi-share-alt",
      url: "/SerialReportes",
      id: "SerialReportes",
    },
    {
      label: "Productos",
      icon: "pi pi-th-large",
      url: "/productos",
      id: "productos",
    },
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
          icon: "pi pi-users",
          url: "/contactos",
          id: "contactos",
        },
        {
          label: "Cliente-Contacto",
          icon: "pi pi-link",
          url: "/AsociarClienteContacto",
          id: "AsociarClienteContacto",
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
