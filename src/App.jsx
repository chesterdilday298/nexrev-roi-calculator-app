import { useState, useMemo, useCallback } from 'react';

// ── Color palette: professional B2B enterprise ────────────────────────────────
// Light, high-contrast, CFO-ready. No dark backgrounds.
const C = {
  pageBg:     '#F4F7FC',
  card:       '#FFFFFF',
  cardAlt:    '#EEF4FF',
  nav:        '#1B2D50',
  navText:    '#FFFFFF',
  primary:    '#2563EB',
  primaryDk:  '#1D4ED8',
  primaryLt:  '#DBEAFE',
  green:      '#15803D',
  greenLt:    '#DCFCE7',
  amber:      '#B45309',
  amberLt:    '#FEF3C7',
  red:        '#DC2626',
  redLt:      '#FEE2E2',
  text:       '#111827',
  textMid:    '#374151',
  muted:      '#6B7280',
  border:     '#E5E7EB',
  divider:    '#F3F4F6',
  shadow:     '0 1px 3px rgba(0,0,0,0.08)',
  shadowMd:   '0 4px 8px rgba(0,0,0,0.08)',
};

// ── Verticals ────────────────────────────────────────────────────────────────
const VERTICALS = [
  {
    id: 'cstore', label: 'C-Store / Fuel',
    desc: 'Convenience stores and fuel retailers',
    context: 'HVAC accounts for 35 to 42 percent of total utility spend at most convenience locations. The BX controller replacement play is the primary entry point, and the portfolio density makes economics compelling at the CFO level.',
    d: { sites: 75, utility: 18000, hvac: 38, savings: 18, ctrl: 3, maint: 6000, maintPct: 12, trucks: 6, truckElim: 30, truckCost: 450, drPct: 35, drPerSite: 900, utilPct: 8, rtuPerSite: 2, rtuCost: 14000 },
  },
  {
    id: 'pharmacy', label: 'Pharmacy',
    desc: 'Drug retail and pharmacy chains',
    context: 'Store HVAC is the controllable load. Self-contained pharmacy refrigeration cases use embedded compressors and are outside this analysis. BX controller HVAC management is the access point for this segment.',
    d: { sites: 100, utility: 22000, hvac: 32, savings: 20, ctrl: 4, maint: 7500, maintPct: 10, trucks: 4, truckElim: 25, truckCost: 500, drPct: 40, drPerSite: 1100, utilPct: 8, rtuPerSite: 3, rtuCost: 14000 },
  },
  {
    id: 'gym', label: 'Health Clubs',
    desc: 'Fitness centers and health club chains',
    context: 'High ventilation demand and occupancy variability make gyms among the most energy-intensive retail locations per square foot. Cellular independence is a structural requirement since franchisees do not share IT networks.',
    d: { sites: 30, utility: 36000, hvac: 45, savings: 25, ctrl: 8, maint: 10000, maintPct: 15, trucks: 5, truckElim: 30, truckCost: 550, drPct: 50, drPerSite: 2000, utilPct: 7, rtuPerSite: 5, rtuCost: 15000 },
  },
  {
    id: 'banking', label: 'Banking',
    desc: 'Bank branch networks and financial services',
    context: 'After-hours HVAC scheduling and setback control drive the primary savings. Low controller count per branch makes deployment fast and the business case straightforward.',
    d: { sites: 50, utility: 14000, hvac: 28, savings: 17, ctrl: 2, maint: 5000, maintPct: 10, trucks: 3, truckElim: 25, truckCost: 400, drPct: 30, drPerSite: 800, utilPct: 8, rtuPerSite: 2, rtuCost: 13000 },
  },
  {
    id: 'k12', label: 'K-12 Education',
    desc: 'Public and private K-12 school districts',
    context: 'California code mandates RTU inspection and tracking for every K-12 rooftop unit. Summer setback and occupancy-based scheduling drive savings. Freedom delivers the compliance data layer without requiring IT infrastructure.',
    d: { sites: 25, utility: 42000, hvac: 40, savings: 22, ctrl: 10, maint: 12000, maintPct: 15, trucks: 8, truckElim: 35, truckCost: 500, drPct: 60, drPerSite: 2500, utilPct: 10, rtuPerSite: 6, rtuCost: 15000 },
  },
  {
    id: 'highered', label: 'Higher Education',
    desc: 'Universities and community colleges',
    context: 'Campus-wide HVAC loads and 24-hour operations create large savings potential. CDP, GRESB, and Energy Star Portfolio Manager requirements are met without additional instrumentation or IT integration.',
    d: { sites: 12, utility: 68000, hvac: 38, savings: 20, ctrl: 15, maint: 18000, maintPct: 12, trucks: 12, truckElim: 30, truckCost: 600, drPct: 65, drPerSite: 4000, utilPct: 10, rtuPerSite: 8, rtuCost: 16000 },
  },
  {
    id: 'healthcare', label: 'Healthcare',
    desc: 'Medical offices and outpatient clinics',
    context: 'Doctor offices and outpatient facilities face strict comfort and compliance requirements. Freedom provides the monitoring and documentation layer that satisfies both facilities managers and compliance teams without touching the clinical network.',
    d: { sites: 40, utility: 28000, hvac: 32, savings: 18, ctrl: 5, maint: 9000, maintPct: 12, trucks: 5, truckElim: 25, truckCost: 550, drPct: 35, drPerSite: 1200, utilPct: 8, rtuPerSite: 3, rtuCost: 14500 },
  },
  {
    id: 'datacenter', label: 'Data Centers / 3PL',
    desc: 'Data centers, warehouses, and 3PL facilities',
    context: 'No IT network required is a structural advantage in data center and 3PL environments where tenant isolation prevents shared connectivity. Freedom installs on every rooftop without touching the existing network.',
    d: { sites: 8, utility: 90000, hvac: 28, savings: 15, ctrl: 14, maint: 20000, maintPct: 10, trucks: 6, truckElim: 25, truckCost: 700, drPct: 70, drPerSite: 8000, utilPct: 7, rtuPerSite: 8, rtuCost: 18000 },
  },
];

