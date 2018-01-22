const argv = require('minimist')(process.argv.slice(2));
const sdarot = require('./lib/sdarot');

let serie = argv['serie'];
let season = argv['season'];

let episode1, episode2;

if (typeof argv['episode'] === 'string') {
    let args = argv['episode'].split('-');
    episode1 = +args[0];
    episode2 = +args[1];
}
else {
    episode1 = episode2 = argv['episode'];
}

if (!serie || !season || !episode1) {
    console.log("usage: --serie=[SID] --season=[SEASON] --episode=[SINGLE|RANGE]");
    process.exit();
}

if (!season) {
    console.log("missing season");
    process.exit();
}

if (!episode1) {
    console.log("missing episode");
    process.exit();
}

async function start() {
    for(let i=episode1; i<=episode2; i++) {
        await sdarot.download({
            SID: serie,
            season: season,
            episode: i
        });
    }
}

start().then(() => {
    console.log("That's it!");
});
