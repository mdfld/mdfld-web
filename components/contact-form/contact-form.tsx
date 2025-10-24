"use client";

import { useState } from "react";
import { Button, Input, Textarea, Select, SelectItem } from "@heroui/react";

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      // Reset form
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });

      // Show success (you can add a toast here if needed)
      alert("Message sent! We'll get back to you as soon as possible.");
    } catch (error) {
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Name"
            placeholder="Your name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            isRequired
            variant="bordered"
            size="md"
          />
          <Input
            type="email"
            label="Email"
            placeholder="your@email.com"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            isRequired
            variant="bordered"
            size="md"
          />
        </div>

        <Select
          label="Subject"
          placeholder="Select a subject"
          selectedKeys={formData.subject ? [formData.subject] : []}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] as string;
            setFormData({ ...formData, subject: selected });
          }}
          isRequired
          variant="bordered"
          size="md"
        >
          <SelectItem key="general">General Inquiry</SelectItem>
          <SelectItem key="order">Order Issue</SelectItem>
          <SelectItem key="account">Account Help</SelectItem>
          <SelectItem key="seller">Seller Support</SelectItem>
          <SelectItem key="other">Other</SelectItem>
        </Select>

        <Textarea
          label="Message"
          placeholder="How can we help you?"
          value={formData.message}
          onChange={(e) =>
            setFormData({ ...formData, message: e.target.value })
          }
          isRequired
          variant="bordered"
          size="md"
          minRows={6}
        />

        <Button
          type="submit"
          variant="bordered"
          radius="full"
          size="md"
          isLoading={isSubmitting}
          className="w-full uppercase tracking-wider text-xs font-medium"
        >
          {isSubmitting ? "Sending..." : "Send Message"}
        </Button>
      </form>
    </div>
  );
}
