require('dotenv').config()
const fetch = require('node-fetch');
const fs = require('fs').promises;
const Mustache = require('mustache');

async function loadLastFMWeeklyScrobbles(username)
{
    const text = await(await fetch(`https://www.last.fm/user/${username}/library?date_preset=LAST_7_DAYS`)).text();
    // This is a terrible way of doing things but in my defense, I glanced at the LastFM api docs and
    // nothing looked like it did what I wanted it to
    const matches = (/<h2 class="metadata-title">Scrobbles<\/h2>\s*?\n?\s*?<p class="metadata-display">(\d+)<\/p>/g).exec(text);
    return matches[1];
}

async function loadWakatimeData(apiKey)
{
    return (await(await fetch('https://api.wakatime.com/api/v1/users/current/stats/last_7_days', {
        headers: {
            'Authorization': 'Basic ' + Buffer.from(apiKey).toString('base64')
        }
    })).json())['data'];
}

async function generateReadme()
{
    const scrobbles = await loadLastFMWeeklyScrobbles(process.env['LASTFM_USERNAME']);
    const wakatimeData = await loadWakatimeData(process.env['WAKATIME_API_KEY']);
    
    await fs.writeFile('readme.md', Mustache.render(await fs.readFile('template.md', 'utf8'), {
        'weekly_scrobbles': scrobbles,
        'daily_scrobbles': Math.floor(scrobbles / 7),
        'coding_weekly_total': wakatimeData['human_readable_total'],
        'coding_daily_average': wakatimeData['human_readable_daily_average'],
        'coding_top_language': wakatimeData['languages'][0].name
    }));
}

generateReadme();
