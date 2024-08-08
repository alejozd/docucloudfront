import React, { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";

const AsociarClienteContacto = () => {
  const toast = useRef(null);
  const hasShownToast = useRef(false);

  useEffect(() => {
    if (!hasShownToast.current) {
      toast.current.show({
        severity: "info",
        summary: "Info",
        detail: "Message Content",
      });
      hasShownToast.current = true;
    }
  }, []);

  return (
    <div>
      <p>Texto de ejemplo en el componente Prueba.</p>
      <Toast ref={toast} />
    </div>
  );
};

export default AsociarClienteContacto;
