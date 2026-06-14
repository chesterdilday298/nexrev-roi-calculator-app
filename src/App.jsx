import { useState, useMemo, useCallback } from 'react';

// ── Brand tokens (extracted from nexrev.com) ──────────────────────────────────
const B = {
  bg0: '#080C15',
  bg1: '#0C111D',
  bg2: '#161B26',
  bg3: '#1F242F',
  blue: '#1578F7',
  blue2: '#3855F6',
  teal: '#38D8CF',
  green: '#04B745',
  text: '#F5F5F6',
  muted: '#94969C',
  border: '#2A3144',
  borderLight: '#3A4560',
};

// ── Vertical definitions ──────────────────────────────────────────────────────
const VERTICALS = [
  {
    id: 'cstore', label: 'C-Store / Fuel', emoji: '⛽',
    desc: 'Convenience stores and fuel retailers',
    context: 'HVAC accounts for 35–42% of total utility spend at most c-store and fuel retail locations. Freedom BX controller replacement drives the primary savings opportunity.',
    d: { sites: 75, utility: 18000, hvac: 38, savings: 18, ctrl: 3 },
  },
  {
    id: 'pharmacy', label: 'Pharmacy', emoji: '💊',
    desc: 'Drug retail and pharmacy chains',
    context: 'Store HVAC is the primary controllable load. Self-contained refrigeration cases are excluded from this estimate. BX controller HVAC management is the entry point.',
    d: { sites: 100, utility: 22000, hvac: 32, savings: 20, ctrl: 4 },
  },
  {
    id: 'gym', label: 'Health Clubs', emoji: '🏋',
    desc: 'Fitness centers and health club chains',
    context: 'High ventilation demands make gyms among the most energy-intensive retail locations. Freedom\'s cellular independence is essential since franchisees do not share IT networks.',
    d: { sites: 30, utility: 36000, hvac: 45, savings: 25, ctrl: 8 },
  },
  {
    id: 'banking', label: 'Banking', emoji: '🏦',
    desc: 'Bank branch networks and financial services',
    context: 'Savings come primarily from scheduling optimization and after-hours HVAC control. Low controller count per branch makes deployment fast and economics favorable.',
    d: { sites: 50, utility: 14000, hvac: 28, savings: 17, ctrl: 2 },
  },
  {
    id: 'mush', label: 'MUSH / Institutional', emoji: '🏛',
    desc: 'Municipal, University, Schools, Hospitals',
    context: 'Higher facility complexity drives more controllers per site. ESG and carbon reporting mandates make NexiAI AI-verified data particularly valuable in this segment.',
    d: { sites: 20, utility: 48000, hvac: 35, savings: 22, ctrl: 12 },
  },
];

// ── Formatters ────────────────────────────────────────────────────────────────
const fmtUSD = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.round(n));
const fmtN = (n) => new Intl.NumberFormat('en-US').format(Math.round(n));
const fmtPct = (n) => `${Math.round(n)}%`;
const fmtMo = (n) => n > 0 && n < 600 ? `${Math.round(n)} mo` : 'N/A';

