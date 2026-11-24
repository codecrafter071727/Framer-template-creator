"use client";

import Image from "next/image";
import { FormEvent } from "react";
import { useFramely } from "@/lib/framely-context";

export function Hero() {
  const { sourceUrl, setSourceUrl, startExtract, startingExtract } = useFramely();

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const jobId = await startExtract(sourceUrl);
    document
      .getElementById("workspace")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (jobId) {
      document.getElementById("extract")?.focus({ preventScroll: true });
    }
  }

  return (
    <section className="hero" aria-labelledby="hero-heading">
      <div className="hero-glow" aria-hidden />
      <div className="hero-mesh" aria-hidden />
      <div className="hero-inner">
        <div className="hero-brand-lockup">
          <Image
            src="/brand/framely-icon.png"
            alt=""
            width={84}
            height={84}
            className="hero-brand-icon"
            priority
          />
          <p className="hero-brand-name">Framely</p>
        </div>

        <h1 id="hero-heading">
          Convert Framer Sites
          <br />
          to Next.js in Minutes
        </h1>
        <p className="hero-sub">
          Extract a complete published Framer zip. Convert it into Next.js or
          React with one prompt.
        </p>

        <form className="hero-cta" onSubmit={onSubmit}>
          <input
            type="url"
            name="framerUrl"
            value={sourceUrl}
            onChange={(event) => setSourceUrl(event.target.value)}
            placeholder="https://your-site.framer.website"
            aria-label="Framer URL"
            required
          />
          <button type="submit" disabled={startingExtract || !sourceUrl.trim()}>
            {startingExtract ? "Starting…" : "Extract"}
          </button>
        </form>
      </div>
    </section>
  );
}
