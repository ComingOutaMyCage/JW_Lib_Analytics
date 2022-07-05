<?php
include (__DIR__.'/functions.php');

$dirs =  glob('C:\temp\WT\*', GLOB_ONLYDIR);

class Data {
    public static $regex = "/([a-z][\w'-]*|\d+|[\.!?\(\)\[\]])/i";
    public static $byBook;
    public static $normals = [ "Publications In Year" => [], "Words In Year" => [], ];
}
class BlankClass {}
Data::$byBook = new BlankClass();
foreach (array_values(PublicationCodes::$codeToName) as $publication) {
    Data::$byBook->{$publication} = new Data();
}

$percent = new PercentReporter(count($dirs));
foreach ($dirs as $dir) {
    $files = glob($dir.'\\*.txt');
    $info = json_decode(file_get_contents($dir . "/info.json"));
    $publication = PublicationCodes::$codeToName[$info->Category] ?? null;
    if(empty($publication)) continue;
    $year = intval($info->Year);
    if($info->UndatedReferenceTitle == 'Aid'){
        continue;
    }
    Data::$normals['Publications In Year'][$year] = (Data::$normals['Publications In Year'][$year] ?? 0) + 1;
    foreach ($files as $file){
        //writeLine ($file);

        ForeachLine($file, function($line) use ($year, $publication){
            preg_match_all(Data::$regex, $line, $matches);
            if(empty($matches[0])) return;

            $matches = $matches[0];
            $wordsOnLine = count($matches);
            Data::$normals['Words In Year'][$year] = (Data::$normals['Words In Year'][$year] ?? 0) + $wordsOnLine;

            $lastWord = null;
            for($i = 0; $i < $wordsOnLine; $i++){
                $word = strtolower($matches[$i]);
                if(strlen($word) == 1) { $lastWord = null; continue; }
                Data::$byBook->{$publication}->{$word[0]}[$word][$year] = (Data::$byBook->{$publication}->{$word[0]}[$word][$year] ?? 0) + 1;
                Data::$byBook->{'All'}->{$word[0]}[$word][$year] = (Data::$byBook->{'All'}->{$word[0]}[$word][$year] ?? 0) + 1;

                if($lastWord != null && !is_numeric($lastWord)){
                    $lastWord .= " ".$word;
                    Data::$byBook->{$publication}->{$lastWord[0]}[$lastWord][$year] = (Data::$byBook->{$publication}->{$lastWord[0]}[$lastWord][$year] ?? 0) + 1;
                    Data::$byBook->{'All'}->{$lastWord[0]}[$lastWord][$year] = (Data::$byBook->{'All'}->{$lastWord[0]}[$lastWord][$year] ?? 0) + 1;
                }

                $lastWord = $word;
            }
            unset($matches);
        });
    }

    $percent->Step($dir);
//    echo(json_encode(Data::$byBook, JSON_NUMERIC_CHECK));
//    var_dump(Data::$byBook);
    //break;
    //die();

    unset($info);
}

$percent->Step('Saving Normals');

$baseFolder = "Data/WordsByYear/";
file_put_contents($baseFolder . 'normals.json', json_encode(Data::$normals, JSON_NUMERIC_CHECK));

$az = range('a', 'z');
$allSavedWords = [];
foreach (array_unique(array_values(PublicationCodes::$codeToName)) as $publication) {
    foreach ($az as $letter){
        writeLine($publication.' - '.$letter);
        $percent->Step('Saving '.$publication.' - '.$letter);
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
    $percent->Step('Saving '.$publication.' - Counts');
    file_put_contents($baseFolder . $publication . '.json', json_encode($wordCounts, JSON_NUMERIC_CHECK));
}
//file_put_contents('Watchtower - Words By Year.json', json_encode(ExtractWords::$byYear));

echo("<pre>");
print_r($allSavedWords);

