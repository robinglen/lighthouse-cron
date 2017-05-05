# Lighthouse Cron
> Cron multiple batch [Lighthouse](https://github.com/googlechrome/lighthouse) audits and emit results for sending to remote server.

Want to track your Lighthouse scores and metrics overtime? This module will allow you to write a simple script to perform multiple audits over time and allow you to transport the results.

## Set up

```Bash
npm install --save lighthouse-cron
```

## Usage
```Javascript
const LighthouseCron = require('lighthouse-cron');
const lighthouseCron = new LighthouseCron(
  [
    {
      url: 'https://www.google.com/'
    }
  ],
  '00 00,15,30,45 * * * 0-6'
);

lighthouseCron.on('auditComplete', audit => {
  console.log(audit);
});

lighthouseCron.init();
```

### Reference
* [new LighthouseCron](#new-lighthouse-cron)
* [init](#init)

<a name="new-lighthouse-cron"></a>
#### `new LighthouseCron(urls, cron, timezone, chromeFlags, lighthouseFlags, lighthouseConfig)`
Create a new instance of lighthouse cron.

##### Parameters
* `urls` - **Required.** Array of objects including the url as a property.
* `cron` - String for cron pattern *(Default: '00 00 * * * 0-6')*
* `timezone` - String for cron timezone *(Default: 'Europe/London')*
* `chromeFlags` - Array of Chrome flags e.g. `['--headless']`
* `lighthouseFlags` - Object to enable Lighthouse flags
* `lighthouseConfig` - Object describe custom configurations for lighthouse runs

<a name="init"></a>
#### `init(autorun)`
Initialise lighthouse cron.

##### Parameters
* `autorun` - Boolean for if cron should do first run instantly *(Default: false)*

### Events
* [auditComplete](#auditComplete)
* [cronCycleComplete](#cronCycleComplete)
* [allAuditsComplete](#allAuditsComplete)
* [error](#error)

<a name="auditComplete"></a>
#### `auditComplete`
After a lighthouse audit is complete on a url this event returns the results.

<a name="cronCycleComplete"></a>
#### `cronCycleComplete`
After the cron job has been complete an event is emitted.

<a name="allAuditsComplete"></a>
#### `allAuditsComplete`
After all lighthouse audits are complete an event is emitted.

<a name="error"></a>
#### `error`
If a an error occurs an event is emitted with the error returned.

## Examples
Below is an example of how you could report performance metrics and lighthouse scores to the data analytics platform [Keen.io](https://keen.io/).

```Javascript
const KeenTracking = require('keen-tracking');
const LighthouseCron = require('lighthouse-cron');

// Configuring Keen client
const keenClient = new KeenTracking({
  projectId: 'Your Project Id',
  writeKey: 'Your Write Key'
});

// Additional website and description fields added to improve your dashboards
const lighthouseCron = new LighthouseCron(
  [
    {
      website: 'Google',
      description: 'Homepage',
      url: 'https://www.google.com'
    },
    {
      website: 'YouTube',
      description: 'Homepage',
      url: 'https://www.youtube.com'
    }
  ],
  '00 00 * * * 0-6'
);

// listening for each audit to be complete
lighthouseCron.on('auditComplete', audit => {
  const report = generateTrackableReport(audit);
  keenClient.recordEvent('lighthouse audits', report);
});


// Pulling out the metrics we are interested in
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

// getting the values we interested in
function getRequiredAuditMetrics(metrics) {
  return {
    score: metrics.score,
    value: metrics.rawValue,
    optimal: metrics.optimalValue
  };
}

lighthouseCron.init();
```

This demo is also available to be run from this module however instead of reporting the metrics to [Keen.io](https://keen.io/) they are just printed to console.

```Bash
npm run demo
```
