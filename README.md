# Lighthouse Cron
> Cron multiple batch [Lighthouse](https://github.com/googlechrome/lighthouse) audits and emit results for sending to remote server.

Want to track your Lighthouse scores and metrics overtime? This module will allow you to write a simple script to perform multiple audits over time and allow you to transport the results.

## TODO
- Fix flags
- run in chromeless (https://developers.google.com/web/updates/2017/04/headless-chrome)
- coverage
- show example of using keen.io to send data back
- publish to npm
- allow for custom lighthouse jobs

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
#### `new LighthouseCron(urls, cron, timezone, flags)`
Create a new instance of lighthouse cron.

##### Parameters
* `urls` - **Required.** Array of objects including the url as a property.
* `cron` - String for cron pattern *(Default: '00 00 * * * 0-6')*
* `timezone` - String for cron timezone *(Default: 'Europe/London')*
* `flags` - Object to enable Chrome and Lighthouse flags

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

## Example
```Javascript
const LighthouseCron = require('lighthouse-cron');
const lighthouseCron = new LighthouseCron(
  [
    {
      website: 'Google',
      description: 'Homepage',
      url: 'https://www.google.com/'
    }
  ],
  '00 00,15,30,45 * * * 0-6'
);

lighthouseCron.on('auditComplete', audit => {
  addAudit(audit);
});

function addAudit(audit) {
  const report = generateTrackableReport(audit);
  console.log(report);
  // You could also beacon this back to GA as custom metrics or your own data visualization platform
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

function getRequiredAuditMetrics(audit) {
  return {
    score: audit.score,
    value: audit.rawValue,
    optimal: audit.optimalValue
  };
}

lighthouseCron.init();
```
