<?php
include (__DIR__.'/functions.php');

$yearDirs =  glob('C:\temp\WT\*', GLOB_ONLYDIR);
$dirs = [];
foreach ($yearDirs as $dir){
    if(!is_numeric(basename($dir))) continue;
    $pubDirs =  glob($dir.'\*', GLOB_ONLYDIR);
    $dirs = array_merge($dirs, $pubDirs);
}

class Data {
    public static $regex = "/[a-z][\w'-]+/i";
    public static $byYear;
}

$percent = new PercentReporter(count($dirs));
foreach ($dirs as $dir) {
    $files = glob($dir.'\\*.txt');
    $info = json_decode(file_get_contents($dir . "/info.json"));
    $publication = PublicationCodes::GetCategory($info);
    if(empty($publication)) continue;
    $year = intval($info->Year);

    if($publication == "Books")
        $publication = $info->UndatedReferenceTitle ?? $info->Title;

    Data::$byYear[$year][$publication] = (Data::$byYear[$year][$publication] ?? 0) + 1;

    $percent->Step($dir);
    //break;

    unset($info);
}

recursive_key_sort(Data::$byYear);

$baseFolder = "Data/PublicationsByYear/";
WriteJSON($baseFolder . 'All.json', Data::$byYear);

echo("<pre>");
echo("Done");

print_r(Data::$byYear);

