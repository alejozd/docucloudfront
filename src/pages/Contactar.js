import React, { useRef } from "react";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { useFormik } from "formik";
import emailjs from "emailjs-com";
import "../styles/Contactar.css";

const EMAILJS_CONFIG = {
  serviceId: "service_p1m3hb3",
  templateId: "template_7gotzgk",
  publicKey: "_wv37ukba9HbYShcd",
};

const INITIAL_VALUES = {
  nombre: "",
  telefono: "",
  email: "",
  mensaje: "",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateForm = (values) => {
  const errors = {};

  if (!values.nombre.trim()) {
    errors.nombre = "El nombre es requerido.";
  }

  if (!values.telefono.trim()) {
    errors.telefono = "El teléfono es requerido.";
  }

  if (!values.email.trim()) {
    errors.email = "El correo electrónico es requerido.";
  } else if (!EMAIL_REGEX.test(values.email)) {
    errors.email = "Correo electrónico inválido.";
  }

  if (!values.mensaje.trim()) {
    errors.mensaje = "El mensaje es requerido.";
  }

  return errors;
};

const buildTemplateParams = (values) => ({
  from_name: values.nombre.trim(),
  to_name: "Alejandro",
  message: values.mensaje.trim(),
  phone: values.telefono.trim(),
  reply_to: values.email.trim(),
});

const sendEmail = async (templateParams) => {
  return emailjs.send(
    EMAILJS_CONFIG.serviceId,
    EMAILJS_CONFIG.templateId,
    templateParams,
    EMAILJS_CONFIG.publicKey
  );
};

const ContactField = ({ id, label, formik, as: Component = InputText, ...props }) => {
  const hasError = Boolean(formik.touched[id] && formik.errors[id]);

  return (
    <div className="contactar-field">
      <label htmlFor={id} className="contactar-label">
        {label}
      </label>
      <Component
        id={id}
        name={id}
        value={formik.values[id]}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        className={hasError ? "p-invalid" : ""}
        {...props}
      />
      {hasError && <small className="p-error">{formik.errors[id]}</small>}
    </div>
  );
};

const Contactar = () => {
  const toast = useRef(null);

  const formik = useFormik({
    initialValues: INITIAL_VALUES,
    validate: validateForm,
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      try {
        const templateParams = buildTemplateParams(values);
        const response = await sendEmail(templateParams);

        console.log("Correo enviado correctamente:", response.status, response.text);
        toast.current?.show({
          severity: "success",
          summary: "Formulario enviado",
          detail: "El mensaje ha sido enviado con éxito.",
        });

        resetForm();
      } catch (error) {
        console.error("Error al enviar el correo:", error);
        toast.current?.show({
          severity: "error",
          summary: "No fue posible enviar el formulario",
          detail: error?.text || "Intenta nuevamente en unos minutos.",
        });
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="contactar-page">
      <Toast ref={toast} />

      <Card className="contactar-card" title="Contáctanos">
        <p className="contactar-subtitle">
          Cuéntanos qué necesitas y te responderemos lo antes posible.
        </p>

        <form onSubmit={formik.handleSubmit} className="contactar-form" noValidate>
          <ContactField id="nombre" label="Nombre" formik={formik} placeholder="Tu nombre" />
          <ContactField
            id="telefono"
            label="Teléfono"
            formik={formik}
            placeholder="Tu teléfono"
            keyfilter="pnum"
          />
          <ContactField
            id="email"
            label="Correo electrónico"
            formik={formik}
            placeholder="tu@correo.com"
          />
          <ContactField
            id="mensaje"
            label="Mensaje"
            formik={formik}
            as={InputTextarea}
            placeholder="¿Cómo podemos ayudarte?"
            rows={6}
            autoResize
          />

          <div className="contactar-actions">
            <Button
              type="submit"
              label={formik.isSubmitting ? "Enviando..." : "Enviar mensaje"}
              icon="pi pi-send"
              loading={formik.isSubmitting}
            />
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Contactar;
