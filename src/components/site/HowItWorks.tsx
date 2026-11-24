import { Reveal } from "@/components/site/Reveal";

const steps = [
  {
    title: "Paste a Framer URL",
    body: "Any published Framer site or template. Framely captures what the browser loads — not editor source.",
  },
  {
    title: "Download the complete zip",
    body: "HTML, assets, fonts, media, manifests, and a conversion pack gated for completeness.",
  },
  {
    title: "Convert to Next.js or React",
    body: "One prompt shapes a downloadable project from your extract — ready to ship.",
  },
];

export function HowItWorks() {
  return (
    <section className="section" id="how">
      <div className="section-inner">
        <Reveal>
          <p className="section-label">
            <span>How it works</span>
          </p>
          <h2>Framer in. Code out.</h2>
          <p className="section-copy">
            Framely extracts published Framer templates into production zips,
            then converts them into Next.js or React.
          </p>
        </Reveal>
        <div className="process-steps">
          {steps.map((item, index) => (
            <Reveal key={item.title} delay={index * 70}>
              <article className="process-step">
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
