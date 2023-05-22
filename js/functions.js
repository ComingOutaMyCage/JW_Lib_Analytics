const range = (min, max) => Array.from({ length: max - min + 1 }, (_, i) => min + i);
function Round2Places(numb){
    return Math.round((numb + Number.EPSILON) * 100) / 100;
}
function Round4Places(numb){
    return Math.round((numb + Number.EPSILON) * 10000) / 10000;
}
var publications = [
    "All",
    "Watchtower",
    "Awake",
    "Kingdom Ministry",
    "Books",
    "Brochures",
    "Year Book",
    "Videos",
];
const bibleBooks = ["Genesis",
    "Exodus",
    "Leviticus",
    "Numbers",
    "Deuteronomy",
    "Joshua",
    "Judges",
    "Ruth",
    "1 Samuel",
    "2 Samuel",
    "1 Kings",
    "2 Kings",
    "1 Chronicles",
    "2 Chronicles",
    "Ezra",
    "Nehemiah",
    "Esther",
    "Job",
    "Psalms",
    "Proverbs",
    "Ecclesiastes",
    "Solomon",
    "Isaiah",
    "Jeremiah",
    "Lamentations",
    "Ezekiel",
    "Daniel",
    "Hosea",
    "Joel",
    "Amos",
    "Obadiah",
    "Jonah",
    "Micah",
    "Nahum",
    "Habakkuk",
    "Zephaniah",
    "Haggai",
    "Zechariah",
    "Malachi",
    "Matthew",
    "Mark",
    "Luke",
    "John",
    "Acts",
    "Romans",
    "1 Corinthians",
    "2 Corinthians",
    "Galatians",
    "Ephesians",
    "Philippians",
    "Colossians",
    "1 Thessalonians",
    "2 Thessalonians",
    "1 Timothy",
    "2 Timothy",
    "Titus",
    "Philemon",
    "Hebrews",
    "James",
    "1 Peter",
    "2 Peter",
    "1 John",
    "2 John",
    "3 John",
    "Jude",
    "Revelation"]

function InsertNav(){
    $('body').prepend(`
<nav class="navbar navbar-expand-lg navbar-dark bg-light mb-1 d-print-none">
    <div class="container-fluid">
        <a class="navbar-brand" href="index.html">JW Lib Analytics</a>
        <div class="navbar-collapse" id="navbarSupportedContent">
            <ul class="navbar-nav me-auto mb-2 mb-lg-0 flex-row gap-1">
                <li class="nav-item d-block d-none d-xl-block"><a class="nav-link active" aria-current="page" href="index.html">Home</a></li>
                <li class="nav-item"><a class="nav-link" href="HeatmapWords.html"><img src="images/heatmap.png"> Search Words</a></li>
                <li class="nav-item"><a class="nav-link" href="HeatmapBibleVerses.html"><img src="images/heatmap.png"> Bible Book Heatmap</a></li>
                <li class="nav-item"><a class="nav-link" href="HeatmapBibleBooks.html"><img src="images/heatmap.png"> Bible Heatmap</a></li>
                <li class="nav-item"><a class="nav-link" href="ViewWordPopularity.html"><img src="images/sort.png"> Word Trends</a></li>
                <li class="nav-item"><a class="nav-link" href="ViewTopWords.html"><img src="images/sort.png"> Most Common Words</a></li>
                <li class="nav-item"><a class="nav-link" href="ViewTopScriptures.html"><img src="images/sort.png"> Most Common Scriptures</a></li>
                <li class="nav-item"><a class="nav-link" href="ViewWordsPerYear.html"><img src="images/sort.png"> Words Per Year</a></li>
                <li class="nav-item"><a class="nav-link" href="ViewReleaseDates.html"><img src="images/sort.png"> Publications Released</a></li>
                <li class="nav-item"><a class="nav-link" href="VODSearch.html"><img src="images/cc.png"> Search Video Subtitles</a></li>
                <li class="nav-item"><a class="nav-link" href="ViewMap.html"><img src="images/map.png"> All Congregation</a></li>
            </ul>
            <div class="d-flex">
                <a href="https://s.reddit.com/c/198w7ck0xmo8u" target="_blank" style="height: 36px; padding:1px 9px 2px 0; border-radius: 30px; white-space: nowrap" class="btn btn-dark"><img src="https://www.redditstatic.com/desktop2x/img/favicon/apple-icon-60x60.png" style="height: 32px;"/> Chat</a>
                <a href="https://www.paypal.com/donate/?hosted_button_id=KEKGVKFPPV3RQ" target="_blank" style="height: 36px; padding:1px 9px 2px 0; border-radius: 30px; white-space: nowrap" class="btn btn-dark">
                    <img src="images/beer.png" style="height: 32px;"/> Support Projects</a>
                </a>
            </div>
        </div>
    </div>
</nav>`);
    $('.nav-link').each(function(){
        //console.log(location.href.indexOf($(this).attr('href')));
       if(location.href.indexOf($(this).attr('href')) >= 0) {
           $(this).addClass('active');
       }
    });
}

