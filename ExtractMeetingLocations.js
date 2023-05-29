import fetch from 'node-fetch';
import fs from 'fs';
import readline from 'readline';
import ProgressTracker from './js/ProgressTracker.js';

var defaultStep = 4;
var allMeetings = {};
var authorization = "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InJRdmlDaV9yalVRc3lQVWhPRUxHaHpuU0F3aDFnb3NlY1lHOHVwVEUzbU0ifQ.eyJqdGkiOiI2YWJlMjRiMC1mNDVkLTQ1MmMtYTgyMS0yMTdmYmM3ZmZjMGYiLCJzdWIiOiJ3d3cuancub3JnLXB1YmxpYyIsImlzcyI6Imp3b3JnOmF1dGg6cHJkIiwiaWF0IjoxNjYwMDUzNjI5LCJuYmYiOjE2NjAwNTM2MjksImV4cCI6MTY2MDY1ODQyOSwiYXVkIjpbIk11bHRpU2l0ZVNlYXJjaDpwcmQiLCJKV0JNZWRpYXRvcjpwcmQiLCJBbGVydHM6cHJkIiwiT21uaVNlYXJjaDpwcmQiXSwicGVybXMiOnsib21uaS1zZWFyY2giOnsic2l0ZXMiOlsiancub3JnOnByZCIsIndvbDpwcmQiXSwiZmlsdGVycyI6WyJhbGwiLCJwdWJsaWNhdGlvbnMiLCJ2aWRlb3MiLCJhdWRpbyIsImJpYmxlIiwiaW5kZXhlcyJdLCJ0YWdzIjp7ImV4Y2x1ZGVkIjpbIlNlYXJjaEV4Y2x1ZGUiLCJXV1dFeGNsdWRlIl19fSwic2VhcmNoIjp7ImZhY2V0cyI6W3sibmFtZSI6InR5cGUiLCJmaWVsZCI6InRhZ3MiLCJ2YWx1ZXMiOlsidHlwZTp2aWRlbyJdfV19fX0.effcIfh8VH2_iz_Z_flEhnM9epNUpnATAAOOW1XiudrB0wU_QuXpE8apQPVkGNeyMB1vdZchCeJyHtmlLAIRjrNBBritJF1uP0jcYQVEGCtLXLy4oLQbJqE5wyYC87aSMrh8gJRTm4VhNVndOGj8cyaCKWXPLLBlkVJgVXIVryYy33EKNjCa6hjERODchBJ_D-mQWO9c868mmBjrk36WxQLWBs_JzklXbYIlzq1p-4d_Ov7qUSP3Gni6I8_sn92acynfpzSgl66wmll-jOWuktTZIHeREAYZdyE8xafYQtVVMDP7hO3UtJczDyXApgBXWvE5SqBRphHu1LvGRd85sA";
var countries = LoadJSON("./Meetings/country_bounds.json");
var totalQueries = 0;

var scriptStarted = new Date();
var scriptStartedTS = scriptStarted.toISOString();

allMeetings = LoadJSON("./Meetings/Meetings.json");
for (const meeting of Object.values(allMeetings)){
    //meeting.active = false;
    if (!meeting.firstSeen)
        meeting.firstSeen = scriptStartedTS;
    if (!meeting.lastSeen)
        meeting.lastSeen = scriptStartedTS;
}
// SaveAllMeetings(allMeetings);
// throw '';

const zeroPad = (num, places) => String(num).padStart(places, '0')
const delay = (ms) => new Promise((resolve) => setTimeout(() => resolve(), ms));
function roundDownToNearest(num, step) { return Math.floor(num / step) * step; }
function roundUpToNearest(num, step) { return Math.ceil(num / step) * step; }

const retryFetch = (
    url,
    fetchOptions = {},
    retries = 3,
    retryDelay = 1000,
    timeout
) => {
    return new Promise((resolve, reject) => {
        // check for timeout
        if (timeout) setTimeout(() => reject('error: timeout'), timeout);

        const wrapper = (n) => {
            fetch(url, fetchOptions)
                .then((res) => {
                    if (res.ok) {
                        resolve(res)
                    } else {
                        throw new Error('Response not OK');
                    }
                })
                .catch(async (err) => {
                    if (n > 0) {
                        await delay(retryDelay);
                        wrapper(--n);
                    } else {
                        reject(err);
                    }
                });
        };
        wrapper(retries);
    });
};

