#!/usr/bin/env node

const {program} = require("commander");
const net = require('net');
const cheerio = require('cheerio');

const makeHttpRequest = (urlString) => {
    const port = 80;
    const url = new URL(urlString)
    const httpRequest = `GET ${url.pathname} HTTP/1.1\r\nHost: ${url.hostname}\r\nAccept: application/json, text/html\r\nConnection: close\r\n\r\n`

    const socket = new net.Socket();

    socket.connect(port, url.hostname)
    socket.on('connect', () => {
        console.log(`Connected to ${url.hostname}`);
        socket.write(httpRequest);
    })

    socket.on('data', (data) => {
        processData(data);
    });
    socket.on('end', () => console.log('Disconnected'));
};

const processData = (data) => {
    const response = data.toString();
    const headersEnd = response.indexOf('\r\n\r\n');
    const body = response.substring(headersEnd + 4);
    if (response.includes('Content-Type: text/html')) {
        const $ = cheerio.load(body);
        console.log("Title of the HTML page:", $('title').text());
    }
};

program
    .description("A simple CLI application for web operations")
    .option("-u, --url <URL>", "make an HTTP request to the specified URL")
    .option("-s, --search <searchTerm>", "make an HTTP request to search a term").action((cmd) => {
    if (cmd.url) {
        makeHttpRequest(cmd.url)
    } else if (cmd.search) {
        console.log('ada')
    }
});

program.parse(process.argv);

