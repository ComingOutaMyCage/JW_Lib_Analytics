import wc from 'which-country';
import tree from '../node_modules/which-country/lib/tree.js';

const treeData = tree();
let cachedBounds = {};
let allPolygons = [];
function getAllPolygons(parent){
    if(parent.children){
        for(let child of parent.children){
            getAllPolygons(child);
        }
    }
    else{
        allPolygons.push(parent);
    }
}
getAllPolygons(treeData.data);

function findNearestCountry(longitude, latitude) {
    const point = [longitude, latitude];
    let result = wc(point);
    if(result !== null)
        return result;

    let minDistance = Infinity;
    let nearestCountry = null;

    let polygons = treeData.search(point.concat(point));
    if(polygons.length === 0){
        polygons = allPolygons;
    }

    let padding = 10;
    let polygonsTested = 0;
    while(polygonsTested === 0 && padding < 1000) {
        padding *= 2;
        for (let polygon of polygons) {

            if (polygon.minLng - padding > longitude ||
                polygon.maxLng + padding < longitude ||
                polygon.minLat - padding > latitude ||
                polygon.maxLat + padding < latitude)
                continue;
            polygonsTested++;

            for (let coords of polygon.coordinates) {
                for (let i = 0; i < coords.length - 1; i++) {
                    let distance = distancePointToSegment(point, [coords[i], coords[i + 1]]);
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearestCountry = polygon.country;
                    }
                }
            }
        }
    }
    if (nearestCountry == null) {
        console.log("nearestCountry: ", nearestCountry, point, polygonsTested, padding);
        throw "";
    }

    return nearestCountry;
}

function distancePointToSegment(point, [start, end]) {
    const l2 = (start[0] - end[0]) ** 2 + (start[1] - end[1]) ** 2;
    if (l2 === 0) return distancePointToPoint(point, start);
    let t = ((point[0] - start[0]) * (end[0] - start[0]) + (point[1] - start[1]) * (end[1] - start[1])) / l2;
    t = Math.max(0, Math.min(1, t));
    return distancePointToPoint(point, [start[0] + t * (end[0] - start[0]), start[1] + t * (end[1] - start[1])]);
}

function distancePointToPoint(point1, point2) {
    return Math.sqrt((point1[0] - point2[0]) ** 2 + (point1[1] - point2[1]) ** 2);
}

export { findNearestCountry };