// ── ROI Engine ────────────────────────────────────────────────────────────────
function calcROI({ sites, utility, hvac, savings, ctrl, ctrlPrice, subMo, elecRate }) {
  const totalUtil = sites * utility;
  const hvacSpend = totalUtil * hvac / 100;
  const annualSavings = hvacSpend * savings / 100;
  const totalCtrl = sites * ctrl;
  const hardwareCost = totalCtrl * ctrlPrice;
  const annualSub = totalCtrl * subMo * 12 + 500; // +$500/yr enterprise SW
  const netBenefit = annualSavings - annualSub;
  const paybackMo = netBenefit > 0 ? (hardwareCost / (netBenefit / 12)) : 9999;

  // Carbon — EPA national avg: 0.386 kg CO2/kWh; tree absorbs 21.77 kg CO2/yr
  const kwhSaved = elecRate > 0 ? annualSavings / elecRate : 0;
  const co2Tons = kwhSaved * 0.000386;
  const trees = co2Tons / 0.02177;

  // Cumulative year-by-year (0–5)
  const cumulative = Array.from({ length: 6 }, (_, yr) => ({
    yr,
    annSavings: annualSavings,
    cumSavings: yr * annualSavings,
    cumSub: yr * annualSub,
    cumCosts: hardwareCost + yr * annualSub,
    cumNet: yr * annualSavings - hardwareCost - yr * annualSub,
  }));

  const roi3 = cumulative[3].cumCosts > 0 ? (cumulative[3].cumNet / cumulative[3].cumCosts) * 100 : 0;
  const roi5 = cumulative[5].cumCosts > 0 ? (cumulative[5].cumNet / cumulative[5].cumCosts) * 100 : 0;

  // Pilot: up to 15 sites, 70% HW discount, ~120 days (4 months sub)
  const pilotN = Math.min(15, Math.max(1, sites));
  const pilotHW = pilotN * ctrl * ctrlPrice * 0.30;
  const pilotSub4mo = pilotN * ctrl * subMo * 4;
  const pilotTotal = pilotHW + pilotSub4mo;
  const pilotAnnSavings = (pilotN / Math.max(sites, 1)) * annualSavings;

  return {
    totalUtil, hvacSpend, annualSavings, totalCtrl,
    hardwareCost, annualSub, netBenefit, paybackMo,
    co2Tons, trees, kwhSaved, cumulative, roi3, roi5,
    pilotN, pilotHW, pilotSub4mo, pilotTotal, pilotAnnSavings,
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Slider({ label, value, min, max, step, fmt, onChange, hint }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <label style={{ fontSize: 13, color: B.muted, fontWeight: 500 }}>{label}</label>
        <span style={{ fontSize: 15, fontWeight: 700, color: B.text }}>{fmt(value)}</span>
      </div>
      <div style={{ position: 'relative' }}>
        <div style={{
          position: 'absolute', top: 8, left: 0, height: 6,
          width: `${pct}%`, background: `linear-gradient(90deg, ${B.blue2}, ${B.blue})`,
          borderRadius: 4, pointerEvents: 'none', zIndex: 1,
        }} />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{ width: '100%', position: 'relative', zIndex: 2 }}
        />
      </div>
      {hint && <div style={{ fontSize: 11, color: B.muted, marginTop: 3 }}>{hint}</div>}
    </div>
  );
}

