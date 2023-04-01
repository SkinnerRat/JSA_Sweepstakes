const express = require("express");
const app = express();
const puppeteer = require('puppeteer'); 
const bodyParser = require('body-parser'); 
const port = process.env.PORT || 3000; 
process.on('uncaughtException', function (error) {
    console.log(error.stack);
});

// use the express-static middleware, getting static files from "public" folder
app.use("/public", express.static("public"));
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.redirect("/public/page.html"); 
})

app.post("/public/page.html/", async (req, res) => {
    const content = await calc(decodeURIComponent(req.body.url), decodeURIComponent(req.body.isWinCon)); 
    res.send(content); 
}); 

async function calc(url, isWinCon) {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'], // needed to run chromium in browser
<<<<<<< HEAD
        headless: false, 
=======
>>>>>>> parent of e07461c (headless testing)
        userDataDir: "./user_data"
    }); 
    const page = await browser.newPage(); 
    await page.goto(url); 

    
    // need to sign in (only when not signed in the browser before)
    await page.waitForNetworkIdle(); 
    if (await page.$("div[jsname='YASyvd']") !== null) {
        await page.waitForSelector(".XfpsVe.J9fJmf");
        const signin = await page.$("div.XfpsVe.J9fJmf span.RveJvd.snByac");
        console.log(signin);
        await signin.click();

        const username = "jlee@socal.jsa.org"; 
        const password = "S@nsmain4"; 

        await page.waitForSelector(".U26fgb.O0WRkf.oG5Srb.HQ8yf.C0oVfc.kHssdc.HvOprf.TFBnVe.M9Bg4d"); 
        await page.click("div.XfpsVe.J9fJmf div.U26fgb.O0WRkf.oG5Srb.HQ8yf.C0oVfc.kHssdc.HvOprf.TFBnVe.M9Bg4d"); 
        await page.waitForSelector("#identifierId"); 
        await page.type("#identifierId", username); 
        let nextBtnClass = ".VfPpkd-LgbsSe.VfPpkd-LgbsSe-OWXEXe-k8QpJ.VfPpkd-LgbsSe-OWXEXe-dgl2Hf.nCP5yc.AjY5Oe.DuMIQc.LQeN7.qIypjc.TrZEUc.lw1w4b"; 
        await page.click(nextBtnClass);
        await page.waitForNetworkIdle(); 
        await page.waitForSelector("div.Xb9hP input[type='password']"); // waiting for specific input inside certain class bc other input in prior page
        await page.type("div.Xb9hP input[type='password']", password);
        await page.click(nextBtnClass); 
        await page.goto(url); // reload page to have editing access after signing in
    }
    
    
    let modifier = isWinCon === "true" ? 1 : 0; // convert boolean to int
    await page.waitForSelector(".s1H0X"); 
    let data = await page.evaluate((mod) => {
        const speakers = []; 
        // skip voting list containers to go to best speaker choice
        let listContain = document.getElementsByClassName("s1H0X")[1+mod]; // [2] for Winter Con, [1] for other
        let names = listContain.getElementsByClassName("oD4MFb oNpSq-G9bxwf oDFlZb"); 
        
        for (let i = 0; i < names.length; i++) {
            let name = names[i].getElementsByClassName("Hvn9fb zHQkBf")[0].value; 
            speakers.push(name); 
        }

        return speakers; 
    }, modifier);

    // go to "responses" tab of Google form for moderator name & best speaker
    await page.goto(url + "#responses"); 
    await page.reload(); // for some reason need to reload in order to actually navigate
    await page.waitForNetworkIdle(); // wait for networkidle to fully load dom
    await page.waitForSelector(".o5ddgd"); 
    let resData = await page.evaluate((mod) => {
        const mods = {}, best = {}; 

        const modContain = document.getElementsByClassName("o5ddgd")[2]; 
        const modList = modContain.getElementsByTagName("tbody")[0]; 
        const modNames = modList.getElementsByTagName("tr");
        for (const mod of modNames) {
            let row = mod.innerText.split("	"); 
            let modName = row[0], modCount = row[1]; 
            if (!(modName in mods)) mods[modName] = 0; 
            mods[modName] += modCount; 
        }

        const speakContain = document.getElementsByClassName("o5ddgd")[4+mod]; // go to best speaker; [5] for Winter Con, [4] for other 
        const speakList = speakContain.getElementsByTagName("tbody")[0]; 
        const speakNames = speakList.getElementsByTagName("tr");
        for (const speaker of speakNames) {
            let row = speaker.innerText.split("	"); 
            let name = row[0], vote = row[1]; 
            if (!(name in best)) best[name] = 0; 
            best[name] += vote; 
        }
    
        return [mods, best]; 
    }, modifier); 

    browser.close(); 

    return [data].concat(resData); 
}


// start the server listening for requests
app.listen(port, () => { 
    console.log(`Server is running on port ${port}`); 
});