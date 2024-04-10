const https = require("https");
const cheerio = require("cheerio");

const searchWithEngine = (searchTerm) => {
    const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(searchTerm)}`;
    https.get(searchUrl, (res) => {
        const buffers = [];

        res.on('data', (data) => buffers.push(data));

        res.on('end', () => {
            const response = Buffer.concat(buffers).toString();
            displaySearchResponse(response, searchUrl);
        });

    }).on('error', (e) => console.error(e));
};

const displaySearchResponse = (response, urlString) => {
    let links = [];
    const $ = cheerio.load(response);

    $('a').each(function () {
        let link = $(this).attr('href');
        if (link && !link.startsWith('javascript:') && !link.startsWith('mailto:')) {
            link = new URL(link, urlString).toString();
            links.push(link);
        }
    });

    links = [...new Set(links)];
    links.slice(13,23).forEach((link, index) => {
        console.log(`${link}`);
    });
}

module.exports = { searchWithEngine };




