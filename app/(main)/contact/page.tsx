import { ContactForm } from "@/components/contact-form/contact-form";
import { Icon } from "@iconify/react";

export default function ContactPage() {
  const policies = [
    {
      icon: "solar:shield-check-linear",
      title: "SECURE & PROTECTED",
      description: "Your data is encrypted and never shared",
    },
    {
      icon: "solar:clock-circle-linear",
      title: "FAST RESPONSE",
      description: "We respond within 24 hours",
    },
    {
      icon: "solar:chat-line-linear",
      title: "EXPERT SUPPORT",
      description: "Dedicated team for your inquiries",
    },
  ];

  const faqs = [
    {
      question: "What's your authentication process?",
      answer:
        "Every item goes through our multi-point verification system to ensure 100% authenticity.",
    },
    {
      question: "How long does shipping take?",
      answer:
        "Standard: 3-5 days. Express: 1-2 days (additional fee at checkout).",
    },
    {
      question: "How do I become a seller?",
      answer:
        'Click "Start Selling" in your dashboard. Approval takes 1-2 business days.',
    },
    {
      question: "Is my payment secure?",
      answer:
        "Yes. We use Stripe for secure payment processing with industry-standard encryption.",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center gap-16 py-8 md:py-10">
      {/* Hero Section */}
      <div className="flex flex-col gap-6 px-4 md:px-20 lg:px-40 text-center">
        <div className="flex justify-center align-middle">
          <h1 className="text-4xl font-bold text-foreground uppercase tracking-wide">
            Contact
          </h1>
        </div>
        <div className="flex justify-center align-middle">
          <p className="text-foreground text-center max-w-xl text-sm">
            Need help? We're here for you. Send us a message and our team will
            respond promptly.
          </p>
        </div>
      </div>

      {/* Contact Form */}
      <div className="w-full px-4 md:px-20 lg:px-40">
        <ContactForm />
      </div>

      {/* Our Promise */}
      <div className="flex flex-col gap-6 px-4 md:px-20 lg:px-40 w-full">
        <div className="flex justify-center align-middle">
          <p className="text-xl font-bold text-foreground uppercase tracking-wide">
            Our Promise
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {policies.map((policy, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center gap-3 p-4"
            >
              <Icon icon={policy.icon} width={28} className="text-primary" />
              <h3 className="font-medium text-foreground uppercase tracking-wider text-xs">
                {policy.title}
              </h3>
              <p className="text-foreground/60 text-xs">{policy.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQs */}
      <div className="flex flex-col gap-6 px-4 md:px-20 lg:px-40 w-full">
        <div className="flex justify-center align-middle">
          <p className="text-xl font-bold text-foreground uppercase tracking-wide">
            FAQ
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="group hover:border-foreground/30 transition-colors border border-foreground/10 rounded-lg p-5"
            >
              <h3 className="font-medium text-foreground text-sm mb-2 group-hover:text-primary transition-colors">
                {faq.question}
              </h3>
              <p className="text-foreground/60 text-xs leading-relaxed">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
