import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';
import {findNearestCountry} from "./GeoLocator.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mainDir = __dirname + "/";

function LoadJSON(filename){
    let json = fs.readFileSync(filename, (err) => {
        if (err) { console.error(err); return; };
    });
    return JSON.parse(json);
}
function SaveFile(filename, contents, retriesAvailable = 3){
    if (contents[0] === '{' || contents[0] === '[') {
        contents = contents.replace(/\[\n\s*("[^"]+")\s*]/g, '[ $1 ]');
    }
    const newName = filename + ".new";
    const oldName = filename + ".old";
    return fs.writeFile(newName, contents, (err) => {
        if (err) {
            if (retriesAvailable <= 0) {
                console.error(err);
                return;
            }
        }
        try
        {
            if (!fs.existsSync(newName)){
                console.error(`File ${newName} does not exist after SaveFile.`);
                throw new Error(`File ${newName} does not exist after SaveFile.`);
            }
            if (fs.existsSync(oldName))
                fs.unlinkSync(oldName);
            if (fs.existsSync(filename))
                fs.renameSync(filename, oldName);
            fs.renameSync(newName, filename);
            if (fs.existsSync(oldName))
                fs.unlinkSync(oldName);
            console.log(`${filename} has been created`);
            return true;
        } catch (ex) { console.error(ex); }

        if(retriesAvailable > 0)
            return SaveFile(filename, contents, retriesAvailable - 1);
    });
}

function cleanMeeting(meeting, force = false){

    replaceBooleansWithIntegers(meeting);

    let properties = meeting.properties;
    if (properties.schedule !== undefined && !isString(properties.schedule)){
        properties.schedule = formatSchedule(properties.schedule);
    }

    if(properties.orgGuid === undefined && !force)
        return;
    if(isEmpty(properties.orgTransliteratedName))
        delete properties.orgTransliteratedName;
    if(isEmpty(properties.transliteratedAddress))
        delete properties.transliteratedAddress;

    if (properties.address) {
        properties.address = properties.address.trim();
        properties.address = properties.address.replace(/(\r\n|\n|\r)+/gm, "\n");
    }

    // if(!properties.schedule.futureDate)
    //     delete properties.schedule.futureDate;
    // if(!properties.schedule.changeStamp)
    //     delete properties.schedule.changeStamp;
    // delete properties.schedule;

    if(isEmpty(properties.relatedLanguageCodes))
        delete properties.relatedLanguageCodes;

    delete properties.memorialAddress;
    delete properties.memorialTime;

    if (meeting.geoId && meeting.geoId === properties.orgGuid) {
        delete properties.orgGuid;
    }

    let phones = properties.phones;
    if (isString(phones)) properties.phones = phones = [phones];
    if(phones && phones.length && !isString(phones[0])){
        let newPhones = [];
        for (const phone of phones) {
            if(!phone.phone) continue;
            if(phone.ext)
                phone.phone = phone.ext + " " + phone.phone;
            newPhones.push(phone.phone);
        }
        properties.phones = newPhones;
    }

    meeting.properties = properties;
}
function formatSchedule(schedule) {
    const days = ['None', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    if(schedule.current === undefined) return '';
    const weekend = schedule.current.weekend;
    const midweek = schedule.current.midweek;

    let weekendString = '', midweekString = '';
    if(weekend !== undefined && weekend.weekday !== 0)
        weekendString = `${days[weekend.weekday]} ${weekend.time} `;
    if(midweek !== undefined && midweek.weekday !== 0)
        midweekString = `${days[midweek.weekday]} ${midweek.time}`;

    return `${weekendString}${midweekString}`;
}

async function _SaveAllMeetings(filePath, allMeetings){
    //const filePath = meetingsFile; // Replace with the actual file path
    // Get the last modified date of the file
    const stats = fs.statSync(filePath);
    const lastModifiedDate = ISODateString(stats.mtime);
    const currentDate = ISODateString(new Date());
    if (lastModifiedDate !== currentDate) {
        const destinationFilePath = `${mainDir}/history/Meetings ${lastModifiedDate}.json`;
        fs.copyFileSync(filePath, destinationFilePath);
        console.log(`File copied to ${destinationFilePath}`);
    }
    await SaveFile(filePath, JSON.stringify(allMeetings, null, 1));
}

function replaceBooleansWithIntegers(obj) {
    if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
            if (typeof obj[i] === "boolean") {
                obj[i] = obj[i] ? 1 : 0;
            } else if (typeof obj[i] === "object" && obj[i] !== null) {
                replaceBooleansWithIntegers(obj[i]);
            }
        }
    } else if (typeof obj === "object" && obj !== null) {
        for (let key in obj) {
            if (typeof obj[key] === "boolean") {
                obj[key] = obj[key] ? 1 : 0;
            } else if (typeof obj[key] === "object" && obj[key] !== null) {
                replaceBooleansWithIntegers(obj[key]);
            }
        }
    }
    return obj;
}

function ISODateString(date){
    return date.toISOString().slice(0, 10);
}
function isObject(item) {
    return (item && typeof item === 'object');
}
function isString(item) {
    return (typeof item === 'string' || item instanceof String);
}
function isEmpty(item) {
    return (item === undefined || item === null || !item.length);
}

export function assignCountryIso(meeting){
    if(!meeting || !meeting.location) return false;
    let countryCode = findNearestCountry(meeting.location.longitude, meeting.location.latitude);
    if (countryCode === null) {
        console.log(`Couldnt find country for ${meeting.location.latitude}, ${meeting.location.longitude} using ${meeting.location.iso} instead.`);
        return false;
    }

    meeting.location.iso = countryCode;
    return countryCode;
}

export { LoadJSON, SaveFile, _SaveAllMeetings, cleanMeeting, replaceBooleansWithIntegers, ISODateString, isObject, isString, isEmpty };