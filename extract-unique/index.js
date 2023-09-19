const fs = require('fs');
const _ = require('lodash');
const url = require('url');

// Read the JSON file
fs.readFile('../output/2023-05-20T051325681Z_any.json', 'utf8', (err, jsonString) => {
    if (err) {
        console.log("File read failed:", err);
        return;
    }

    // Parse JSON
    const data = JSON.parse(jsonString);

    // Extract unique base domains
    const uniqueUrls = _(data)
        .map(item => url.parse(item.domain).protocol + "//" + url.parse(item.domain).host) // extract base domain
        .uniq() // get unique URLs
        .map(domain => ({ url: domain })) // transform to required format
        .value();

    // Write unique URLs to new JSON file
    fs.writeFile('../output/2023-05-20T051325681Z_any.json-UNIQUE.json', JSON.stringify(uniqueUrls, null, 2), (err) => {
        if (err) console.log('Error writing file:', err);
    });
});