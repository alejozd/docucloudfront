import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';

// Obtener API Key desde variables de entorno
const REACT_APP_API_KEY = process.env.REACT_APP_API_KEY;

/**
 * Modal para pedir password de autenticación
 * Similar al módulo "Aerolínea" (ZamAir)
 * Usa la ZAM_API_KEY del backend para validación
 */
const PasswordModal = ({ visible, onHide, onAuthenticate, loading }) => {
  const [password, setPassword] = React.useState('');
  const [errorMsg, setErrorMsg] = React.useState('');
  
  // Verificar si REACT_APP_API_KEY está definida
  React.useEffect(() => {
    if (!REACT_APP_API_KEY) {
      console.warn('⚠️ ADVERTENCIA: REACT_APP_API_KEY no está definida en el archivo .env');
      console.warn('Por favor, configura REACT_APP_API_KEY en tu archivo .env con la misma clave que el backend (ZAM_API_KEY)');
    }
  }, []);

  const handleAuthenticate = () => {
    if (!password.trim()) {
      setErrorMsg('Por favor ingrese el password');
      return;
    }
    
    // Validar que el password coincida con REACT_APP_API_KEY
    if (REACT_APP_API_KEY && password !== REACT_APP_API_KEY) {
      setErrorMsg('Password incorrecto. Verifique la clave.');
      return;
    }
    
    onAuthenticate(password);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAuthenticate();
    }
  };

  const footerContent = (
    <div className="flex justify-content-end gap-2">
      <Button 
        label="Cancelar" 
        icon="pi pi-times" 
        className="p-button-text" 
        onClick={onHide} 
      />
      <Button 
        label="Ingresar" 
        icon="pi pi-check" 
        onClick={handleAuthenticate} 
        loading={loading}
        disabled={!password.trim()}
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
      style={{ width: '90vw', maxWidth: '400px' }}
      footer={footerContent}
      onHide={onHide}
      className="p-fluid"
    >
      <div className="flex flex-column gap-4 py-3">
        <div className="flex flex-column align-items-center text-center gap-2">
          <div className="w-4rem h-4rem bg-primary-100 border-circle flex align-items-center justify-content-center mb-2">
            <i className="pi pi-shield text-primary text-3xl"></i>
          </div>
          <span className="text-xl font-medium text-900">Autenticación Requerida</span>
          <p className="m-0 text-secondary line-height-3">
            Ingrese su <strong>ZAM_API_KEY</strong> para habilitar las herramientas de descarga y procesamiento.
          </p>
        </div>
        
        {!REACT_APP_API_KEY && (
          <div className="p-3 bg-orange-50 border-round border-1 border-orange-200 flex align-items-start gap-3">
            <i className="pi pi-exclamation-triangle text-orange-500 text-xl mt-1"></i>
            <div className="flex flex-column">
              <span className="text-orange-900 font-bold text-sm">Falta Configuración</span>
              <span className="text-orange-700 text-xs">
                REACT_APP_API_KEY no encontrada en el entorno.
              </span>
            </div>
          </div>
        )}
        
        <div className="flex flex-column gap-2">
          <span className="p-input-icon-left w-full">
            <i className="pi pi-key z-2" />
            <Password
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrorMsg('');
              }}
              onKeyPress={handleKeyPress}
              placeholder="ZAM_API_KEY"
              toggleMask
              feedback={false}
              autoFocus
              inputClassName="w-full"
              className="w-full"
            />
          </span>
          {errorMsg && (
            <small className="p-error flex align-items-center gap-2">
              <i className="pi pi-times-circle"></i>
              {errorMsg}
            </small>
          )}
        </div>
      </div>
    </Dialog>
  );
};

export default PasswordModal;
