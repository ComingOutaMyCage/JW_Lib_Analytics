import fetch from 'node-fetch';
import fs from 'fs';
import readline from 'readline';
import ProgressTracker from './js/ProgressTracker.js';
import { LoadJSON, SaveFile, _SaveAllMeetings, cleanMeeting, replaceBooleansWithIntegers, ISODateString, isObject, isString, isEmpty } from './Meetings/Functions.js';

var defaultStep = 4;
var allMeetings = null;
var authorization = "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InJRdmlDaV9yalVRc3lQVWhPRUxHaHpuU0F3aDFnb3NlY1lHOHVwVEUzbU0ifQ.eyJqdGkiOiI2YWJlMjRiMC1mNDVkLTQ1MmMtYTgyMS0yMTdmYmM3ZmZjMGYiLCJzdWIiOiJ3d3cuancub3JnLXB1YmxpYyIsImlzcyI6Imp3b3JnOmF1dGg6cHJkIiwiaWF0IjoxNjYwMDUzNjI5LCJuYmYiOjE2NjAwNTM2MjksImV4cCI6MTY2MDY1ODQyOSwiYXVkIjpbIk11bHRpU2l0ZVNlYXJjaDpwcmQiLCJKV0JNZWRpYXRvcjpwcmQiLCJBbGVydHM6cHJkIiwiT21uaVNlYXJjaDpwcmQiXSwicGVybXMiOnsib21uaS1zZWFyY2giOnsic2l0ZXMiOlsiancub3JnOnByZCIsIndvbDpwcmQiXSwiZmlsdGVycyI6WyJhbGwiLCJwdWJsaWNhdGlvbnMiLCJ2aWRlb3MiLCJhdWRpbyIsImJpYmxlIiwiaW5kZXhlcyJdLCJ0YWdzIjp7ImV4Y2x1ZGVkIjpbIlNlYXJjaEV4Y2x1ZGUiLCJXV1dFeGNsdWRlIl19fSwic2VhcmNoIjp7ImZhY2V0cyI6W3sibmFtZSI6InR5cGUiLCJmaWVsZCI6InRhZ3MiLCJ2YWx1ZXMiOlsidHlwZTp2aWRlbyJdfV19fX0.effcIfh8VH2_iz_Z_flEhnM9epNUpnATAAOOW1XiudrB0wU_QuXpE8apQPVkGNeyMB1vdZchCeJyHtmlLAIRjrNBBritJF1uP0jcYQVEGCtLXLy4oLQbJqE5wyYC87aSMrh8gJRTm4VhNVndOGj8cyaCKWXPLLBlkVJgVXIVryYy33EKNjCa6hjERODchBJ_D-mQWO9c868mmBjrk36WxQLWBs_JzklXbYIlzq1p-4d_Ov7qUSP3Gni6I8_sn92acynfpzSgl66wmll-jOWuktTZIHeREAYZdyE8xafYQtVVMDP7hO3UtJczDyXApgBXWvE5SqBRphHu1LvGRd85sA";
var countries = null;
var totalQueries = 0;
var languagesFull = null;

const mainDir = "./Meetings/";
const languagesFile = mainDir + "languages.json";
const meetingsFile = mainDir + "Meetings.json";
const boundsFile = mainDir + "country_bounds.json";
const cacheFile = mainDir + "cache.json";
const statsFile = mainDir + "init_data.json";

const scriptStartedTS = ISODateString(new Date());
const scriptStarted = new Date(scriptStartedTS);

