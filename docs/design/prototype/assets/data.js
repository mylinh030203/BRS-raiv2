/* Synthetic demo data for the BSR Market Intelligence design prototype. */
(function () {
  const DAY = 86400000;
  const end = new Date('2026-11-17T11:30:00+07:00');

  function buildTrajectory(anchors, n, vol, seed, finalValue, isInteger) {
    const out = [];
    for (let i = n - 1; i >= 0; i--) {
      const daysAgo = i;
      let target = anchors[0][1];
      for (let j = 0; j < anchors.length - 1; j++) {
        const a1 = anchors[j];
        const a2 = anchors[j + 1];
        if (daysAgo <= a1[0] && daysAgo >= a2[0]) {
          const ratio = (daysAgo - a2[0]) / (a1[0] - a2[0] || 1);
          target = a2[1] + ratio * (a1[1] - a2[1]);
          break;
        }
      }
      if (daysAgo === 0) {
        target = finalValue;
      } else {
        const noise = (Math.sin((i + seed) * 1.31) * 0.6 + Math.cos((i + seed * 2.1) * 0.43) * 0.4) * vol;
        target = target + noise;
      }
      const val = isInteger ? Math.round(target) : Math.round(target * 100) / 100;
      out.push({
        date: new Date(end.getTime() - daysAgo * DAY),
        value: val
      });
    }
    out[out.length - 1].value = finalValue;
    return out;
  }

  const brentSeries = buildTrajectory([
    [365, 82.50], [180, 84.00], [90, 85.50], [60, 88.00], [30, 106.07],
    [18, 117.64], [15, 104.77], [11, 98.32], [6, 92.76], [2, 91.80], [1, 91.33], [0, 92.45]
  ], 365, 0.45, 3, 92.45);

  const wtiSeries = buildTrajectory([
    [365, 76.20], [180, 77.50], [90, 78.50], [60, 81.20], [30, 98.40],
    [18, 109.80], [15, 97.50], [11, 91.20], [6, 85.10], [2, 84.10], [1, 83.75], [0, 84.60]
  ], 365, 0.40, 7, 84.60);

  const brentPhysSeries = buildTrajectory([
    [365, 80.00], [180, 81.50], [90, 82.50], [30, 95.00], [18, 104.50],
    [15, 92.00], [11, 85.00], [6, 78.50], [1, 77.10], [0, 77.90]
  ], 365, 0.35, 11, 77.90);

  const ron95Series = buildTrajectory([
    [365, 94.00], [180, 96.00], [90, 98.50], [30, 118.00], [18, 132.50],
    [15, 120.00], [11, 112.50], [6, 96.80], [1, 92.55], [0, 92.10]
  ], 365, 0.50, 15, 92.10);

  const dieselSeries = buildTrajectory([
    [365, 98.00], [180, 100.00], [90, 102.00], [30, 122.00], [18, 136.50],
    [15, 124.00], [11, 116.00], [6, 101.50], [1, 96.10], [0, 96.40]
  ], 365, 0.45, 19, 96.40);

  const jetSeries = buildTrajectory([
    [365, 99.00], [180, 101.50], [90, 104.00], [30, 124.00], [18, 138.00],
    [15, 126.00], [11, 118.00], [6, 104.00], [1, 98.65], [0, 99.20]
  ], 365, 0.45, 23, 99.20);

  const foSeries = buildTrajectory([
    [365, 65.00], [180, 67.00], [90, 69.00], [30, 76.00], [18, 82.50],
    [15, 77.00], [11, 73.00], [6, 70.00], [1, 68.50], [0, 68.30]
  ], 365, 0.30, 27, 68.30);

  const usdvndSeries = buildTrajectory([
    [365, 24850], [180, 25400], [90, 26050], [30, 25850], [15, 25580],
    [6, 25620], [1, 25639], [0, 25652]
  ], 365, 15, 31, 25652, true);

  const dxySeries = buildTrajectory([
    [365, 104.20], [180, 101.50], [90, 99.80], [30, 101.80], [15, 102.80],
    [6, 103.30], [1, 103.49], [0, 103.65]
  ], 365, 0.12, 35, 103.65);

  const crackGasSeries = buildTrajectory([
    [365, 14.50], [180, 15.20], [90, 16.20], [30, 17.50], [18, 19.80],
    [15, 18.90], [11, 18.20], [6, 17.80], [1, 17.73], [0, 18.35]
  ], 365, 0.25, 39, 18.35);

  const crackDslSeries = buildTrajectory([
    [365, 18.50], [180, 19.20], [90, 20.00], [30, 22.50], [18, 24.80],
    [15, 23.50], [11, 22.20], [6, 21.50], [1, 21.34], [0, 21.10]
  ], 365, 0.25, 43, 21.10);

  const crack321Series = buildTrajectory([
    [365, 16.00], [180, 16.80], [90, 17.80], [30, 19.20], [18, 21.50],
    [15, 20.40], [11, 19.50], [6, 19.00], [1, 18.99], [0, 19.40]
  ], 365, 0.25, 47, 19.40);

  const bsrMarginSeries = buildTrajectory([
    [365, 7.10], [180, 7.30], [90, 7.50], [30, 8.50], [18, 9.80],
    [15, 9.10], [11, 8.50], [6, 8.00], [1, 8.06], [0, 8.24]
  ], 365, 0.15, 51, 8.24);

  const instruments = [
    {
      id: 'brent_futures', name: 'Brent Crude Futures', short: 'Brent', group: 'Crude oil', ticker: 'BRN',
      value: 92.45, unit: 'USD/bbl', priceType: 'Futures', source: 'ICE (demo)', sourceId: 'SRC-ICE',
      marketTime: '17 Nov 2026 · 11:30 ICT', ingestionTime: '17 Nov 2026 · 11:32 ICT',
      dataStatus: 'Real-time', quality: 'Valid', classification: 'Internal', decimals: 2,
      change: 1.12, pct: 1.23, spark: brentSeries.slice(-40), series: brentSeries,
      description: 'Front-month Brent futures, ICE. Live benchmark feed.'
    },
    {
      id: 'wti_futures', name: 'WTI Crude Futures', short: 'WTI', group: 'Crude oil', ticker: 'CL',
      value: 84.60, unit: 'USD/bbl', priceType: 'Futures', source: 'CME (demo)', sourceId: 'SRC-CME',
      marketTime: '17 Nov 2026 · 11:28 ICT', ingestionTime: '17 Nov 2026 · 11:30 ICT',
      dataStatus: 'Real-time', quality: 'Valid', classification: 'Internal', decimals: 2,
      change: 0.85, pct: 1.02, spark: wtiSeries.slice(-40), series: wtiSeries,
      description: 'Front-month WTI futures, CME. Live benchmark feed.'
    },
    {
      id: 'brent_physical', name: 'Brent Physical Dated', short: 'Brent Dated', group: 'Crude oil', ticker: 'BRD',
      value: 77.9, unit: 'USD/bbl', priceType: 'Physical', source: 'Platts (demo)', sourceId: 'SRC-PLATTS',
      marketTime: '13 Nov 2026 · 18:30 ICT', ingestionTime: '14 Nov 2026 · 07:05 ICT',
      dataStatus: 'End-of-day', quality: 'Valid', classification: 'Restricted', decimals: 2,
      change: 0.8, pct: 1.04, spark: brentPhysSeries.slice(-40), series: brentPhysSeries,
      description: 'Dated Brent physical assessment. Restricted commercial data.'
    },
    {
      id: 'ron95', name: 'Gasoline RON95 (FOB Singapore)', short: 'RON95', group: 'Refined products', ticker: 'RON95',
      value: 92.1, unit: 'USD/bbl', priceType: 'Physical', source: 'Platts (demo)', sourceId: 'SRC-PLATTS',
      marketTime: '13 Nov 2026 · 18:30 ICT', ingestionTime: '14 Nov 2026 · 07:05 ICT',
      dataStatus: 'End-of-day', quality: 'Valid', classification: 'Internal', decimals: 2,
      change: -0.45, pct: -0.49, spark: ron95Series.slice(-40), series: ron95Series,
      description: 'Gasoline RON95 FOB Singapore assessment used for crack reference.'
    },
    {
      id: 'diesel', name: 'Diesel 10ppm (FOB Singapore)', short: 'Diesel', group: 'Refined products', ticker: 'DIESEL',
      value: 96.4, unit: 'USD/bbl', priceType: 'Physical', source: 'Platts (demo)', sourceId: 'SRC-PLATTS',
      marketTime: '13 Nov 2026 · 18:30 ICT', ingestionTime: '14 Nov 2026 · 07:05 ICT',
      dataStatus: 'End-of-day', quality: 'Valid', classification: 'Internal', decimals: 2,
      change: 0.3, pct: 0.31, spark: dieselSeries.slice(-40), series: dieselSeries,
      description: 'Diesel 10ppm FOB Singapore assessment.'
    },
    {
      id: 'jet', name: 'Jet Fuel A-1 (FOB Singapore)', short: 'Jet A-1', group: 'Refined products', ticker: 'JET',
      value: 99.2, unit: 'USD/bbl', priceType: 'Physical', source: 'Platts (demo)', sourceId: 'SRC-PLATTS',
      marketTime: '13 Nov 2026 · 18:30 ICT', ingestionTime: '14 Nov 2026 · 07:05 ICT',
      dataStatus: 'End-of-day', quality: 'Valid', classification: 'Internal', decimals: 2,
      change: 0.55, pct: 0.56, spark: jetSeries.slice(-40), series: jetSeries,
      description: 'Jet Fuel A-1 FOB Singapore assessment.'
    },
    {
      id: 'fuel_oil', name: 'Fuel Oil 180 CST (FOB Singapore)', short: 'Fuel oil', group: 'Refined products', ticker: 'FO180',
      value: 68.3, unit: 'USD/bbl', priceType: 'Physical', source: 'Platts (demo)', sourceId: 'SRC-PLATTS',
      marketTime: '13 Nov 2026 · 18:30 ICT', ingestionTime: '14 Nov 2026 · 07:05 ICT',
      dataStatus: 'End-of-day', quality: 'Pending', classification: 'Internal', decimals: 2,
      change: -0.2, pct: -0.29, spark: foSeries.slice(-40), series: foSeries,
      description: 'Fuel oil 180 CST FOB Singapore. Quality check pending.'
    },
    {
      id: 'usd_vnd', name: 'USD/VND', short: 'USD/VND', group: 'FX & macro', ticker: 'USDVND',
      value: 25652, unit: 'VND', priceType: 'Index', source: 'SBV (demo)', sourceId: 'SRC-SBV',
      marketTime: '17 Nov 2026 · 11:00 ICT', ingestionTime: '17 Nov 2026 · 11:02 ICT',
      dataStatus: 'Delayed', quality: 'Valid', classification: 'Internal', decimals: 0,
      change: 13, pct: 0.05, spark: usdvndSeries.slice(-40), series: usdvndSeries,
      description: 'State Bank of Vietnam reference central rate. Live public feed.'
    },
    {
      id: 'dxy', name: 'US Dollar Index', short: 'DXY', group: 'FX & macro', ticker: 'DXY',
      value: 103.65, unit: 'index', priceType: 'Index', source: 'ICE (demo)', sourceId: 'SRC-ICE',
      marketTime: '17 Nov 2026 · 11:20 ICT', ingestionTime: '17 Nov 2026 · 11:22 ICT',
      dataStatus: 'Delayed', quality: 'Valid', classification: 'Internal', decimals: 2,
      change: 0.16, pct: 0.15, spark: dxySeries.slice(-40), series: dxySeries,
      description: 'US Dollar Index, delayed market feed.'
    },
    {
      id: 'crack_gasoline', name: 'Gasoline Crack Spread', short: 'Gasoline crack', group: 'Crack spreads', ticker: 'CS-GAS',
      value: 18.35, unit: 'USD/bbl', priceType: 'Calculated', source: 'BSR Analytical', sourceId: 'SRC-BSR-AN',
      marketTime: '13 Nov 2026 · 18:30 ICT', ingestionTime: '14 Nov 2026 · 07:06 ICT',
      dataStatus: 'End-of-day', quality: 'Valid', classification: 'Internal', decimals: 2,
      change: 0.62, pct: 3.5, spark: crackGasSeries.slice(-40), series: crackGasSeries,
      description: 'Gasoline crack versus Brent futures. Formula CS-GAS-2.1, no price-type mixing.',
      formula: { id: 'CS-GAS-2.1', inputs: ['RON95 (FOB Singapore)', 'Brent Crude Futures'], rule: 'RON95 physical − Brent futures. Converted to USD/bbl.' }
    },
    {
      id: 'crack_diesel', name: 'Diesel Crack Spread', short: 'Diesel crack', group: 'Crack spreads', ticker: 'CS-DSL',
      value: 21.1, unit: 'USD/bbl', priceType: 'Calculated', source: 'BSR Analytical', sourceId: 'SRC-BSR-AN',
      marketTime: '13 Nov 2026 · 18:30 ICT', ingestionTime: '14 Nov 2026 · 07:06 ICT',
      dataStatus: 'End-of-day', quality: 'Valid', classification: 'Internal', decimals: 2,
      change: -0.24, pct: -1.12, spark: crackDslSeries.slice(-40), series: crackDslSeries,
      description: 'Diesel crack versus Brent futures. Formula CS-DSL-2.0.',
      formula: { id: 'CS-DSL-2.0', inputs: ['Diesel 10ppm (FOB Singapore)', 'Brent Crude Futures'], rule: 'Diesel physical − Brent futures. Converted to USD/bbl.' }
    },
    {
      id: 'crack_321', name: '3-2-1 Composite Crack', short: '3-2-1 crack', group: 'Crack spreads', ticker: 'CS-321',
      value: 19.4, unit: 'USD/bbl', priceType: 'Calculated', source: 'BSR Analytical', sourceId: 'SRC-BSR-AN',
      marketTime: '13 Nov 2026 · 18:30 ICT', ingestionTime: '14 Nov 2026 · 07:06 ICT',
      dataStatus: 'End-of-day', quality: 'Valid', classification: 'Internal', decimals: 2,
      change: 0.41, pct: 2.16, spark: crack321Series.slice(-40), series: crack321Series,
      description: 'Illustrative 3-2-1 composite using two gasoline barrels and one diesel barrel against three crude barrels.',
      formula: { id: 'CS-321-1.3', inputs: ['RON95', 'Diesel', 'Brent futures'], rule: '(2 × gasoline + 1 × diesel − 3 × Brent) / 3. Demo formula.' }
    },
    {
      id: 'bsr_margin', name: 'BSR Indicative Refining Margin', short: 'BSR margin', group: 'Refinery operations', ticker: 'BSR-M',
      value: 8.24, unit: 'USD/bbl', priceType: 'Calculated', source: 'BSR Internal', sourceId: 'SRC-BSR-IN',
      marketTime: '13 Nov 2026 · 17:00 ICT', ingestionTime: '13 Nov 2026 · 17:04 ICT',
      dataStatus: 'Manual', quality: 'Valid', classification: 'Confidential', decimals: 2,
      change: 0.34, pct: 4.3, spark: bsrMarginSeries.slice(-40), series: bsrMarginSeries,
      description: 'Indicative internal refining margin. Confidential; illustrative only.'
    }
  ];

  const events = [
    { date: '2026-10-06', title: 'OPEC+ agrees November output path', type: 'Policy', instruments: ['brent_futures', 'wti_futures'], source: 'Reuters (demo)' },
    { date: '2026-10-19', title: 'Red Sea freight disruption widens', type: 'Logistics', instruments: ['brent_futures', 'diesel'], source: 'Platts (demo)' },
    { date: '2026-11-03', title: 'Dung Quat unit maintenance begins', type: 'Refining', instruments: ['crack_gasoline', 'bsr_margin'], source: 'BSR Internal' },
    { date: '2026-11-11', title: 'US crude inventories fall more than expected', type: 'Inventory', instruments: ['wti_futures', 'brent_futures'], source: 'EIA (demo)' }
  ];

  const drivers = [
    { group: 'Supply', label: 'OPEC+ discipline', detail: 'Voluntary cuts extended through Q4; compliance signal firming.', direction: 'tightening', strength: 82 },
    { group: 'Supply', label: 'Middle East risk', detail: 'Shipping insurance costs elevated along the Gulf routes.', direction: 'tightening', strength: 68 },
    { group: 'Demand', label: 'Asia gasoline demand', detail: 'Regional cracks supported by resilient mobility demand.', direction: 'firming', strength: 61 },
    { group: 'Demand', label: 'Industrial diesel demand', detail: 'Soft manufacturing prints cap upside in middle distillates.', direction: 'softening', strength: 47 },
    { group: 'Logistics', label: 'Freight & insurance', detail: 'Red Sea diversions keep product arb windows uneven.', direction: 'tightening', strength: 57 },
    { group: 'Macro', label: 'USD / VND', detail: 'State Bank central rate steady at 25,652 VND reduces imported-cost volatility.', direction: 'neutral', strength: 36 }
  ];

  const highlights = [
    { title: 'Brent holds above $92 as supply risk offsets demand caution', meta: 'Reuters · 17 Nov 2026, 11:10 ICT', topics: ['Crude supply', 'Geopolitics'], source: 'Reuters (demo)', published: '17/11/2026 · 11:10 ICT', type: 'Source fact' },
    { title: 'Gasoline crack widens on stronger Asian blending demand', meta: 'Platts · 13 Nov 2026, 19:05 ICT', topics: ['Refined products', 'Asia demand'], source: 'Platts (demo)', published: '13/11/2026 · 19:05 ICT', type: 'Source fact' },
    { title: 'AI read: product cracks are doing more work than crude direction', meta: 'AI interpretation · 17 Nov 2026, 11:15 ICT', topics: ['Cross-market'], source: 'Market data + cited news', published: '17/11/2026 · 11:15 ICT', basis: 'Deterministic prices + Reuters/Platts reporting', type: 'AI interpretation' }
  ];

  const news = [
    {
      id: 'N-2411', title: 'OPEC+ signals patience on output as Brent tests $92', source: 'Reuters (demo)', published: '17 Nov 2026 · 10:50 ICT', ingested: '17 Nov 2026 · 11:02 ICT',
      topics: ['OPEC+', 'Crude supply'], entities: ['OPEC+', 'Brent'], classification: 'Internal', status: 'Processed', relevance: 94,
      summary: 'Delegates indicated the group is unlikely to accelerate unwinding voluntary cuts before the next ministerial meeting, keeping near-term supply expectations tight.',
      original: 'Sourced reporting placeholder for the prototype. The original article remains accessible from the licensed provider in production.',
      insight: 'AI interpretation: the signal supports the front of the Brent curve, but the market reaction is modest because the decision was partly expected.',
      linked: ['brent_futures', 'wti_futures'], duplicateOf: null, coverage: '3 sources · 2 unique details'
    },
    {
      id: 'N-2410', title: 'Red Sea diversions add a week to Gulf–Asia product voyages', source: 'Platts (demo)', published: '14 Nov 2026 · 06:40 ICT', ingested: '14 Nov 2026 · 06:58 ICT',
      topics: ['Shipping & freight', 'Refined products'], entities: ['Red Sea', 'Singapore'], classification: 'Internal', status: 'Processed', relevance: 88,
      summary: 'Freight assessments for Gulf–Asia routes rose again as operators extended diversions, tightening effective product availability in the east.',
      original: 'Sourced reporting placeholder for the prototype.',
      insight: 'AI interpretation: the freight move is more material for product arb economics than for absolute crude direction.',
      linked: ['diesel', 'jet'], duplicateOf: null, coverage: '4 sources · 3 unique details'
    },
    {
      id: 'N-2409', title: 'US crude inventories fall more than expected: EIA', source: 'EIA (demo)', published: '13 Nov 2026 · 22:30 ICT', ingested: '13 Nov 2026 · 22:41 ICT',
      topics: ['Inventory', 'Crude demand'], entities: ['United States', 'WTI'], classification: 'Public', status: 'Processed', relevance: 76,
      summary: 'Commercial crude stocks declined while gasoline inventories built modestly, a mixed signal for the crude–product complex.',
      original: 'Sourced reporting placeholder for the prototype.',
      insight: 'AI interpretation: crude draws support flat price, but the product build limits the read-through to cracks.',
      linked: ['wti_futures', 'crack_gasoline'], duplicateOf: null, coverage: '2 sources · 1 unique detail'
    },
    {
      id: 'N-2408', title: 'Dung Quat begins planned maintenance on CDU', source: 'BSR Internal', published: '13 Nov 2026 · 16:20 ICT', ingested: '13 Nov 2026 · 16:25 ICT',
      topics: ['Refining operations'], entities: ['Dung Quat', 'BSR'], classification: 'Confidential', status: 'Processed', relevance: 91,
      summary: 'A planned crude distillation unit maintenance window begins, with product output and crude intake adjusted according to the internal plan.',
      original: 'Internal operations note (demo placeholder).',
      insight: 'AI interpretation: the maintenance window is already reflected in the internal plan; monitor product cracks for unintended tightening.',
      linked: ['bsr_margin', 'crack_gasoline'], duplicateOf: null, coverage: '1 source · 2 unique details'
    },
    {
      id: 'N-2407', title: 'OPEC+ keeps output path steady, delegates say', source: 'Bloomberg (demo)', published: '14 Nov 2026 · 07:58 ICT', ingested: '14 Nov 2026 · 08:06 ICT',
      topics: ['OPEC+', 'Crude supply'], entities: ['OPEC+', 'Brent'], classification: 'Internal', status: 'Duplicate candidate', relevance: 93,
      summary: 'A near-identical account of the OPEC+ signal, adding one detail on the next ministerial date.',
      original: 'Sourced reporting placeholder for the prototype.',
      insight: 'AI interpretation: duplicate candidate linked to N-2411. Adds the ministerial date, so the source is retained and linked, not removed.',
      linked: ['brent_futures'], duplicateOf: 'N-2411', coverage: 'Linked to N-2411 · 1 additive detail'
    },
    {
      id: 'N-2406', title: 'Asian refiners trim spot crude purchases for December', source: 'Reuters (demo)', published: '13 Nov 2026 · 14:10 ICT', ingested: '13 Nov 2026 · 14:23 ICT',
      topics: ['Crude demand', 'Asia demand'], entities: ['Asia', 'Brent'], classification: 'Internal', status: 'Processed', relevance: 72,
      summary: 'Several regional refiners reduced December spot requirements, pointing to softer near-term crude demand in Asia.',
      original: 'Sourced reporting placeholder for the prototype.',
      insight: 'AI interpretation: a demand-side offset to the supply narrative; keep it in the watch list rather than the base case.',
      linked: ['brent_futures', 'diesel'], duplicateOf: null, coverage: '2 sources · 1 unique detail'
    },
    {
      id: 'N-2405', title: 'Platts physical Brent assessment: dated cargoes firm', source: 'Platts (demo)', published: '13 Nov 2026 · 18:30 ICT', ingested: '14 Nov 2026 · 07:05 ICT',
      topics: ['Crude supply', 'Refining operations'], entities: ['Brent', 'North Sea'], classification: 'Restricted', status: 'Processed', relevance: 85,
      summary: 'Restricted physical assessment detail. Visible only to roles with Restricted access.',
      original: 'Licensed physical assessment placeholder.',
      insight: 'AI interpretation is withheld from unauthorized roles at retrieval time.',
      linked: ['brent_physical'], duplicateOf: null, coverage: 'Restricted source'
    }
  ];

  const forecasts = [
    { id: 'F-101', source: 'EIA (demo)', instrument: 'brent_futures', instrumentLabel: 'Brent Crude Futures', value: 79.5, period: 'Q1 2027', horizon: '3-month', published: '12 Nov 2026', ingested: '12 Nov 2026', version: 3, methodology: 'STEO baseline', classification: 'Internal', actual: 77.35, previous: 80.2 },
    { id: 'F-102', source: 'IEA (demo)', instrument: 'brent_futures', instrumentLabel: 'Brent Crude Futures', value: 77.8, period: 'Q1 2027', horizon: '3-month', published: '10 Nov 2026', ingested: '10 Nov 2026', version: 2, methodology: 'Balances + inventory model', classification: 'Internal', actual: null, previous: 78.4 },
    { id: 'F-103', source: 'Platts (demo)', instrument: 'ron95', instrumentLabel: 'Gasoline RON95', value: 93.4, period: 'Dec 2026', horizon: '1-month', published: '13 Nov 2026', ingested: '13 Nov 2026', version: 4, methodology: 'Analytics spot outlook', classification: 'Internal', actual: 91.7, previous: 92.9 },
    { id: 'F-104', source: 'BSR Internal', instrument: 'crack_gasoline', instrumentLabel: 'Gasoline Crack Spread', value: 17.9, period: 'Dec 2026', horizon: '1-month', published: '11 Nov 2026', ingested: '11 Nov 2026', version: 1, methodology: 'Demo internal scenario', classification: 'Confidential', actual: 18.35, previous: null },
    { id: 'F-105', source: 'IEA (demo)', instrument: 'wti_futures', instrumentLabel: 'WTI Crude Futures', value: 72.6, period: 'Q1 2027', horizon: '3-month', published: '10 Nov 2026', ingested: '10 Nov 2026', version: 2, methodology: 'Balances + inventory model', classification: 'Internal', actual: 73.66, previous: 73.9 },
    { id: 'F-106', source: 'EIA (demo)', instrument: 'wti_futures', instrumentLabel: 'WTI Crude Futures', value: 74.1, period: 'Q1 2027', horizon: '3-month', published: '12 Nov 2026', ingested: '12 Nov 2026', version: 3, methodology: 'STEO baseline', classification: 'Internal', actual: null, previous: 75.0 }
  ];

  const reports = [
    { id: 'R-2026-041', type: 'Morning Briefing', title: 'Morning briefing — supply risk meets product strength', range: '13–14 Nov 2026', created: '14 Nov 2026 · 09:20 ICT', cutOff: '14 Nov 2026 · 09:15 ICT', version: 2, requester: 'Lê Minh Anh', status: 'Final', classification: 'Internal', sources: ['SRC-ICE', 'SRC-PLATTS', 'SRC-NEWS-2411', 'SRC-NEWS-2410'] },
    { id: 'R-2026-040', type: 'Weekly Market Report', title: 'Week 46 — cracks carry the narrative', range: '9–15 Nov 2026', created: '13 Nov 2026 · 17:40 ICT', cutOff: '13 Nov 2026 · 17:30 ICT', version: 1, requester: 'Lê Minh Anh', status: 'Final', classification: 'Internal', sources: ['SRC-ICE', 'SRC-CME', 'SRC-PLATTS'] },
    { id: 'R-2026-039', type: 'Event-driven Analysis', title: 'Hormuz disruption — exposure and watch list', range: '1–12 Nov 2026', created: '12 Nov 2026 · 15:10 ICT', cutOff: '12 Nov 2026 · 15:00 ICT', version: 1, requester: 'Nguyễn Thu Hà', status: 'Final', classification: 'Confidential', sources: ['SRC-ICE', 'SRC-NEWS-2410', 'SRC-BSR-AN'] }
  ];

  const audit = [
    { time: '14 Nov 2026 · 09:42 ICT', actor: 'Lê Minh Anh', role: 'Leadership', action: 'AI request', object: 'AI-8F2A · market_briefing', result: 'Succeeded', classification: 'Internal' },
    { time: '14 Nov 2026 · 09:20 ICT', actor: 'Lê Minh Anh', role: 'Leadership', action: 'Report generated', object: 'R-2026-041 v2', result: 'Succeeded', classification: 'Internal' },
    { time: '14 Nov 2026 · 09:05 ICT', actor: 'Nguyễn Thu Hà', role: 'Market Intelligence', action: 'Restricted data viewed', object: 'brent_physical', result: 'Allowed', classification: 'Restricted' },
    { time: '14 Nov 2026 · 08:58 ICT', actor: 'Nguyễn Thu Hà', role: 'Market Intelligence', action: 'News uploaded', object: 'N-2411', result: 'Succeeded', classification: 'Internal' },
    { time: '14 Nov 2026 · 08:31 ICT', actor: 'Trần Quốc Bảo', role: 'Internal', action: 'Restricted data requested', object: 'brent_physical', result: 'Denied', classification: 'Restricted' },
    { time: '14 Nov 2026 · 08:02 ICT', actor: 'system', role: 'Pipeline', action: 'News processed', object: 'N-2411', result: 'Succeeded', classification: 'Internal' }
  ];

  const aiExecutions = [
    { task: 'AI-8F2A', type: 'market_briefing', model: 'demo-orchestrator/large', reasoning: 'deep', tools: 4, latency: '2.8s', cost: '$0.041', status: 'Succeeded', validation: 'Passed' },
    { task: 'AI-8F19', type: 'news_summarization', model: 'demo-orchestrator/small', reasoning: 'standard', tools: 2, latency: '1.4s', cost: '$0.008', status: 'Succeeded', validation: 'Passed' },
    { task: 'AI-8F11', type: 'chat_query', model: 'demo-orchestrator/standard', reasoning: 'standard', tools: 3, latency: '2.1s', cost: '$0.018', status: 'Fallback', validation: 'Passed' },
    { task: 'AI-8EF0', type: 'chat_query', model: 'demo-orchestrator/small', reasoning: 'simple', tools: 2, latency: '0.9s', cost: '$0.004', status: 'Succeeded', validation: 'Passed' }
  ];

  const coverage = [
    { topic: 'OPEC+ output signal', sources: ['Reuters', 'Bloomberg'], shared: 'Extension of voluntary cuts; next ministerial date', unique: 'Bloomberg adds the ministerial date; Reuters adds delegate count', articles: 2 },
    { topic: 'Red Sea freight', sources: ['Platts', 'Reuters'], shared: 'Diversions and rising insurance costs', unique: 'Platts adds Gulf–Asia freight route assessments', articles: 2 },
    { topic: 'US inventories', sources: ['EIA'], shared: 'Crude draw, gasoline build', unique: 'Weekly inventory levels and product breakdown', articles: 1 }
  ];

  const analysis = {
    question: 'What is driving the recent move in product cracks, and what should BSR watch next?',
    asOf: '14 Nov 2026 · 09:30 ICT',
    facts: [
      'Gasoline crack (CS-GAS-2.1) is $18.35/bbl, +3.5% over the last session.',
      'Brent futures are $78.42/bbl, +1.38%; WTI is $74.18/bbl, +0.71%.',
      'Red Sea freight assessments have risen for a second week.'
    ],
    calculations: [
      { label: '5-day return, Brent', value: '+2.1%', method: 'close-to-close, 5 sessions' },
      { label: '20-day realised volatility, Brent', value: '24.6%', method: 'annualised stdev of daily log returns' },
      { label: 'Brent–WTI spread', value: '$4.24/bbl', method: 'Brent futures − WTI futures' },
      { label: 'Gasoline crack change', value: '+$0.62/bbl', method: 'CS-GAS-2.1, session change' }
    ],
    assumptions: [
      'Demo series are illustrative and are not official BSR or Platts assessments.',
      'The freight signal is treated as a product-arbitrage input, not proof of crude supply loss.',
      'No restricted physical assessment is included for unauthorized roles.'
    ],
    recommendation: {
      title: 'Keep product cracks as the primary watch item; do not extrapolate a crude-supply shock from the freight move alone.',
      confidence: 'Medium',
      rationale: 'The crack move is supported by product-specific freight and Asian blending demand, while crude flat price remains range-bound. The evidence supports a watch stance, not a trading instruction.',
      watch: ['Gasoline crack vs 20-day average', 'Red Sea freight assessments', 'OPEC+ ministerial commentary', 'Dung Quat maintenance progress']
    }
  };

  window.DEMO = { meta: { asOf: '14 Nov 2026 · 09:42 ICT', freshness: 'Mixed freshness', disclaimer: 'Synthetic demo data for review. Not live BSR or licensed market data.' },
    uploadLimits: { maxBytes: 5 * 1024 * 1024, extensions: ['.csv', '.xlsx', '.pdf', '.doc', '.docx'], label: 'CSV, XLSX, PDF, DOC/DOCX' },
    roles: {
    leadership: { label: 'Leadership', label_vi: 'Ban lãnh đạo', name: 'Lê Minh Anh', initials: 'LA', maxClassification: 'Restricted', viewRestricted: true, export: false, admin: false, department: 'Executive Office', department_vi: 'Văn phòng điều hành' },
    mi: { label: 'Market Intelligence', label_vi: 'Phân tích thị trường', name: 'Nguyễn Thu Hà', initials: 'TH', maxClassification: 'Restricted', viewRestricted: true, export: true, admin: true, department: 'Market Intelligence', department_vi: 'Phân tích thị trường' },
    internal: { label: 'Internal user', label_vi: 'Người dùng nội bộ', name: 'Trần Quốc Bảo', initials: 'QB', maxClassification: 'Internal', viewRestricted: false, export: false, admin: false, department: 'Commercial', department_vi: 'Kinh doanh' }
  }, instruments, events, drivers, highlights, news, forecasts, reports, audit, aiExecutions, coverage, analysis };
})();
