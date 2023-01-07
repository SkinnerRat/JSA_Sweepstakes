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

document.getElementById('authorize_button').style.visibility = 'hidden';
document.getElementById('file_selector').style.visibility = 'hidden'; 
document.getElementById('file_label').style.visibility = 'hidden'; 
document.getElementById('signout_button').style.visibility = 'hidden';
document.getElementById('sheet_url').style.visibility = 'hidden';
document.getElementById('num_responses').style.visibility = 'hidden';
document.getElementById('enter').style.visibility = 'hidden';

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
        document.getElementById('authorize_button').style.visibility = 'visible';
    }
}

// Sign in the user upon button click.
function handleAuthClick() {
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            throw (resp);
        }
        document.getElementById('signout_button').style.visibility = 'visible';
        document.getElementById('file_label').style.visibility = 'visible';
        document.getElementById('sheet_url').style.visibility = 'visible';
        document.getElementById('num_responses').style.visibility = 'visible';
        document.getElementById('enter').style.visibility = 'visible'; 
        document.getElementById('authorize_button').innerText = 'Refresh';
        //await makeDict();
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
        document.getElementById('authorize_button').innerText = 'Authorize';
        document.getElementById('signout_button').style.visibility = 'hidden';
        document.getElementById('file_selector').style.visibility = 'hidden';
        document.getElementById('sheet_url').style.visibility = 'hidden';
        document.getElementById('num_responses').style.visibility = 'hidden';
        document.getElementById('enter').style.visibility = 'hidden';
    }
}

// make table to display schools
function makeTable(dict) {
    const tbl = document.createElement('table');
    tbl.style.border = '1px solid black';
    tbl.style.borderCollapse = 'collapse'; 
  
    for (let i = 0; i < Object.keys(dict).length+1; i++) {
      const tr = tbl.insertRow();
      for (let j = 0; j < Object.keys(Object.values(dict)[0]).length+1; j++) {
        const td = tr.insertCell();
        td.appendChild(document.createTextNode(`Cell I${i}/J${j}`));
        td.id = `Cell I${i}/J${j}`
        td.style.border = '1px solid black';
        td.style.padding = '0px 5px 0px 5px'; 
      }
    }
    document.body.appendChild(tbl);
}

// sort schools in descending order by total points
function compareSchools(a, b) {
    let totalA = a[1].total; 
    let totalB = b[1].total; 

    if (totalA < totalB) return 1; 
    else if (totalA > totalB) return -1; 
    return 0; 
}
  
const categories = {}, schools = {}, students = {}; 
let longest; 

// read point categories for sweepstakes from inputted file
function readFile(input) {
    let file = input.files[0];
    document.getElementById("file_label").innerText = file.name; 

    let fileReader = new FileReader(); 
    fileReader.readAsText(file); 
    fileReader.onload = function() {
        res = fileReader.result.split(/,|\n/) 
        for (let i = 0; i < res.length; i+= 2) {
            categories[res[i]] = parseInt(res[i+1]); 
        }
        makeDict();
    }; 
    fileReader.onerror = function() {
        alert(fileReader.error);
    }; 
}

// populate empty table with school names, in order
function fillTable(str) {
    const strList = str.split("\n"); 

    for (let i = 0; i < Object.keys(schools).length+1; i++) {
        for (let j = 0; j < Object.keys(Object.values(schools)[0]).length+1; j++) {
            if (i == 0) {
                let catList = Object.keys(categories); 
                if (j == 0) document.getElementById("Cell I0/J0").innerText = "Schools"; 
                else if (j == Object.keys(Object.values(schools)[0]).length) document.getElementById(`Cell I0/J${j}`).innerText = "Total"; 
                else document.getElementById(`Cell I0/J${j}`).innerText = catList[j-1]; 
            } else {
                const schoolList = strList[i-1].split(/,|:|}/);  
                document.getElementById(`Cell I${i}/J${j}`).innerText = schoolList[j*2]; 
            }
        }
    }
}

// make dictionary keeping track of school participation
// also make dictionary linking students to schools (easy student-school lookup)
async function makeDict() { 
    let response;
    try {
        response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: '1HoceuRdtyhuFlUaa-Lg2NkzPXBSK77t3tMWNji6DT1o',
            range: 'A11:B562',
        });
    } catch (err) {
        document.getElementById('content').innerText = err.message;
        return;
    }
    const range = response.result;
    if (!range || !range.values || range.values.length == 0) {
        document.getElementById('content').innerText = 'No values found.';
        return;
    }

    let schoolName; 
    for (const row of range.values) {
        if (row[0] != null && row[0].includes('(')) {
            schoolName = row[0]
            schoolName = schoolName.split('(', 1)[0]; 
            schools[schoolName] = {}; 
            for (const cat in categories) schools[schoolName][cat] = 0; 
            schools[schoolName]["total"] = 0; 
        } else if (row[1] != null) {
            students[row[1]] = schoolName; 
        }
    }

    // find string of longest length to justify all strings
    longestSchool = 0; 
    for (const school in schools) longestSchool = Math.max(longestSchool, school.length);

    makeTable(schools); 
    const output = Object.entries(schools).reduce(
        (str, row) => `${str}${row[0].padEnd(longestSchool)}, ${JSON.stringify(row[1])}\n`, ""); 
    fillTable(output); 
}

// update points from each new debate
async function calcDebate() {
    const sheetUrl = document.getElementById('sheet_url').value; 
    const numResponses = document.getElementById('num_responses').value;

    if (!sheetUrl || !numResponses) {
        alert("Spreadsheet url or # of responses missing, please enter all values");
        return;  
    }

    document.getElementById('sheet_url').value = null; 
    document.getElementById('num_responses').value = null; 
    let response;
    try {
        response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: sheetUrl.split('/')[5],
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
            }
        }
    }

    const output = Object.entries(schools).sort(compareSchools).reduce(
        (str, row) => `${str}${row[0].padEnd(longestSchool)}, ${JSON.stringify(row[1])}\n`, ""); 
    fillTable(output); 
}
