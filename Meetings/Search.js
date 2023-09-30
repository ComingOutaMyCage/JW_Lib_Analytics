import fetch from 'node-fetch';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
//import wc from 'which-country';
import {findNearestCountry} from "./GeoLocator.js";
import iso from 'iso-3166-1';
import {_SaveAllMeetings, LoadJSON, SaveFile} from './Functions.js';

//console.log(wc([-100, 40])); // USA

const __dirname = path.dirname(fileURLToPath(import.meta.url));

var allMeetings = {};
var results = [];
var resultsCSV = "Name\tType\tAddress\tPhone";

let stateTotals = {};
var byCountry = {};

let codeToCountry = {};

function assignCountryIso(meeting){
    if(!meeting || !meeting.location) return false;
    let countryCode = findNearestCountry(meeting.location.longitude, meeting.location.latitude);
    if (countryCode === null) {
        console.log(`Couldnt find country for ${meeting.location.latitude}, ${meeting.location.longitude} using ${meeting.location.iso} instead.`);
        return false;
    }

    meeting.location.iso = countryCode;
    return countryCode;
}

let deleted = LoadJSON(__dirname + "/grid/deleted.json");
for (const meeting of deleted){
    if(!meeting.location.iso)
        assignCountryIso(meeting);
}
await SaveFile(__dirname + `/grid/deleted.json`, JSON.stringify(deleted, null, 1));

let orphans = LoadJSON(__dirname + "/grid/orphans.json");
for (const meeting of orphans){
    if(!meeting.location.iso)
        assignCountryIso(meeting);
}
await SaveFile(__dirname + `/grid/orphans.json`, JSON.stringify(orphans, null, 1));

let orphanLocations = LoadJSON(__dirname + "/grid/orphanLocations.json");
for (const location of Object.values(orphanLocations)) {
    for (const meeting of location) {
        if(!meeting.location.iso)
            assignCountryIso(meeting);
    }
}
await SaveFile(__dirname + `/grid/orphanLocations.json`, JSON.stringify(orphanLocations, null, 1));


allMeetings = LoadJSON(__dirname + "/Meetings.json");
for (const meeting of Object.values(allMeetings)){

    // if(meeting.location.iso)
    //     continue;
    let countryCode = assignCountryIso(meeting);
    if (countryCode === false)
        continue;

    let country = iso.whereAlpha3(countryCode);
    if(!country || !country.country)
    {
        continue;
    }

    codeToCountry[countryCode] = country.country;

    meeting.location.iso = countryCode;

    //console.log(countryCode, country);
    country = country.country;

    if(byCountry[country] === undefined)
        byCountry[country] = [0, 0]

    let status = meeting.active ? 0 : 1;
    byCountry[country][status]++;

    let stateMatch = meeting.properties.orgName.match(/(\w+) \(USA\)/);
    if(stateMatch != null){
        let state = stateMatch[1];
        if(stateTotals[state] === undefined)
            stateTotals[state] = [0, 0]
        stateTotals[state][status]++;
    }
    //
    // if (meeting.properties.orgName.indexOf("(USA)") > 0){
    //     results.push(meeting);
    //     let phone = '';
    //     meeting.properties.phones.forEach(element => {
    //         phone += element.phone + " ";
    //     });
    //     resultsCSV += "\n" + (meeting.properties.orgName + "\t" + meeting.properties.orgType + "\t" + meeting.properties.address.trim() + "\t" + phone.trim()).replaceAll("\n", " ").replaceAll("\r", "");
    // }
}
results = Object.keys(byCountry).sort().reduce(
    (obj, key) => {
        obj[key] = byCountry[key];
        return obj;
    }, {}
);

await SaveFile(__dirname + `/Search.json`, JSON.stringify(results, null, 1));
await SaveFile(__dirname + `/USATotals.json`, JSON.stringify(stateTotals, null, 1));
await SaveFile(__dirname + `/Search.csv`, CleanCSVContents(resultsCSV));
await SaveFile(__dirname + `/CountryCodes.json`, JSON.stringify(codeToCountry, null, 1));
await _SaveAllMeetings(__dirname + `/Meetings.json`, allMeetings);
// SaveAllMeetings(allMeetings);
// throw '';

function CleanCSVContents(contents){
    let reg = /\s*(\d+,?|\])/gm;
    contents = contents.replace(reg, "$1");
    return contents;
}