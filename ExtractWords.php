<?php
include (__DIR__.'/functions.php');

$dirs =  glob('C:\temp\WT\*', GLOB_ONLYDIR);

class Data {
    public static $regex = "/([a-z][a-zÀ-ÖØ-öø-ÿ'\-]*|\d+|[\.!?\(\)\[\]])/i";
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
        //writeLine ($file);
        $line = file_get_contents($file);
        //ForeachLine($file, function($line) use ($year, $publication){
            //$line = "1914 is the year in which 1975 failed";
            preg_match_all(Data::$regex, $line, $matches);
            if(empty($matches[0])) continue;

            $matches = $matches[0];
            $wordsOnLine = count($matches);
            Data::$normals['All']['Words In Year'][$year] = (Data::$normals['All']['Words In Year'][$year] ?? 0) + $wordsOnLine;
            Data::$normals[$publication]['Words In Year'][$year] = (Data::$normals[$publication]['Words In Year'][$year] ?? 0) + $wordsOnLine;

            $lastWord = null;
            for($i = 0; $i < $wordsOnLine; $i++){
                $word = strtolower($matches[$i]);
                if(strlen($word) <= 1) { $lastWord = null; continue; }
                $letter = $word[0];
                Data::$letters[$letter] = true;
                Data::$byBook->{$publication}->{$letter}[$word][$year] = (Data::$byBook->{$publication}->{$letter}[$word][$year] ?? 0) + 1;
                Data::$byBook->{'All'}->{$letter}[$word][$year] = (Data::$byBook->{'All'}->{$letter}[$word][$year] ?? 0) + 1;

                if($lastWord != null && !is_numeric($lastWord)){
                    $lastWord .= " ".$word;
                    Data::$byBook->{$publication}->{$lastWord[0]}[$lastWord][$year] = (Data::$byBook->{$publication}->{$lastWord[0]}[$lastWord][$year] ?? 0) + 1;
                    Data::$byBook->{'All'}->{$lastWord[0]}[$lastWord][$year] = (Data::$byBook->{'All'}->{$lastWord[0]}[$lastWord][$year] ?? 0) + 1;
                }

                $lastWord = $word;
            }
            //unset($matches);
        //});
    }

    //echo(json_encode(Data::$byBook, JSON_NUMERIC_CHECK));
//    var_dump(Data::$normals);
//    break;
    //die();

    unset($info);
}
//die();

$percent->Step('Saving Normals', true);

$baseFolder = "Data/WordsByYear/";
recursive_key_sort(Data::$normals);
file_put_contents($baseFolder . 'normals.json', json_encode(Data::$normals, JSON_NUMERIC_CHECK));

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
            if($wordCount > 100 || strpos($word,' ') == false)
                $allSavedWords[$publication][$word] = $wordCount;
            else
                unset($words[$word]);
        }
        $dir = $baseFolder.$publication.'/';
        if(!is_dir($dir)) mkdir($dir, 0755, true);
        file_put_contents($dir. strtoupper($letter) . '.json', json_encode($words, JSON_NUMERIC_CHECK));
    }
}

foreach ($allSavedWords as $publication=>$wordCounts) {
    $percent->Step('Saving '.$publication.' - Counts',true);
    file_put_contents($baseFolder . $publication . '.json', json_encode($wordCounts, JSON_NUMERIC_CHECK));
}
//file_put_contents('Watchtower - Words By Year.json', json_encode(ExtractWords::$byYear));

echo("<pre>");
echo("Done");
//print_r($allSavedWords);

