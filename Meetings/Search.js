import fetch from 'node-fetch';
import fs from 'fs';


var allMeetings = {};
var results = [];
var resultsCSV = "Name\tType\tAddress\tPhone";


let stateTotals = {};

allMeetings = LoadJSON("./Meetings/Meetings.json");
for (const meeting of Object.values(allMeetings)){
    let stateMatch = meeting.properties.orgName.match(/(\w+) \(USA\)/);
    if(stateMatch != null){
        stateTotals[stateMatch[1]] = (stateTotals[stateMatch[1]] ?? 0) + 1;
    }

    if (meeting.properties.orgName.indexOf(" PA (USA)") > 0){
        results.push(meeting);
        let phone = '';
        meeting.properties.phones.forEach(element => {
            phone += element.phone + " ";
        });
        resultsCSV += "\n" + (meeting.properties.orgName + "\t" + meeting.properties.orgType + "\t" + meeting.properties.address.trim() + "\t" + phone.trim()).replaceAll("\n", " ").replaceAll("\r", "");
    }
}

await SaveFile(`./Meetings/Search.json`, JSON.stringify(results, null, 1));
await SaveFile(`./Meetings/USATotals.json`, JSON.stringify(stateTotals, null, 1));
await SaveFile(`./Meetings/Search.csv`, resultsCSV);
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