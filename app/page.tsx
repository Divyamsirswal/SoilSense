"use client";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { AuthStatus } from "@/components/auth/auth-status";
import { useSession } from "next-auth/react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Leaf,
  LineChart,
  Cloud,
  Bell,
  Brain,
  Smartphone,
  BarChart,
  Zap,
  ArrowUpRight,
  Droplets,
  Layers,
  Sprout,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background selection:bg-primary/10 selection:text-primary">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 group"
            aria-label="SoilGuardian Home"
          >
            <div className="relative w-8 h-8 transition-transform group-hover:scale-105 duration-300">
              <div className="absolute inset-0 bg-primary rounded-full opacity-20"></div>
                <div className="absolute inset-1 bg-primary rounded-full"></div>
                <div className="absolute inset-2 bg-background rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                </div>
              </div>
            <span className="font-semibold text-lg group-hover:text-primary transition-colors duration-200">
                SoilGuardian
              </span>
            </Link>

          <nav className="hidden md:flex items-center gap-8">
            {["Features", "How It Works", "Pricing", "Testimonials"].map(
              (item) => (
            <Link
                  key={item}
                  href={`/#${item.toLowerCase().replace(/\s+/g, "-")}`}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-primary after:transition-all hover:after:w-full"
            >
                  {item}
            </Link>
              )
            )}
          </nav>

          <AuthStatus />
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-28 md:py-36 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(var(--primary-rgb),0.08),transparent_70%)]"></div>
        <div className="absolute -top-48 -right-48 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-48 -left-48 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute inset-0 bg-grid-pattern bg-[length:32px_32px] bg-primary/[0.01] -z-10"></div>

        <div className="container relative">
          <div className="max-w-[800px] mx-auto text-center space-y-8">
            <div className="inline-flex items-center rounded-full border border-border/60 bg-background/80 px-4 py-1.5 text-sm shadow-sm backdrop-blur-sm">
              <span className="relative mr-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                Smart agriculture monitoring
              </span>
              </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
              Precision soil monitoring for{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70 relative">
                modern agriculture
                <svg
                  className="absolute -bottom-2 w-full left-0 h-[0.58em] text-primary/20"
                  preserveAspectRatio="none"
                  viewBox="0 0 115 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1 5.5C25 1.5 86 1.5 114 5.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-[600px] mx-auto">
              Maximize yields and optimize resource usage with real-time soil
              analytics and AI-powered recommendations.
              </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                <ClientActionButtons />
                <Button variant="outline" size="lg" asChild className="group">
                <Link href="/#features" className="inline-flex items-center">
                  Learn more
                  <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5 duration-200" />
                  </Link>
                </Button>
              </div>

            <div className="pt-16 flex justify-center">
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center">
                  <div className="flex -space-x-2 mr-3">
                    {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                        className="w-8 h-8 rounded-full border-2 border-background bg-muted/80 flex items-center justify-center text-xs font-medium ring-1 ring-background/20"
                    >
                        {["JD", "MR", "DC"][i - 1]}
                    </div>
                  ))}
                  </div>
                  <div className="font-medium">500+ farmers</div>
                </div>
                <div className="h-4 w-px bg-border"></div>
                <div className="flex items-center">
                  <div className="mr-2">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M8 0L10.2 5.3L16 6.1L12 10.2L13 16L8 13.3L3 16L4 10.2L0 6.1L5.8 5.3L8 0Z"
                        fill="currentColor"
                        className="text-yellow-400"
                      />
                    </svg>
                  </div>
                  <div className="font-medium">4.9/5 rating</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature highlights */}
      <section className="py-20 bg-muted/20 border-y border-border/40 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern bg-[length:24px_24px] bg-primary/[0.01] -z-10"></div>
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                icon: <Leaf className="h-5 w-5 text-primary" />,
                title: "Soil Health Monitoring",
                description: "Track moisture, pH, nutrients in real-time with enterprise-grade sensors",
              },
              {
                icon: <LineChart className="h-5 w-5 text-primary" />,
                title: "AI-Powered Insights",
                description: "Get data-driven crop recommendations with our advanced ML models",
              },
              {
                icon: <Zap className="h-5 w-5 text-primary" />,
                title: "Resource Optimization",
                description: "Reduce water and fertilizer waste with precision agriculture",
              },
            ].map((feature, i) => (
              <div 
                key={i} 
                className="flex items-start gap-5 group rounded-xl p-6 bg-background/40 backdrop-blur-sm border border-border/50 shadow-sm hover:shadow-md transition-all hover:border-primary/30"
              >
                <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/25 transition-all group-hover:ring-primary/50 group-hover:bg-primary/15">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">{feature.title}</h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24">
        <div className="container">
          <div className="flex flex-col items-center text-center space-y-4 mb-16">
            <div className="inline-flex rounded-md bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              How It Works
            </div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Smart soil monitoring in three steps
            </h2>
            <p className="text-muted-foreground max-w-[600px]">
              Our complete soil monitoring ecosystem helps you make data-driven
              decisions with minimal effort
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-16">
            {howItWorks.map((step, index) => (
              <div key={index} className="relative group">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary/20 bg-primary/10 text-primary font-semibold transition-all group-hover:border-primary/40 group-hover:bg-primary/20">
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-semibold group-hover:text-primary transition-colors duration-200">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>

                {index < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-7 left-[calc(100%_-_24px)] w-[calc(100%_-_48px)] h-px border-t-2 border-dashed border-primary/20"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-24 bg-muted/30 border-y border-border/40"
      >
        <div className="container space-y-16">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="inline-flex rounded-md bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                Features
              </div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need for precision farming
              </h2>
            <p className="text-muted-foreground max-w-[600px]">
                Our comprehensive soil monitoring system provides real-time data
              and insights to help you make informed decisions
              </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Droplets />,
                title: "Real-time Monitoring",
                description:
                  "Get instant updates on soil moisture, pH levels, and nutrient content.",
              },
              {
                icon: <Cloud />,
                title: "Weather Integration",
                description:
                  "Combine soil data with weather forecasts for better decisions.",
              },
              {
                icon: <BarChart />,
                title: "Advanced Analytics",
                description:
                  "View trends and patterns in soil health with interactive dashboards.",
              },
              {
                icon: <Leaf />,
                title: "Crop Recommendations",
                description:
                  "Receive AI-powered crop suggestions based on soil conditions.",
              },
              {
                icon: <Smartphone />,
                title: "Mobile Access",
                description:
                  "Monitor your farm from anywhere using our responsive application.",
              },
              {
                icon: <Bell />,
                title: "Smart Alerts",
                description:
                  "Get notified when soil conditions require your attention.",
              },
              {
                icon: <Brain />,
                title: "AI Insights",
                description:
                  "Leverage machine learning to predict optimal farming practices.",
              },
              {
                icon: <Layers />,
                title: "Easy Integration",
                description:
                  "Connect with existing farming equipment through our open API.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-lg border bg-background/80 p-6 shadow-sm hover:shadow-md transition-all hover:border-primary/50"
              >
                <div className="mb-4 text-primary">{feature.icon}</div>
                <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
                <div className="absolute bottom-0 right-0 h-8 w-8 -mb-4 -mr-4 rounded-full bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-32 relative">
        <div className="absolute inset-0 bg-grid-pattern bg-[length:24px_24px] bg-primary/[0.01] -z-10"></div>
        <div className="container">
          <div className="flex flex-col items-center text-center space-y-4 mb-16">
            <div className="inline-flex rounded-md bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              Testimonials
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight max-w-xl">
              Trusted by farmers worldwide
            </h2>
            <p className="text-muted-foreground max-w-[600px]">
              See what our users say about their experience with SoilGuardian
            </p>
          </div>

          <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="rounded-xl border bg-background/50 backdrop-blur-sm p-8 hover:shadow-lg transition-all hover:border-primary/30 relative"
                >
                  <div className="absolute -top-4 -left-2 text-primary/20 text-6xl font-serif">
                    "
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                    <svg
                          key={i}
                      xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                      viewBox="0 0 24 24"
                          fill="#FFCA28"
                          stroke="#FFCA28"
                          strokeWidth="0"
                          className="text-yellow-400"
                    >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </div>
                    <p className="text-base italic text-foreground/90">
                  "{testimonial.quote}"
                </p>
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                      {testimonial.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                  </div>
                  <div>
                      <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            </div>

            <div className="mt-16 text-center">
              <div className="inline-flex items-center gap-4 rounded-lg border bg-background/80 backdrop-blur-sm p-4 shadow-sm">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-semibold"
                    >
                      {["JD", "MR", "DC", "+"][i - 1]}
                    </div>
                  ))}
                </div>
                <div className="text-sm">
                  <span className="font-medium">500+</span> farmers are already
                  using SoilGuardian
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        id="pricing"
        className="py-24 bg-muted/30 border-y border-border/40"
      >
        <div className="container">
          <div className="flex flex-col items-center text-center space-y-4 mb-16">
            <div className="inline-flex rounded-md bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              Pricing
            </div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="text-muted-foreground max-w-[600px]">
              Choose the plan that's right for your farm size and needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricing.map((plan, index) => (
              <div
                key={index}
                className={`rounded-xl border bg-background/80 p-8 shadow-sm hover:shadow-md transition-all ${
                  plan.highlighted ? "relative shadow-md border-primary" : ""
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-0 right-0 mx-auto w-fit bg-primary text-primary-foreground text-xs font-medium py-1 px-3 rounded-full">
                    Most Popular
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-1 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full transition-all ${
                    plan.highlighted ? "shadow-sm hover:shadow" : ""
                  }`}
                  variant={plan.highlighted ? "default" : "outline"}
                >
                  Get Started
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container max-w-5xl">
          <div className="rounded-2xl bg-primary/5 border border-primary/10 p-8 md:p-12 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="space-y-4 md:max-w-md">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              Ready to transform your farming?
            </h2>
                <p className="text-muted-foreground">
                  Join hundreds of farmers already using SoilGuardian to
                  optimize their crop yields.
            </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
              <ClientActionButtons size="default" />
                <Button variant="outline" asChild className="group">
                  <Link href="/contact" className="inline-flex items-center">
                    Contact Sales
                    <ArrowUpRight className="ml-1.5 h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </Link>
              </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 md:py-16 bg-background">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between gap-12">
            <div className="md:max-w-xs">
              <Link
                href="/"
                className="flex items-center gap-2 mb-4 group"
                aria-label="SoilGuardian Home"
              >
                <div className="relative w-6 h-6 transition-transform group-hover:scale-105 duration-300">
                  <div className="absolute inset-0 bg-primary rounded-full opacity-20"></div>
                  <div className="absolute inset-1 bg-primary rounded-full"></div>
                  <div className="absolute inset-2 bg-background rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  </div>
                </div>
                <span className="font-semibold group-hover:text-primary transition-colors duration-200">
                  SoilSense
                </span>
              </Link>
              <p className="text-sm text-muted-foreground mb-4">
                Precision agriculture solutions for modern farmers. Monitor soil
                health and optimize crop yields.
              </p>
              <div className="flex gap-4">
                {[
                  <svg
                    key="fb"
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>,
                  <svg
                    key="tw"
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                  </svg>,
                  <svg
                    key="in"
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect
                      width="20"
                      height="20"
                      x="2"
                      y="2"
                      rx="5"
                      ry="5"
                    ></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                  </svg>,
                ].map((icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={["Facebook", "Twitter", "Instagram"][i]}
                  >
                    {icon}
                </a>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 md:gap-12">
              {[
                {
                  title: "Product",
                  links: [
                    { label: "Features", href: "/features" },
                    { label: "Pricing", href: "/pricing" },
                    { label: "Integrations", href: "/integration" },
                    { label: "Changelog", href: "/changelog" },
                  ],
                },
                {
                  title: "Resources",
                  links: [
                    { label: "Blog", href: "/blog" },
                    { label: "Guides", href: "/guides" },
                    { label: "Documentation", href: "/documentation" },
                    { label: "Help Center", href: "/help" },
                  ],
                },
                {
                  title: "Company",
                  links: [
                    { label: "About", href: "/about" },
                    { label: "Contact", href: "/contact" },
                    { label: "Careers", href: "/careers" },
                    { label: "Privacy", href: "/privacy" },
                  ],
                },
              ].map((group, i) => (
                <div key={i}>
                  <h3 className="font-semibold text-sm mb-3">{group.title}</h3>
              <ul className="space-y-2">
                    {group.links.map((link, j) => (
                      <li key={j}>
                  <Link
                          href={link.href}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors group flex items-center"
                  >
                          <span className="group-hover:underline">
                            {link.label}
                          </span>
                          <ArrowUpRight className="ml-1 h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
                    ))}
              </ul>
            </div>
              ))}
            </div>
          </div>

          <div className="border-t mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} SoilGuardian. All rights reserved.
            </p>
            <div className="flex gap-6">
              {["Terms", "Privacy", "Cookies"].map((item, i) => (
              <Link
                  key={i}
                  href={`/${item.toLowerCase()}`}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors hover:underline"
              >
                  {item}
              </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Improved client action buttons that don't force redirect
function ClientActionButtons({ size = "lg" }: { size?: "default" | "lg" }) {
  const { status } = useSession();

  if (status === "loading") {
    return (
      <Button variant="default" size={size} disabled>
        <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
        Loading...
      </Button>
    );
  }

  // Instead of forcing redirect, use links
  if (status === "authenticated") {
    return (
      <Button variant="default" size={size} asChild className="group">
        <Link href="/dashboard" className="inline-flex items-center">
          Go to Dashboard
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </Button>
    );
  }

  return (
    <Button variant="default" size={size} asChild className="group">
      <Link href="/register" className="inline-flex items-center">
        Get Started Free
        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
      </Link>
    </Button>
  );
}

// How It Works data
const howItWorks = [
  {
    title: "Connect Your Sensors",
    description:
      "Easily install our IoT soil sensors on your farm and connect them to our platform in minutes.",
  },
  {
    title: "Collect Real-Time Data",
    description:
      "Our sensors continuously monitor soil conditions and send data to your dashboard.",
  },
  {
    title: "Get Smart Recommendations",
    description:
      "Receive AI-powered insights on irrigation, fertilization, and crop selection based on your soil data.",
  },
];

// Testimonial data
const testimonials = [
  {
    quote:
      "SoilGuardian has revolutionized how I manage my farm. I've seen a 30% increase in crop yields within just one season.",
    name: "John Deerson",
    role: "Wheat Farmer, Kansas",
  },
  {
    quote:
      "The precision agriculture capabilities are game-changing. I can now target specific zones that need attention instead of treating the entire field.",
    name: "Maria Rodriguez",
    role: "Vineyard Owner, California",
  },
  {
    quote:
      "The soil health insights have helped us reduce our fertilizer use by 25% while maintaining optimal crop growth. Great for our bottom line and the environment.",
    name: "David Chanderling",
    role: "Organic Farm Manager, Oregon",
  },
];

// Pricing data
const pricing = [
  {
    name: "Starter",
    description: "For small farms just getting started",
    price: "29",
    features: [
      "Up to 5 sensors",
      "7-day data history",
      "Basic recommendations",
      "Email support",
    ],
    highlighted: false,
  },
  {
    name: "Professional",
    description: "For growing agricultural operations",
    price: "79",
    features: [
      "Up to 20 sensors",
      "30-day data history",
      "Advanced analytics",
      "AI crop recommendations",
      "Priority support",
    ],
    highlighted: true,
  },
  {
    name: "Enterprise",
    description: "For large-scale farming operations",
    price: "199",
    features: [
      "Unlimited sensors",
      "1-year data history",
      "Custom reporting",
      "API access",
      "Dedicated account manager",
    ],
    highlighted: false,
  },
];
