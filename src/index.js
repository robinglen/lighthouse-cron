const lighthouse = require('./lighthouse');
const CronJob = require('cron').CronJob;
const Printer = require('lighthouse/lighthouse-cli/printer');
const defer = require('promise-defer');
const EventEmitter = require('events').EventEmitter;

module.exports = class LighthouseCron extends EventEmitter {
  constructor(
    urls = [],
    cron = '00 00 * * * 0-6',
    timezone = 'Europe/London',
    chromeFlags = [],
    lighthouseFlags = {},
    lighthouseConfig = undefined
  ) {
    super();
    this.urls = urls;
    this.cron = cron;
    this.timezone = timezone;
    this.chromeFlags = chromeFlags;
    this.lighthouseFlags = lighthouseFlags;
    this.lighthouseConfig = lighthouseConfig;
    this.chrome = lighthouse.launchChrome(this.chromeFlags);
    this.job = new CronJob(
      cron,
      () => {
        this._cron(this.urls);
      },
      () => {
        this.emit('cronCycleComplete', {
          message: `${urls.length} cron cycle completed`
        });
      },
      false,
      this.timezone
    );
  }

  _cron(urls) {
    this._doPromises(urls, this.chrome, this.flags, this.lighthouseConfig);
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

  _doPromises(urls, chrome, flags, config) {
    return new Promise((resolve, reject) => {
      let urlArrayPosition = 0;
      this._promiseWhile(
        () => urlArrayPosition < urls.length,
        () =>
          lighthouse
            .runLighthouse(chrome, urls[urlArrayPosition].url, flags, config)
            .then(lighthouseResults => {
              const auditObj = {
                metadata: urls[urlArrayPosition],
                score: lighthouse.getOverallScore(lighthouseResults),
                results: lighthouseResults
              };
              this.emit('auditComplete', auditObj);
              urlArrayPosition++;
            })
      )
        .then(() => {
          this.emit('allAuditsComplete', {
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
      throw 'No urls passed';
    }
    if (autorun) {
      this._cron(this.urls);
    }
    this.job.start();
  }
};
