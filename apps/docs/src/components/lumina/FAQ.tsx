import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "¿Cómo empiezo con Lumina?",
    answer:
      "Simplemente crea una cuenta, conecta tu número de WhatsApp escaneando un código QR, configura tus flujos y listo. El proceso toma menos de 5 minutos.",
  },
  {
    question: "¿Es seguro conectar mi WhatsApp a Lumina?",
    answer:
      "Sí, absolutamente. Utilizamos encriptación end-to-end y cumplimos con todas las regulaciones de privacidad de datos. Tu información está protegida.",
  },
  {
    question: "¿Puedo integrar múltiples números de WhatsApp?",
    answer:
      "Sí, según tu plan puedes conectar desde 1 hasta bots ilimitados. Cada uno funciona de forma independiente pero con mismo dashboard.",
  },
  {
    question: "¿Qué pasa si tengo un pico de mensajes?",
    answer:
      "Nuestros servidores escalan automáticamente. Procesamos desde 100 hasta millones de mensajes sin problemas ni costo adicional por uso.",
  },
  {
    question: "¿Puedo cancelar cuando quiera?",
    answer: "Claro. No hay contratos a largo plazo. Cancela tu suscripción cuando quieras sin penalizaciones. Tus datos se exportan automáticamente.",
  },
  {
    question: "¿Hay soporte en español?",
    answer:
      "Sí, nuestro equipo de soporte en Latinoamérica está disponible 24/7 en español. También tenemos documentación completa en tu idioma.",
  },
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-6 max-w-3xl">
        <div className="text-center mb-16">
          <span className="text-sm font-medium text-primary uppercase tracking-widest">Preguntas frecuentes</span>
          <h2 className="mt-4 font-display text-4xl md:text-5xl font-bold">
            Las dudas más <span className="text-gradient">comunes</span>
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="overflow-hidden rounded-xl border border-border/60 bg-card transition-smooth"
            >
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full flex items-center justify-between p-5 hover:bg-secondary/40 transition-smooth"
              >
                <h3 className="text-left font-semibold text-foreground">{faq.question}</h3>
                <ChevronDown
                  className={`h-5 w-5 text-muted-foreground transition-transform ${
                    openIndex === idx ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openIndex === idx && (
                <div className="border-t border-border/40 bg-secondary/20 px-5 py-4">
                  <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
            ¿Tienes más preguntas?{" "}
            <button className="text-primary hover:underline font-medium">Contacta con nuestro equipo</button>
          </p>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
