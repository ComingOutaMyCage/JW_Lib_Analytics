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

function InsertNav(translate = false) {
    const navItems = {
        'Heatmaps': {
            icon: 'images/heatmap.png',
            pages: {
                'Search Word Popularity': 'HeatmapWords.html',
                'Bible Verse Heatmap': 'HeatmapBibleVerses.html',
                'Bible Book Heatmap': 'HeatmapBibleBooks.html',
                'Bible Chapters': 'HeatmapBibleChapters.html',
            }
        },
        'Trends & Stats': {
            icon: 'images/sort.png',
            pages: {
                'Word Trends': 'ViewWordPopularity.html',
                'Most Common Words': 'ViewTopWords.html',
                'Most Common Scriptures': 'ViewTopScriptures.html',
                'Words Per Year': 'ViewWordsPerYear.html',
                'Publications Released': 'ViewReleaseDates.html',
            }
        },
        'Search': {
            icon: 'images/cc.png',
            pages: {
                'Search Video Subtitles': 'VODSearch.html',
            }
        },
        'Congregations': {
            icon: 'images/map.png',
            pages: {
                'Congregation Map': 'ViewMap.html',
                'Congregation Deletions': 'ViewCongChanges.html',
                'Hall Closures': 'ViewHallClosures.html',
            }
        }
    };

    let navbarHtml = `
    <nav class="navbar navbar-expand-lg navbar-dark bg-light mb-1 d-print-none">
        <div class="container-fluid">
            <a class="navbar-brand" href="index.html">JW Lib Analytics</a>
            <div id="google_translate_element"></div>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarSupportedContent">
                <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                    <li class="nav-item"><a class="nav-link" aria-current="page" href="index.html">Home</a></li>`;

    for (const category in navItems) {
        navbarHtml += `
        <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown${category.replace(/\s/g, '')}" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                <img src="${navItems[category].icon}"> ${category}
            </a>
            <ul class="dropdown-menu" aria-labelledby="navbarDropdown${category.replace(/\s/g, '')}">`;
        for (const pageName in navItems[category].pages) {
            const pageUrl = navItems[category].pages[pageName];
            navbarHtml += `<li><a class="dropdown-item" href="${pageUrl}">${pageName}</a></li>`;
        }
        navbarHtml += `</ul></li>`;
    }

    navbarHtml += `
                </ul>
                <div class="d-flex">
                    <a href="https://www.reddit.com/user/ComingOutaMyCage/" target="_blank" style="height: 36px; padding:1px 9px 2px 0; border-radius: 30px; white-space: nowrap" class="btn btn-dark"><img src="https://www.redditstatic.com/desktop2x/img/favicon/apple-icon-60x60.png" style="height: 32px;"/> Chat</a>
                </div>
            </div>
        </div>
    </nav>`;

    $('body').prepend(navbarHtml);

    $('.nav-link, .dropdown-item').each(function () {
        if (location.href.includes($(this).attr('href'))) {
            $(this).addClass('active');
            $(this).closest('.dropdown').find('.nav-link').addClass('active');
        }
    });

    if (translate) {
        $('body').prepend('<script type="text/javascript" src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"></script>');
    }
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

function autoTranslatePage() {
    let userLang = navigator.language || navigator.userLanguage;
    if (userLang === 'en-US' || userLang == 'en-UK') return;
    userLang = userLang.split("-")[0]; // to get the primary language code
    console.log("autoTranslatePage");
    let selectElement = document.querySelector('#google_translate_element select');
    if (selectElement) {
        let options = selectElement.querySelectorAll('option');
        if (options.length) {
            // Check if the detected language is available in the Google Translate dropdown
            let isLanguageAvailable = Array.from(options).some(option => option.value === userLang);
            if (isLanguageAvailable) {
                selectElement.value = userLang;
                // Trigger the change event to initiate translation
                var event = new Event('change', {
                    'bubbles': true,
                    'cancelable': true
                });
                selectElement.dispatchEvent(event);
            }
            return;
        }
    }
    setTimeout(autoTranslatePage, 100);
}
// This function initializes the Google Translate widget and then calls autoTranslatePage
function googleTranslateElementInit() {
    console.log("googleTranslateElementInit");
    let userLang = navigator.language || navigator.userLanguage;
    if (userLang === 'en-US' || userLang == 'en-UK') return;
    new google.translate.TranslateElement({
        pageLanguage: 'en', // change 'en' to your page's primary language
        //includedLanguages: 'de,fr,es,it,nl,pt', // Optional: limit available languages
    }, 'google_translate_element');
    autoTranslatePage();
}
