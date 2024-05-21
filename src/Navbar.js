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
      label: "Clientes",
      icon: "pi pi-users",
      url: "/clientes",
      id: "clientes",
    },
    {
      label: "Productos",
      icon: "pi pi-th-large",
      url: "/productos",
      id: "productos",
    },
    {
      label: "Contacto",
      icon: "pi pi-envelope",
      url: "/contacto",
      id: "contacto",
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
        image="https://primefaces.org/cdn/primevue/images/avatar/amyelsner.png"
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
