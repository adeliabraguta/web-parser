#!/usr/bin/env node

const {program} = require("commander");

program
    .description("A simple CLI application for web operations")
    .option("-u, --url <URL>", "make an HTTP request to the specified URL")
    .option("-s, --search <searchTerm>", "make an HTTP request to search a term").action((cmd) => {
    if (cmd.url) {
        //make http request
    } else if (cmd.search) {
        // search
    }
});

program.parse(process.argv);