// ── Pain points ───────────────────────────────────────────────────────────────
const PAIN_POINTS = [
  { id: 'hvac_fail',   label: 'HVAC failures',              bucket: 'Truck Roll Reduction' },
  { id: 'hotcold',     label: 'Hot and cold complaints',     bucket: 'Maintenance Savings' },
  { id: 'downtime',    label: 'Equipment downtime',          bucket: 'Deferred Capital Replacement' },
  { id: 'emergency',   label: 'Emergency service calls',     bucket: 'Truck Roll Reduction' },
  { id: 'escalations', label: 'Escalations from Operations', bucket: 'Energy Savings' },
  { id: 'angry',       label: 'Angry customers',             bucket: 'Maintenance Savings' },
  { id: 'surprise',    label: 'Surprise repair bills',       bucket: 'Maintenance Savings' },
  { id: 'esg',         label: 'ESG reporting requirements',  bucket: 'ESG / Compliance' },
];

// ── Formatters ────────────────────────────────────────────────────────────────
const fmtUSD = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.round(n));
const fmtN   = (n) => new Intl.NumberFormat('en-US').format(Math.round(n));
const fmtPct = (n) => `${n > 0 ? '+' : ''}${Math.round(n)}%`;
const fmtMo  = (n) => (n > 0 && n < 600) ? `${Math.round(n)} months` : 'N/A';
const fmtIRR = (n) => (n === null || n < 0) ? 'N/A' : `${Math.round(n)}%`;

// ── Subscription tier ─────────────────────────────────────────────────────────
function getSubRate(totalCtrl) {
  if (totalCtrl < 100)  return 10;
  if (totalCtrl <= 250) return  9;
  if (totalCtrl <= 500) return  8;
  return 7;
}

function subTierLabel(totalCtrl) {
  if (totalCtrl < 100)  return '$10/unit/mo (under 100 units)';
  if (totalCtrl <= 250) return '$9/unit/mo (101-250 units)';
  if (totalCtrl <= 500) return '$8/unit/mo (251-500 units)';
  return '$7/unit/mo (over 500 units)';
}

// ── Financial math ────────────────────────────────────────────────────────────
function calcNPV(annNet, hwCost, years = 10, rate = 0.08) {
  let npv = -hwCost;
  for (let t = 1; t <= years; t++) npv += annNet / Math.pow(1 + rate, t);
  return npv;
}

function calcIRR(annNet, hwCost, years = 10) {
  if (annNet <= 0 || hwCost <= 0) return null;
  const npvFn = (r) => {
    let v = -hwCost;
    for (let t = 1; t <= years; t++) v += annNet / Math.pow(1 + r, t);
    return v;
  };
  if (npvFn(0.001) < 0) return null;
  let lo = 0, hi = 10;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    npvFn(mid) > 0 ? (lo = mid) : (hi = mid);
  }
  return ((lo + hi) / 2) * 100;
}

function calcAll(s) {
  const { sites, utility, hvac, savings, ctrl, ctrlPrice,
          maint, maintPct, trucks, truckElim, truckCost,
          drPct, drPerSite, utilPct, rtuPerSite, rtuCost } = s;

  const totalCtrl    = sites * ctrl;
  const subRate      = getSubRate(totalCtrl);
  const hwCost       = totalCtrl * ctrlPrice;
  const annualSub    = totalCtrl * subRate * 12 + 500; // +$500/yr enterprise SW

  // 1. Energy savings
  const hvacSpend    = sites * utility * hvac / 100;
  const energySavings = hvacSpend * savings / 100;

  // 2. Maintenance savings
  const maintSavings = sites * maint * maintPct / 100;

  // 3. Truck roll reduction
  const truckSavings = sites * trucks * (truckElim / 100) * truckCost;

  // 4. Demand response revenue
  const drRevenue    = sites * (drPct / 100) * drPerSite;

  // 5. Utility incentives (one-time, annualized over 5 yrs for display)
  const utilIncentive     = hwCost * utilPct / 100;
  const utilIncentiveAnn  = utilIncentive / 5;

  // 6. Deferred capital replacement (annual benefit)
  const totalDeferredCapex  = sites * rtuPerSite * rtuCost;
  const deferredAnnBenefit  = totalDeferredCapex * 0.08; // ~8% annualized benefit of deferral

  // 7. ESG / Compliance — qualitative, no dollar value assigned

  const totalAnnualValue = energySavings + maintSavings + truckSavings + drRevenue + utilIncentiveAnn + deferredAnnBenefit;
  const netBenefit       = totalAnnualValue - annualSub;
  const paybackMo        = netBenefit > 0 ? (hwCost / (netBenefit / 12)) : 9999;

  // CFO metrics
  const npv10    = calcNPV(netBenefit, hwCost, 10, 0.08);
  const irr      = calcIRR(netBenefit, hwCost, 10);
  const year1CF  = totalAnnualValue - annualSub;           // operating
  const year1Net = year1CF - hwCost;                       // after capex

  // Year-by-year (0-5)
  const cumulative = Array.from({ length: 6 }, (_, yr) => ({
    yr,
    annValue:  totalAnnualValue,
    cumValue:  yr * totalAnnualValue,
    cumCosts:  hwCost + yr * annualSub,
    cumNet:    yr * totalAnnualValue - hwCost - yr * annualSub,
  }));

  const roi3 = cumulative[3].cumCosts > 0
    ? (cumulative[3].cumNet / cumulative[3].cumCosts) * 100 : 0;
  const roi5 = cumulative[5].cumCosts > 0
    ? (cumulative[5].cumNet / cumulative[5].cumCosts) * 100 : 0;

  // Pilot: up to 15 sites, 70% HW discount, 4-month sub
  const pilotN         = Math.min(15, Math.max(1, sites));
  const pilotHW        = pilotN * ctrl * ctrlPrice * 0.30;
  const pilotSub4mo    = pilotN * ctrl * subRate * 4;
  const pilotTotal     = pilotHW + pilotSub4mo;
  const pilotAnnValue  = (pilotN / Math.max(sites, 1)) * totalAnnualValue;

  return {
    totalCtrl, subRate, hwCost, annualSub,
    energySavings, maintSavings, truckSavings, drRevenue,
    utilIncentive, utilIncentiveAnn, totalDeferredCapex, deferredAnnBenefit,
    totalAnnualValue, netBenefit, paybackMo,
    npv10, irr, year1CF, year1Net,
    cumulative, roi3, roi5,
    pilotN, pilotHW, pilotSub4mo, pilotTotal, pilotAnnValue,
  };
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const cardStyle = {
  background: C.card,
  border: `1px solid ${C.border}`,
  borderRadius: 12,
  boxShadow: C.shadow,
};

// ── Sub-components ────────────────────────────────────────────────────────────
function SectionHead({ children, mt }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, color: C.primary, textTransform: 'uppercase',
      letterSpacing: '0.08em', marginBottom: 12, marginTop: mt || 8,
      paddingBottom: 8, borderBottom: `2px solid ${C.primaryLt}`,
    }}>
      {children}
    </div>
  );
}

