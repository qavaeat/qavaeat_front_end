import type { Metadata } from "next";
import  ContactSection  from "./page";

export const metadata: Metadata = {
  title: "Contact Us - QavaEat",
  description:
    "Get in touch with the QavaEat team. We're happy to help with meal plans, chef partnerships, billing and more.",
};

export default function ContactPage() {
  return <ContactSection />;
}