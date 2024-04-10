const net = require("net");
const cheerio = require('cheerio');
const fs = require('node:fs');
const tls = require("tls");

const HTTP_STATUS_CODES = {
    REDIRECT: [301, 302, 307, 308]
};
let isSearching = false;
let isRedirecting = false;
let cleanedResponse;

const makeHttpRequest = (urlString) => {
    let cacheBuffer;
    const url = new URL(urlString)
    const buffers = [];
    const options = {
        host: url.hostname,
        port: url.protocol === 'https:' ? 443 : 80,
        servername: url.hostname,
        rejectUnauthorized: false
    };
    const httpRequest = `GET ${url.pathname} HTTP/1.1\r\nHost: ${url.hostname}\r\nUser-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3\r\nAccept: application/json, text/html\r\nConnection: close\r\n\r\n`;

    fs.readFile('data.json', (err, data) => {
        if (err) {
            console.error(err);
            return
        }

        try {
            cacheBuffer = JSON.parse(data.toString());
        } catch (error) {
            cacheBuffer = {};
        }

        if (cacheBuffer.hasOwnProperty(urlString)) {
            console.log('Process data from Cache')
            console.log(cacheBuffer[urlString])
            return
        }

        const socket = url.protocol === 'https:' ? new tls.connect(options, () => {
            socket.write(httpRequest);

        },) : new net.connect(options, () => {
            socket.write(httpRequest);

        })

        socket.on('data', (data) => {
            buffers.push(data);
        });
        socket.on('end', () => {
            const response = Buffer.concat(buffers).toString();
            processData(response, urlString);
            if (!cacheBuffer.hasOwnProperty(urlString) && !isSearching && !isRedirecting) {
                cacheBuffer[urlString] = cleanedResponse;
                fs.writeFile('data.json', JSON.stringify(cacheBuffer), function (err) {
                    if (err) throw err;
                });
                console.log('Data Cached')
            }
        });
    })
};

const processData = (response, urlString) => {
    const {headers, statusCode, body} = parseResponse(response);
    if (HTTP_STATUS_CODES.REDIRECT.includes(statusCode) && headers['Location']) {
        const redirectUrl = new URL(headers['Location'], urlString).toString();
        console.log(`Redirecting to ${redirectUrl} (${statusCode})`);
        isRedirecting = true
        makeHttpRequest(redirectUrl);
    } else {
        isRedirecting = false
        handleResponse(response, urlString, body);
    }
}

const parseResponse = (response) => {
    const headersEnd = response.indexOf('\r\n\r\n');
    const headersText = response.substring(0, headersEnd);
    const headers = headersText.split('\r\n').slice(1).reduce((acc, current) => {
        const [key, value] = current.split(': ');
        acc[key] = value;
        return acc;
    }, {});

    const body = response.substring(headersEnd + 4);
    const statusLine = response.substring(0, response.indexOf('\r\n'));
    const statusCode = parseInt(statusLine.split(' ')[1], 10);

    return {headers, statusCode, body};
};

const handleResponse = (response, urlString, body) => {
    if (response || response.includes('Content-Type: text/html')) {
        displayHtmlResponse(response, body);
    } else if (response.includes('Content-Type: application/json')) {
        displayJsonResponse(response, body);
    }
};

const displayHtmlResponse = (response, body) => {
    const $ = cheerio.load(body);
    $('img').each(function () {
        const src = $(this).attr('src');
        $(this).replaceWith(`Image: ${src}\n`);
    }).remove();
    $('style').remove();
    $('script').remove();
    $('iframe').remove();

    cleanedResponse = cleanUpResponse($('body').text());
    console.log(cleanedResponse);
}

const displayJsonResponse = (response, body) => {
    try {
        const json = JSON.parse(body);
        cleanedResponse = JSON.stringify(json, null, 2);
        console.log(cleanedResponse);
    } catch (error) {
        console.error("Error parsing JSON:", error.message);
    }
}

const cleanUpResponse = (responseText) => {
    return responseText.replace(/[ \t]+/g, ' ').replace(/\n\s*\n\s*\n/g, '\n\n').trim();
};

module.exports = {makeHttpRequest}