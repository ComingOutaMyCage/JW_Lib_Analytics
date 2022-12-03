import fetch from 'node-fetch';
import fs from 'fs';

var defaultStep = 4;
var allMeetings = {};
var authorization = "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InJRdmlDaV9yalVRc3lQVWhPRUxHaHpuU0F3aDFnb3NlY1lHOHVwVEUzbU0ifQ.eyJqdGkiOiI2YWJlMjRiMC1mNDVkLTQ1MmMtYTgyMS0yMTdmYmM3ZmZjMGYiLCJzdWIiOiJ3d3cuancub3JnLXB1YmxpYyIsImlzcyI6Imp3b3JnOmF1dGg6cHJkIiwiaWF0IjoxNjYwMDUzNjI5LCJuYmYiOjE2NjAwNTM2MjksImV4cCI6MTY2MDY1ODQyOSwiYXVkIjpbIk11bHRpU2l0ZVNlYXJjaDpwcmQiLCJKV0JNZWRpYXRvcjpwcmQiLCJBbGVydHM6cHJkIiwiT21uaVNlYXJjaDpwcmQiXSwicGVybXMiOnsib21uaS1zZWFyY2giOnsic2l0ZXMiOlsiancub3JnOnByZCIsIndvbDpwcmQiXSwiZmlsdGVycyI6WyJhbGwiLCJwdWJsaWNhdGlvbnMiLCJ2aWRlb3MiLCJhdWRpbyIsImJpYmxlIiwiaW5kZXhlcyJdLCJ0YWdzIjp7ImV4Y2x1ZGVkIjpbIlNlYXJjaEV4Y2x1ZGUiLCJXV1dFeGNsdWRlIl19fSwic2VhcmNoIjp7ImZhY2V0cyI6W3sibmFtZSI6InR5cGUiLCJmaWVsZCI6InRhZ3MiLCJ2YWx1ZXMiOlsidHlwZTp2aWRlbyJdfV19fX0.effcIfh8VH2_iz_Z_flEhnM9epNUpnATAAOOW1XiudrB0wU_QuXpE8apQPVkGNeyMB1vdZchCeJyHtmlLAIRjrNBBritJF1uP0jcYQVEGCtLXLy4oLQbJqE5wyYC87aSMrh8gJRTm4VhNVndOGj8cyaCKWXPLLBlkVJgVXIVryYy33EKNjCa6hjERODchBJ_D-mQWO9c868mmBjrk36WxQLWBs_JzklXbYIlzq1p-4d_Ov7qUSP3Gni6I8_sn92acynfpzSgl66wmll-jOWuktTZIHeREAYZdyE8xafYQtVVMDP7hO3UtJczDyXApgBXWvE5SqBRphHu1LvGRd85sA";
var countries = LoadJSON("./Meetings/country_bounds.json");
var totalQueries = 0;

var scriptStartedTS = new Date().toISOString();

allMeetings = LoadJSON("./Meetings/Meetings.json");
for (const meeting of Object.values(allMeetings)){
    meeting.active = false;
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
                .then((res) => resolve(res))
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

async function getMeetings(lowerLat, lowerLon, upperLat, upperLon){
    totalQueries++;

    if(totalQueries % 100 === 0) {
        SaveCache();
        SaveExpectations();
    }

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
        for(const meeting of Object.values(data['geoLocationList'])){
            cleanMeeting(meeting);
        }
        return data;
    });//.then((data) => data.category.subcategories.map(ele => ele.key))
}
function cleanMeeting(meeting){
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
    delete meeting.properties.memorialAddress;
    delete meeting.properties.memorialTime;
}

async function ProcessGrid(country, forCountry, sw, ne, step = null, recursivePercent = "") {
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
            // if (area.lat === 0 || area.lon === 0 || area.latMax === 0 || area.lonMax === 0) {
            //     expectation = null;
            //     cache[key] = null;
            // }
            if(expectation === 0) continue;
            let percent = recursivePercent + " " + Math.round(step * 111) + "km " + zeroPad(Math.round(((percentLon + percentLat) / 2.0) * 100), 2) + "%";
            if(expectation !== "+") {
                let data = cache[key] ?? null;
                if(!data) {
                    //await new Promise(delay => setTimeout(delay, 3));
                    data = await getMeetings(lat, lon, lat + step, lon + step);
                    cache[key] = data;
                }
                let items = data ? (data['geoLocationList'] ?? []) : [];
                if (items) {
                    for (const item of items) {
                        forCountry[item['geoId']] = item;
                    }
                }
                if (data['hasMoreResults'] == true || items.length === 25 || (items.length > 18 && (step * 111) > 3))
                    expectation = "+";
                else if(items.length > 0)
                    cachedExpectation[key] = items.length;
                else
                    cachedExpectation[key] = 0;
                console.log(`Queries: ${totalQueries}\t${country} Locations: ` + Object.keys(forCountry).length + "\tTotal Locations: " + Object.keys(allMeetings).length + "\t" + percent);
            }
            if(expectation === "+"){
                cachedExpectation[key] = "+";
                let substep = Math.min(latMax - lat, step * 0.5);
                await ProcessGrid(
                    country,
                    forCountry,
                    {lat: lat, lon: lon},
                    {lat: Math.min(lat + step, latMax), lon: Math.min(lon + step, lonMax)},
                    substep,
                    percent);
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
        if(fs.existsSync(progressPath) /*&& !crossesZero*/) {
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
                UpdateMeetingState(meeting);
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
                    UpdateMeetingState(meeting);

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
function UpdateMeetingState(meeting){
    cleanMeeting(meeting);
    meeting.lastSeen = scriptStartedTS;
    meeting.active = true;
    let key = meeting['geoId'];
    let existing = allMeetings[key];
    if(existing){
        meeting.firstSeen = existing.firstSeen;
    }
    allMeetings[key] = meeting;
}
async function SaveAllMeetings(allMeetings){
    allMeetings = Object.fromEntries(
        Object.entries(allMeetings).sort(([,a],[,b]) => (a.location.latitude + a.location.longitude) - (b.location.latitude + b.location.longitude))
    );
    let grids = {};
    let available_grids = {};
    let totalActive = 0;
    let totalInactive = 0;
    let typeTotals = {};
    for (const meeting of Object.values(allMeetings)){
        let lat = meeting.location.latitude;
        let lon = meeting.location.longitude;
        lat = roundDownToNearest(lat, 8);
        lon = roundDownToNearest(lon, 8);
        let key = `${lat},${lon}`;
        if(grids[key] === undefined)
            grids[key] = [];
        grids[key].push(meeting);
        available_grids[key] = true;
        typeTotals[meeting.properties.orgType] = (typeTotals[meeting.properties.orgType] ?? 0) + 1;
        if(meeting.active)
            totalActive++;
        else
            totalInactive++;
    }
    let stats = {
        typeTotals: typeTotals,
        totalActive: totalActive,
        totalInactive: totalInactive,
        grids: Object.keys(available_grids),
    };
    SaveFile('./Meetings/init_data.json', JSON.stringify(stats, null, 2));
    for(const [key, meetings] of Object.entries(grids)){
        SaveFile(`./Meetings/grid/${key}.json`, JSON.stringify(meetings, null, 2));
    }
    await SaveFile(`./Meetings/Meetings.json`, JSON.stringify(allMeetings, null, 1));
    await delay(3000);
}
GetAllMeetings(countries);

function SaveFile(filename, contents){
    return fs.writeFile(filename + ".new", contents, (err) => {
        if (err) { console.error(err); return; }
        try
        {
            fs.renameSync(filename + ".new", filename);
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