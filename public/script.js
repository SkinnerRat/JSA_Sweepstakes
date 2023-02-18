/* exported gapiLoaded */
/* exported gisLoaded */
/* exported handleAuthClick */
/* exported handleSignoutClick */

// TODO(developer): Set to client ID and API key from the Developer Console
const CLIENT_ID = '465003959133-icdkpohegb3mhcuat38t1g83litafflu.apps.googleusercontent.com';
const API_KEY = 'AIzaSyBXymw-4ST7577pbkVqMEUzdOzlyoCv274';

// Discovery doc URL for APIs used by the quickstart
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets.readonly';

let tokenClient;
let gapiInited = false;
let gisInited = false;

document.getElementById('authorizeButton').style.visibility = 'hidden';
document.getElementById('fileSelector').style.visibility = 'hidden'; 
document.getElementById('fileLabel').style.visibility = 'hidden'; 
document.getElementById('signoutButton').style.visibility = 'hidden';
document.getElementById('register').style.visibility = 'hidden'; 
document.getElementById('debate').style.visibility = 'hidden'; 
document.getElementById('activism').style.visibility = 'hidden'; 
document.getElementById('chgPts').style.visibility = 'hidden'; 
document.getElementById('popupContain').style.visibility = 'hidden'; 


// Callback after api.js is loaded.
function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

/**
    * Callback after the API client is loaded. Loads the
    * discovery doc to initialize the API.
    */
async function initializeGapiClient() {
    await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: [DISCOVERY_DOC],
    });
    gapiInited = true;
    maybeEnableButtons();
}

// Callback after Google Identity Services are loaded.
function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', // defined later
    });
    gisInited = true;
    maybeEnableButtons();
}

// Enables user interaction after all libraries are loaded.
function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        document.getElementById('authorizeButton').style.visibility = 'visible';
    }
}

// Sign in the user upon button click.
function handleAuthClick() {
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            throw (resp);
        }
        document.getElementById('signoutButton').style.visibility = 'visible';
        document.getElementById('fileLabel').style.visibility = 'visible';
        
        document.getElementById('register').style.visibility = 'visible'; 
        document.getElementById('debate').style.visibility = 'visible'; 
        document.getElementById('activism').style.visibility = 'visible'; 
        document.getElementById('chgPts').style.visibility = 'visible'; 
        document.getElementById('authorizeButton').innerText = 'Refresh';
    };

    if (gapi.client.getToken() === null) {
        // Prompt the user to select a Google Account and ask for consent to share their data
        // when establishing a new session.
        tokenClient.requestAccessToken({prompt: 'consent'});
    } else {
        // Skip display of account chooser and consent dialog for an existing session.
        tokenClient.requestAccessToken({prompt: ''});
    }
}

// Sign out the user upon button click.
function handleSignoutClick() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken('');
        document.getElementById('content').innerText = '';
        document.getElementById('authorizeButton').innerText = 'Authorize';
        document.getElementById('signoutButton').style.visibility = 'hidden';
        document.getElementById('fileSelector').style.visibility = 'hidden';
        
        document.getElementById('register').style.visibility = 'hidden'; 
        document.getElementById('debate').style.visibility = 'hidden'; 
        document.getElementById('activism').style.visibility = 'hidden'; 
        document.getElementById('chgPts').style.visibility = 'hidden'; 
    }
}

const categories = {}, schools = {}, students = {}; 

// read point categories for sweepstakes from inputted file
function readFile(input) {
    let file = input.files[0];
    document.getElementById("fileLabel").innerText = file.name; 

    const catDrop = document.getElementById("miscCat"); 
    let fileReader = new FileReader(); 
    fileReader.readAsText(file); 
    fileReader.onload = function() {
        res = fileReader.result.split(/,|\n/) 
        for (let i = 0; i < res.length; i+= 2) {
            categories[res[i]] = parseInt(res[i+1]);
            
            const addCat = document.createElement("input"); 
            addCat.type = "number"; 
            addCat.id = `mod ${res[i]}`; 
            addCat.placeholder = `# ${res[i]}`; 
            document.getElementById("chgPts").appendChild(addCat); 
        }
        const ent = document.createElement("input");
        ent.type = "button"; 
        ent.id = "chgEnter";
        ent.value = "Enter"; 
        ent.setAttribute("onclick", "changePts()"); 
        document.getElementById("chgPts").appendChild(ent); 
    }; 
    fileReader.onerror = function() {
        alert(fileReader.error);
    }; 
}

// sort schools in descending order by total points
function compareSchools(a, b) {
    let totalA = a[1].total; 
    let totalB = b[1].total; 

    if (totalA < totalB) return 1; 
    else if (totalA > totalB) return -1; 
    return 0; 
}

