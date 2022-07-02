const range = (min, max) => Array.from({ length: max - min + 1 }, (_, i) => min + i);
function Round2Places(numb){
    return Math.round((numb + Number.EPSILON) * 100) / 100;
}
function Round4Places(numb){
    return Math.round((numb + Number.EPSILON) * 10000) / 10000;
}
const publications = [
    "All",
    "Watchtower",
    "Awake",
    "Kingdom Ministry",
    "Books",
    "Brochures",
    "Year Book",
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
                <li class="nav-item"><a class="nav-link" href="HeatmapWords.html"><img src="images/heatmap.png"> By Words</a></li>
                <li class="nav-item"><a class="nav-link" href="HeatmapBibleVerses.html"><img src="images/heatmap.png"> By Verses</a></li>
                <li class="nav-item"><a class="nav-link" href="HeatmapBibleBooks.html"><img src="images/heatmap.png"> By Bible Books</a></li>
                <li class="nav-item"><a class="nav-link" href="ViewTopWords.html"><img src="images/sort.png"> Most Common Words</a></li>
                <li class="nav-item"><a class="nav-link" href="ViewReleaseDates.html"><img src="images/sort.png"> Publications Released</a></li>
            </ul>
            <div class="d-flex">
                <a href="https://s.reddit.com/c/198w7ck0xmo8u" target="_blank" style="height: 36px; padding:1px 9px 2px 0; border-radius: 30px; white-space: nowrap" class="btn btn-dark"><img src="https://www.redditstatic.com/desktop2x/img/favicon/apple-icon-60x60.png" style="height: 32px;"/> Chat</a>
                <a href="https://www.paypal.com/donate/?hosted_button_id=KEKGVKFPPV3RQ" target="_blank" style="height: 36px; padding:1px 9px 2px 0; border-radius: 30px; white-space: nowrap" class="btn btn-dark">
                    <img src="images/beer.png" style="height: 32px;"/> Buy Me a Beer</a>
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
    //$(".highcharts-container").css('transform-origin', 'top center').css('transform', 'scale(0.8)');
    // redimChartBeforePrint($('#container').highcharts(), 800, 600);
};
window.onafterprint = function() {
    // redimChartAfterPrint($('#container').highcharts());
    //$(".highcharts-container").css('transform-origin', '').css('transform', '');
    // redimChartAfterPrint($('#chart2').highcharts());
};

$(document).ready(function(){
   $('select,input[type=checkbox]').change(function(){
      $('button[type=submit]').click();
   });
});