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
    public static $regex = "/([a-z][a-zÀ-ÖØ-öø-ÿ'\-\']*|\d+|[\.!?\(\)\[\]])/i";//2+ letter Words beginning with a-z then any accented characters allowed. Also punctuation marks to interrupt double words.
    public static $byBook;
    public static $normals = [];//[ "Publications In Year" => [], "Words In Year" => [], ];
    public static $letters = [];
}
Data::$letters = array_fill_keys(array_merge(range('a', 'z'), range('0', '9')),0);
class BlankClass {}
Data::$byBook = new BlankClass();
foreach (array_values(PublicationCodes::$codeToName) as $publication) {
    Data::$byBook->{$publication} = new Data();
}

$percent = new PercentReporter(count($dirs));
foreach ($dirs as $dir) {
    $percent->Step($dir);

    $files = glob($dir.'\\*.txt');
    $info = json_decode(file_get_contents($dir . "/info.json"));
    $publication = PublicationCodes::GetCategory($info);
    if(empty($publication)) continue;
    $year = intval($info->Year);

    Data::$normals['All']['Publications In Year'][$year] = (Data::$normals['All']['Publications In Year'][$year] ?? 0) + 1;
    Data::$normals[$publication]['Publications In Year'][$year] = (Data::$normals[$publication]['Publications In Year'][$year] ?? 0) + 1;
    foreach ($files as $file){
        ParseFile($file, $publication, $year);
    }
    //echo(json_encode(Data::$byBook, JSON_NUMERIC_CHECK));
//    var_dump(Data::$normals);
//    break;
    //die();

    unset($info);
}

function ParseFile($file, $publication, $year){
    //writeLine ($file);
    $line = file_get_contents($file);
    $totalWords = 0;
    $wordCounts = [];
    ForeachLine($file, function($line) use ($year, $publication, $totalWords, $wordCounts){
        //$line = "1914 is the year in which 1975 failed";
        $line = str_replace('’', "'", $line);
        preg_match_all(Data::$regex, $line, $matches);
        if(empty($matches[0])) return;

        $matches = $matches[0];
        $wordsOnLine = 0;
        foreach ($matches as &$match) {
            if(IsText($match)) $wordsOnLine++;
        }
        $totalWords += $wordsOnLine;

        $matchesCount = count($matches);
        $lastWord = null;
        for($i = 0; $i < $matchesCount; $i++){
            $word = strtolower($matches[$i]);
            if(!IsText($word)) { $lastWord = null; continue; }
            $letter = $word[0];
            Data::$letters[$letter] = true;
            $wordCounts[$word] = ($wordCounts[$word] ?? 0) + 1;

            if($lastWord != null && !is_numeric($lastWord)){
                $lastWord .= " ".$word;
                $wordCounts[$lastWord] = ($wordCounts[$lastWord] ?? 0) + 1;
            }

            $lastWord = $word;
        }
        //unset($matches);
    });
    Data::$normals['All']['Words In Year'][$year] = (Data::$normals['All']['Words In Year'][$year] ?? 0) + $totalWords;
    Data::$normals[$publication]['Words In Year'][$year] = (Data::$normals[$publication]['Words In Year'][$year] ?? 0) + $totalWords;

    foreach($wordCounts as $word=>$count){
        $letter = $word[0];
        Data::$byBook->{$publication}->{$letter}[$word][$year] = (Data::$byBook->{$publication}->{$letter}[$word][$year] ?? 0) + $count;
        Data::$byBook->{'All'}->{$letter}[$word][$year] = (Data::$byBook->{'All'}->{$letter}[$word][$year] ?? 0) + $count;
    }
}

function IsText(&$text){
    if(strlen($text) > 1) return true;
    else if ($text[0] >= 'a' && $text[0] <= 'z') return true;
    else if ($text[0] >= 'A' && $text[0] <= 'Z') return true;
}

$percent->Step('Saving Normals', true);

$baseFolder = "Data/WordsByYear/";
recursive_key_sort(Data::$normals);
WriteJSON($baseFolder . 'normals.json', Data::$normals);

$letters = array_keys(Data::$letters);
//var_dump($letters);

$allSavedWords = [];
foreach (array_unique(array_values(PublicationCodes::$codeToName)) as $publication) {
    foreach ($letters as $letter){
        writeLine($publication.' - '.$letter);
        $percent->Step('Saving '.$publication.' - '.$letter, true);
        $words = &Data::$byBook->{$publication}->{$letter};
        if (empty($words)) continue;
        recursive_key_sort($words);

        foreach ($words as $word => &$values) {
            $wordCount = array_sum(array_values($values));
            $latestYear = max(array_keys($values));
            if($wordCount < 2 && $latestYear < 1950)
                unset($words[$word]);
            else if($wordCount < 20 && strpos($word,' ') !== false)
                unset($words[$word]);
            else
                $allSavedWords[$publication][$word] = $wordCount;

        }
        $dir = $baseFolder.$publication.'/';
        if(!is_dir($dir)) mkdir($dir, 0755, true);
        WriteJSON($dir. strtoupper($letter) . '.json', $words);
    }
}

foreach ($allSavedWords as $publication=>$wordCounts) {
    $percent->Step('Saving '.$publication.' - Counts',true);
    WriteJSON($baseFolder . $publication . '.json', $wordCounts);
}
//file_put_contents('Watchtower - Words By Year.json', json_encode(ExtractWords::$byYear));

echo("<pre>");
echo("Done");
//print_r($allSavedWords);

