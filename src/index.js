const lighthouse = require('./lighthouse')
const CronJob = require('cron').CronJob;
const Printer = require('lighthouse/lighthouse-cli/printer');
const defer = require('promise-defer');
const EventEmitter = require('events').EventEmitter;

console.log(lighthouse);

module.exports = class LighthouseCron extends EventEmitter {
  constructor(
    urls = [],
    cron = '0 0/5 * 1/1 * ? *',
    timeZone = 'Europe/London'
  ) {
    super();
    this.urls = urls;
    this.cron = cron;
    this.chrome = lighthouse.launchChrome();
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

  _promiseWhile(condition, action) {
    const resolver = defer();

    function loop() {
      if (!condition()) return resolver.resolve();
      return Promise.resolve(action()).then(loop).catch(resolver.reject);
    }
    process.nextTick(loop);
    return resolver.promise;
  }

  _doPromises(urls, chrome) {
    return new Promise((resolve, reject) => {
      let urlArrayPosition = 0;

      this.promiseWhile(
        () => urlArrayPosition < urls.length,
        () =>
          lighthouse.runLighthouse(
            chrome,
            urls[urlArrayPosition].url
          ).then(lighthouseResults => {
            this.emit('auditComplete', {
              metadata: urls[urlArrayPosition],
              score: lighthouse.getOverallScore(lighthouseResults),
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

  init(autorun = false) {
    if (!this.urls.length > 0) {
      console.log('No paths passed');
      return;
    }
    if (autorun) {
        this._cron(this.urls);
    }
    this.job.start();
  }
};