//var forCountry = {};
var cachedExpectation = LoadExpectations();
var cache = LoadCache();

class SearchedLocations{
    static points = [];

    static AddPoint(key){
        this.points.push(key);
    }
    static PointWithinDist(key){
        return this.points.includes(key);
    }

    static _LatLonDist(lat1, lon1, lat2, lon2, unit) {
        let radlat1 = Math.PI * lat1/180;
        let radlat2 = Math.PI * lat2/180;
        let theta = lon1-lon2;
        let radtheta = Math.PI * theta/180;
        let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        if (dist > 1) {
            dist = 1;
        }
        dist = Math.acos(dist);
        dist = dist * 180/Math.PI;
        dist = dist * 60 * 1.1515;
        switch (unit){
            case "K": return dist * 1.609344;
            case "N": return dist * 0.8684;
        }
        return dist
    }
}
async function getMeetingsAtLoc(lat, lon, languageCode, incSuggestions){
    totalQueries++;

    let url = "&includeSuggestions=" + (incSuggestions ? 'true' : 'false') +
        "&latitude=" + lat.toString() + "&longitude=" + lon.toString();
    if(languageCode)
        url += "&searchLanguageCode=" + languageCode.toString();
    return await retryFetch("https://apps.jw.org/api/public/meeting-search/weekly-meetings?" + url,
        {
            "headers": {
                "accept": "application/json, text/javascript, */*; q=0.01",
                "accept-language": "en-US,en;q=0.9",
                "authorization": authorization,
                //"cache-control": "no-cache",
                //"pragma": "no-cache",
                "sec-ch-ua": "\"Chromium\";v=\"104\", \" Not A;Brand\";v=\"99\", \"Google Chrome\";v=\"104\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "cross-site",
                "Referer": "https://www.jw.org/",
                "Referrer-Policy": "strict-origin-when-cross-origin"
            },
            "body": null,
            "method": "GET"
        }, 3, 1000).then((response) => response.json()).then((data) => {

        if(data && data['geoLocationList']) {
            for (const meeting of Object.values(data['geoLocationList'])) {
                cleanMeeting(meeting);
            }
        }
        return data;
    });//.then((data) => data.category.subcategories.map(ele => ele.key))
}
async function getMeetings(lowerLat, lowerLon, upperLat, upperLon){
    totalQueries++;

    if(totalQueries % 100 === 0) {
        SaveCache();
        SaveExpectations();
    }
    let size = upperLat - lowerLat;
    lowerLat -= size * 0.1;
    lowerLon -= size * 0.1;
    upperLat += size * 0.1;
    upperLon += size * 0.1;
    if(lowerLat === 0) lowerLat = -0.001;
    if(lowerLon === 0) lowerLon = -0.001;
    if(lowerLon === 0) upperLat = 0.001;
    if(upperLon === 0) upperLon = 0.001;

    let url = "lowerLatitude=" + lowerLat.toString() + "&lowerLongitude=" + lowerLon.toString() +
        "&upperLatitude=" + upperLat.toString() + "&upperLongitude=" +  upperLon.toString();
    return await retryFetch("https://apps.jw.org/api/public/meeting-search/weekly-meetings?" + url,
{
        "headers": {
            "accept": "application/json, text/javascript, */*; q=0.01",
            "accept-language": "en-US,en;q=0.9",
            "authorization": authorization,
            //"cache-control": "no-cache",
            //"pragma": "no-cache",
            "sec-ch-ua": "\"Chromium\";v=\"104\", \" Not A;Brand\";v=\"99\", \"Google Chrome\";v=\"104\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "cross-site",
            "Referer": "https://www.jw.org/",
            "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        "body": null,
        "method": "GET"
    }, 3, 1000).then((response) => response.json()).then((data) => {

        if(data && data['geoLocationList']) {
            for (const meeting of Object.values(data['geoLocationList'])) {
                cleanMeeting(meeting);
            }
        }
        return data;
    });//.then((data) => data.category.subcategories.map(ele => ele.key))
}
function cleanMeeting(meeting){
    if (meeting.properties.schedule !== undefined && !(meeting.properties.schedule instanceof String)){
        meeting.properties.schedule = formatSchedule(meeting.properties.schedule);
    }

    if(meeting.properties.memorialAddress === undefined) return;
    if(!meeting.properties.orgTransliteratedName.length)
        delete meeting.properties.orgTransliteratedName;
    if(!meeting.properties.transliteratedAddress.length)
        delete meeting.properties.transliteratedAddress;
    if(!meeting.properties.schedule.futureDate)
        delete meeting.properties.schedule.futureDate;
    if(!meeting.properties.schedule.changeStamp)
        delete meeting.properties.schedule.changeStamp;
    if(meeting.properties.relatedLanguageCodes && !meeting.properties.relatedLanguageCodes.length)
        delete meeting.properties.relatedLanguageCodes;
    delete meeting.properties.schedule;
    delete meeting.properties.memorialAddress;
    delete meeting.properties.memorialTime;


}
function formatSchedule(schedule) {
    const days = ['None', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const weekend = schedule.current.weekend;
    const midweek = schedule.current.midweek;

    let weekendString = `${days[weekend.weekday]} ${weekend.time} `;
    let midweekString = `${days[midweek.weekday]} ${midweek.time}`;
    if(weekend.weekday === 0) weekendString = '';
    if(midweek.weekday === 0) midweekString = '';

    return `${weekendString}${midweekString}`;
}

function GroupByLocation(meetings = []){
    if(!Array.isArray(meetings))
        meetings = Object.values(meetings);
    const meetingGroups = new Map();
    for (const meeting of meetings) {
        const { latitude, longitude } = meeting.location;
        const key = `${latitude},${longitude}`;

        if (!meetingGroups.has(key)) {
            meetingGroups.set(key, []);
        }
        meetingGroups.get(key).push(meeting);
    }
    return meetingGroups;
}

function FilterLastSeen(meetings, days, takeOlder = true){
    const day = 24 * 60 * 60 * 1000;
    const filterDate = new Date(Date.now() - (days * day)); // Calculate the date 30 days ago

    return meetings.filter((meeting) => {
        const lastSeenDate = new Date(meeting.lastSeen);
        return lastSeenDate < filterDate === takeOlder;
    });
}
function DaysSinceLastSeen(meeting){
    const lastSeenDate = new Date(meeting.lastSeen);
    const diff = scriptStarted - lastSeenDate;
    return diff / (1000 * 60 * 60 * 24);
}

async function ZoomIntoDenseHalls(meetings = [], iteratePerLanguage = false) {
    if(!Array.isArray(meetings))
        meetings = Object.values(meetings);

    //meetings = FilterLastSeen(meetings, 1);

    // Group meetings by their location.latitude and location.longitude
    const meetingGroups = GroupByLocation(meetings);

    // Filter groups and keep only where group count >= 12
    const denseGroups = Array.from(meetingGroups.values()).filter(group => group.length >= 1 && group.length <= 8);

    let index = 0;
    let estQueries = 0;
    for (const group of denseGroups) {
        let uniqueLanguageCodes = new Set(group.map(meeting => meeting.properties.languageCode));
        if (!iteratePerLanguage && group.length <= 8 && uniqueLanguageCodes.size < 3) {
            uniqueLanguageCodes = new Set([null]);
        }
        estQueries += uniqueLanguageCodes.size;
    }
    const progress = new ProgressTracker(estQueries);
    let oldCount = Object.keys(allMeetings).length;

    let promises = [];
    // Iterate over each location and language
    for (const group of denseGroups) {
        const { latitude, longitude } = group[0].location;
        let uniqueLanguageCodes = new Set(group.map(meeting => meeting.properties.languageCode));
        if (!iteratePerLanguage && group.length <= 8 && uniqueLanguageCodes.size < 3) {
            uniqueLanguageCodes = [null];
        }
        for (const languageCode of uniqueLanguageCodes) {

            let newPromise = new Promise(async (resolve, reject) => {
                // Call async function getMeetingsAtLoc(lat, lon, languageCode, incSuggestions)
                const data = await getMeetingsAtLoc(latitude, longitude, languageCode, true);

                index++;
                let timeRemaining = progress.updateProgress();
                console.log(`Queries: ${totalQueries}\tTotal Locations: ` + Object.keys(allMeetings).length + `\tProgress: ${index}/${estQueries}\tEst ${timeRemaining}`);

                if(!data || data['geoLocationList'] === undefined){
                    return;
                }
                let freshMeetings = data ? (data['geoLocationList'] ?? []) : [];

                // Call UpdateMeetingState on each of the meeting objects
                for (const freshMeeting of freshMeetings) {
                    freshMeeting.lastVisit = scriptStarted;
                    UpdateMeetingState(freshMeeting, true);
                }

                resolve();
            });
            newPromise.then(() => { newPromise.isCompleted = true; });
            promises.push(newPromise);
            if(promises.length >= 50){
                await Promise.any(promises);
            }
            promises = promises.filter(p => !p.isCompleted);

            let newCount = Object.keys(allMeetings).length;
            if(index % 2500 == 0 && oldCount !== newCount){
                oldCount = newCount;
                await Promise.all(promises);
                await _SaveAllMeetings(allMeetings);
            }
        }
    }

    while(promises.length > 0) {
        await Promise.all(promises);
        promises = promises.filter(p => !p.isCompleted);
    }

    await SaveAllMeetings(allMeetings);
}
async function RescanMissingMeetings(meetings = [], daysSince = 7) {
    if (!Array.isArray(meetings))
        meetings = Object.values(meetings);

    //Fix bad data
    let inactiveMeetings = meetings.filter(meeting => !meeting.active);
    let recentlySeen = FilterLastSeen(inactiveMeetings, 2, false);
    for(const meeting of recentlySeen){
        UpdateMeetingState(meeting, false);
        meeting.active = true;
    }

    let agedMeetings = FilterLastSeen(meetings, daysSince, true);

    await ZoomIntoDenseHalls(agedMeetings, true);

    for (const meetingOld of agedMeetings) {

        const meeting = allMeetings[meetingOld.geoId];

        if (DaysSinceLastSeen(meeting) > daysSince) {
            meeting.active = false;
        }
    }

    await SaveAllMeetings(allMeetings);
}
async function ProcessGrid(country, forCountry, sw, ne, step = null, recursivePercent = "", denseRegion = null) {
    let latMin = sw["lat"];
    let latMax = ne["lat"];
    let lonMin = sw["lon"];
    let lonMax = ne["lon"];
    if(step === 0 || latMin === latMax) return;
    if (step == null) step = defaultStep;
    for (let lat = latMin; lat < latMax; lat += step) {
        let percentLat = (lat - latMin) / ((latMax - latMin) + 0.0);
        for (let lon = lonMin; lon < lonMax; lon += step) {
            let percentLon = (lat - latMin) / (latMax - latMin);
            let area = {lat: lat, lon: lon, latMax: lat + step, lonMax: lon + step};
            let key = area.lat + "," + area.lon + "," + area.latMax + "," + area.lonMax;
            if(step === defaultStep) {
                if (SearchedLocations.PointWithinDist(key))
                    continue;
                SearchedLocations.AddPoint(key);
            }
            let expectation = cachedExpectation[key] ?? null;
            // if (area.lat === 0 || area.latMax === 0/* || area.lonMax === 0 || area.lon === 0*/) {
            //     expectation = null;
            //     cache[key] = null;
            // }
            if(expectation === 0) continue;
            let km = step * 111;
            let percent = recursivePercent + " " + Math.round(km) + "km " + zeroPad(Math.round(((percentLon + percentLat) / 2.0) * 100), 2) + "%";
            if(km <= 0.05 && expectation == '+')
                expectation = null;
            let data = cache[key] ?? null;
            if(expectation !== "+") {
                if(!data) {
                    //await new Promise(delay => setTimeout(delay, 3));
                    for(let i = 0; i < 10; i++) {
                        data = await getMeetings(lat, lon, lat + step, lon + step);
                        if(data && data['geoLocationList'] !== undefined){
                            break;
                        }
                        console.error("Failed, retry " + (i + 1));
                        await delay(100);
                    }
                    cache[key] = data;
                }
                let items = data ? (data['geoLocationList'] ?? []) : [];
                if (items) {
                    for (const item of items) {
                        forCountry[item['geoId']] = item;
                    }
                }
                if(km <= 0.05)
                    cachedExpectation[key] = items.length;
                else if (data['hasMoreResults'] == true || (items.length >= 20) || (items.length > 10 && km > 3) || (items.length > 0 && km > 100) || ((country.startsWith("USA") || denseRegion) && km > 50))
                    expectation = "+";
                else if(items.length > 0)
                    cachedExpectation[key] = items.length;
                else
                    cachedExpectation[key] = 0;
                console.log(`Queries: ${totalQueries}\t${country} Locations: ` + Object.keys(forCountry).length + "\tTotal Locations: " + Object.keys(allMeetings).length + "\t" + percent);
            }
            if(expectation === "+"){
                if (data && (data['hasMoreResults'] == true || data['geoLocationList'].length >= 18))
                    denseRegion = true;
                cachedExpectation[key] = "+";
                let substep = Math.min(latMax - lat, step * 0.5);
                await ProcessGrid(
                    country,
                    forCountry,
                    {lat: lat, lon: lon},
                    {lat: Math.min(lat + step, latMax), lon: Math.min(lon + step, lonMax)},
                    substep,
                    percent,
                    denseRegion);
            }
        }
    }
}

function SaveCache(){
    SaveFile("./Meetings/cache.json", JSON.stringify(cache ?? {}));
}
function LoadCache(){
    if(fs.existsSync("./Meetings/cache.json")) {
        cache = LoadJSON("./Meetings/cache.json");
    } else cache = {};
    return cache
}

function SaveExpectations(){
    SaveFile("./Meetings/Expectations.json", JSON.stringify(cachedExpectation ?? {}, null, 2));
}
function LoadExpectations(){
    let filename = "./Meetings/Expectations.json";
    if(fs.existsSync(filename)) {
        cachedExpectation = LoadJSON(filename);
    }else cachedExpectation = {};
    return cachedExpectation
}
async function GetAllMeetings(countries){

    await fs.mkdir("./Meetings/progress", (err)=>{
        if (err) { console.error(err); return; };
        console.log("Meetings/progress dir has been created");
    });

    let promises = [];
    for(const [countryCode, country] of Object.entries(countries)) {
        let latMin = country['sw']["lat"];
        let latMax = country['ne']["lat"];
        let lonMin = country['sw']["lon"];
        let lonMax = country['ne']["lon"];
        latMin = roundDownToNearest(latMin, defaultStep);
        lonMin = roundDownToNearest(lonMin, defaultStep);
        latMax = roundUpToNearest(latMax, defaultStep);
        lonMax = roundUpToNearest(lonMax, defaultStep);

        var crossesZero = (latMin < 0 && latMax > 0) || (lonMin < 0 && lonMax > 0);
        let progressPath = `./Meetings/progress/${countryCode}.json`;
        if(fs.existsSync(progressPath)/* && !crossesZero*/) {
            console.log("Already processed " + countryCode);
            let forCountry = LoadJSON(progressPath);
            if(!forCountry) forCountry = {};

            let step = defaultStep;
            for (let lat = latMin; lat < latMax; lat += step) {
                for (let lon = lonMin; lon < lonMax; lon += step) {
                    let area = {lat: lat, lon: lon, latMax: lat + step, lonMax: lon + step};
                    let key = area.lat + "," + area.lon + "," + area.latMax + "," + area.lonMax;

                    if (SearchedLocations.PointWithinDist(key))
                        continue;
                    SearchedLocations.AddPoint(key);
                }
            }

            for(const [key, meeting] of Object.entries(forCountry))
                UpdateMeetingState(meeting, false);
        }
        else
        {
            let newPromise = new Promise(async (resolve, reject) => {
                console.log("Downloading " + countryCode);
                let forCountry = {};
                await ProcessGrid(countryCode, forCountry,
                    {lat: latMin, lon: lonMin},
                    {lat: latMax, lon: lonMax});

                SaveFile(progressPath, JSON.stringify(forCountry, null, 2));
                for(const [key, meeting] of Object.entries(forCountry))
                    UpdateMeetingState(meeting, true);

                resolve();
            });
            newPromise.then(() => { newPromise.isCompleted = true; });
            promises.push(newPromise);
            if(promises.length >= 8){
                await Promise.any(promises);
            }
            promises = promises.filter(p => !p.isCompleted);
        }
    }
    await Promise.all(promises);
    SaveExpectations();
    await SaveAllMeetings(allMeetings);
}
function UpdateMeetingState(meeting, updateSeen){
    cleanMeeting(meeting);
    if (updateSeen)
        meeting.lastSeen = scriptStartedTS;
    meeting.active = true;
    let key = meeting['geoId'];
    let existing = allMeetings[key];
    if(!existing){
        meeting.firstSeen = scriptStartedTS;
    }
    allMeetings[key] = meeting;
}
async function SaveAllMeetings(allMeetings){
    allMeetings = Object.fromEntries(
        Object.entries(allMeetings).sort(([,a],[,b]) => (a.location.latitude + a.location.longitude) - (b.location.latitude + b.location.longitude))
    );
    let grids = {};
    grids['deleted'] = [];
    let available_grids = {};
    let totalActive = 0;
    let totalInactive = 0;
    let locations = GroupByLocation(allMeetings);
    let totalLocations = locations.size;
    let typeTotals = {};
    let languages = new Set();
    for (const meeting of Object.values(allMeetings)){
        cleanMeeting(meeting);
        let lat = meeting.location.latitude;
        let lon = meeting.location.longitude;
        lat = roundDownToNearest(lat, 8);
        lon = roundDownToNearest(lon, 8);
        let key = `${lat},${lon}`;
        if(grids[key] === undefined)
            grids[key] = [];
        grids[key].push(meeting);
        if (!meeting.active)
            grids['deleted'].push(meeting);
        available_grids[key] = true;
        typeTotals[meeting.properties.orgType] = (typeTotals[meeting.properties.orgType] ?? 0) + 1;
        languages.add(meeting.properties.languageCode);
        if(meeting.properties.relatedLanguageCodes) {
            for (const otherLang of meeting.properties.relatedLanguageCodes) {
                languages.add(otherLang);
            }
        }
        if(meeting.active)
            totalActive++;
        else
            totalInactive++;
    }
    languages = [...languages];
    languages.sort();
    let stats = {
        typeTotals: typeTotals,
        total: totalActive + totalInactive,
        totalActive: totalActive,
        totalInactive: totalInactive,
        totalLocations: totalLocations,
        languages: [...languages],
        grids: Object.keys(available_grids),
    };
    SaveFile('./Meetings/init_data.json', JSON.stringify(stats, null, 1));
    let savePromises = [];
    for(const [key, meetings] of Object.entries(grids)){
        savePromises.push(SaveFile(`./Meetings/grid/${key}.json`, JSON.stringify(meetings, null, 1)));
    }

    await _SaveAllMeetings(allMeetings);

    await Promise.all(savePromises);
    await delay(1000);
}
async function _SaveAllMeetings(allMeetings){
    const filePath = `./Meetings/Meetings.json`; // Replace with the actual file path
    // Get the last modified date of the file
    const stats = fs.statSync(filePath);
    const lastModifiedDate = stats.mtime.toISOString().slice(0, 10);
    const currentDate = new Date().toISOString().slice(0, 10);
    if (lastModifiedDate !== currentDate) {
        const destinationFilePath = `./Meetings/history/Meetings ${lastModifiedDate}.json`;
        fs.copyFileSync(filePath, destinationFilePath);
        console.log(`File copied to ${destinationFilePath}`);
    }
    await SaveFile(filePath, JSON.stringify(allMeetings, null, 1));
}

function SaveFile(filename, contents){
    return fs.writeFile(filename + ".new", contents, (err) => {
        if (err) {
            console.error(err); return;
        }
        try
        {
            if (fs.existsSync(filename + ".old"))
                fs.renameSync(filename, filename + ".old");
            fs.renameSync(filename + ".new", filename);
            if (fs.existsSync(filename + ".old"))
                fs.unlinkSync(filename + ".old");
            console.log(`${filename} has been created`);
        } catch (ex) { console.error(ex); }
    });
}
function LoadJSON(filename){
    let json = fs.readFileSync(filename, (err) => {
        if (err) { console.error(err); return; };
    });
    return JSON.parse(json);
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
// Prompt user for function choice
async function promptUser() {
    rl.question('Which function do you want to initiate?\n1. Get All\n2. Scan Dense\n3. Scan Missing\n4. Redo Grid\n', (answer) => {
        switch (answer) {
            case '1':
                GetAllMeetings(countries);
                break;
            case '2':
                ZoomIntoDenseHalls(allMeetings);
                break;
            case '3':
                RescanMissingMeetings(allMeetings);
                break;
            case '4':
                SaveAllMeetings(allMeetings);
                break;
            default:
                console.log('Invalid option. Please choose a valid function (1-3).');
                promptUser();
        }
        rl.close();
    });
}
promptUser();