// make table to display schools
function makeTable(dict) {
    const tbl = document.createElement('table');
    tbl.style.border = '1px solid black';
    tbl.style.borderCollapse = 'collapse'; 

    // making dropdown for student select
    const container = document.getElementById('popupContain'); 
    const popup = document.createElement('div'); 
    const sel = document.createElement('select'); 
    const lbl = document.createElement('label'); 
    const ent = document.createElement('input'); 
    popup.id = 'popup'; 
    popup.style.visibility = 'inherit'; 
    sel.id = 'schoolSelect'; 
    lbl.id = 'selectLbl'; 
    lbl.setAttribute("for", "schoolSelect");
    ent.id = 'select_btn'; 
    ent.type = 'Submit'; 
    ent.value = 'Confirm'; 

    // styling for later use of modal
    container.style.backgroundColor = 'rgba(0,0,0,0.4)'; 
    container.style.zIndex = 1;
    container.style.position = 'fixed';
    container.style.height = '100%';
    container.style.width = '100%';
    container.style.left = 0;
    container.style.top = 0;
    container.style.overflow = 'auto';

    popup.style.backgroundColor = 'rgb(254,254,254)'; 
    popup.style.margin = '15% 20%'; 
    popup.style.padding = '20px';
    popup.style.border = '1px solid #888';
    popup.style.width = '60%%'; 

    // making rows for both table and modal
    for (let i = 0; i < Object.keys(dict).length+1; i++) {
        const tr = tbl.insertRow();
        for (let j = 0; j < Object.keys(Object.values(dict)[0]).length+1; j++) {
            const td = tr.insertCell();
            td.appendChild(document.createTextNode(`Cell I${i}/J${j}`));
            td.id = `Cell I${i}/J${j}`
            td.style.border = '1px solid black';
            td.style.padding = '0px 5px 0px 5px'; 
        }

        const popupOpt = document.createElement('option'); 
        popupOpt.id = `Opt ${i}`; 
        sel.appendChild(popupOpt);

        const chgOpt = document.createElement('option'); 
        chgOpt.id = `chgOpt ${i}`; 
        document.getElementById('miscSchool').appendChild(chgOpt); 
    }

    document.body.appendChild(tbl);
    popup.appendChild(lbl);
    popup.appendChild(sel); 
    popup.appendChild(ent); 
    container.append(popup); 
    document.body.appendChild(container); 
}

// populate empty table with school names, in order
function fillTable(str) {
    const strList = str.split("\n"); 

    for (let i = 0; i < Object.keys(schools).length+1; i++) {
        let schoolName = ""; 
        for (let j = 0; j < Object.keys(Object.values(schools)[0]).length+1; j++) {
            // making visible dictionary for school points in html
            if (i == 0) { // making title row 
                let catList = Object.keys(categories); 
                if (j == 0) document.getElementById("Cell I0/J0").innerText = "Schools"; 
                else if (j == Object.keys(Object.values(schools)[0]).length) document.getElementById(`Cell I0/J${j}`).innerText = "Total"; 
                else document.getElementById(`Cell I0/J${j}`).innerText = catList[j-1]; 
            } else { // actually adding schools
                const schoolList = strList[i-1].split(/,|:|}/); 
                if (j == 0) schoolName = schoolList[j];  
                document.getElementById(`Cell I${i}/J${j}`).innerText = schoolList[j*2]; 
            }    
        }
    }
}

// make dictionary keeping track of school participation
// also make dictionary linking students to schools (easy student-school lookup)
async function makeDict() { 
    const reg = document.getElementById('registration').value; 
    if (!reg) {
        alert("Please enter the registration spreadsheet for this convention"); 
        return false; 
    }

    let response;
    try {
        response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: reg.split('/')[5],
            range: 'A12:D337', // range of chapters & names registered 
            // TODO: make this user inputted
        });
    } catch (err) {
        alert("Invalid url"); 
        document.getElementById('registration').value = null; 
        return;
    }
    const range = response.result;
    if (!range || !range.values || range.values.length == 0) {
        document.getElementById('content').innerText = 'No values found.';
        return;
    }
    // hiding "enter" button to lock in registration spreadsheet
    document.getElementById('registerBtn').style.visibility = 'hidden'; 

    // making both dictionaries
    let schoolName; 
    for (const row of range.values) {
        if (row[0] != null && row[0].includes('(')) { // getting school names
            schoolName = row[0]
            schoolName = schoolName.split('(', 1)[0]; 
            schools[schoolName] = {}; 
            for (const cat in categories) schools[schoolName][cat] = 0; 
            schools[schoolName]["total"] = 0; 

        } else if (row[3] != null) {
            students[row[3]] = schoolName; 
        }
    }

    makeTable(schools);  
    
    // adding schools to dropdown select for student search
    let i = 1; 
    for (const school in schools) {        
        document.getElementById(`Opt ${i}`).value = school; 
        document.getElementById(`Opt ${i}`).text = school; 
        document.getElementById(`chgOpt ${i}`).value = school; 
        document.getElementById(`chgOpt ${i}`).text = school; 
        i++; 
    }
    
    // find string of longest length to justify all strings
    longestSchool = 0; 
    for (const school in schools) longestSchool = Math.max(longestSchool, school.length);

    const output = Object.entries(schools).reduce(
        (str, row) => `${str}${row[0].padEnd(longestSchool)}, ${JSON.stringify(row[1])}\n`, ""); 
    fillTable(output); 

    return true; 
}

