const CronJob = require('cron').CronJob;

class LighthouseCron {
    constructor(urls = [], cron = '00 00 * * * 0-6', timeZone = 'Europe/London') {
        this.urls = urls;
        this.cron = cron;
        this.job = new CronJob(cron, () => {
                console.log('cron');
            }, function() {
                console.log('finished');
            },
            false,
            timeZone
        );
    }

    init() {
        if (!this.urls.length > 0) {
            console.log('No paths passed');
            return;
        }

        this.job.start();
    }

}

new LighthouseCron([
    'https://www.net-a-porter.com/'
], '* * * * * 0-6').init();
