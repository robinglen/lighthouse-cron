const CronJob = require('cron').CronJob;
const Lighthouse = require('lighthouse');
const ChromeLauncher = require('lighthouse/lighthouse-cli/chrome-launcher.js').ChromeLauncher;
const Printer = require('lighthouse/lighthouse-cli/printer');
const defer = require('promise-defer');


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
    const config = require('lighthouse/lighthouse-core/config/perf.json');
    return chrome.isDebuggerReady()
        .catch(() => {
            if (flags.skipAutolaunch) {
                return;
            }
            return chrome.run(); // Launch Chrome.
        })
        .then(() => Lighthouse(url, flags, config)) // Run Lighthouse.
        .then(results => chrome.kill().then(() => results)) // Kill Chrome and return results.
        .catch(err => {
            // Kill Chrome if there's an error.
            return chrome.kill().then(() => {
                throw err;
            }, console.error);
        });
}


class LighthouseCron {
    constructor(urls = [], cron = '0 0/5 * 1/1 * ? *', timeZone = 'Europe/London') {
        this.urls = urls;
        this.cron = cron;
        this.chrome = launchChrome();
        this.job = new CronJob(cron, () => {
                this._cron(this.urls);
            }, function() {
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
                    runLighthouse(chrome, urls[urlArrayPosition]).then(lighthouseResults => {
                        urlArrayPosition++
                        console.log(`finished promise ${urlArrayPosition}`);
                        return Printer.write(lighthouseResults);
                    })
                )
                .then(() => {
                    console.log('finuished all promises');
                    resolve();
                })
                .catch((error) => {
                    console.log(`a promise blew up`);

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

}

new LighthouseCron([
    'https://www.net-a-porter.com/'
], '30 * * * * 0-6').init();
