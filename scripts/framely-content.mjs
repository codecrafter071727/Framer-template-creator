/**
 * Framely launch copy — replaces Saino template text in extracted HTML.
 * Longest strings first when applying.
 */

export const FRAMELY_REPLACEMENTS = [
  // Meta / legal
  [
    "Saino is an AI Micro-SaaS platform that turns any input into structured output. Generate, refine, extract and automate with one flexible AI engine.",
    "Framely extracts published Framer sites into complete asset zips, then converts them into Next.js or React projects.",
  ],
  ["© Saino 2026. All rights reserved.", "© Framely 2026. All rights reserved."],
  ["© Saino", "© Framely"],

  // Hero
  [
    "Build AI-Powered Experiences in Minutes",
    "Convert Framer Sites to Next.js in Minutes",
  ],
  [
    "Over 200,000 users creating with Saino",
    "Ship Framer templates as production Next.js",
  ],
  ["users creating with Framely", "Framer sites converted with Framely"],
  ["Over Complete", "Trusted complete captures —"],
  ["200,000", "Complete"],
  ["Build Framer → Next.js", "Convert Framer Sites to Next.js"],
  ["Build AI-Powered", "Convert Framer Sites"],
  ["Experiences in Minutes", "to Next.js in Minutes"],
  [
    "Launch Your Framer → Next.jsProduct Today!",
    "Launch your Framer rebuild today",
  ],
  [
    "Launch Your Framer → Next.js Product Today!",
    "Launch your Framer rebuild today",
  ],
  [
    "Over Complete Framer sites converted with Framely",
    "Complete Framer sites converted with Framely",
  ],
  [
    "Powerful AI Infrastructure, Built for Any Idea.",
    "Powerful capture. Clean convert.",
  ],
  [
    "Powerful AI Infrastructure,Built for Any Idea.",
    "Powerful capture. Clean convert.",
  ],
  [
    "Seamless from Input to Insight.",
    "Seamless from URL to codebase.",
  ],
  ["Build Smarter. Pay Simpler.", "Extract free. Convert when you're ready."],
  [
    "Projects powered by our AI engine",
    "Framer sites converted to Next.js",
  ],
  [
    "Connect Seamlessly. Build Without Limits.",
    "Ship Framer. Own your code.",
  ],
  [
    "Connect Seamlessly.Build Without Limits.",
    "Ship Framer. Own your code.",
  ],
  ["Framely Empowers You.", "Why teams choose Framely."],
  ["Empowers You.", "for Framer → Next.js."],
  ["PERFORMANCE BENCHMARK", "DEEP CHROMIUM CAPTURE"],
  ["RANKING ON G2", "COMPLETE ASSET ZIP"],
  ["TRENDING PRODUCT HUNT", "PROMPT → NEXT.JS"],
  ["What do you want to create today?", "Paste a published Framer URL to download the zip…"],

  // Intro
  ["(What's Saino?)", "(What's Framely?)"],
  [
    "Our platform powers intelligent, adaptive workflows designed to fit any use-case, giving you the flexibility to move from idea to prototype to production in record time.",
    "Framely is the production pipeline from published Framer URLs to real code — extract every network asset, then convert with one prompt.",
  ],
  ["#BuildwithSaino", "#BuildwithFramely"],
  [
    "Projects powered by our AI engine",
    "Framer sites converted to Next.js",
  ],
  ["Client satisfaction rate", "Capture completeness rate"],

  // Benefits
  ["Saino Empowers You.", "Framely Empowers You."],
  [
    "Smarter Output",
    "Complete capture",
  ],
  [
    "AI understands context and delivers meaningful results instantly.",
    "Chromium + CDP records HTML, JS, CSS, fonts, images, and media into one zip.",
  ],
  [
    "Flexible for Any Workflow",
    "Conversion-ready pack",
  ],
  [
    "Use it for content, communication, automation or data-driven tasks, no limits.",
    "Manifests, design tokens, structure, visuals, and animation metadata ship with the extract.",
  ],
  [
    "Production-Ready Speed",
    "Prompt to Next.js",
  ],
  [
    "Ultra-fast inference ensures a seamless, real-time experience.",
    "Describe your stack — download a Next.js or React project shaped for production.",
  ],
  [
    "“Integrated the AI engine into an internal automation tool. It instantly understood our structure and delivered clean, formatted responses out of the box.”",
    "“Pasted our Framer URL, got a complete zip in minutes, and the Next.js convert kept layout and motion cues intact.”",
  ],
  ["Founder of Aganu.Co", "Engineering lead"],
  ["Jaron Smith", "Anshul Bhathija"],
  ["Alex Rivera", "Anshul Bhathija"],

  // Security
  [
    "Your trust is our foundation. Saino has a deep commitment to data privacy and security.",
    "Your data stays yours. Framely captures only the published URL you submit — with SSRF protection and rate limits.",
  ],

  // Features
  [
    "Powerful AI Infrastructure, Built for Any Idea.",
    "Powerful capture. Clean convert.",
  ],
  ["Generate Anything", "Extract published sites"],
  ["Simplify &amp; Polish", "Package assets offline"],
  ["Extract Insights", "Document motion & scroll"],
  ["Automate Actions", "Generate Next.js code"],
  [
    "Create structured responses, ideas, explanations or formatted output from any input. Just describe what you want — the system handles the rest.",
    "Paste any published Framer link. Framely crawls pages, settles Motion/Appear, and gates the zip on completeness.",
  ],
  [
    "Ideation &amp; Creation. Generate ideas, explore concepts, and quickly expand early thoughts into clear, structured directions.",
    "Deep network capture — every script, font, image, and JSON the browser loads.",
  ],
  [
    "Workflow Enhancement. Refining inputs, organizing information, and removing repetitive steps from your process.",
    "Conversion pack included — content, tokens, structure, visuals, and animations for faithful rebuilds.",
  ],

  // Process
  [
    "Seamless from Input to Insight.",
    "Seamless from URL to codebase.",
  ],
  ["Provide Input", "Paste Framer URL"],
  [
    "Upload your raw data or connect your source directly. We handle various formats.",
    "Point Framely at a published Framer site or template — not editor source.",
  ],
  ["AI Processes", "Extract zip"],
  ["Get Output", "Convert to code"],

  // Testimonials
  [
    "“Feels like adding superpowers to any product!”",
    "“Finally a real path from Framer publish to maintainable Next.js.”",
  ],
  [
    "Built and launched an AI-driven note app in just two weeks using our engine. The flexibility was incredible. No restrictions, no heavy setup. Just connect and start building.",
    "We extracted a client Framer site, converted with one prompt, and deployed on Vercel the same day.",
  ],
  ["Product Designer", "Full-stack developer"],
  ["Alex Wilson", "Jordan Lee"],

  // Product is free — pricing page removed at launch
  ["Saino Pro", "Framely Pro"],
  ["Access to core AI features", "Full published-site capture"],
  ["Limited requests per month", "Extract + convert jobs"],
  ["Full API access and dashboard", "Downloadable Next.js / React zips"],
  ["Advanced request tiers", "Higher page limits & priority"],
  ["Full access to all AI features", "AI-assisted semantic convert"],
  [
    "Team collaboration tools, multi-user access",
    "Team workspace (coming soon)",
  ],
  [
    "Dedicated support and performance tuning",
    "Production support & tuning",
  ],
  ["$24.9", "$0"],
  ["$20", "$19"],

  // Integrations
  [
    "Plug Saino into the tools your team already uses. Connect your stack in a few clicks and let AI run across every workflow — no rebuilds, no lock-in.",
    "Framely fits your stack — extract locally or on Vercel, store zips in Blob, and convert with AI Gateway when you need semantic rewrites.",
  ],
  ["40+ Tools &amp; Platforms", "Next.js · React · Zip"],
  [
    "Connect Seamlessly. Build Without Limits.",
    "Ship Framer. Own your code.",
  ],

  // FAQ
  [
    "From creation to automation. Here’s a quick look at how our AI engine fits into your workflow, what it can do, and how to get started effortlessly.",
    "Everything you need to know about capture scope, convert modes, and what Framely pulls from published Framer sites.",
  ],
  [
    "What can I actually build with this AI platform?",
    "Does Framely export Framer editor source?",
  ],
  [
    "How fast are the responses?",
    "How accurate is the capture?",
  ],
  [
    "What if I want to integrate it into my existing tools?",
    "Can I upload a zip instead of extracting?",
  ],
  [
    "What happens when I hit my plan limits?",
    "Do I need an AI key to convert?",
  ],
  [
    "All data is encrypted in transit and at rest. We don’t store, share, or train on private user data. You retain full ownership of your information, always.",
    "Framely captures what the browser loads from your URL. Jobs can stay on disk or Blob you configure — never used to train models.",
  ],

  // CTA
  [
    "Launch Your AI-Powered Product Today!",
    "Launch your Framer rebuild today",
  ],
  ["Leading the next era of work.", "Framer in. Code out."],
  ["Have any new product idea?", "Ready to extract?"],
  ["Start your Free Trial", "Start extract"],
  ["Join our Community", "How it works"],
  ["Contact us", "Try Framely"],

  ["Saino logo", "Framely logo"],
  ["saino.framer.ai", "framely"],
  // Brand word (last — broad)
  ["Saino", "Framely"],
  ["saino", "framely"],
];

export function applyFramelyContent(html) {
  let next = html;
  for (const [from, to] of FRAMELY_REPLACEMENTS) {
    next = next.split(from).join(to);
  }
  return next;
}