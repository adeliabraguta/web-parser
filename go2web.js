#!/usr/bin/env node

const {program} = require("commander");
const {searchWithEngine} = require("./httpSearch");
const {makeHttpRequest} = require("./httpRequest");

program
    .description("A simple CLI application for web operations")
    .option("-u, --url <URL>", "make an HTTP request to the specified URL")
    .option("-s, --search <searchTerm>", "make an HTTP request to search a term").action((cmd) => {
    if (cmd.url) {
        makeHttpRequest(cmd.url)
    } else if (cmd.search) {
        searchWithEngine(cmd.search)
    }
});

program.parse(process.argv);

