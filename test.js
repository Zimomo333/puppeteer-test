const puppeteer = require("puppeteer-core");
const puppeteerProxy = require("puppeteer-proxy");
const http = require('http')

function getProxy() {
    return new Promise((resolve) => {
        let data = '';
        http.get('http://localhost:5010/get/?type=https', res => {
            res.on('data', chunk => { data += chunk });
            res.on('end', () => resolve(JSON.parse(data)));
        }) 
    })
};

puppeteer
    .launch({
        executablePath:
            "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        headless: false,
        args: [
            // '--proxy-server=127.0.0.1:1081',
        ],
    })
    .then(async (browser) => {
        const page = await browser.newPage();
        await page.setRequestInterception(true);
        page.on("request", async (request) => {
            console.log("🚀 ~ page.on ~ request.url()", request.url())
            if (request.url().startsWith('https://tarkov-market.com/api')) {
                let { proxy } = await getProxy();
                console.log("🚀 ~ page.on ~ proxy", proxy)
                await puppeteerProxy.proxyRequest({
                    page,
                    proxyUrl: `https://${proxy}`,
                    request,
                });
            } else {
                request.continue();
            }
        });
        await page.goto("https://tarkov-market.com/");
        await page.$eval(
            "button[class='big bold w-100 text-center py-10']",
            (ele) => {
                ele.click();
            }
        );
        await page.evaluate(() => {
            setInterval(() => {
                window.scrollTo(0, 9999999);
            }, 4000);
        });
        let urls;
        setInterval(async () => {
            urls = await page.$$eval(
                ".card .body .block:first-child a",
                (aEles) => {
                    const urls = [];
                    aEles.forEach((aEle) => urls.push(aEle.href));
                    return urls;
                }
            );
            console.log(urls.length);
        }, 10000);
    });
