const puppeteer = require('puppeteer'); 

export async function calc(url) {
    const browser = await puppeteer.launch(); 
    const page = await browser.newPage(); 
    await page.goto(url); 

    await page.waitForSelector(".s1H0X"); 
    let data = await page.evaluate(() => {
        const speakers = {}; 
        let listContain = document.getElementsByClassName("s1H0X")[1]; // skip first list container as that is voting for sides
        let names = listContain.getElementsByClassName("oD4MFb oNpSq-G9bxwf oDFlZb"); 
        
        for (let i = 0; i < names.length; i++) {
            let name = names[i].getElementsByClassName("Hvn9fb zHQkBf")[0].value; 
            name.replace(/-|(|)|,/g, ''); // get rid of punctuation marks
            speakers.append(name); 
        }

        return speakers; 
    });

    await page.goto(url + "#responses"); // going to "responses" tab of Google form
    await page.waitForSelector(".ThdJC.kaAt2.c0XF8e.KKjvXb.j7nIZb"); 
    let resData = await page.evaluate(() => {
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

        const speakContain = document.getElementsByClassName("o5ddgd")[4]; 
        const speakList = speakContain.getElementsByTagName("tbody")[0]; 
        const speakNames = speakList.getElementsByTagName("tr");
        for (const speaker of speakNames) {
            let row = speaker.innerText.split("	"); 
            let name = row[0], vote = row[1]; 
            if (!(name in best)) best[name] = 0; 
            best[name] += vote; 
        }
    
        return [mods, best]; 
    })

    for (let i = 0; i < data.length; i++) {
        let name = data[i]; 
        let nameList = data[i].split(" "); 
        for (let j = 1; j < nameList.length; j++) {
            let combo = nameList.slice(j-1, j+1).join(' '); // getting different 2-word combinations until find valid name
            if (combo in students) {
                let category = "subsequent speaking"; 
                if (i < 2 || name.toLowerCase().includes("main")) category = "main speaking"; 
                schools[students[combo]][category] += 1; 
                schools[students[combo]]["total"] += categories[category]; 
                found = true; 
                break; 
            }
        }
        if (!found) await askSchool(name);
    }

    let found = false; 
    while (!found) {
        let bestMod = null, highest = 0; 
        for (const modName in resData[0]) { // find most likely moderator name
            if (resData[0][modName] > highest) {
                highest = resData[0][modName]; 
                bestMod = modName; 
            }
        }

        if (bestMod in students) {
            schools[students[bestMod]]["moderating"]++; 
            schools[students[bestMod]]["total"] += categories["moderating"]; 
            found = true; 
        }

        delete mods[bestMod]; 
    }

    for (const name of resData[1]) {
        let found = false; 
        for (const school in schools) {
            if (name.includes(school)) {
                schools[school]["best speaker"] += 1; 
                schools[school]["total"] += categories["best speaker"]; 
                found = true; 
                break; 
            }
        }

        if (found) continue; 
        const nameList = name.split(" "); 
        for (let i = 1; i < nameList.length; i++) {
            let combo = nameList.slice(i-1, i+1).join(' '); // getting different 2-word combinations until find valid name
            if (combo in students) {
                schools[students[combo]]["best speaker"] += 1; 
                schools[students[combo]]["total"] += categories["best speaker"]; 
                found = true; 
                break; 
            }
        }
        if (!found) await askSchool(name); 
    }

}