import React, { useState } from "react";
import { Dropdown } from "primereact/dropdown";
import { FloatLabel } from "primereact/floatlabel";

const ClienteDialogFE = () => {
  const [selectedRegimenFEL, setSelectedRegimenFEL] = useState(null);
  const regimenesFEL = [
    { name: "responsable de IVA (48)", code: "1" },
    { name: "No responsable de IVA (49)", code: "2" },
  ];
  const [selectedResponsabilidadFEL, setSelectedResponsabilidadFEL] =
    useState(null);
  const responsabilidadesFEL = [
    { name: "Aplica", code: "01" },
    { name: "IVA", code: "2" },
    { name: "ZZ no aplica", code: "3" },
  ];

  return (
    <div className="card p-fluid">
      <div className="flex flex-column mt-3">
        <FloatLabel className="w-full">
          <Dropdown
            inputId="regfel"
            value={selectedRegimenFEL}
            onChange={(e) => setSelectedRegimenFEL(e.value)}
            options={regimenesFEL}
            optionLabel="name"
            placeholder="Seleccionar Regimen"
          />
          <label htmlFor="regfel">Seleccionar Regimen FEL</label>
        </FloatLabel>
      </div>
      <div className="flex flex-column mt-5">
        <FloatLabel className="w-full">
          <Dropdown
            inputId="respfel"
            value={selectedResponsabilidadFEL}
            onChange={(e) => setSelectedResponsabilidadFEL(e.value)}
            options={responsabilidadesFEL}
            optionLabel="name"
            placeholder="Seleccionar Responsabilidad FEL"
          />
          <label htmlFor="respfel">Seleccionar Responsabilidad FEL</label>
        </FloatLabel>
      </div>
    </div>
  );
};

export default ClienteDialogFE;