function GetScripture(verse){
    const regex = /^(.*) (\d+):(\d+)/;
    let match = verse.match(regex);
    let book = bible[match[1]];
    if(!book){
        if (match[1] == "Acts") book = bible["Acts of the Apostles"];
        else return "COULD NOT FIND " + verse;
    }
    //console.log(match);
    var chapter = book[match[2] - 1];
    return chapter[match[3] - 1];
}
function wrap(s, w) {
    return s.replace(
    new RegExp(`(?![^\\n]{1,${w}}$)([^\\n]{1,${w}})\\s`, 'g'), '$1\n'
    )
}

function redimChartBeforePrint(chart, width, height) {
    if (typeof(width) == 'undefined')
        width  = chart.chartWidth;
    if (typeof(height) == 'undefined')
        height = chart.chartHeight;
    chart.marginRight = 0;
    chart.oldhasUserSize = chart.hasUserSize;
    chart.resetParams = [chart.chartWidth, chart.chartHeight, false];
    chart.setSize(width, height, false);
}
function redimChartAfterPrint(chart) {
    chart.setSize.apply(chart, chart.resetParams);
    chart.hasUserSize = chart.oldhasUserSize;
}

window.onbeforeprint = function() {
    // redimChartBeforePrint($('#container').highcharts(), 850, undefined);
    //$(".highcharts-div").css('transform-origin', 'top center').css('transform', 'scale(0.8)');
    // redimChartBeforePrint($('#container').highcharts(), 800, 600);
};
window.onafterprint = function() {
    // redimChartAfterPrint($('#container').highcharts());
    //$(".highcharts-div").css('transform-origin', '').css('transform', '');
    // redimChartAfterPrint($('#chart2').highcharts());
};

$(document).ready(function(){
   $('select,input[type=checkbox]').change(function(){
      $('button[type=submit]').click();
   });
});

function AjaxJsonGzip(path, callback){
    //path += ".gz";
    return $.ajax({
        url: path,
        type: 'GET',
        cache: true,
        contentType: "application/x-gzip;charset=utf-8",
        //  contentType: "application/octet-stream;charset=ISO-8859-15",
        // contentType: "application/x-www-form-urlencoded;charset=ISO-8859-15",
        success: function(result) {
            if(isGzip(result)){
                let charData    = result.split('').map(function(x){return x.charCodeAt(0);});
                let binData     = new Uint8Array(charData);
                let data        = pako.inflate(binData);
                result = _arrayBufferToString(data);
                //  result = String.fromCharCode.apply(null, new Uint8Array(data));
            }
            if(result instanceof String)
                callback(JSON.parse(result));
            else
                callback(result);
        },
        error: function() { }
    });
}

function _arrayBufferToString( bytes ) {
    let binary = '';
    let newBytes = bytes;//new Uint16Array(bytes)
    let len = newBytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode( newBytes[ i ] );
    }
    return binary;
}
function isGzip(buf){
    if (!buf || buf.length < 3) {
        return false;
    }
    return buf[0] === '\x1F' && buf[1] === '\x8B' && buf[2] === '\x08';
}

var chart = null;
$( window ).resize(OnResize);
function OnResize(){
    if(!isTouchDevice()) return;
    if(!chart) return;
    HidePace();
    let scale = ($(".navbar").width() / chart.chartWidth);
    if(scale > 1) scale = 1;
    $('#container,#container1,#container2,#container3').css('transform', 'scale(' + scale + ")").css('transform-origin', 'top left').css('overflow', '');

    // $('.highcharts-div').css('transform', 'scale(' + scale + ")").css('transform-origin', 'top left').css('overflow', '');
    // $('.highcharts-container').css('overflow', '');
    // $('.highcharts-figure').css('position', 'relative').css('display', 'inline-block');
    // $("#container").css('overflow', '');
}
function HidePace() {
    Pace.stop();
    setInterval(function(){
        $('.pace').hide();
    }, 1000);
}
const isTouchDevice = () => {
    return window.matchMedia("(pointer: coarse)").matches
}
function HtmlEncode(s) {
    var el = document.createElement("div");
    el.innerText = el.textContent = s;
    s = el.innerHTML;
    return s;
}

function setPageState(param, value) {
    //console.log(param + " = " + value);
    let newURL = new URL(location.href);
    if (value == null || value === '' || value === '[""]' || value === '[]')
        newURL.searchParams.delete(param);
    else
        newURL.searchParams.set(param, value);
    window.history.pushState(param + ":" + value, null, newURL.toString());
}
function getPageState(param) {
    return getUrlParam(location.href, param);
}
function getUrlParam(href, param) {
    let url = new URL(href);
    return url.searchParams.get(param);
}

function roundDownToNearest(num, step) { return Math.floor(num / step) * step; }
function roundUpToNearest(num, step) { return Math.ceil(num / step) * step; }
