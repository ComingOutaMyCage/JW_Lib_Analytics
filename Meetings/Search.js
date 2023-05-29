import fetch from 'node-fetch';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import wc from 'which-country';
import iso from 'iso-3166-1';

//console.log(wc([-100, 40])); // USA

const __dirname = path.dirname(fileURLToPath(import.meta.url));

var allMeetings = {};
var results = [];
var resultsCSV = "Name\tType\tAddress\tPhone";


let stateTotals = {};
var byCountry = {};

allMeetings = LoadJSON(__dirname + "/Meetings.json");
for (const meeting of Object.values(allMeetings)){
    if(meeting.active) continue;
    let countryCode = wc([meeting.location.longitude, meeting.location.latitude]);
    if(countryCode === null) continue;

    let country = iso.whereAlpha3(countryCode);
    if(!country || !country.country)
    {
        continue;
    }
    console.log(countryCode, country);
    country = country.country;

    if(byCountry[country] === undefined)
        byCountry[country] = 0;
    byCountry[country]++;

    // let stateMatch = meeting.properties.orgName.match(/(\w+) \(USA\)/);
    // if(stateMatch != null){
    //     stateTotals[stateMatch[1]] = (stateTotals[stateMatch[1]] ?? 0) + 1;
    // }
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
await SaveFile(__dirname + `/Search.csv`, resultsCSV);
// SaveAllMeetings(allMeetings);
// throw '';



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