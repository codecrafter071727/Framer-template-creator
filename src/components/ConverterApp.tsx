"use client";

import { ConvertForm } from "@/components/ConvertForm";
import { ExtractForm } from "@/components/ExtractForm";
import { Reveal } from "@/components/site/Reveal";

export function ConverterApp() {
  return (
    <section className="section workspace-section" id="workspace">
      <div className="section-inner">
        <Reveal>
          <p className="section-label">
            <span>Workspace</span>
          </p>
          <h2>Extract & convert</h2>
          <p className="section-copy">
            Run Framely on a published Framer URL, then turn the zip into a
            Next.js or React project.
          </p>
        </Reveal>
        <div className="workspace">
          <ExtractForm />
          <ConvertForm />
        </div>
      </div>
    </section>
  );
}
