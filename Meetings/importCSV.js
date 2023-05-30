import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import csv from 'csv-parser';
import axios from 'axios';
import crypto from 'crypto';

const apiKey = ''; // Replace with your Google Maps API key

const __dirname = path.dirname(fileURLToPath(import.meta.url));
var allMeetings = LoadJSON(__dirname + "/Meetings.json");
function generateGeoId(seed_name) {
    const chars = '0123456789ABCDEF';
    const seed = seed_name.toString();
    const hash = crypto.createHash('sha256').update(seed).digest('hex');
    let geoId = '';

    for (let i = 0; i < 32; i++) {
        const index = parseInt(hash[i], 16) % chars.length;
        geoId += chars[index];
    }

    return `acnc.gov.au-${geoId.substring(12, 4)}-${geoId.substring(16, 4)}-${geoId.substring(20)}`;
}

async function getLatLon(address) {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;

    try {
        const response = await axios.get(url);
        const { results } = response.data;
        if (results.length > 0) {
            const { lat, lng } = results[0].geometry.location;
            return { latitude: lat, longitude: lng };
        }
    } catch (error) {
        console.error('Error retrieving latitude and longitude:', error.message);
    }

    return null;
}

const results = [];
fs.createReadStream('australia.csv')
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
        Import(results);
    });

function findNearestLocation(targetLatitude, targetLongitude) {
    let nearestLocation = null;
    let nearestDistance = Infinity;
    for (const location of Object.values(allMeetings)) {
        const { latitude, longitude } = location.location;
        const distance = calculateDistance(latitude, longitude, targetLatitude, targetLongitude);

        if (distance < nearestDistance) {
            nearestLocation = location;
            nearestDistance = distance;
        }
    }
    return { loc: nearestLocation, dist: nearestDistance };
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const toRadians = (angle) => (Math.PI / 180) * angle;
    const earthRadius = 6371; // in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = earthRadius * c;
    return distance;
}
async function Import(results) {
    for (const row of results)
    {
        let {Index, Name, Language, Comment, STATUS, Pubs, SUBURB, STATE, DATECLOSED, ADDRESS, PostalCode} = row;

        let full_address = [ADDRESS, SUBURB, STATE + " " + PostalCode].map(e=>e.trim()).filter(e=>e).join(", ");
        full_address = full_address.replace(/\s{2,10}/, " ");
        const geoId = generateGeoId(Name);
        let {latitude, longitude} = await getLatLon(full_address);

        const { loc, dist } = findNearestLocation(latitude, longitude);
        if(dist < 0.5){
            latitude = loc.location.latitude;
            longitude = loc.location.longitude;
        }
        if(!Language)
            Language = 'E';

        const data = {
            geoId,
            type: 'weekly',
            location: {
                "latitude": latitude,
                "longitude": longitude,
            },
            properties: {
                orgName: Name,
                orgType: 'CONG',
                address: full_address,
                languageCode: Language,
            },
            lastVisit: new Date().toISOString(),
            lastSeen: DATECLOSED,
            active: false,
            firstSeen: DATECLOSED,
        };
        allMeetings[geoId] = data;

        console.log(data); // Output or further processing
    }

    allMeetings = Object.fromEntries(
        Object.entries(allMeetings).sort(([,a],[,b]) => (a.location.latitude + a.location.longitude) - (b.location.latitude + b.location.longitude))
    );

    await SaveFile(__dirname + `/Meetings.json`, JSON.stringify(allMeetings, null, 1));
    console.log('CSV file processed.');
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