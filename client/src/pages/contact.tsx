import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, MapPin, Phone, Clock, MessageSquare, Twitter, Github, ExternalLink } from "lucide-react";

export default function Contact() {

  const contactMethods = [
    {
      icon: <Mail className="w-6 h-6" />,
      title: "Email Support",
      description: "Get help from our support team",
      contact: "vaultaggregator@protonmail.com",
      responseTime: "Within 24 hours",
      color: "blue"
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "Live Chat",
      description: "Chat with us in real-time",
      contact: "Available 24/7",
      responseTime: "Usually within minutes",
      color: "green"
    },
    {
      icon: <Phone className="w-6 h-6" />,
      title: "Business Inquiries",
      description: "For partnerships and enterprise",
      contact: "vaultaggregator@protonmail.com",
      responseTime: "Within 48 hours",
      color: "purple"
    }
  ];

  const officeInfo = [
    {
      city: "San Francisco",
      address: "123 Market Street, Suite 500\nSan Francisco, CA 94103",
      timezone: "PST (UTC-8)",
      hours: "9:00 AM - 6:00 PM"
    },
    {
      city: "New York",
      address: "456 Broadway, Floor 12\nNew York, NY 10013",
      timezone: "EST (UTC-5)",
      hours: "9:00 AM - 6:00 PM"
    },
    {
      city: "London",
      address: "789 Oxford Street\nLondon W1C 2LA, UK",
      timezone: "GMT (UTC+0)",
      hours: "9:00 AM - 5:00 PM"
    }
  ];

  const socialLinks = [
    { name: "Twitter", icon: <Twitter className="w-5 h-5" />, url: "https://twitter.com/vault-aggregator" },
    { name: "GitHub", icon: <Github className="w-5 h-5" />, url: "https://github.com/vault-aggregator" },
    { name: "Discord", icon: <MessageSquare className="w-5 h-5" />, url: "https://discord.gg/vault-aggregator" },
    { name: "Telegram", icon: <ExternalLink className="w-5 h-5" />, url: "https://t.me/vault-aggregator" }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900" data-testid="text-contact-title">
            Contact Us
          </h1>
          <p className="text-gray-600 mt-2" data-testid="text-contact-subtitle">Get in touch with our team - we're here to help with any questions or feedback  vaultaggregator@protonmail.com</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Information */}
          <Card className="lg:col-span-2">
            
          </Card>

          
        </div>

        
      </div>
      </div>
      <Footer />
    </div>
  );
}