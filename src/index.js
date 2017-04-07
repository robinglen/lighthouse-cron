const CronJob = require('cron').CronJob;
const Lighthouse = require('lighthouse');
const ChromeLauncher = require('lighthouse/lighthouse-cli/chrome-launcher.js').ChromeLauncher;
const Printer = require('lighthouse/lighthouse-cli/printer');
const defer = require('promise-defer');
const EventEmitter = require('events').EventEmitter;

function launchChrome() {
  return new ChromeLauncher({
    port: 9222,
    autoSelectChrome: true
  });
}

function runLighthouse(chrome, url) {
  const flags = {
    output: 'json'
  };
  return chrome
    .isDebuggerReady()
    .catch(() => {
      if (flags.skipAutolaunch) {
        return;
      }
      return chrome.run(); // Launch Chrome.
    })
    .then(() => Lighthouse(url, flags)) // Run Lighthouse.
    .then(results => chrome.kill().then(() => results)) // Kill Chrome and return results.
    .catch(err => {
      // Kill Chrome if there's an error.
      return chrome.kill().then(
        () => {
          throw err;
        },
        console.error
      );
    });
}

function getOverallScore(lighthouseResults) {
  const scoredAggregations = lighthouseResults.aggregations.filter(a => a.scored);
  const total = scoredAggregations.reduce((sum, aggregation) => sum + aggregation.total, 0);
  return (total / scoredAggregations.length) * 100;
}

module.exports = class LighthouseCron extends EventEmitter {
  constructor(
    urls = [],
    cron = '0 0/5 * 1/1 * ? *',
    timeZone = 'Europe/London'
  ) {
    super();
    this.urls = urls;
    this.cron = cron;
    this.chrome = launchChrome();
    this.job = new CronJob(
      cron,
      () => {
        this._cron(this.urls);
      },
      function() {
        console.log('finished');
      },
      false,
      timeZone
    );
  }

  _cron(urls) {
    this.doPromises(urls, this.chrome);
  }

  promiseWhile(condition, action) {
    const resolver = defer();

    function loop() {
      if (!condition()) return resolver.resolve();
      return Promise.resolve(action()).then(loop).catch(resolver.reject);
    }
    process.nextTick(loop);
    return resolver.promise;
  }

  doPromises(urls, chrome) {
    return new Promise((resolve, reject) => {
      let urlArrayPosition = 0;

      this.promiseWhile(
        () => urlArrayPosition < urls.length,
        () =>
          runLighthouse(
            chrome,
            urls[urlArrayPosition].url
          ).then(lighthouseResults => {
            this.emit('auditComplete', {
              metadata: urls[urlArrayPosition],
              score: getOverallScore(lighthouseResults),
              results: lighthouseResults
            });
            urlArrayPosition++;
          })
      )
        .then(() => {
          this.emit('auditsComplete', {
            message: `${urls.length} audits completed`
          });
          resolve();
        })
        .catch(error => {
          this.emit('error', error);
          reject(error);
        });
    });
  }

  init() {
    if (!this.urls.length > 0) {
      console.log('No paths passed');
      return;
    }

    this._cron(this.urls);
    this.job.start();
  }
};
