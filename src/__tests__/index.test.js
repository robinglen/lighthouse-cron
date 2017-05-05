const LighthouseCron = require('../');

const urls = [
  {
    url: 'https://www.demo.com/'
  }
];

describe('lighthouseCron', () => {
  it('No urls will throw', () => {
    const lighthouseCron = new LighthouseCron();
    expect(() => {
      lighthouseCron.init();
    }).toThrow();
  });

  it('Urls are passed through', () => {
    const lighthouseCron = new LighthouseCron(urls);
    expect(lighthouseCron.urls).toEqual(urls);
  });

  it('Setting class default varianbles', () => {
    const lighthouseCron = new LighthouseCron(urls);
    expect(lighthouseCron.cron).toEqual('00 00 * * * 0-6');
    expect(lighthouseCron.timezone).toEqual('Europe/London');
    expect(lighthouseCron.chromeFlags).toEqual([]);
    expect(lighthouseCron.lighthouseFlags).toEqual({});
    expect(lighthouseCron.lighthouseConfig).toBeUndefined();
  });

  it('Setting class default varianbles', () => {
    const lighthouseCron = new LighthouseCron(
      urls,
      '00 30 * * * 0-6',
      'America/Los_Angeles',
      ['--headless'],
      { 'disable-cpu-throttling': true },
      { custom: 'perf audit' }
    );
    expect(lighthouseCron.cron).toEqual('00 30 * * * 0-6');
    expect(lighthouseCron.timezone).toEqual('America/Los_Angeles');
    expect(lighthouseCron.chromeFlags).toEqual(['--headless']);
    expect(lighthouseCron.lighthouseFlags).toEqual({
      'disable-cpu-throttling': true
    });
    expect(lighthouseCron.lighthouseConfig).toEqual({ custom: 'perf audit' });
  });
});
