"use client";

import { ConverterApp } from "@/components/ConverterApp";
import { Hero } from "@/components/site/Hero";
import { HowItWorks } from "@/components/site/HowItWorks";
import { SiteFooter } from "@/components/site/SiteFooter";
import { FramelyProvider } from "@/lib/framely-context";

export function FramelyApp() {
  return (
    <FramelyProvider>
      <div className="site">
        <div className="noise" aria-hidden />
        <div className="site-content">
          <main>
            <Hero />
            <HowItWorks />
            <ConverterApp />
          </main>
          <SiteFooter />
        </div>
      </div>
    </FramelyProvider>
  );
}
