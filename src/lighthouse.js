const Lighthouse = require('lighthouse');
const ChromeLauncher = require('lighthouse/lighthouse-cli/chrome-launcher.js').ChromeLauncher;

function launchChrome(opts) {
  return new ChromeLauncher(opts);
}

function runLighthouse(chrome, url, flags = {}, config = undefined) {
  // overwrite so always return json
  flags.output = 'json';
  return chrome
    .isDebuggerReady()
    .catch(() => {
      if (flags.skipAutolaunch) {
        return;
      }
      return chrome.run();
    })
    .then(() => Lighthouse(url, flags, config)) // Run Lighthouse.
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
  const scoredAggregations = lighthouseResults.aggregations.filter(
    a => a.scored
  );
  const total = scoredAggregations.reduce(
    (sum, aggregation) => sum + aggregation.total,
    0
  );
  return total / scoredAggregations.length * 100;
}

module.exports.launchChrome = launchChrome;
module.exports.runLighthouse = runLighthouse;
module.exports.getOverallScore = getOverallScore;