function Slider({ label, value, min, max, step, fmt, onChange, hint }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
        <label style={{ fontSize: 13, color: C.textMid, fontWeight: 500 }}>{label}</label>
        <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{fmt(value)}</span>
      </div>
      <div style={{ position: 'relative', height: 20 }}>
        <div style={{
          position: 'absolute', top: 7, left: 0, height: 6,
          width: `${pct}%`, background: C.primary,
          borderRadius: 4, pointerEvents: 'none', zIndex: 1,
        }} />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{ width: '100%', position: 'relative', zIndex: 2, margin: 0 }}
        />
      </div>
      {hint && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{hint}</div>}
    </div>
  );
}

function MetricCard({ label, value, sub, color, border, size }) {
  return (
    <div style={{
      ...cardStyle,
      border: border ? `1px solid ${border}` : `1px solid ${C.border}`,
      padding: '14px 16px', flex: 1, minWidth: 0,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: size || 20, fontWeight: 800, color: color || C.text, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function BucketRow({ label, value, pct, highlight }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 0', borderBottom: `1px solid ${C.divider}`,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: highlight ? C.green : C.text, fontWeight: highlight ? 600 : 400 }}>{label}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 80, height: 6, background: C.divider, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: highlight ? C.green : C.primary, borderRadius: 3 }} />
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: highlight ? C.green : C.text, minWidth: 90, textAlign: 'right' }}>{value}</div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', background: C.card, border: `1px solid ${C.border}`,
  borderRadius: 8, padding: '10px 13px', color: C.text,
  fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
};

// ── Pain Point Intro Screen ───────────────────────────────────────────────────
function PainPointScreen({ onProceed }) {
  const [selected, setSelected] = useState([]);
  const [vertIdx, setVertIdx] = useState(0);
  const [error, setError] = useState('');

  const toggle = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
    setError('');
  };

  const proceed = () => {
    if (selected.length === 0) { setError('Select at least one challenge to continue.'); return; }
    onProceed({ pains: selected, vertIdx });
  };

  return (
    <div style={{ minHeight: '100vh', background: C.pageBg, fontFamily: "'Inter', sans-serif" }}>

      {/* Nav */}
      <nav style={{ background: C.nav, padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
            <path d="M14 4C8.477 4 4 8.477 4 14s4.477 10 10 10 10-4.477 10-10" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M24 4l-2 6M24 4l-6 2" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.4px' }}>
            Nex<span style={{ color: '#60A5FA' }}>Rev</span>
          </span>
        </div>
        <span style={{ fontSize: 12, color: '#94A3B8' }}>Freedom EMS + NexiAI</span>
      </nav>

      {/* Hero */}
      <div style={{ background: C.nav, padding: '48px 32px 56px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.3)', borderRadius: 100, padding: '5px 16px', fontSize: 12, color: '#93C5FD', fontWeight: 600, marginBottom: 20 }}>
          Cellular-Based Energy Management
        </div>
        <h1 style={{ fontSize: 34, fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2, marginBottom: 12 }}>
          Besides reducing energy cost and understanding<br />enterprise store performance, which of these<br />are a current challenge for your organization?
        </h1>
        <p style={{ fontSize: 15, color: '#94A3B8', marginBottom: 0 }}>
          Select all that apply. Your results will reflect every category you identify.
        </p>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px 64px', marginTop: -24 }}>

        {/* Pain point cards */}
        <div style={{ ...cardStyle, padding: '28px 28px 24px', marginBottom: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {PAIN_POINTS.map(p => {
              const on = selected.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => toggle(p.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 16px',
                    background: on ? C.primaryLt : C.card,
                    border: `2px solid ${on ? C.primary : C.border}`,
                    borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.12s',
                  }}
                >
                  <div style={{
                    width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                    border: `2px solid ${on ? C.primary : C.border}`,
                    background: on ? C.primary : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {on && <svg width="12" height="9" viewBox="0 0 12 9" fill="none"><path d="M1 4l3.5 3.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: on ? 600 : 400, color: on ? C.primary : C.text }}>
                    {p.label}
                  </span>
                </button>
              );
            })}
          </div>
          {error && (
            <div style={{ marginTop: 14, fontSize: 13, color: C.red, padding: '10px 14px', background: C.redLt, borderRadius: 8 }}>
              {error}
            </div>
          )}
        </div>

        {/* Vertical selector */}
        <div style={{ ...cardStyle, padding: '28px 28px 24px', marginBottom: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>
            What type of organization are you?
          </div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 18 }}>
            This sets the representative starting values. You can adjust everything in the next step.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {VERTICALS.map((v, i) => {
              const on = vertIdx === i;
              return (
                <button
                  key={v.id}
                  onClick={() => setVertIdx(i)}
                  style={{
                    padding: '12px 16px', textAlign: 'left',
                    background: on ? C.primaryLt : C.card,
                    border: `2px solid ${on ? C.primary : C.border}`,
                    borderRadius: 10, cursor: 'pointer', transition: 'all 0.12s',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: on ? 700 : 500, color: on ? C.primary : C.text }}>{v.label}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{v.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={proceed}
          style={{
            width: '100%', background: C.primary, border: 'none',
            borderRadius: 12, padding: '17px 24px',
            color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer',
            boxShadow: `0 4px 14px rgba(37,99,235,0.35)`,
          }}
        >
          Calculate My ROI
        </button>
      </div>
    </div>
  );
}

// ── Calculator Screen ─────────────────────────────────────────────────────────
function CalculatorScreen({ pains, vertIdx: initVertIdx, onBack }) {
  const [vertIdx, setVertIdx] = useState(initVertIdx);
  const vert = VERTICALS[vertIdx];

  // Core inputs
  const [sites,    setSites]    = useState(vert.d.sites);
  const [utility,  setUtility]  = useState(vert.d.utility);
  const [hvac,     setHvac]     = useState(vert.d.hvac);
  const [savings,  setSavings]  = useState(vert.d.savings);
  const [ctrl,     setCtrl]     = useState(vert.d.ctrl);
  const [ctrlPrice, setCtrlPrice] = useState(550);

  // Additional value inputs (collapsible)
  const [showAdditional, setShowAdditional] = useState(false);
  const [maint,      setMaint]      = useState(vert.d.maint);
  const [maintPct,   setMaintPct]   = useState(vert.d.maintPct);
  const [trucks,     setTrucks]     = useState(vert.d.trucks);
  const [truckElim,  setTruckElim]  = useState(vert.d.truckElim);
  const [truckCost,  setTruckCost]  = useState(vert.d.truckCost);
  const [drPct,      setDrPct]      = useState(vert.d.drPct);
  const [drPerSite,  setDrPerSite]  = useState(vert.d.drPerSite);
  const [utilPct,    setUtilPct]    = useState(vert.d.utilPct);
  const [rtuPerSite, setRtuPerSite] = useState(vert.d.rtuPerSite);
  const [rtuCost,    setRtuCost]    = useState(vert.d.rtuCost);

  // Email gate
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [company,  setCompany]  = useState('');
  const [optIn,    setOptIn]    = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [formErr,  setFormErr]  = useState('');

  const switchVertical = useCallback((i) => {
    const v = VERTICALS[i];
    setVertIdx(i);
    setSites(v.d.sites);
    setUtility(v.d.utility);
    setHvac(v.d.hvac);
    setSavings(v.d.savings);
    setCtrl(v.d.ctrl);
    setMaint(v.d.maint);
    setMaintPct(v.d.maintPct);
    setTrucks(v.d.trucks);
    setTruckElim(v.d.truckElim);
    setTruckCost(v.d.truckCost);
    setDrPct(v.d.drPct);
    setDrPerSite(v.d.drPerSite);
    setUtilPct(v.d.utilPct);
    setRtuPerSite(v.d.rtuPerSite);
    setRtuCost(v.d.rtuCost);
  }, []);

  const r = useMemo(() => calcAll({
    sites, utility, hvac, savings, ctrl, ctrlPrice,
    maint, maintPct, trucks, truckElim, truckCost,
    drPct, drPerSite, utilPct, rtuPerSite, rtuCost,
  }), [sites, utility, hvac, savings, ctrl, ctrlPrice,
       maint, maintPct, trucks, truckElim, truckCost,
       drPct, drPerSite, utilPct, rtuPerSite, rtuCost]);

  const breakevenYr = r.cumulative.findIndex(row => row.cumNet >= 0);

  // Which pain-point buckets are selected
  const selectedBuckets = new Set(pains.map(id => PAIN_POINTS.find(p => p.id === id)?.bucket).filter(Boolean));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim())                    { setFormErr('Name is required.'); return; }
    if (!email.trim() || !email.includes('@')) { setFormErr('A valid email address is required.'); return; }
    if (!company.trim())                 { setFormErr('Company name is required.'); return; }
    if (!optIn)                          { setFormErr('Please check the box to receive your report.'); return; }
    setFormErr('');
    setUnlocked(true);

    // ── HubSpot integration ──────────────────────────────────────────────────
    // Replace portalId and formGuid with your HubSpot account values.
    // const portalId  = 'YOUR_PORTAL_ID';
    // const formGuid  = 'YOUR_FORM_GUID';
    // fetch(`https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${formGuid}`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     fields: [
    //       { name: 'firstname', value: name.split(' ')[0] },
    //       { name: 'lastname',  value: name.split(' ').slice(1).join(' ') },
    //       { name: 'email',     value: email },
    //       { name: 'company',   value: company },
    //       { name: 'roi_vertical',   value: vert.label },
    //       { name: 'roi_sites',      value: String(sites) },
    //       { name: 'roi_annual_value', value: String(Math.round(r.totalAnnualValue)) },
    //     ],
    //     legalConsentOptions: {
    //       consent: { consentToProcess: true, text: 'I agree to receive communications from NexRev.' },
    //     },
    //   }),
    // }).catch(console.error);
  };

  const buckets = [
    { label: 'Energy Savings',               value: r.energySavings,        note: `${hvac}% HVAC load x ${savings}% reduction` },
    { label: 'Maintenance Savings',           value: r.maintSavings,         note: `${maintPct}% reduction on avg $${(maint/1000).toFixed(0)}K/site maintenance` },
    { label: 'Truck Roll Reduction',          value: r.truckSavings,         note: `${truckElim}% of ${trucks} rolls/site eliminated at $${truckCost}/roll` },
    { label: 'Demand Response Revenue',       value: r.drRevenue,            note: `${drPct}% of sites eligible, avg $${drPerSite.toLocaleString()}/site/yr` },
    { label: 'Utility Incentives',            value: r.utilIncentiveAnn,     note: `${utilPct}% of hardware cost, amortized 5 yrs` },
    { label: 'Deferred Capital Replacement',  value: r.deferredAnnBenefit,   note: `${fmtUSD(r.totalDeferredCapex)} total capex deferred` },
    { label: 'ESG / Compliance',              value: null,                   note: 'Scope 1 & 2 tracking, CDP, GRESB, Energy Star — auditable data without additional instrumentation' },
  ];

  const maxBucketVal = Math.max(...buckets.filter(b => b.value).map(b => b.value));

  return (
    <div style={{ minHeight: '100vh', background: C.pageBg, fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <header style={{
        background: C.nav, position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 16, height: 56 }}>
          <button onClick={onBack} style={{
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 8, padding: '6px 14px', color: '#E2E8F0',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
              <path d="M14 4C8.477 4 4 8.477 4 14s4.477 10 10 10 10-4.477 10-10" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M24 4l-2 6M24 4l-6 2" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF' }}>
              Nex<span style={{ color: '#60A5FA' }}>Rev</span>
            </span>
          </div>
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.2)' }} />
          <span style={{ fontSize: 13, color: '#94A3B8', fontWeight: 500 }}>Energy ROI Calculator</span>
          <div style={{ flex: 1 }} />
          {pains.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {pains.slice(0, 3).map(id => {
                const p = PAIN_POINTS.find(x => x.id === id);
                return p ? (
                  <span key={id} style={{
                    fontSize: 11, background: 'rgba(96,165,250,0.2)', color: '#93C5FD',
                    border: '1px solid rgba(96,165,250,0.3)', borderRadius: 100,
                    padding: '3px 10px', fontWeight: 500,
                  }}>{p.label}</span>
                ) : null;
              })}
              {pains.length > 3 && (
                <span style={{ fontSize: 11, color: '#94A3B8', padding: '3px 6px' }}>+{pains.length - 3} more</span>
              )}
            </div>
          )}
        </div>

        {/* Vertical tabs */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', background: '#1E3A6A' }}>
          <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 24px', display: 'flex', gap: 2, overflowX: 'auto' }}>
            {VERTICALS.map((v, i) => (
              <button key={v.id} onClick={() => switchVertical(i)} style={{
                padding: '10px 16px', background: 'transparent',
                border: 'none', borderBottom: i === vertIdx ? '2px solid #60A5FA' : '2px solid transparent',
                color: i === vertIdx ? '#60A5FA' : '#94A3B8',
                fontSize: 12, fontWeight: i === vertIdx ? 700 : 500,
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.12s',
              }}>
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Insight banner */}
      <div style={{
        background: '#EFF6FF', borderBottom: `1px solid ${C.primaryLt}`,
        padding: '14px 24px',
      }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', fontSize: 14, color: C.primary, fontWeight: 600 }}>
          In addition to energy savings, we tell you what is wrong before someone else does so you do not have to drive to your building to know what is happening.
        </div>
      </div>

      {/* Main layout */}
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '28px 24px 64px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 28, alignItems: 'start' }}>

          {/* LEFT: Inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ ...cardStyle, padding: '24px 24px 20px' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 20 }}>
                {vert.label} — {vert.desc}
              </div>

              <SectionHead>Portfolio size</SectionHead>
              <Slider label="Number of sites" value={sites} min={5} max={500} step={5}
                fmt={v => `${fmtN(v)} sites`} onChange={setSites}
                hint={`${fmtN(r.totalCtrl)} total Freedom controllers — ${subTierLabel(r.totalCtrl)}`} />
              <Slider label="Avg annual utility cost per site" value={utility} min={5000} max={120000} step={1000}
                fmt={fmtUSD} onChange={setUtility}
                hint={`${fmtUSD(sites * utility)} total portfolio utility spend`} />

              <SectionHead mt={20}>Energy profile</SectionHead>
              <Slider label="HVAC as a share of utility spend" value={hvac} min={10} max={65} step={1}
                fmt={v => `${v}%`} onChange={setHvac}
                hint={`${fmtUSD(sites * utility * hvac / 100)} annual controllable HVAC load`} />
              <Slider label="Expected savings with Freedom EMS" value={savings} min={8} max={35} step={1}
                fmt={v => `${v}%`} onChange={setSavings}
                hint="Adjust based on your current controls baseline" />

              <SectionHead mt={20}>Freedom configuration</SectionHead>
              <Slider label="Controllers per site" value={ctrl} min={1} max={20} step={1}
                fmt={v => `${v} unit${v !== 1 ? 's' : ''}`} onChange={setCtrl}
                hint="Typical: 2-4 for retail, 8-15 for institutional" />
              <Slider label="Avg controller mix price" value={ctrlPrice} min={450} max={650} step={10}
                fmt={fmtUSD} onChange={setCtrlPrice}
                hint={`Monthly subscription auto-sets: ${subTierLabel(r.totalCtrl)}`} />
            </div>

            {/* Additional value factors */}
            <div style={{ ...cardStyle, padding: '20px 24px' }}>
              <button
                onClick={() => setShowAdditional(!showAdditional)}
                style={{
                  width: '100%', background: 'none', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: 'pointer', padding: 0,
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Additional value factors</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                  style={{ transform: showAdditional ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: C.muted }}>
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {!showAdditional && (
                <div style={{ marginTop: 10, fontSize: 12, color: C.muted }}>
                  Maintenance savings, truck roll reduction, demand response, utility incentives, and capital deferral. Defaults are pre-set for {vert.label}.
                </div>
              )}
              {showAdditional && (
                <div style={{ marginTop: 20 }}>
                  <SectionHead>Maintenance and service</SectionHead>
                  <Slider label="Avg annual maintenance cost per site" value={maint} min={2000} max={30000} step={500}
                    fmt={fmtUSD} onChange={setMaint} />
                  <Slider label="Expected maintenance cost reduction" value={maintPct} min={5} max={25} step={1}
                    fmt={v => `${v}%`} onChange={setMaintPct}
                    hint={`${fmtUSD(sites * maint * maintPct / 100)} annual maintenance savings`} />
                  <Slider label="Truck rolls per site per year" value={trucks} min={1} max={20} step={1}
                    fmt={v => `${v} rolls`} onChange={setTrucks} />
                  <Slider label="Percentage of truck rolls eliminated" value={truckElim} min={10} max={60} step={5}
                    fmt={v => `${v}%`} onChange={setTruckElim} />
                  <Slider label="Cost per truck roll" value={truckCost} min={200} max={1000} step={50}
                    fmt={fmtUSD} onChange={setTruckCost}
                    hint={`$${(sites * trucks * (truckElim/100) * truckCost / 1000).toFixed(0)}K annual truck roll savings`} />

                  <SectionHead mt={20}>Demand response</SectionHead>
                  <Slider label="Sites eligible for demand response programs" value={drPct} min={10} max={90} step={5}
                    fmt={v => `${v}%`} onChange={setDrPct} />
                  <Slider label="Avg annual demand response revenue per site" value={drPerSite} min={200} max={10000} step={100}
                    fmt={fmtUSD} onChange={setDrPerSite}
                    hint={`${fmtUSD(sites * (drPct/100) * drPerSite)} total portfolio demand response`} />

                  <SectionHead mt={20}>Utility incentives and capital deferral</SectionHead>
                  <Slider label="Utility incentive as a share of hardware cost" value={utilPct} min={0} max={25} step={1}
                    fmt={v => `${v}%`} onChange={setUtilPct}
                    hint={`${fmtUSD(r.hwCost * utilPct / 100)} one-time incentive (amortized 5 yrs in annual value)`} />
                  <Slider label="Rooftop units per site" value={rtuPerSite} min={1} max={20} step={1}
                    fmt={v => `${v} RTUs`} onChange={setRtuPerSite} />
                  <Slider label="Avg RTU replacement cost" value={rtuCost} min={8000} max={30000} step={500}
                    fmt={fmtUSD} onChange={setRtuCost}
                    hint={`${fmtUSD(sites * rtuPerSite * rtuCost)} total capital deferred`} />
                </div>
              )}
            </div>

            {/* Segment context */}
            <div style={{ ...cardStyle, padding: '18px 20px', background: C.cardAlt }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                Segment context
              </div>
              <div style={{ fontSize: 12, color: C.textMid, lineHeight: 1.65 }}>{vert.context}</div>
            </div>
          </div>

          {/* RIGHT: Results */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Total value headline */}
            <div style={{ ...cardStyle, padding: '24px 28px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
                Total estimated annual value
              </div>
              <div style={{ fontSize: 48, fontWeight: 800, color: C.green, lineHeight: 1, marginBottom: 6, letterSpacing: '-1px' }}>
                {fmtUSD(r.totalAnnualValue)}
              </div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>
                per year across {fmtN(sites)} sites with {fmtN(r.totalCtrl)} Freedom controllers
              </div>

              {/* CFO metrics row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                <MetricCard
                  label="Simple payback"
                  value={fmtMo(r.paybackMo)}
                  sub={r.paybackMo < 36 ? 'Under threshold' : r.paybackMo < 48 ? 'Acceptable' : 'Above target'}
                  color={r.paybackMo < 36 ? C.green : r.paybackMo < 48 ? C.amber : C.red}
                  border={r.paybackMo < 36 ? C.green : undefined} />
                <MetricCard
                  label="3-Year ROI"
                  value={fmtPct(r.roi3)}
                  sub="net of all costs"
                  color={r.roi3 > 20 ? C.green : r.roi3 > 0 ? C.amber : C.red}
                  border={r.roi3 > 20 ? C.green : undefined} />
                <MetricCard
                  label="IRR (10-year)"
                  value={fmtIRR(r.irr)}
                  sub={r.irr && r.irr > 20 ? 'Exceeds 20% hurdle' : 'Below 20% hurdle'}
                  color={r.irr && r.irr > 20 ? C.green : C.amber}
                  border={r.irr && r.irr > 20 ? C.green : undefined} />
                <MetricCard
                  label="NPV (10yr / 8%)"
                  value={r.npv10 > 0 ? fmtUSD(r.npv10) : 'Negative'}
                  sub={r.npv10 > 0 ? 'Proceed' : 'Adjust inputs'}
                  color={r.npv10 > 0 ? C.green : C.red}
                  border={r.npv10 > 0 ? C.green : undefined} />
                <MetricCard
                  label="Year 1 op. CF"
                  value={r.year1CF > 0 ? fmtUSD(r.year1CF) : 'Negative'}
                  sub="Savings minus subscription"
                  color={r.year1CF > 0 ? C.green : C.red}
                  border={r.year1CF > 0 ? C.green : undefined} />
              </div>

              {/* CFO threshold checklist */}
              <div style={{ marginTop: 14, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {[
                  { label: 'Payback under 36 months',     pass: r.paybackMo < 36 },
                  { label: 'Annualized ROI above 20%',    pass: r.roi3 > 20 },
                  { label: 'IRR above 20%',               pass: r.irr && r.irr > 20 },
                  { label: 'NPV positive',                pass: r.npv10 > 0 },
                  { label: 'Year 1 operating CF positive',pass: r.year1CF > 0 },
                ].map((m, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.muted }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                      background: m.pass ? C.greenLt : C.redLt,
                      border: `1.5px solid ${m.pass ? C.green : C.red}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {m.pass
                        ? <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3l2 2 4-4" stroke={C.green} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        : <svg width="6" height="6" viewBox="0 0 6 6" fill="none"><path d="M1 1l4 4M5 1L1 5" stroke={C.red} strokeWidth="1.5" strokeLinecap="round"/></svg>
                      }
                    </div>
                    {m.label}
                  </div>
                ))}
              </div>
            </div>

            {/* 7 value buckets */}
            <div style={{ ...cardStyle, padding: '24px 28px' }}>
              <SectionHead>Seven-bucket value analysis</SectionHead>
              {[
                { label: 'Energy Savings',              value: r.energySavings,       note: `${hvac}% HVAC load x ${savings}% reduction across ${fmtN(sites)} sites` },
                { label: 'Maintenance Savings',         value: r.maintSavings,        note: `${maintPct}% reduction on avg ${fmtUSD(maint)}/site maintenance budget` },
                { label: 'Truck Roll Reduction',        value: r.truckSavings,        note: `${truckElim}% of ${trucks} rolls/site eliminated at ${fmtUSD(truckCost)}/roll` },
                { label: 'Demand Response Revenue',     value: r.drRevenue,           note: `${drPct}% of sites eligible, avg ${fmtUSD(drPerSite)}/site/yr` },
                { label: 'Utility Incentives',          value: r.utilIncentiveAnn,    note: `${utilPct}% of hardware cost amortized over 5 years` },
                { label: 'Deferred Capital Replacement',value: r.deferredAnnBenefit,  note: `${fmtUSD(r.totalDeferredCapex)} total RTU capex deferred` },
                { label: 'ESG / Compliance',            value: null,                  note: 'Scope 1 and 2 tracking, CDP, GRESB, Energy Star Portfolio Manager — auditable data without additional instrumentation' },
              ].map((b, i) => {
                const maxVal = Math.max(r.energySavings, r.maintSavings, r.truckSavings, r.drRevenue, r.utilIncentiveAnn, r.deferredAnnBenefit);
                const highlighted = selectedBuckets.has(b.label);
                return b.value !== null ? (
                  <BucketRow key={i} label={b.label} value={fmtUSD(b.value)}
                    pct={maxVal > 0 ? (b.value / maxVal) * 100 : 0} highlight={highlighted} />
                ) : (
                  <div key={i} style={{ padding: '10px 0', borderBottom: `1px solid ${C.divider}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: highlighted ? 600 : 400, color: highlighted ? C.primary : C.text }}>{b.label}</div>
                        <div style={{ fontSize: 11, color: C.muted, marginTop: 3, lineHeight: 1.5 }}>{b.note}</div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: C.primary, background: C.primaryLt, borderRadius: 100, padding: '3px 10px', whiteSpace: 'nowrap' }}>
                        Strategic
                      </span>
                    </div>
                  </div>
                );
              })}
              <div style={{ marginTop: 16, padding: '12px 16px', background: C.greenLt, border: `1px solid ${C.green}30`, borderRadius: 10, fontSize: 12, color: C.green, lineHeight: 1.6 }}>
                Energy savings typically represent 40 to 60 percent of total project value. The remaining value comes from operational savings, capital deferral, demand response, and compliance capability that standard energy audits do not capture.
              </div>
            </div>

            {/* Investment summary */}
            <div style={{ ...cardStyle, padding: '24px 28px' }}>
              <SectionHead>Investment summary</SectionHead>
              {[
                { label: 'Hardware investment',          val: fmtUSD(r.hwCost),     note: `${fmtN(r.totalCtrl)} controllers x ${fmtUSD(ctrlPrice)} avg mix price` },
                { label: 'Annual subscription + platform',val: fmtUSD(r.annualSub), note: `${subTierLabel(r.totalCtrl)} plus $500/yr enterprise software` },
                { label: 'One-time utility incentives',  val: fmtUSD(r.utilIncentive), note: `${utilPct}% of hardware cost — reduces net investment` },
                { label: 'Net annual benefit',           val: fmtUSD(r.netBenefit), note: 'Total annual value minus subscription cost', green: r.netBenefit > 0 },
              ].map((row, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  padding: '11px 14px', marginBottom: 8,
                  background: row.green ? C.greenLt : C.divider,
                  border: `1px solid ${row.green ? C.green + '40' : C.border}`,
                  borderRadius: 8,
                }}>
                  <div>
                    <div style={{ fontSize: 13, color: row.green ? C.green : C.text, fontWeight: row.green ? 700 : 400 }}>{row.label}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{row.note}</div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: row.green ? C.green : C.text, whiteSpace: 'nowrap', marginLeft: 16 }}>{row.val}</div>
                </div>
              ))}
            </div>

            {/* Email gate */}
            {!unlocked ? (
              <div style={{ ...cardStyle, padding: '28px', border: `1px solid ${C.primary}40` }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6 }}>
                  Get the full financial analysis
                </div>
                <p style={{ fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 1.6 }}>
                  Enter your information to unlock the year-by-year cash flow model, pilot program estimate, and the complete seven-bucket breakdown formatted for executive review.
                </p>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <input type="text" placeholder="Your name" value={name}
                      onChange={e => setName(e.target.value)} style={inputStyle} />
                    <input type="text" placeholder="Company name" value={company}
                      onChange={e => setCompany(e.target.value)} style={inputStyle} />
                  </div>
                  <input type="email" placeholder="Work email address" value={email}
                    onChange={e => setEmail(e.target.value)} style={inputStyle} />
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginTop: 4 }}>
                    <input type="checkbox" checked={optIn} onChange={e => setOptIn(e.target.checked)}
                      style={{ marginTop: 3, accentColor: C.primary, width: 16, height: 16, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: C.muted, lineHeight: 1.55 }}>
                      I agree to receive my full analysis and periodic energy management updates from NexRev. I can unsubscribe at any time.
                    </span>
                  </label>
                  {formErr && (
                    <div style={{ fontSize: 12, color: C.red, padding: '8px 12px', background: C.redLt, borderRadius: 8 }}>
                      {formErr}
                    </div>
                  )}
                  <button type="submit" style={{
                    background: C.primary, border: 'none', borderRadius: 10,
                    padding: '14px 20px', color: '#fff', fontSize: 15,
                    fontWeight: 700, cursor: 'pointer', marginTop: 4,
                    boxShadow: `0 4px 14px rgba(37,99,235,0.3)`,
                  }}>
                    Unlock Full Analysis
                  </button>
                </form>
              </div>
            ) : (
              <div style={{ ...cardStyle, padding: '14px 20px', background: C.greenLt, border: `1px solid ${C.green}50` }}>
                <span style={{ fontSize: 14, color: C.green, fontWeight: 700 }}>
                  Analysis unlocked for {name} at {company}.
                </span>
              </div>
            )}

            {/* Full report — unlocked */}
            {unlocked && (
              <>
                {/* Year-by-year table */}
                <div style={{ ...cardStyle, overflow: 'hidden' }}>
                  <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Cumulative financial model</div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Year-by-year total value vs. full cost of ownership (hardware + subscription)</div>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: C.divider }}>
                        {['Period', 'Annual value', 'Cumulative costs', 'Net position'].map(h => (
                          <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left', borderBottom: `1px solid ${C.border}` }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {r.cumulative.map((row) => {
                        const isBE = row.yr === breakevenYr && row.yr > 0;
                        const pos  = row.cumNet >= 0;
                        return (
                          <tr key={row.yr} style={{ background: isBE ? C.greenLt : 'transparent' }}>
                            <td style={{ padding: '10px 16px', fontSize: 13, borderBottom: `1px solid ${C.divider}`, fontWeight: isBE ? 700 : 400 }}>
                              {row.yr === 0 ? 'Deployment' : `Year ${row.yr}`}
                              {isBE && (
                                <span style={{ marginLeft: 8, fontSize: 10, color: C.green, fontWeight: 700, background: 'white', border: `1px solid ${C.green}50`, borderRadius: 100, padding: '1px 8px' }}>
                                  Breakeven
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '10px 16px', fontSize: 13, borderBottom: `1px solid ${C.divider}`, color: C.green }}>
                              {row.yr === 0 ? 'Deployment' : fmtUSD(row.annValue)}
                            </td>
                            <td style={{ padding: '10px 16px', fontSize: 13, borderBottom: `1px solid ${C.divider}`, color: C.muted }}>
                              {fmtUSD(row.cumCosts)}
                            </td>
                            <td style={{ padding: '10px 16px', fontSize: 13, borderBottom: `1px solid ${C.divider}`, fontWeight: 700, color: pos && row.yr > 0 ? C.green : C.red }}>
                              {pos && row.yr > 0 ? '+' : ''}{fmtUSD(row.cumNet)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {breakevenYr > 0 && (
                    <div style={{ padding: '10px 20px', background: C.greenLt, fontSize: 12, color: C.green, borderTop: `1px solid ${C.border}` }}>
                      Portfolio breakeven in Year {breakevenYr}. Hardware recovery in {fmtMo(r.paybackMo)}.
                    </div>
                  )}
                </div>

                {/* Pilot estimate */}
                <div style={{ ...cardStyle, padding: '24px 28px' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>Pilot program estimate</div>
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>
                    {r.pilotN} sites, 70% hardware discount, 120-day validation. NexRev installs in 2 to 4 hours per site — no IT, no cable pulls, no downtime.
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    {[
                      { label: 'Hardware at 70% off',     val: fmtUSD(r.pilotHW) },
                      { label: 'Subscription (4 months)', val: fmtUSD(r.pilotSub4mo) },
                      { label: 'Total pilot investment',  val: fmtUSD(r.pilotTotal) },
                    ].map((item, i) => (
                      <div key={i} style={{
                        ...cardStyle,
                        padding: 16,
                        background: i === 2 ? C.primaryLt : C.divider,
                        border: `1px solid ${i === 2 ? C.primary + '40' : C.border}`,
                      }}>
                        <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>{item.label}</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: i === 2 ? C.primary : C.text }}>{item.val}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 14, padding: 14, background: C.cardAlt, border: `1px solid ${C.primaryLt}`, borderRadius: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.primary, marginBottom: 4 }}>
                      Projected pilot annual value: {fmtUSD(r.pilotAnnValue)}
                    </div>
                    <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
                      A successful pilot produces AI-verified savings data that converts to a full deployment proposal. The conversion clause credits pilot hardware against the full rollout invoice.
                    </div>
                  </div>
                </div>

                {/* Tagline */}
                <div style={{ ...cardStyle, padding: '24px 28px', background: C.nav, border: 'none' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.55 }}>
                    This is an operating expense reduction, capital preservation, risk reduction, and ESG reporting platform that happens to save energy.
                  </div>
                </div>

                {/* CTA */}
                <div style={{ ...cardStyle, padding: '28px' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6 }}>
                    Ready to validate these numbers at your specific locations?
                  </div>
                  <div style={{ fontSize: 13, color: C.muted, marginBottom: 24, lineHeight: 1.6 }}>
                    NexRev Freedom EMS installs in 2 to 4 hours per site with no IT network, no cable pulls, and no operational downtime. A 15-site pilot produces real, AI-verified data your CFO can act on — and establishes the baseline for a full rollout proposal.
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <a
                      href="mailto:info@nexrev.com?subject=ROI Calculator Inquiry"
                      style={{
                        flex: 1, display: 'block', textAlign: 'center',
                        background: C.primary, borderRadius: 10,
                        padding: '14px 20px', color: '#fff',
                        fontSize: 14, fontWeight: 700, textDecoration: 'none',
                        boxShadow: `0 4px 14px rgba(37,99,235,0.25)`,
                      }}
                    >
                      Request More Information
                    </a>
                    <a
                      href="https://calendly.com/nexrev/discovery"
                      style={{
                        flex: 1, display: 'block', textAlign: 'center',
                        background: C.card, border: `2px solid ${C.primary}`,
                        borderRadius: 10, padding: '14px 20px',
                        color: C.primary, fontSize: 14, fontWeight: 700,
                        textDecoration: 'none',
                      }}
                    >
                      Schedule a Call
                    </a>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: '20px 24px', textAlign: 'center', background: C.card }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
          <strong style={{ color: C.text }}>NexRev</strong> Freedom EMS + NexiAI &nbsp;|&nbsp; {new Date().getFullYear()}<br />
          All projections are estimates based on representative industry data and the inputs above. Actual results depend on facility type, existing controls, utility rates, and operational patterns. Contact NexRev for a site-specific assessment.
        </div>
      </footer>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [step,  setStep]  = useState(0);
  const [state, setState] = useState({ pains: [], vertIdx: 0 });

  if (step === 0) {
    return (
      <PainPointScreen
        onProceed={({ pains, vertIdx }) => {
          setState({ pains, vertIdx });
          setStep(1);
        }}
      />
    );
  }
  return (
    <CalculatorScreen
      pains={state.pains}
      vertIdx={state.vertIdx}
      onBack={() => setStep(0)}
    />
  );
}