async function loadAllmeetings() {
    console.log("Loading Meetings...");
    countries = LoadJSON(boundsFile);
    const meetings = LoadJSON(meetingsFile);
    for (const meeting of Object.values(meetings)) {
        if (!meeting.firstSeen)
            meeting.firstSeen = meeting.lastSeen || scriptStartedTS;
        if (!meeting.lastSeen)
            meeting.lastSeen = meeting.firstSeen;

        if (meeting.firstSeen.includes('T')) meeting.firstSeen = meeting.firstSeen.split('T')[0];
        if (meeting.lastSeen.includes('T')) meeting.lastSeen = meeting.lastSeen.split('T')[0];
        if (!meeting.lastVisit) meeting.lastVisit = meeting.lastSeen;
        if (meeting.lastVisit.includes('T')) meeting.lastVisit = meeting.lastVisit.split('T')[0];

        //cleanMeeting(meeting, true);
        if (meeting.geoId === meeting.properties.orgGuid) {
            delete meeting.properties.orgGuid;
        }
    }
    allMeetings = meetings;
    languagesFull = await FetchLanguages();

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
const fetchOptions = {
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
};
async function getMeetingsAtLoc(lat, lon, languageCode, incSuggestions){
    totalQueries++;

    let url = "&includeSuggestions=" + (incSuggestions ? 'true' : 'false') +
        "&latitude=" + lat.toString() + "&longitude=" + lon.toString();
    if(languageCode)
        url += "&searchLanguageCode=" + languageCode.toString();
    return await retryFetch("https://apps.jw.org/api/public/meeting-search/weekly-meetings?" + url, fetchOptions,
        3, 1000).then((response) => response.json()).then((data) => {

        if(data && data['geoLocationList']) {
            for (const meeting of Object.values(data['geoLocationList'])) {
                cleanMeeting(meeting);
            }
        }
        return data;
    });//.then((data) => data.category.subcategories.map(ele => ele.key))
}
async function getMeetings(lowerLat, lowerLon, upperLat, upperLon) {
    totalQueries++;

    if (totalQueries % 100 === 0) {
        SaveCache();
        SaveExpectations();
    }
    let size = upperLat - lowerLat;
    lowerLat -= size * 0.1;
    lowerLon -= size * 0.1;
    upperLat += size * 0.1;
    upperLon += size * 0.1;
    if (lowerLat === 0) lowerLat = -0.001;
    if (lowerLon === 0) lowerLon = -0.001;
    if (lowerLon === 0) upperLat = 0.001;
    if (upperLon === 0) upperLon = 0.001;

    let url = "lowerLatitude=" + lowerLat.toString() + "&lowerLongitude=" + lowerLon.toString() +
        "&upperLatitude=" + upperLat.toString() + "&upperLongitude=" + upperLon.toString();
    return await retryFetch("https://apps.jw.org/api/public/meeting-search/weekly-meetings?" + url, fetchOptions, 3, 1000).then((response) => response.json()).then((data) => {

        if (data && data['geoLocationList']) {
            for (const meeting of Object.values(data['geoLocationList'])) {
                cleanMeeting(meeting);
            }
        }
        return data;
    });//.then((data) => data.category.subcategories.map(ele => ele.key))
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
function isoDateNow(){
    return new Date(ISODateString(new Date()));
}
function FilterLastSeen(meetings, days, takeOlder = true){
    if (days <= 0) return meetings;
    const day = 24 * 60 * 60 * 1000;
    const filterDate = new Date(isoDateNow().getTime() - (days * day)); // Calculate the date 30 days ago

    return meetings.filter((meeting) => {
        const lastSeenDate = new Date(meeting.lastSeen);
        return lastSeenDate < filterDate === takeOlder;
    });
}
function FilterLastVisit(meetings, days, takeOlder = true){
    if (days <= 0) return meetings;
    const day = 24 * 60 * 60 * 1000;
    const filterDate = new Date(isoDateNow().getTime() - (days * day)); // Calculate the date 30 days ago

    return meetings.filter((meeting) => {
        const lastSeenDate = new Date(meeting.lastVisit);
        return lastSeenDate < filterDate === takeOlder;
    });
}
function DaysSinceLastSeen(meeting){
    const lastSeenDate = new Date(meeting.lastSeen);
    const diff = scriptStarted - lastSeenDate;
    return diff / (1000 * 60 * 60 * 24);
}
function DaysSinceLastVisit(meeting){
    const lastVisitDate = new Date(meeting.lastVisit);
    const diff = scriptStarted - lastVisitDate;
    return diff / (1000 * 60 * 60 * 24);
}


async function ZoomIntoDenseHalls(meetings = [], iteratePerLanguage = false, rescanSeenToday = false) {
    if(!Array.isArray(meetings))
        meetings = Object.values(meetings);

    //meetings = FilterLastSeen(meetings, 1);

    // Group meetings by their location.latitude and location.longitude
    const meetingGroups = GroupByLocation(meetings);

    // Filter groups and keep only where group count >= 12
    const groups = Array.from(meetingGroups.values()).filter(group => group.length >= 1/* && group.length <= 8*/);

    let index = 0;
    let estQueries = 0;
    for (const group of groups) {
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
    for (const group of groups) {
        const { latitude, longitude } = group[0].location;
        let thisIsPerLanguage = true;
        let uniqueLanguageCodes = new Set(group.map(meeting => meeting.properties.languageCode));
        if (!iteratePerLanguage && group.length <= 8 && uniqueLanguageCodes.size < 3) {
            thisIsPerLanguage = false;
            uniqueLanguageCodes = [null];
        }

        for (const languageCode of uniqueLanguageCodes) {

            let newPromise = new Promise(async (resolve, reject) => {
                let oldMeetings = group;
                if (thisIsPerLanguage) oldMeetings = oldMeetings.filter(meeting => meeting.properties.languageCode === languageCode);

                //Replace meeting = group[i] with allMeetings[meeting.geoId]
                for (let i = 0; i < oldMeetings.length; i++) {
                    const meeting = group[i];
                    oldMeetings[i] = allMeetings[meeting.geoId];
                }
                if(!rescanSeenToday) {
                    const anyUnseen = oldMeetings.some(m => m.lastVisit !== scriptStartedTS);
                    if (!anyUnseen) {
                        index++;
                        progress.updateProgress();
                        resolve();
                        return;
                    }
                }

                // Call async function getMeetingsAtLoc(lat, lon, languageCode, incSuggestions)
                const data = await getMeetingsAtLoc(latitude, longitude, languageCode, true);

                index++;
                let timeRemaining = progress.updateProgress();
                console.log(`Queries: ${totalQueries}\tTotal Locations: ` + Object.keys(allMeetings).length + `\tProgress: ${index}/${estQueries}\tEst ${timeRemaining}`);

                if(!data || data['geoLocationList'] === undefined){
                    resolve();
                    return;
                }
                let freshMeetings = data ? (data['geoLocationList'] ?? []) : [];
                let freshMeetingKeys = freshMeetings.map(meeting => meeting.geoId);

                for (const oldMeeting of oldMeetings) {
                    oldMeeting.lastVisit = scriptStartedTS;
                    if (freshMeetingKeys.includes(oldMeeting.geoId)) continue;
                    UpdateMeeting(oldMeeting);
                }

                // Call UpdateMeetingState on each of the meeting objects
                for (const freshMeeting of freshMeetings) {
                    freshMeeting.lastVisit = scriptStartedTS;
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
            if(index % 2500 == 0){
                oldCount = newCount;
                await Promise.all(promises);
                await _SaveAllMeetings(meetingsFile, allMeetings);
            }
        }
    }

    while(promises.length > 0) {
        await Promise.all(promises);
        promises = promises.filter(p => !p.isCompleted);
    }

    await SaveAllMeetings(allMeetings);
}
async function RescanMissingMeetings(meetings = [], maximum = 0, daysSince = 7) {
    if (!Array.isArray(meetings))
        meetings = Object.values(meetings);

    //Fix bad data
    // let inactiveMeetings = meetings.filter(meeting => !meeting.active);
    // let recentlySeen = FilterLastSeen(inactiveMeetings, 2, false);
    // for(const meeting of recentlySeen){
    //     UpdateMeetingState(meeting, false);
    //     meeting.active = true;
    // }

    let agedCount = 10000;
    while(agedCount > 2) {
        //Find meetings that we havent seen in $daysSince
        let agedMeetings = FilterLastSeen(meetings, daysSince, true);
        //Refine to only meetings we havent visited in $daysSince
        agedMeetings = FilterLastVisit(agedMeetings, daysSince, true);

        agedMeetings = agedMeetings.sort((a, b) => {
            const aDate = new Date(a.lastVisit || a.lastSeen);
            const bDate = new Date(b.lastVisit || b.lastSeen);
            return aDate - bDate;
        });

        if (maximum !== 0) {
            agedMeetings = agedMeetings.slice(0, maximum);
        }
        console.log(`Rescanning ${agedMeetings.length} meetings that haven't been seen in ${daysSince} days.`);
        agedCount = agedMeetings.length;

        await ZoomIntoDenseHalls(agedMeetings, true, daysSince <= 0);

        for (const meetingOld of agedMeetings) {

            const meeting = allMeetings[meetingOld.geoId];

            let daysSinceSeen = DaysSinceLastSeen(meeting);
            let daysSinceVisit = DaysSinceLastVisit(meeting);
            if ((daysSinceSeen - daysSinceVisit) > daysSince) {
                meeting.active = 0;
            }
        }

        if(daysSince <= 0) break;
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
    SaveFile(cacheFile, JSON.stringify(cache ?? {}));
}
function LoadCache(){
    if(fs.existsSync(cacheFile)) {
        cache = LoadJSON(cacheFile);
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
        let progressPath = `${mainDir}/progress/${countryCode}.json`;
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
function updateObject(objA, objB) {
    for (let key in objB) {
        if (objB.hasOwnProperty(key)) {
            objA[key] = objB[key];
        }
    }
    return objA;
}
function UpdateMeetingState(meeting, updateSeen){
    cleanMeeting(meeting);
    if (updateSeen)
        meeting.lastSeen = scriptStartedTS;
    meeting.active = 1;
    UpdateMeeting(meeting);
}
function UpdateMeeting(meeting){
    let key = meeting['geoId'];
    let existing = allMeetings[key];
    if(!existing){
        meeting.firstSeen = scriptStartedTS;
        meeting.lastSeen = scriptStartedTS;
        meeting.lastVisit = scriptStartedTS;
    }else {
        meeting = updateObject(existing, meeting);
    }
    allMeetings[key] = meeting;
}
async function FetchLanguages(){
    //check if file exists and is less than 30 day old
    if(fs.existsSync(languagesFile) && fs.statSync(languagesFile).mtimeMs > Date.now() - (86400000 * 30)) {
        console.log("Using cached languages");
        return LoadJSON(languagesFile);
    }
    //const url = "https://www.jw.org/en/languages/";
    const url = "https://apps.jw.org/api/public/meeting-search/languages?UILanguageCode=E";
    return await retryFetch(url, fetchOptions,
        3, 1000).then((response) => response.json()).then((data) => {

        if(data && data.length > 100) {
            let dict = {};
            data.forEach(item => {
                dict[item.languageCode.toUpperCase()] = item;
            });
            data = dict;

            SaveFile(languagesFile, JSON.stringify(data, null, 1));
        }else data = null;
        return data;
    });
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
    let totalSchedules = 0;
    let locations = GroupByLocation(allMeetings);
    let totalLocations = locations.size;
    let typeTotals = {};
    let languages = {};
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
        let type = getMeetingType(meeting);
        typeTotals[type] = (typeTotals[meeting.properties.orgType] ?? 0) + 1;
        incrementLanguages(languages, meeting.properties.languageCode);
        if(meeting.properties.relatedLanguageCodes) {
            for (const otherLang of meeting.properties.relatedLanguageCodes) {
                incrementLanguages(languages, otherLang);
            }
        }
        if(!isEmpty(meeting.properties.schedule))
            totalSchedules++;
        if(meeting.active)
            totalActive++;
        else
            totalInactive++;
    }
    let orphanHalls = [];
    let orphanCount = 0;
    for(const [key, meetings] of locations){
        const anyActive = meetings.some(m => m.active);
        if(anyActive) continue;
        orphanCount++;
        for(const meeting of meetings){
            orphanHalls.push(meeting);
        }
    }
    grids['orphans'] = orphanHalls;
    //Sort by key
    languages = Object.keys(languages).sort().reduce((obj, key) => { obj[key] = languages[key]; return obj; }, {});


    let stats = {
        typeTotals: typeTotals,
        total: totalActive + totalInactive,
        totalActive: totalActive,
        totalInactive: totalInactive,
        totalLocations: totalLocations,
        totalOrphans: orphanCount,
        totalWithSchedules: totalSchedules,
        languages: languages,
        grids: Object.keys(available_grids),
    };
    SaveFile(statsFile, JSON.stringify(stats, null, 1));
    let savePromises = [];
    for(const [key, meetings] of Object.entries(grids)){
        savePromises.push(SaveFile(`${mainDir}/grid/${key}.json`, JSON.stringify(meetings, null, 1)));
    }

    await _SaveAllMeetings(meetingsFile, allMeetings);

    await Promise.all(savePromises);
    await delay(1000);
}
function incrementLanguages(languages, langCode){
    langCode = langCode.toUpperCase();
    let row = languages[langCode];
    if(row === undefined) {
        let langData = languagesFull[langCode];
        if(langData === undefined) {
            console.log("Couldn't find any language for ", langCode);
            return;
        }
        languages[langCode] = row = {
            count: 0,
            name: langData.languageName,
            signLang: langData.isSignLanguage,
            writeLang: langData.writtenLanguageCode,
        };
    }
    row.count++;
}
const pregroupTranslations = [
    "pregroup",
    "pre group",
    "pre-group",
    "pregrupo",
    "pré-groupe",
    "vorguppen"
];
function getMeetingType(meeting){
    let type =  meeting.properties.orgType;
    if(type === "GROUP") {
        let name = meeting.properties.orgName;
        //scan pregroupTranslations
        for (const pregroupTranslation of pregroupTranslations) {
            if (name.toLowerCase().includes(pregroupTranslation))
                return meeting.properties.orgType = "PREGROUP";
        }
    }
    return type;
}

loadAllmeetings();
var cachedExpectation = LoadExpectations();
var cache = LoadCache();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
// Prompt user for function choice
async function promptUser() {
    rl.question(`Which function do you want to initiate?
1. get-all
2. scan-dense
3. revisit [max-items] [days-ago]
4. scan-innactive [max-items] [days-ago]
5. compile
6. validate-recent-losses
`, (answer) => {
        doOption(answer.split(' '));
        rl.close();
    });
}
async function doOption(args){
    while(allMeetings == null){
        console.log("Waiting for meetings to load...");
        await delay(100);
    }
    let option = args.length > 0 ? args[0].toLowerCase() : '';
    switch (option) {
        case 'get-all':
        case '1':
            GetAllMeetings(countries);
            break;
        case 'scan-dense':
        case '2':
            ZoomIntoDenseHalls(allMeetings);
            break;
        case 'revisit':
        case '3': {
            const maximum = parseInt(args[1]) || 0;
            const daysSince = parseInt(args[2]) || 7;

            RescanMissingMeetings(allMeetings, maximum, daysSince);
            break;
        }
        case 'scan-innactive':
        case '4': {
            const maximum = parseInt(args[1]) || 0;
            const daysSince = parseInt(args[2]) || -1;

            const inactiveMeetings = Object.values(allMeetings).filter(meeting => !meeting.active);

            RescanMissingMeetings(inactiveMeetings, maximum, daysSince);
            break;
        }
        case 'compile':
        case '5':
            SaveAllMeetings(allMeetings);
            break;
        case 'validate-recent-losses':
        case '6': {
            let inactiveMeetings = Object.values(allMeetings).filter(meeting => !meeting.active);
            inactiveMeetings = FilterLastSeen(inactiveMeetings, 1, false);

            RescanMissingMeetings(inactiveMeetings, 0, 0);
            break;
        }
        // case '6':
        //     RestoreFirstSeen();
        //     break;
        default:
            console.log('Invalid option. Please choose a valid function (1-3).');
            promptUser();
    }
}
//check args
if (process.argv.length > 2) {
    const args = process.argv.slice(2);
    doOption(args);
}else {
    promptUser();
}

async function RestoreFirstSeen(){
    //files in history/Meetings*.json
    const files = fs.readdirSync('./Meetings/history');
    for (const file of files) {
        if(!file.startsWith('Meetings')) continue;
        const json = fs.readFileSync(`./Meetings/history/${file}`);
        const fileMeetings = JSON.parse(json);
        for (const fileMeeting of Object.values(fileMeetings)) {
            let key = fileMeeting.geoId;
            let existing = allMeetings[key];
            if (new Date(fileMeeting.firstSeen) < new Date(existing.firstSeen))
                existing.firstSeen = fileMeeting.firstSeen;
        }
    }
    await SaveAllMeetings(allMeetings);
}