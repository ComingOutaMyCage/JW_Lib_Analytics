<?php
$dirs = glob('./Data/WordsByYear/*', GLOB_ONLYDIR);

echo("<pre>");

class BlankClass{}
foreach ($dirs as $dir){
    $publication = basename($dir);
    $wordCount = new BlankClass();
    $jsonFiles = glob($dir.'/*.json');
    foreach ($jsonFiles as $jsonFile){
        $json = json_decode(file_get_contents($jsonFile));
        foreach ($json as $word=>&$years){
            foreach ($years as $year=>&$count){
                $wordCount->{$year} = ($wordCount->{$year} ?? 0) + $count;
            }
        }
    }
    $data = json_encode($wordCount);
    file_put_contents($dir . "/TotalsPerYear.json", $data);
    echo($data);
}


