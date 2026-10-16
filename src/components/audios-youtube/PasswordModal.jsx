import React from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Password } from "primereact/password";

/**
 * Modal para pedir la clave de acceso al módulo de audios de YouTube.
 *
 * La clave se envía al backend, que la valida y responde con una sesión de
 * 24 horas. Ya NO se compara contra REACT_APP_API_KEY en el navegador, porque
 * esa variable viaja compilada dentro del bundle JS y era visible para
 * cualquiera desde las DevTools.
 *
 * @param {boolean}  visible
 * @param {Function} onHide
 * @param {Function} onAuthenticate - async (password) => void
 * @param {boolean}  loading
 * @param {string}   error - Mensaje de error devuelto por el backend
 * @param {number}   expiresInHours - Duración de la sesión (para el texto informativo)
 */
const PasswordModal = ({
  visible,
  onHide,
  onAuthenticate,
  loading,
  error,
  expiresInHours = 24,
}) => {
  const [password, setPassword] = React.useState("");
  const [localError, setLocalError] = React.useState("");

  // Limpiar el campo al cerrar el modal
  React.useEffect(() => {
    if (!visible) {
      setPassword("");
      setLocalError("");
    }
  }, [visible]);

  const errorMsg = localError || error;

  const handleAuthenticate = () => {
    if (loading) return;

    if (!password.trim()) {
      setLocalError("Por favor ingrese la clave de acceso");
      return;
    }

    setLocalError("");
    onAuthenticate(password);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleAuthenticate();
    }
  };

  const footerContent = (
    <div className="flex justify-content-end gap-2">
      <Button
        label="Cancelar"
        icon="pi pi-times"
        className="p-button-danger"
        onClick={onHide}
        disabled={loading}
      />
      <Button
        label="Ingresar"
        icon="pi pi-check"
        onClick={handleAuthenticate}
        loading={loading}
        disabled={!password.trim() || loading}
      />
    </div>
  );

  return (
    <Dialog
      header={
        <div className="flex align-items-center gap-2">
          <i className="pi pi-lock text-primary text-xl"></i>
          <span className="font-bold">Acceso Restringido</span>
        </div>
      }
      visible={visible}
      modal
      closable={false}
      dismissableMask={false}
      style={{ width: "90vw", maxWidth: "400px" }}
      footer={footerContent}
      onHide={onHide}
      className="p-fluid"
    >
      <div className="flex flex-column gap-4 py-3">
        <div className="flex flex-column align-items-center text-center gap-2">
          <div className="w-4rem h-4rem bg-primary-100 border-circle flex align-items-center justify-content-center mb-2">
            <i className="pi pi-shield text-primary text-3xl"></i>
          </div>
          <span className="text-xl font-medium text-900">
            Autenticación Requerida
          </span>
          <p className="m-0 text-secondary line-height-3">
            Ingrese su clave para habilitar las herramientas de descarga y
            procesamiento.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border-round border-1 border-red-200 flex align-items-start gap-3">
            <i className="pi pi-exclamation-circle text-red-500 text-xl mt-1"></i>
            <div className="flex flex-column">
              <span className="text-red-900 font-bold text-sm">
                No se pudo ingresar
              </span>
              <span className="text-red-700 text-xs">{errorMsg}</span>
            </div>
          </div>
        )}

        <div className="w-full" style={{ position: "relative" }}>
          <i
            className="pi pi-key absolute"
            style={{
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 1,
              color: "var(--primary-color)",
            }}
          />
          <Password
            id="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setLocalError("");
            }}
            onKeyPress={handleKeyPress}
            placeholder="Ingrese su clave de acceso"
            toggleMask
            feedback={false}
            autoFocus
            disabled={loading}
            inputClassName="w-full"
            className="w-full"
            inputStyle={{ paddingLeft: "40px" }}
          />
        </div>

        <div className="flex align-items-center gap-2 text-xs text-color-secondary">
          <i className="pi pi-clock"></i>
          <span>
            El acceso queda habilitado en este dispositivo por{" "}
            {expiresInHours} horas.
          </span>
        </div>
      </div>
    </Dialog>
  );
};

export default PasswordModal;
