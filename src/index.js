const lighthouse = require('./lighthouse')
const CronJob = require('cron').CronJob;
const Printer = require('lighthouse/lighthouse-cli/printer');
const defer = require('promise-defer');
const EventEmitter = require('events').EventEmitter;
const pino = require('pino').pretty();

module.exports = class LighthouseCron extends EventEmitter {
    constructor(
        urls = [],
        cron = '0 0/5 * 1/1 * ? *',
        timeZone = 'Europe/London',
        logger = 'info',
        flags = {}
    ) {
        super();
        this.urls = urls;
        this.cron = cron;
        this.logger = logger;
        this.flags = flags;
        this.chrome = lighthouse.launchChrome(this.flags);
        this.job = new CronJob(
            cron,
            () => {
                this._cron(this.urls);
            },
            () => {
                pino.info('Cron cycle complete');
                this.emit('cronCycleComplete', auditObj);
            },
            false,
            timeZone
        );
    }

    _cron(urls) {
        this._doPromises(urls, this.chrome, this.flags);
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

    _doPromises(urls, chrome, flags) {
        return new Promise((resolve, reject) => {
            let urlArrayPosition = 0;
            this._promiseWhile(
                    () => urlArrayPosition < urls.length,
                    () =>
                    lighthouse.runLighthouse(
                        chrome,
                        urls[urlArrayPosition].url,
                        flags
                    ).then(lighthouseResults => {
                        const auditObj = {
                            metadata: urls[urlArrayPosition],
                            score: lighthouse.getOverallScore(lighthouseResults),
                            results: lighthouseResults
                        };
                        pino.info('Audit complete', auditObj);
                        this.emit('auditComplete', auditObj);
                        urlArrayPosition++;
                    })
                )
                .then(() => {
                    const msg = {
                        message: `${urls.length} audits completed`
                    };
                    pino.info('All audit complete', msg);
                    this.emit('allAuditsComplete', msg);
                    resolve();
                })
                .catch(error => {
                    this.emit('error', error);
                    reject(error);
                });
        });
    }

    init(autorun = false) {
        pino.level = this.logger;
        if (!this.urls.length > 0) {
            pino.error('No urls passed');
            return;
        }
        pino.info({
            cron: this.cron,
            timezone: this.timeZone,
            urls: this.urls
        });
        if (autorun) {
            this._cron(this.urls);
        }
        this.job.start();
    }
};
