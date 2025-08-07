import { useState } from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Mail, MapPin, Phone, Clock, MessageSquare, Twitter, Github, ExternalLink } from "lucide-react";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    subject: "",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log("Form submitted:", formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const contactMethods = [
    {
      icon: <Mail className="w-6 h-6" />,
      title: "Email Support",
      description: "Get help from our support team",
      contact: "support@vault-aggregator.com",
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
      contact: "business@vault-aggregator.com",
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
          <p className="text-gray-600 mt-2" data-testid="text-contact-subtitle">
            Get in touch with our team - we're here to help with any questions or feedback
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Send us a message</CardTitle>
              <p className="text-gray-600">
                Fill out the form below and we'll get back to you as soon as possible.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Name *</label>
                    <Input
                      placeholder="Your full name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                      data-testid="input-contact-name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email *</label>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      data-testid="input-contact-email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Company (optional)</label>
                  <Input
                    placeholder="Your company name"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    data-testid="input-contact-company"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Subject *</label>
                  <select 
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    required
                    data-testid="select-contact-subject"
                  >
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="partnership">Partnership</option>
                    <option value="press">Press & Media</option>
                    <option value="bug">Bug Report</option>
                    <option value="feature">Feature Request</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Message *</label>
                  <Textarea
                    placeholder="Tell us how we can help..."
                    rows={6}
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    required
                    data-testid="textarea-contact-message"
                  />
                </div>

                <Button type="submit" className="w-full" data-testid="button-submit-contact">
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-6">
            {/* Contact Methods */}
            <Card>
              <CardHeader>
                <CardTitle>Get in touch</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contactMethods.map((method, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                    <div className={`bg-${method.color}-100 p-2 rounded-lg`}>
                      {method.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{method.title}</h4>
                      <p className="text-sm text-gray-600 mb-1">{method.description}</p>
                      <p className="text-sm font-medium text-blue-600">{method.contact}</p>
                      <p className="text-xs text-gray-500">{method.responseTime}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Office Hours */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Office Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {officeInfo.map((office, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-semibold text-gray-900">{office.city}</h4>
                      <p className="text-sm text-gray-600 whitespace-pre-line">{office.address}</p>
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>{office.timezone}</span>
                        <span>{office.hours}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Social Media */}
            <Card>
              <CardHeader>
                <CardTitle>Follow us</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {socialLinks.map((link, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="flex items-center justify-center space-x-2"
                      data-testid={`button-social-${link.name.toLowerCase()}`}
                    >
                      {link.icon}
                      <span>{link.name}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <h4 className="font-semibold text-blue-900 mb-2">Need immediate help?</h4>
                <p className="text-sm text-blue-800 mb-3">
                  Check out our Help Center for instant answers to common questions.
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    Help Center
                  </Button>
                  <Button size="sm" className="flex-1">
                    Live Chat
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  question: "How quickly do you respond to inquiries?",
                  answer: "We typically respond within 24 hours for general inquiries and within 2 hours for technical support during business hours."
                },
                {
                  question: "Do you offer phone support?",
                  answer: "Currently, we provide support primarily through email and live chat. Phone support is available for enterprise customers."
                },
                {
                  question: "Can I schedule a demo?",
                  answer: "Yes! Contact us through the business inquiries email to schedule a personalized demo of our platform."
                },
                {
                  question: "Where is your company located?",
                  answer: "We have offices in San Francisco, New York, and London. Our team works across multiple time zones to provide global support."
                }
              ].map((faq, index) => (
                <div key={index} className="space-y-2">
                  <h4 className="font-semibold text-gray-900">{faq.question}</h4>
                  <p className="text-sm text-gray-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
      <Footer />
    </div>
  );
}