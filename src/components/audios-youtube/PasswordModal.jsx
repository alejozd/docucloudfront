import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';

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
      header="Autenticación Requerida"
      visible={visible}
      modal
      closable={false}
      dismissableMask={false}
      style={{ width: '400px' }}
      footer={footerContent}
      onHide={onHide}
    >
      <div className="flex flex-column gap-3 p-3">
        <p className="m-0 text-color-secondary">
          Por favor ingrese la <strong>ZAM_API_KEY</strong> para acceder al módulo de descarga de audios desde YouTube.
        </p>
        
        {!REACT_APP_API_KEY && (
          <div className="p-3 bg-orange-100 border-round border-1 border-orange-300">
            <i className="pi pi-exclamation-triangle text-orange-600 mr-2"></i>
            <span className="text-orange-700 text-sm">
              Advertencia: REACT_APP_API_KEY no está configurada en el archivo .env
            </span>
          </div>
        )}
        
        <div className="flex flex-column gap-2">
          <label htmlFor="password" className="font-medium">ZAM API Key</label>
          <InputText
            id="password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrorMsg('');
            }}
            onKeyPress={handleKeyPress}
            placeholder="Ingrese su ZAM_API_KEY"
            className="w-full"
            autoFocus
          />
          {errorMsg && (
            <small className="p-error">{errorMsg}</small>
          )}
        </div>
      </div>
    </Dialog>
  );
};

export default PasswordModal;