function MetricCard({ label, value, sub, color, large }) {
  return (
    <div style={{
      background: B.bg3,
      border: `1px solid ${B.border}`,
      borderRadius: 12,
      padding: large ? '20px 22px' : '16px 18px',
      flex: 1,
      minWidth: 140,
    }}>
      <div style={{ fontSize: 11, color: B.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: large ? 28 : 22, fontWeight: 800, color: color || B.text, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: B.muted, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function SectionHead({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, color: B.blue, textTransform: 'uppercase',
      letterSpacing: '0.1em', marginBottom: 14, marginTop: 8,
      paddingBottom: 8, borderBottom: `1px solid ${B.border}`,
    }}>{children}</div>
  );
}

function YearRow({ row, isBreakeven }) {
  const positive = row.cumNet >= 0;
  return (
    <tr style={{ background: isBreakeven ? `${B.blue}18` : 'transparent' }}>
      <td style={tdStyle}>{row.yr === 0 ? 'Deploy' : `Year ${row.yr}`}</td>
      <td style={{ ...tdStyle, color: B.green }}>{row.yr === 0 ? '—' : fmtUSD(row.annSavings)}</td>
      <td style={{ ...tdStyle, color: B.muted }}>{fmtUSD(row.cumCosts)}</td>
      <td style={{ ...tdStyle, fontWeight: 700, color: positive ? B.green : '#EF4444' }}>
        {positive ? '+' : ''}{fmtUSD(row.cumNet)}
      </td>
    </tr>
  );
}
const tdStyle = { padding: '10px 14px', fontSize: 13, borderBottom: `1px solid ${B.border}` };
const thStyle = { padding: '10px 14px', fontSize: 11, fontWeight: 700, color: B.muted, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left', borderBottom: `1px solid ${B.borderLight}` };

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [vertIdx, setVertIdx] = useState(0);
  const vert = VERTICALS[vertIdx];

  const [sites, setSites] = useState(vert.d.sites);
  const [utility, setUtility] = useState(vert.d.utility);
  const [hvac, setHvac] = useState(vert.d.hvac);
  const [savings, setSavings] = useState(vert.d.savings);
  const [ctrl, setCtrl] = useState(vert.d.ctrl);
  const [ctrlPrice, setCtrlPrice] = useState(550);
  const [subMo, setSubMo] = useState(8);
  const [elecRate, setElecRate] = useState(0.12);
  const [showAdv, setShowAdv] = useState(false);

  // Email gate state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [optIn, setOptIn] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');
  const [reportUnlocked, setReportUnlocked] = useState(false);

  const switchVertical = useCallback((idx) => {
    const v = VERTICALS[idx];
    setVertIdx(idx);
    setSites(v.d.sites);
    setUtility(v.d.utility);
    setHvac(v.d.hvac);
    setSavings(v.d.savings);
    setCtrl(v.d.ctrl);
  }, []);

  const roi = useMemo(() =>
    calcROI({ sites, utility, hvac, savings, ctrl, ctrlPrice, subMo, elecRate }),
    [sites, utility, hvac, savings, ctrl, ctrlPrice, subMo, elecRate]
  );

  const breakevenYr = roi.cumulative.findIndex(r => r.cumNet >= 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) { setFormError('Please enter your name.'); return; }
    if (!email.trim() || !email.includes('@')) { setFormError('Please enter a valid email address.'); return; }
    if (!company.trim()) { setFormError('Please enter your company name.'); return; }
    if (!optIn) { setFormError('Please check the box to receive your report.'); return; }
    setFormError('');
    setSubmitted(true);
    setReportUnlocked(true);
    // In production: POST to Formspree, HubSpot, or serverless function here
  };

  // Shared input panel
  const inputPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <SectionHead>Your Portfolio</SectionHead>
      <Slider label="Number of sites" value={sites} min={5} max={500} step={5}
        fmt={v => fmtN(v) + ' sites'} onChange={setSites}
        hint={`${fmtN(roi.totalCtrl)} total Freedom controllers`} />
      <Slider label="Avg annual utility per site" value={utility} min={5000} max={100000} step={1000}
        fmt={fmtUSD} onChange={setUtility}
        hint={`${fmtUSD(roi.totalUtil)} total portfolio utility spend`} />

      <SectionHead>Energy Profile</SectionHead>
      <Slider label="HVAC as % of utility spend" value={hvac} min={10} max={65} step={1}
        fmt={v => `${v}%`} onChange={setHvac}
        hint={`${fmtUSD(roi.hvacSpend)}/yr controllable HVAC load`} />
      <Slider label="Expected savings with Freedom" value={savings} min={10} max={35} step={1}
        fmt={v => `${v}%`} onChange={setSavings}
        hint="Adjust based on current controls baseline" />

      <SectionHead>Freedom Configuration</SectionHead>
      <Slider label="Freedom controllers per site" value={ctrl} min={1} max={20} step={1}
        fmt={v => `${v} unit${v !== 1 ? 's' : ''}`} onChange={setCtrl}
        hint="Typical: 2–4 for retail, 8–12 for institutional" />
      <Slider label="Controller price" value={ctrlPrice} min={450} max={650} step={10}
        fmt={fmtUSD} onChange={setCtrlPrice}
        hint="List price ~$800; typical sell price $500–$600" />
      <Slider label="Monthly subscription per unit" value={subMo} min={6} max={12} step={0.5}
        fmt={v => `$${v}/mo`} onChange={setSubMo}
        hint="Includes 24/7 support, connectivity, 10-yr warranty" />

      <button
        onClick={() => setShowAdv(!showAdv)}
        style={{
          background: 'none', border: `1px solid ${B.border}`, color: B.muted,
          borderRadius: 8, padding: '8px 14px', fontSize: 12, cursor: 'pointer',
          marginTop: 4, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6,
        }}>
        <span style={{ transform: showAdv ? 'rotate(90deg)' : 'none', display: 'inline-block', transition: 'transform 0.2s' }}>▶</span>
        Advanced settings
      </button>
      {showAdv && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${B.border}` }}>
          <Slider label="Avg commercial electricity rate" value={elecRate} min={0.06} max={0.30} step={0.01}
            fmt={v => `$${v.toFixed(2)}/kWh`} onChange={setElecRate}
            hint="US avg ~$0.12/kWh. Varies by state and rate class." />
        </div>
      )}

      <div style={{
        marginTop: 20, padding: 14, background: `${B.blue}12`,
        border: `1px solid ${B.blue}40`, borderRadius: 10, fontSize: 12, color: B.muted,
        lineHeight: 1.6,
      }}>
        <span style={{ color: B.blue, fontWeight: 600 }}>Context: </span>
        {vert.context}
      </div>

      <div style={{
        marginTop: 12, padding: 14, background: B.bg3,
        border: `1px solid ${B.border}`, borderRadius: 10, fontSize: 11, color: B.muted,
        lineHeight: 1.6,
      }}>
        <strong style={{ color: B.muted }}>Disclaimer:</strong> All figures are estimates based on representative industry data and assumptions adjustable above. Actual results depend on existing controls, facility type, usage patterns, and utility rates. Contact NexRev for a site-specific assessment.
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: B.bg1, fontFamily: "'Inter', sans-serif" }}>

      {/* ── Header ── */}
      <header style={{
        background: B.bg0, borderBottom: `1px solid ${B.border}`,
        padding: '0 24px', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              {/* NexRev logo icon (circular arrow) */}
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M14 4C8.477 4 4 8.477 4 14s4.477 10 10 10 10-4.477 10-10" stroke={B.blue} strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M24 4l-2 6M24 4l-6 2" stroke={B.blue} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontSize: 22, fontWeight: 800, color: B.text, letterSpacing: '-0.5px' }}>
                Nex<span style={{ color: B.blue }}>Rev</span>
              </span>
            </div>
            <div style={{ width: 1, height: 24, background: B.border }} />
            <span style={{ fontSize: 13, color: B.muted, fontWeight: 500 }}>Energy ROI Calculator</span>
          </div>
          <div style={{ fontSize: 12, color: B.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: B.green, display: 'inline-block' }} />
            Powered by Freedom EMS + NexiAI
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <div style={{
        background: `linear-gradient(180deg, ${B.bg0} 0%, ${B.bg1} 100%)`,
        padding: '48px 24px 40px', textAlign: 'center',
        borderBottom: `1px solid ${B.border}`,
      }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: `${B.teal}18`, border: `1px solid ${B.teal}40`,
            borderRadius: 100, padding: '5px 14px', fontSize: 12,
            color: B.teal, fontWeight: 600, marginBottom: 20,
          }}>
            <span>⚡</span> Cellular-Independent Energy Management — No IT Network Required
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: B.text, lineHeight: 1.15, marginBottom: 14 }}>
            How much could your portfolio<br />
            <span style={{ color: B.blue }}>save with Freedom EMS?</span>
          </h1>
          <p style={{ fontSize: 16, color: B.muted, lineHeight: 1.6, marginBottom: 0 }}>
            Select your vertical, adjust the sliders to match your portfolio, and see your projected ROI, payback period, and carbon impact in real time.
          </p>
        </div>
      </div>

      {/* ── Vertical Tabs ── */}
      <div style={{ background: B.bg2, borderBottom: `1px solid ${B.border}`, padding: '0 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', gap: 4, overflowX: 'auto', padding: '12px 0' }}>
          {VERTICALS.map((v, i) => (
            <button key={v.id} onClick={() => switchVertical(i)} style={{
              background: i === vertIdx ? B.blue : 'transparent',
              border: `1px solid ${i === vertIdx ? B.blue : B.border}`,
              borderRadius: 10, padding: '9px 18px', cursor: 'pointer',
              color: i === vertIdx ? '#fff' : B.muted, fontWeight: 600,
              fontSize: 13, whiteSpace: 'nowrap', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: 7,
            }}>
              <span>{v.emoji}</span>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px 64px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>

          {/* LEFT: Inputs */}
          <div style={{ background: B.bg2, border: `1px solid ${B.border}`, borderRadius: 16, padding: '28px 28px 24px' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: B.text, marginBottom: 22 }}>
              {vert.emoji} {vert.desc}
            </h2>
            {inputPanel}
          </div>

          {/* RIGHT: Results */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Summary headline */}
            <div style={{ background: B.bg2, border: `1px solid ${B.border}`, borderRadius: 16, padding: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: B.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
                Estimated Annual Energy Savings
              </div>
              <div style={{
                fontSize: 52, fontWeight: 800, color: B.green, lineHeight: 1,
                marginBottom: 6, letterSpacing: '-1px',
              }}>
                {fmtUSD(roi.annualSavings)}
              </div>
              <div style={{ fontSize: 14, color: B.muted }}>
                per year across {fmtN(sites)} sites — {fmtN(roi.totalCtrl)} Freedom controllers
              </div>

              {/* Key metrics row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 20 }}>
                <MetricCard label="Simple Payback" value={fmtMo(roi.paybackMo)}
                  sub="hardware recovery" color={roi.paybackMo < 36 ? B.teal : B.text} />
                <MetricCard label="3-Year ROI" value={roi.roi3 > 0 ? `+${fmtPct(roi.roi3)}` : fmtPct(roi.roi3)}
                  sub="net of all costs" color={roi.roi3 > 0 ? B.green : '#EF4444'} />
                <MetricCard label="5-Year ROI" value={roi.roi5 > 0 ? `+${fmtPct(roi.roi5)}` : fmtPct(roi.roi5)}
                  sub="net of all costs" color={roi.roi5 > 0 ? B.green : '#EF4444'} />
              </div>
            </div>

            {/* Carbon */}
            <div style={{
              background: `linear-gradient(135deg, ${B.bg2} 0%, #0C1F1A 100%)`,
              border: `1px solid ${B.teal}40`, borderRadius: 16, padding: 20,
              display: 'flex', gap: 20,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: B.teal, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>CO₂ Avoided / Year</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: B.teal }}>{fmtN(roi.co2Tons)} tons</div>
                <div style={{ fontSize: 12, color: B.muted, marginTop: 3 }}>{fmtN(roi.kwhSaved)} kWh saved annually</div>
              </div>
              <div style={{ flex: 1, borderLeft: `1px solid ${B.teal}30`, paddingLeft: 20 }}>
                <div style={{ fontSize: 11, color: B.teal, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>🌳 Trees Equivalent</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: B.teal }}>{fmtN(roi.trees)}</div>
                <div style={{ fontSize: 12, color: B.muted, marginTop: 3 }}>trees planted per year (EPA)</div>
              </div>
            </div>

            {/* Investment summary */}
            <div style={{ background: B.bg2, border: `1px solid ${B.border}`, borderRadius: 16, padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: B.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
                Investment Summary
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Hardware (Freedom controllers)', val: fmtUSD(roi.hardwareCost), note: `${fmtN(roi.totalCtrl)} units × ${fmtUSD(ctrlPrice)}` },
                  { label: 'Annual subscription + enterprise SW', val: fmtUSD(roi.annualSub), note: `$${subMo}/mo per unit + $500/yr platform` },
                  { label: 'Net annual benefit', val: fmtUSD(roi.netBenefit), note: 'Savings minus subscription', highlight: roi.netBenefit > 0 },
                ].map((r, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                    padding: '10px 14px', background: B.bg3, borderRadius: 8,
                    border: r.highlight ? `1px solid ${B.green}40` : `1px solid ${B.border}`,
                  }}>
                    <div>
                      <div style={{ fontSize: 13, color: r.highlight ? B.green : B.text, fontWeight: r.highlight ? 700 : 400 }}>{r.label}</div>
                      <div style={{ fontSize: 11, color: B.muted, marginTop: 2 }}>{r.note}</div>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: r.highlight ? B.green : B.text, whiteSpace: 'nowrap', marginLeft: 12 }}>{r.val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Email gate */}
            {!reportUnlocked ? (
              <div style={{
                background: `linear-gradient(135deg, #0D1428 0%, ${B.bg2} 100%)`,
                border: `1px solid ${B.blue}50`, borderRadius: 16, padding: 24,
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', top: -30, right: -30, width: 120, height: 120,
                  borderRadius: '50%', background: `${B.blue}15`, pointerEvents: 'none',
                }} />
                <div style={{ fontSize: 13, fontWeight: 700, color: B.blue, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                  📊 Get Your Complete Analysis
                </div>
                <p style={{ fontSize: 14, color: B.muted, marginBottom: 20, lineHeight: 1.6 }}>
                  Enter your information below to unlock the full year-by-year savings table, pilot program estimate, and detailed cost breakdown — ready to share with your CFO.
                </p>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <input
                      type="text" placeholder="Your name" value={name}
                      onChange={e => setName(e.target.value)}
                      style={inputStyle} />
                    <input
                      type="text" placeholder="Company name" value={company}
                      onChange={e => setCompany(e.target.value)}
                      style={inputStyle} />
                  </div>
                  <input
                    type="email" placeholder="Work email address" value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={inputStyle} />
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginTop: 4 }}>
                    <input type="checkbox" checked={optIn} onChange={e => setOptIn(e.target.checked)}
                      style={{ marginTop: 3, accentColor: B.blue, width: 16, height: 16, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: B.muted, lineHeight: 1.5 }}>
                      I agree to receive my ROI report and occasional energy management insights from NexRev. I can unsubscribe at any time.
                    </span>
                  </label>
                  {formError && (
                    <div style={{ fontSize: 12, color: '#EF4444', padding: '8px 12px', background: '#EF444415', borderRadius: 8, border: '1px solid #EF444440' }}>
                      {formError}
                    </div>
                  )}
                  <button type="submit" style={{
                    background: `linear-gradient(135deg, ${B.blue2}, ${B.blue})`,
                    border: 'none', borderRadius: 10, padding: '14px 20px',
                    color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                    marginTop: 4, letterSpacing: '-0.2px',
                    boxShadow: `0 4px 20px ${B.blue}40`,
                  }}>
                    Unlock Full Analysis →
                  </button>
                </form>
              </div>
            ) : (
              <div style={{
                background: `${B.green}18`, border: `1px solid ${B.green}50`,
                borderRadius: 12, padding: '14px 18px', fontSize: 14, color: B.green, fontWeight: 600,
              }}>
                ✓ Report unlocked for {name} — {email}
              </div>
            )}

            {/* Full report (unlocked) */}
            {reportUnlocked && (
              <>
                {/* Year-by-year table */}
                <div style={{ background: B.bg2, border: `1px solid ${B.border}`, borderRadius: 16, overflow: 'hidden' }}>
                  <div style={{ padding: '18px 20px 14px', borderBottom: `1px solid ${B.border}` }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: B.text }}>Cumulative Financial Model</div>
                    <div style={{ fontSize: 12, color: B.muted, marginTop: 2 }}>Year-by-year savings vs. total cost of ownership</div>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: B.bg3 }}>
                        <th style={thStyle}>Period</th>
                        <th style={thStyle}>Annual Savings</th>
                        <th style={thStyle}>Cum. Costs</th>
                        <th style={thStyle}>Net Position</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roi.cumulative.map((row) => (
                        <YearRow key={row.yr} row={row} isBreakeven={row.yr === breakevenYr && row.yr > 0} />
                      ))}
                    </tbody>
                  </table>
                  {breakevenYr > 0 && (
                    <div style={{ padding: '10px 20px', background: `${B.blue}10`, fontSize: 12, color: B.blue, borderTop: `1px solid ${B.border}` }}>
                      ★ Breakeven occurs in Year {breakevenYr} (highlighted). Hardware paid back in {fmtMo(roi.paybackMo)}.
                    </div>
                  )}
                </div>

                {/* Pilot estimate */}
                <div style={{ background: B.bg2, border: `1px solid ${B.border}`, borderRadius: 16, padding: 22 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: B.text, marginBottom: 4 }}>Pilot Program Estimate</div>
                  <div style={{ fontSize: 12, color: B.muted, marginBottom: 18 }}>
                    {roi.pilotN}-site pilot · 70% hardware discount · 120-day validation period
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    {[
                      { label: 'Hardware (at 70% off)', val: fmtUSD(roi.pilotHW) },
                      { label: 'Subscription (4 months)', val: fmtUSD(roi.pilotSub4mo) },
                      { label: 'Total pilot investment', val: fmtUSD(roi.pilotTotal) },
                    ].map((item, i) => (
                      <div key={i} style={{ background: B.bg3, borderRadius: 10, padding: 14, border: `1px solid ${B.border}` }}>
                        <div style={{ fontSize: 11, color: B.muted, marginBottom: 6 }}>{item.label}</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: i === 2 ? B.blue : B.text }}>{item.val}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 14, padding: 14, background: `${B.teal}10`, border: `1px solid ${B.teal}30`, borderRadius: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: B.teal, marginBottom: 4 }}>
                      Pilot saves an estimated {fmtUSD(roi.pilotAnnSavings)}/yr
                    </div>
                    <div style={{ fontSize: 12, color: B.muted, lineHeight: 1.6 }}>
                      A successful pilot validates the ROI model and creates the data foundation for a full deployment proposal. NexRev's 2–4 hour install per site means all {roi.pilotN} sites can be live within days, not weeks.
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div style={{
                  background: `linear-gradient(135deg, #0C1830, ${B.bg2})`,
                  border: `1px solid ${B.blue}40`, borderRadius: 16, padding: 24, textAlign: 'center',
                }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: B.text, marginBottom: 8 }}>
                    Ready to validate these numbers at your sites?
                  </div>
                  <div style={{ fontSize: 13, color: B.muted, marginBottom: 20, lineHeight: 1.6 }}>
                    NexRev's Freedom EMS installs in 2–4 hours per site with no IT network required.<br />
                    A 15-site pilot produces real, AI-verified data your CFO can act on.
                  </div>
                  <a href="mailto:chet@nexrev.com?subject=ROI Calculator - Pilot Discussion"
                    style={{
                      display: 'inline-block',
                      background: `linear-gradient(135deg, ${B.blue2}, ${B.blue})`,
                      border: 'none', borderRadius: 10, padding: '13px 28px',
                      color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none',
                      boxShadow: `0 4px 20px ${B.blue}40`,
                    }}>
                    Schedule a Pilot Discussion →
                  </a>
                </div>
              </>
            )}

          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: `1px solid ${B.border}`, background: B.bg0,
        padding: '20px 24px', textAlign: 'center',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ fontSize: 12, color: B.muted, lineHeight: 1.6 }}>
            <strong style={{ color: B.text }}>Nex<span style={{ color: B.blue }}>Rev</span></strong>
            {' '}· Freedom EMS + NexiAI · {new Date().getFullYear()}<br />
            All ROI projections are estimates based on representative industry benchmarks. Results vary by facility type, climate, utility rates, and existing control systems. Contact NexRev for a site-specific assessment.
          </div>
        </div>
      </footer>
    </div>
  );
}

const inputStyle = {
  background: B.bg3, border: `1px solid ${B.border}`, borderRadius: 8,
  padding: '11px 14px', color: B.text, fontSize: 14, width: '100%',
  outline: 'none', fontFamily: "'Inter', sans-serif",
  '::placeholder': { color: B.muted },
};
