import fs from 'fs';
Number.prototype.round = function (places) {
    return +(Math.round(this + "e+" + places) + "e-" + places);
}

let publication = 'Watchtower';

let periods = [ 
    { name: '1880 - 2020', startYear: 1880, endYear: 2020 },
    { name: '1910 - 1925 (Rutherford Takeover 1917)', startYear: 1910, endYear: 1925 },
    { name: '1925 - 1950', startYear: 1925, endYear: 1950 },
    { name: "1950 - 1980", startYear: 1950, endYear: 1980 },
    { name: "1950 - 2020", startYear: 1950, endYear: 2020 },
    { name: "1970 - 1980 (Pre/Post 1975)", startYear: 1970, endYear: 1980 },
    { name: "1980 - 2000", startYear: 1980, endYear: 2000 },
    { name: "1980 - 2020", startYear: 1980, endYear: 2020 },
    { name: "1990 - 2010", startYear: 1990, endYear: 2010 },
    { name: "1990 - 2020", startYear: 1990, endYear: 2020 },
    { name: '2012 - 2020 (Modern Revolution)', startYear: 2012, endYear: 2020 },
];
periods.forEach(period => {
    const startYear = period.startYear;
    const endYear = period.endYear;
    const listYears = rangeOfNumbers(startYear, endYear);

    let wordsMorePop = [];
    let wordsLessPop = [];
    let wordCount = 0;
    let sortAt = 100;
    let maxResults = 50;

    var data = fs.readFileSync('./Data/WordsByYear/normals.json', (err) => {
        if (err) { console.error(err); return; };
    });
    let normals = JSON.parse(data);
    let wordsInYear = normals[publication]['Words In Year'];
    let normalsForYears = wordsInYear;

    const testFolder = `./Data/WordsByYear/${publication}/`;
    fs.readdirSync(testFolder).forEach(file => {
        if(file.match(/\d\.json/)) return;
        file = testFolder + file;
        if(!file.endsWith(".json")) return;
        if (file.indexOf("_pair") > 0) return;

        var data = fs.readFileSync(file, (err) => {
            if (err) { console.error(err); return; };
        });
        let wordsDict = JSON.parse(data);

        let words = Object.keys(wordsDict);
        words.forEach((word)=>{
            let yearsDict = wordsDict[word];
            if (Object.keys(yearsDict).length < 70) return;
            let allYears = [];
            let sumTotal = 0;
            listYears.forEach(year=>{
                let yearTotal = (yearsDict[year] ?? 0);
                sumTotal += yearTotal;
                allYears.push({ year: year, count: yearTotal, normalised: (yearTotal / normalsForYears[year]) * 100000});
            });
            if (sumTotal < allYears.length * 4) return;
            let [slope, intercept] = linearRegression(allYears, 'year', 'normalised');

            let est1 = slope * listYears[0] + intercept
            let est2 = slope * listYears[listYears.length - 1] + intercept;
            if(est1 < 0)
                est1 = 0;
            if(est2 < 0)
                est2 = 0;
            let rawChange = est2 - est1;
            let percentChange = ((est2 - est1) / est1) * 100;
            percentChange = percentChange.round(0);
            if(percentChange === null) return;

            let result = { word: word, change: percentChange.round(3), rawChange: rawChange };
            wordsMorePop.push(result);
            wordsLessPop.push(result);
            if (wordCount++ > sortAt){
                wordsMorePop = SortResultsDesc(wordsMorePop);
                wordsLessPop = SortResultsAsc(wordsLessPop);
                wordCount = maxResults;
            }
            //console.log(word,allYears);
        });
        console.log(file);
    });
    function SortResultsDesc(words){
        words.sort((a, b) => {
            if(a.change === b.change) return b.rawChange > a.rawChange ? 1 : -1;
            return b.change - a.change;
        });//Increased
        return words.slice(0, maxResults);
    }
    function SortResultsAsc(words) {
        words.sort((a, b) => {
            if(a.change === b.change) return a.rawChange > b.rawChange ? 1 : -1;
            return a.change - b.change;
        });//Decreased
        return words.slice(0, maxResults);
    }

    wordsMorePop = SortResultsDesc(wordsMorePop);
    wordsLessPop = SortResultsAsc(wordsLessPop);

    wordsMorePop = wordsMorePop.filter(w => w.change);
    wordsLessPop = wordsLessPop.filter(w => w.change);

    console.log(period);
    // console.log("More Popular");
    // wordsMorePop.slice(0, 30).forEach(w => console.log(w));
    // console.log("Less Popular");
    // wordsLessPop.slice(0, 30).forEach(w => console.log(w));
    // console.log("Done");

    wordsMorePop = Object.assign({}, ...wordsMorePop.map((x) => ({ [x.word]: Math.max(-100, x.change) })));
    wordsLessPop = Object.assign({}, ...wordsLessPop.map((x) => ({ [x.word]: Math.max(-100, x.change) })));

    period['morePopular'] = wordsMorePop;
    period['lessPopular'] = wordsLessPop;

});


let dir = `./Data/Popularity/`;
fs.mkdirSync(dir, { recursive: true });

fs.writeFileSync(dir + `${publication}.json`, JSON.stringify(periods, null, 4), (err) => {
    if (err) { console.error(err); return; };
    console.log(info.Title + " has been saved");
});

function linearRegression(inputArray, xLabel, yLabel) {
    const x = inputArray.map((element) => element[xLabel]);
    const y = inputArray.map((element) => element[yLabel]);
    const sumX = x.reduce((prev, curr) => prev + curr, 0);
    const avgX = sumX / x.length;
    const xDifferencesToAverage = x.map((value) => avgX - value);
    const xDifferencesToAverageSquared = xDifferencesToAverage.map(
        (value) => value ** 2
    );
    const SSxx = xDifferencesToAverageSquared.reduce(
        (prev, curr) => prev + curr,
        0
    );
    const sumY = y.reduce((prev, curr) => prev + curr, 0);
    const avgY = sumY / y.length;
    const yDifferencesToAverage = y.map((value) => avgY - value);
    const xAndYDifferencesMultiplied = xDifferencesToAverage.map(
        (curr, index) => curr * yDifferencesToAverage[index]
    );
    const SSxy = xAndYDifferencesMultiplied.reduce(
        (prev, curr) => prev + curr,
        0
    );
    const slope = SSxy / SSxx;
    const intercept = avgY - slope * avgX;
    return [slope, intercept];
    //return (x) => intercept + slope * x;
}
function rangeOfNumbers(a, b) {
    let arr = [];
    for (a; a <= b; a++) {
        arr.push(a)
    }
    return arr;
}
function isNum(val) {
    return !isNaN(val)
}