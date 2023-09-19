import fs from "node:fs";
import path from "node:path";
import fetch from "node-fetch";
import randomUseragent from "random-useragent";
import dorks from "./data/customs.json" assert { type: "json" };
import HttpsProxyAgent from "https-proxy-agent";

function replaceSite(input, dorkArray) {
  return dorkArray.map((item) => {
    return { dork: item.dork.replace(/\{site\}/g, input) };
  });
}

const domain = process.argv[2];
const folder = "output";

if (!fs.existsSync(folder)) {
  fs.mkdirSync(folder);
}

const filename = `${new Date().toISOString().replace(/[:.]/g, "")}_${
  domain ? domain : "any"
}.json`;
const filepath = path.join(folder, filename);
console.log(`[ ! ] Getting information about: ${domain ? domain : ""}`);
console.log(`[ ! ] Output file is saved: ${filepath}`);

async function query(dork) {
  const userAgent = randomUseragent.getRandom();
  const proxy = "";
  const proxyUrl = new HttpsProxyAgent(proxy);
  let result = [];

  for (let start = 0; start <= 40; start += 10) {
    let success = false;
    while (!success) {
      const response = await fetch(
        `https://www.google.com/search?q=${encodeURIComponent(
          dork
        )}&start=${start}&client=firefox-b-e`,
        {
          headers: {
            "User-Agent": userAgent, // Use the random user agent you generated
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            Connection: "keep-alive",

            Cookie: "CONSENT=YES+srp.gws-20211028-0-RC2.es+FX+330",
          },
          method: "GET",
          redirect: "follow",
        }
      );

      const html = await response.text();
      console.log(response.status);
      if (html.includes("https://www.google.com/sorry/index")) {
        console.log("[ ! ] Changing user agent and retrying search query...");
        userAgent = randomUseragent.getRandom();
        await new Promise((resolve) =>
          setTimeout(
            resolve,
            Math.floor(Math.random() * (12 - 8 + 1) + 8) * 1000
          )
        );
      } else {
        success = true;
        const matches = html.match(
          new RegExp(
            `(http|https)://[a-zA-Z0-9./?=_~-]*/[a-zA-Z0-9./?=_~-]*`,
            "g"
          )
        );
        if (matches) {
          result.push(...matches);
        } else {
          await new Promise((resolve) =>
            setTimeout(
              resolve,
              Math.floor(Math.random() * (12 - 8 + 1) + 8) * 1000
            )
          );
          break;
        }
      }
    }
  }
  return [...new Set(result)];
}

async function printResults(dorks) {
  const domains = [];
  let modifiedDorks = replaceSite(domain, dorks);
  for (const { dork } of modifiedDorks) {
    console.log(`[ * ] Dorking for: ${dork}`);
    const results = await query(dork);
    if (!results.length) {
      console.log(`\n[ - ] No results`);
    } else {
      for (const result of results) {
        console.log(`[ + ] ${result}`);
        domains.push({ domain: result, dork });
      }
    }
    fs.writeFileSync(filepath, JSON.stringify(domains, null, 2));
  }
  console.log("");
}

(async () => {
  await printResults(dorks);
})();
