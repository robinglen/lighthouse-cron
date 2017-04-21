const KeenTracking = require('keen-tracking');
const PROJECT = process.env.PROJECT_ID;
const KEY = process.env.WRITE_KEY;

const client = new KeenTracking({
  projectId: PROJECT,
  writeKey: KEY
});

const LighthouseCron = require('./src/');
const lighthouseCron = new LighthouseCron(
  [
    {
      title: 'Homepage',
      brand: 'NAP',
      url: 'https://www.net-a-porter.com/'
    },
    {
      title: 'Whats new',
      brand: 'NAP',
      url: 'https://www.net-a-porter.com/gb/en/m/Shop/Whats-New/Now'
    },
    {
      title: 'Product details',
      brand: 'NAP',
      url: 'https://www.net-a-porter.com/gb/en/product/855530'
    },
    {
      title: 'Shopping bag',
      brand: 'NAP',
      url: 'https://www.net-a-porter.com/gb/en/shoppingbag.nap'
    },
    {
      title: 'Editorial',
      brand: 'NAP',
      url: 'https://www.net-a-porter.com/magazine'
    },
    {
      title: 'Homepage',
      brand: 'MRP',
      url: 'https://www.mrporter.com/'
    },
    {
      title: 'Whats new',
      brand: 'MRP',
      url: 'https://www.mrporter.com/en-gb/mens/whats-new'
    },
    {
      title: 'Product details',
      brand: 'MRP',
      url: 'https://www.mrporter.com/en-gb/mens/tom_ford/slim-fit-button-down-collar-cotton-and-cashmere-blend-twill-shirt/788010'
    },
    {
      title: 'Shopping bag',
      brand: 'MRP',
      url: 'https://www.mrporter.com/en-gb/shoppingbag.mrp'
    },
    {
      title: 'Editorial',
      brand: 'MRP',
      url: 'https://www.mrporter.com/journal/'
    }
  ],
  '00 15,30,45 * * * 0-6'
);

lighthouseCron.on('auditComplete', audit => {
  addAudit(audit);
});

function getRequiredAuditMetrics(audit) {
  return {
    score: audit.score,
    value: audit.rawValue,
    optimal: audit.optimalValue
  };
}

function generateTrackableReport(audit) {
  const reports = [
    'first-meaningful-paint',
    'speed-index-metric',
    'estimated-input-latency',
    'time-to-interactive',
    'total-byte-weight',
    'dom-size'
  ];

  const obj = {
    metadata: audit.metadata,
    score: Math.round(audit.score),
    results: {}
  };

  reports.forEach(report => {
    obj.results[report] = getRequiredAuditMetrics(audit.results.audits[report]);
  });
  return obj;
}

function addAudit(audit) {
  const report = generateTrackableReport(audit);
  client.recordEvent('lighthouse', report, (err, res) => {
    if (err) {
      console.log(err);
    } else {
      console.log(res);
    }
  });
}

lighthouseCron.init(true);
