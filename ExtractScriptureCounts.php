<?php
include (__DIR__.'/functions.php');

$dirs =  glob('C:\temp\WT\*', GLOB_ONLYDIR);

class Data {
    public static $regex = "/((([123]|first|second|third)\s*)?[a-zA-Z]+\.?)\s(\d+):(\d+)(-(\d+))?/i";
    public static $byPubAndYear = [];
    public static $byPubYearBook = [];
    public static $normals = [ "Publications In Year" => [], "Scriptures In Year" => [], ];
}

$percent = new PercentReporter(count($dirs));

foreach ($dirs as $dir) {
    $files = glob($dir.'\\*.txt');
    $info = json_decode(file_get_contents($dir . "/info.json"));
    $info->Category = PublicationCodes::$codeToName[$info->Category] ?? null;
    if($info->Category == null) continue;
    $info->Year = intval($info->Year);
    if($info->UndatedReferenceTitle == 'Aid'){
        continue;
    }
    Data::$normals['Publications In Year'][$info->Year] = (Data::$normals['Publications In Year'][$info->Year] ?? 0) + 1;
    foreach ($files as $file){
        //writeLine ($file);

        ForeachLine($file, function($line) use ($info) {
            $line = mb_convert_encoding($line, "US-ASCII");
            $line = str_replace('?', ' ', $line);//There were hidden characters only inspectable when changing encoding >:/
            preg_match_all(Data::$regex, $line, $matches);
            if(empty($matches[0])) return;
            //var_dump($matches);

            for($i=0; $i< count($matches[0]); $i++){
                if(!AddScripture($info, $matches[1][$i], $matches[4][$i], $matches[5][$i], $matches[7][$i])){
                    //writeLine($matches[1][$i]);
                    //var_dump($matches);
                    //writeLine("<small>".$line."</small>");
                }
            }
        });

    }
    $percent->Step($dir);
}
echo("<pre>");
echo("Done");

$baseFolder = "Data/ScripturesByYear/";
if(!is_dir($baseFolder)) mkdir($baseFolder);

$percent->Step('Saving Normals');
file_put_contents($baseFolder . 'normals.json', json_encode(Data::$normals, JSON_NUMERIC_CHECK));

recursive_key_sort(Data::$byPubAndYear);
foreach (Data::$byPubAndYear as $publication => &$byYear) {
    $percent->Step('Saving Stage 1 - '.$publication);
    file_put_contents($baseFolder.$publication.'.json', json_encode($byYear, JSON_NUMERIC_CHECK));
}
Data::$byPubAndYear = null;

recursive_key_sort(Data::$byPubYearBook);
foreach (Data::$byPubYearBook as $publication => &$byBook) {
    foreach ($byBook as $book => &$byYear) {
        $percent->Step('Saving Stage 2 - '.$book);
        $dir = $baseFolder.$publication."/";
        if(!is_dir($dir)) mkdir($dir);
        file_put_contents($dir."{$book}.json", json_encode($byYear, JSON_NUMERIC_CHECK));
    }
}

function AddScripture($info, $raw_book, $chapter, $startVerse, $endVerse){
    $book = BibleBooks::ConvertName($raw_book);
    if(!$book)
        return false;

    $year = $info->Year;
    $publication = $info->Category;

    if($endVerse < $startVerse || empty($endVerse)) $endVerse = $startVerse;

    Data::$normals['Scriptures In Year'][$year] = (Data::$normals['Scriptures In Year'][$year] ?? 0) + 1;

    for ($v = $startVerse; $v <= $endVerse; $v++) {

        Data::$byPubYearBook[$publication][$book][$chapter.':'.$v][$year] = (Data::$byPubYearBook[$publication][$book][$chapter.':'.$v][$year] ?? 0) + 1;
        Data::$byPubYearBook['All'][$book][$chapter.':'.$v][$year] = (Data::$byPubYearBook['All'][$book][$chapter.':'.$v][$year] ?? 0) + 1;

        $textVer = $book.' '.$chapter.':'.$v;
        Data::$byPubAndYear[$publication][$textVer][$year] = (Data::$byPubAndYear[$publication][$textVer][$year] ?? 0) + 1;
        Data::$byPubAndYear['All'][$textVer][$year] = (Data::$byPubAndYear['All'][$textVer][$year] ?? 0) + 1;
    }
    return true;
}

