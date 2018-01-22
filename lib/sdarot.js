const fs = require('fs');
const request = require('request');

// request.debug = true;
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36";
const URL = "https://sdarot.wf/ajax/watch";

let jar = request.jar();

let headers = {
    "User-Agent": UA,
    "Origin": "https://sdarot.wf",
    "Referer": "https://sdarot.wf/watch/"
};

async function watch(options) {

    console.log(`starting sid\\season\\episode: ${options.SID}\\${options.season}\\${options.episode}`);

    let token = await serverRequest({
        url: URL,
        method: "POST",
        headers: headers,
        jar: jar,
        rejectUnauthorized: false,
        requestCert: true,
        form: {
            preWatch: 'true',
            SID: options.SID,
            season: options.season,
            ep: options.episode
        }
    });

    if (!token || token.length !== 13) {
        throw new Error("no token?");
    }

    console.log("received token " + token);
    console.log("waiting 30 seconds...");

    await sleep(30000);

    let data = await serverRequest({
        url: URL,
        method: "POST",
        headers: headers,
        json: true,
        jar: jar,
        rejectUnauthorized: false,
        requestCert: true,
        form: {
            watch: 'true',
            token: token,
            serie: options.SID,
            season: options.season,
            episode: options.episode
        }
    });

    if (data.error) {
        throw new Error(data.error);
    }

    let t = Object.keys(data.watch)[0];
    let mediaURL = "https://" + data.url + "/watch/" + t + "/" + data.VID + ".mp4?token=" + data.watch[t] + "&time=" + data.time;

    console.log("downloading " + mediaURL);

    await download(mediaURL, `${options.SID}-${options.season}-${options.episode}-${data.VID}.mp4`);

    console.log("download finished!");

}

function sleep(time) {
    return new Promise((resolve) => {
        setTimeout(resolve, time);
    });
}

async function download(url, filename) {
    return new Promise((resolve, reject) => {
        request({url: url, jar: jar, headers: headers})
            .on('response', (response) => {

                let stream = fs.createWriteStream(filename);
                let contentLength = response.headers['content-length'];
                let total = 0;

                let interval = setInterval(() => {
                    process.stdout.write('\rdownload progress: ' + Math.round(total / contentLength * 100) + '%');
                }, 1000);

                response.on('data', (chunk) => {
                    stream.write(chunk);
                    total += chunk.byteLength;
                });

                response.on('error', () => {
                    reject(new Error("error while downloading"));
                });

                response.on('end', () => {
                    clearInterval(interval);
                    process.stdout.write('\n');
                    stream.end();
                    resolve();
                });
            })
            .on('error', (err) => {
                reject(err);
            });
    });
}

function serverRequest(options) {
    return new Promise((resolve, reject) => {
        request(options, (err,httpResponse,body) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(body);
            }
        });
    });
}


async function start(options) {
    let finished = false;
    let i = 1;

    do {
        await watch(options)
            .then(() => {
                finished = true;
            })
            .catch((err) => {
                console.error(err);
            });

        if (!finished) {
            console.log(`trying again (${i})...`);
            i++;
        }
    }
    while(!finished);
}

module.exports = {
    download: start
};

