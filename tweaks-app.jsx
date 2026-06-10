/* global React */
const { useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "oklch(0.455 0.135 24)",
  "paper": "Warm",
  "serif": "Spectral",
  "headlineScale": 1,
  "motion": true
}/*EDITMODE-END*/;

/* ---- paper tone maps ------------------------------------------------- */
const PAPER = {
  Warm:    { paper: "oklch(0.972 0.008 83)",  paper2: "oklch(0.948 0.010 83)",  ink: "oklch(0.205 0.012 60)" },
  Neutral: { paper: "oklch(0.975 0.002 80)",  paper2: "oklch(0.949 0.002 80)",  ink: "oklch(0.205 0.004 70)" },
  Cool:    { paper: "oklch(0.974 0.006 240)", paper2: "oklch(0.948 0.008 240)", ink: "oklch(0.210 0.012 252)" }
};

/* ---- on-demand google font loader ------------------------------------ */
const FONT_URLS = {
  Spectral: "https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&display=swap",
  Newsreader: "https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,300;1,6..72,400&display=swap",
  "Source Serif 4": "https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,500;0,8..60,600;1,8..60,300;1,8..60,400&display=swap",
  Lora: "https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap"
};
function ensureFont(name) {
  const url = FONT_URLS[name];
  if (!url) return;
  const id = "font-" + name.replace(/\s+/g, "-");
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id; link.rel = "stylesheet"; link.href = url;
  document.head.appendChild(link);
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const root = document.documentElement;

  useEffect(() => {
    root.style.setProperty("--accent", t.accent);
    root.style.setProperty("--accent-ink", t.accent);
  }, [t.accent]);

  useEffect(() => {
    const p = PAPER[t.paper] || PAPER.Warm;
    root.style.setProperty("--paper", p.paper);
    root.style.setProperty("--paper-2", p.paper2);
    root.style.setProperty("--ink", p.ink);
  }, [t.paper]);

  useEffect(() => {
    ensureFont(t.serif);
    root.style.setProperty("--serif", `"${t.serif}", Georgia, "Times New Roman", serif`);
  }, [t.serif]);

  useEffect(() => {
    root.style.setProperty("--headline-scale", t.headlineScale);
  }, [t.headlineScale]);

  useEffect(() => {
    if (t.motion) {
      document.body.classList.remove("no-motion");
    } else {
      document.body.classList.add("no-motion");
      document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
    }
  }, [t.motion]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Palette" />
      <TweakColor
        label="Ink accent"
        value={t.accent}
        options={[
          "oklch(0.455 0.135 24)",
          "oklch(0.450 0.090 200)",
          "oklch(0.420 0.105 255)",
          "oklch(0.450 0.090 150)",
          "oklch(0.440 0.120 330)"
        ]}
        onChange={(v) => setTweak("accent", v)}
      />
      <TweakRadio
        label="Paper tone"
        value={t.paper}
        options={["Warm", "Neutral", "Cool"]}
        onChange={(v) => setTweak("paper", v)}
      />

      <TweakSection label="Typography" />
      <TweakSelect
        label="Display serif"
        value={t.serif}
        options={["Spectral", "Newsreader", "Source Serif 4", "Lora"]}
        onChange={(v) => setTweak("serif", v)}
      />
      <TweakSlider
        label="Headline size"
        value={t.headlineScale}
        min={0.8}
        max={1.25}
        step={0.05}
        unit="×"
        onChange={(v) => setTweak("headlineScale", v)}
      />

      <TweakSection label="Motion" />
      <TweakToggle
        label="Entrance animations"
        value={t.motion}
        onChange={(v) => setTweak("motion", v)}
      />
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById("tweaks-root")).render(<App />);