// send POST request to scraper
async function calcForm() {
    const url = document.getElementById('formUrl').value; 
    if (!url) {
        alert("url missing"); 
        return; 
    }

    document.getElementById('formUrl').value = null; 

    xhttp = new XMLHttpRequest(); 
    xhttp.onreadystatechange = writeOut; 
    xhttp.open('POST', 'http://localhost:3000/public/page.html/', async=true); 
    xhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhttp.send(`url=${encodeURIComponent(url)}`);
}

// handle data scraped from inputted google form
async function writeOut() {
    if (xhttp.readyState === 4 && xhttp.status === 200) {
        let arrs = JSON.parse(xhttp.response);
        const names = arrs[0], mods = arrs[1], speaks = arrs[2]; 
        let found = false; 

        for (let i = 0; i < names.length; i++) {
            let name = names[i]; 
            found = false; 
            name = name.replace(/—|;|:|-|\(|\)|,/g, ' '); // get rid of punctuation marks
            
            // only give points for main speaking
            if (i < 2 || name.toLowerCase().includes("main")) {
                const nameList = name.split(" "); 
                for (let j = 1; j < nameList.length; j++) {
                    let combo = nameList.slice(j-1, j+1).join(' '); // getting different 2-word combinations until find valid name
                    if (combo in students) {
                        schools[students[combo]]["main speaking"] += 1; 
                        schools[students[combo]]["total"] += categories["main speaking"]; 
                        found = true; 
                        break; 
                    }
                }
                // can't find school for given name    
                if (!found) await askSchool(name, "main speaking"); // TO FIX: breaks half the time
            }
        }

        found = false; 
        while (!found) {
            let bestMod = null, highest = 0, num; 
            for (const modName in mods) { // find most likely moderator name
                num = parseInt(mods[modName]); 
                if (num > highest) {
                    highest = num; 
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

        console.log("found mod"); 

        let bSpeaks = [], highest = 0, numVotes; 
        for (const name in speaks) {
            numVotes = parseInt(speaks[name]); 
            if (numVotes > highest) {
                highest = numVotes; 
                bSpeaks = [name]; 
            } else if (numVotes == highest) bSpeaks.push(name); 
        }

        for (let name of bSpeaks) {
            found = false; 
            name = name.replace(/—|;|:|-|\(|\)|,/g, ' '); // get rid of punctuation marks
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
            if (!found) await askSchool(name, "best speaker"); 
             
        }

        console.log("found best speaker");
        const output = Object.entries(schools).sort(compareSchools).reduce(
            (str, row) => `${str}${row[0].padEnd(longestSchool)}, ${JSON.stringify(row[1])}\n`, ""); 
        fillTable(output); 
    } 
}

// creating modal asking for manual school input
async function askSchool(name, categ) {
    // make modal asking for manual school input visible
    document.getElementById('popupContain').style.visibility = 'visible';
    document.getElementById('schoolSelect').value = null; 
    document.getElementById('selectLbl').textContent = `Choose a school for: ${name}`; 

    await waitClick();  

    let school = document.getElementById('schoolSelect').value; 
    schools[school][categ] += 1; 
    schools[school]["total"] += categories[categ]; 
    
    console.log("logic finished"); 
    // resetting & removing modal
    document.getElementById('popupContain').style.visibility = 'hidden'; 
    console.log("finsihed"); 
}

// wait for user to click "confirm" on modal
async function waitClick() {
    return new Promise((resolve) => {
        this.document.getElementById('select_btn').addEventListener("click", () => {resolve(); });
    });
}

async function calcActive() {

}

async function changePts() {
    const school = document.getElementById("miscSchool").value; 

    if (school == null) {
        alert("Please select a valid school");
        return; 
    }

    for (const cat in categories) {
        let num = document.getElementById(`mod ${cat}`).value; // initially a string or "null" 
        if (num == "") num = 0;
        else num = parseInt(num); 
        schools[school][cat] += num; 
        schools[school]["total"] += num * categories[cat]; 
    }

    const output = Object.entries(schools).sort(compareSchools).reduce(
        (str, row) => `${str}${row[0].padEnd(longestSchool)}, ${JSON.stringify(row[1])}\n`, ""); 
    fillTable(output);
}


/* 
// update points from each new debate
async function calcDebate() {
    const formUrl = document.getElementById('formUrl').value; 
    const numResponses = document.getElementById('num_responses').value;

    if (!formUrl || !numResponses) {
        alert("Spreadsheet url or # of responses missing, please enter all values");
        return;  
    }

    // erasing entered values to prevent multiple entry
    document.getElementById('formUrl').value = null; 
    document.getElementById('num_responses').value = null; 
    let response;
    try {
        response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: formUrl.split('/')[5],
            range: `D1:F${numResponses}`,
        });
    } catch (err) {
        alert("Invalid url or Number of Responses.");
        return;
    }

    const range = response.result;
    if (!range || !range.values || range.values.length == 0) {
        alert('No values found.');
        return;
    }


    const mods = {}, bestSpeaker = {}
    for (const row of range.values) {
        let modName = row[0], vote = row[2]; // getting moderator name & best speaker vote
        if (!(modName in mods)) mods[modName] = 0; 
        mods[modName]++; 

        if (!(vote in bestSpeaker)) bestSpeaker[vote] = 0; 
        bestSpeaker[vote]++; 
    }
    
    let found = false; 
    while (!found) {
        let bestMod = null, highest = 0; 
        for (const modName in mods) { // find most likely moderator name
            if (mods[modName] > highest) {
                highest = mods[modName]; 
                bestMod = modName; 
            }
        }

        console.log(bestMod + " " + highest);
        if (bestMod in students) {
            schools[students[bestMod]]["moderating"]++; 
            schools[students[bestMod]]["total"] += categories["moderating"]; 
            found = true; 
        }

        delete mods[bestMod]; 
    }

    // finding best speaker(s)
    let best = [], highest = 0; 
    for (const speaker in bestSpeaker) {
        let numVotes = bestSpeaker[speaker]; 
        if (numVotes > highest) {
            best = [speaker]; 
            highest = numVotes; 
        } else if (numVotes == highest) best.append(speaker); 
    }

    for (const name of best) {
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

    const output = Object.entries(schools).sort(compareSchools).reduce(
        (str, row) => `${str}${row[0].padEnd(longestSchool)}, ${JSON.stringify(row[1])}\n`, ""); 
    fillTable(output); 
}


async function calcForm() {
    const url = document.getElementById('formUrl').value; 
    if (!url) {
        alert("url missing"); 
        return; 
    }

    document.getElementById('formUrl').value = null; 

    setTimeout(calc, 3000); 

    const output = Object.entries(schools).sort(compareSchools).reduce(
        (str, row) => `${str}${row[0].padEnd(longestSchool)}, ${JSON.stringify(row[1])}\n`, ""); 
    fillTable(output); 

}
*/

/* 
async function calc(url) {
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




    /* 
    // getting all speaker names from main form page
    let listContain = document.getElementsByClassName("s1H0X")[1]; // skip first list container as that is voting for sides
    let names = listContain.getElementsByClassName("oD4MFb oNpSq-G9bxwf oDFlZb"); 
    for (let i = 0; i < names.length; i++) {
        let name = names[i].getElementsByClassName("Hvn9fb zHQkBf")[0].value; 
        name.replace(/-|(|)|,/g, ''); // get rid of punctuation marks

        const nameList = name.split(" "); 
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
    

    // clicking on "responses" tab for moderators / best speaker
    document.getElementsByClassName("a6yTpb")[0].click();  
    await document.getElementsByClassName("ThdJC kaAt2 c0XF8e KKjvXb j7nIZb"); 


    // finding moderator
    const modContain = document.getElementsByClassName("o5ddgd")[2]; 
    const modList = modContain.getElementsByTagName("tbody")[0]; 
    const modNames = modList.getElementsByTagName("tr");
    const mods = {}; 
    for (const mod of modNames) {
        let row = mod.innerText.split("	"); 
        let modName = row[0], modCount = row[1]; 
        if (!(modName in mods)) mods[modName] = 0; 
        mods[modName] += modCount; 
    }
    
    let found = false; 
    while (!found) {
        let bestMod = null, highest = 0; 
        for (const modName in mods) { // find most likely moderator name
            if (mods[modName] > highest) {
                highest = mods[modName]; 
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


    const speakContain = document.getElementsByClassName("o5ddgd")[4]; 
    const speakList = speakContain.getElementsByTagName("tbody")[0]; 
    const speakNames = speakList.getElementsByTagName("tr");
    const best = {}; 
    for (const speaker of speakNames) {
        let row = speaker.innerText.split("	"); 
        let name = row[0], vote = row[1]; 
        if (!(name in best)) best[name] = 0; 
        best[name] += vote; 
    }
    
    for (const name of best) {
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

    window.close(); 
    
}
*/
