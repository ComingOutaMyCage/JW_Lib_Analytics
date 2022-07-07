<?php
class BibleBooks
{
    public static $conversion;
    public static $InOrder;

    public static function Init()
    {
        self::$InOrder = [
            "Genesis",
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
            "Song of Solomon",
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
            "Revelation"
        ];
        $conversion = [
            'Jude' => 'Jude',
            '1 Tim' => '1 Timothy',
            '2 Tim' => '2 Timothy',
            '1 Ti' => '1 Timothy',
            '2 Ti' => '2 Timothy',
            'Matt'=>'Matthew',
            'Mt'=>'Matthew',
            'Mr'=>'Mark',
            'Mk'=>'Mark',
            'Ezra' => 'Ezra',
            'Ezr' => 'Ezra',
            'Ez' => 'Ezra',
            'Esdras' => 'Ezra',
            'Psalm' => 'Psalms',
            '1 Psalm' => 'Psalms',
            '2 Psalm' => 'Psalms',
            '3 Psalm' => 'Psalms',
            'Ps' => 'Psalms',
            'Pss' => 'Psalms',
            'Gen' => 'Genesis',
            'Prov' => 'Proverbs',
            'Ex' => 'Exodus',
            'Lev' => 'Leviticus',
            'Le' => 'Leviticus',
            'Zech' => 'Zechariah',
            'Zec' => 'Zechariah',
            'Jas' => 'James',
            'Ezek' => 'Ezekiel',
            'Eccl' => 'Ecclesiastes',
            'Ecclus' => 'Ecclesiastes',
            'Ec' => 'Ecclesiastes',
            'Ecclesiasticus' => 'Ecclesiastes',
            'Hag' => 'Haggai',
            '1 Chron' => '1 Chronicles',
            '2 Chron' => '2 Chronicles',
            '1 Chro' => '1 Chronicles',
            '2 Chro' => '2 Chronicles',
            '1 Chr' => '1 Chronicles',
            '2 Chr' => '2 Chronicles',
            '1 Ch' => '1 Chronicles',
            '2 Ch' => '2 Chronicles',
            '1 Paralipomenon' => '1 Chronicles',
            '2 Paralipomenon' => '2 Chronicles',
            'Rev' => 'Revelation',
            '1 Cor' => '1 Corinthians',
            '2 Cor' => '2 Corinthians',
            '1 Co' => '1 Corinthians',
            '2 Co' => '2 Corinthians',
            '1 Pet' => '1 Peter',
            '2 Pet' => '2 Peter',
            'Isa' => 'Isaiah',
            'Isaias' => 'Isaiah',
            'Mic' => 'Micah',
            'Micheas' => 'Micah',
            'Ho' => 'Hosea',
            'Hos' => 'Hosea',
            'Osee' => 'Hosea',
            'Jer' => 'Jeremiah',
            'Zeph' => 'Zephaniah',
            'Sophonias' => 'Zephaniah',
            'Hab' => 'Habakkuk',
            'Habakkuk' => 'Habakkuk',
            'Da' => 'Daniel',
            'Dan' => 'Daniel',
            'Deut' => 'Deuteronomy',
            'De' => 'Deuteronomy',
            'Rom' => 'Romans',
            'Col' => 'Colossians',
            'Josh' => 'Joshua',
            'Jos' => 'Joshua',
            '1 Thess' => '1 Thessalonians',
            '2 Thess' => '2 Thessalonians',
            '1 Th' => '1 Thessalonians',
            '2 Th' => '2 Thessalonians',
            '1 Sam' => '1 Samuel',
            '2 Sam' => '2 Samuel',
            '1 Sa' => '1 Samuel',
            '2 Sa' => '2 Samuel',
            'Judg' => 'Judges',
            'Jg' => 'Judges',
            'Eph' => 'Ephesians',
            'Nah' => 'Nahum',
            'Pr' => 'Proverbs',
            'Phil' => 'Philippians',
            'Php' => 'Philippians',
            'Phm' => 'Philemon',
            'Philemon' => 'Philemon',
            'Gal' => 'Galatians',
            'Ga' => 'Galatians',
            'Gn' => 'Galatians',
            'Heb' => 'Hebrews',
            'Num' => 'Numbers',
            'Mal' => 'Malachi',
            'Tit' => 'Titus',
            'Obad' => 'Obadiah',
            'Es' => 'Esther',
            'Esth' => 'Esther',
            '1 Ki' => '1 Kings',
            '2 Ki' => '2 Kings',
            'Joe' => 'Joseph',

            'Neh' => 'Nehemiah',
            'Ne' => 'Nehemiah',
            'Re' => 'Revelation',
            'Eze' => 'Ezekiel',
            'Ezech' => 'Ezekiel',
            'Ezechiel' => 'Ezekiel',
            'Ge' => 'Genesis',
            'Ac' => 'Acts',
            'Act' => 'Acts',
            'Ro' => 'Romans',
            'Lu' => 'Luke',
            'Lk' => 'Luke',
            'Joh' => 'John',
            'Jon' => 'John',
            'Jn' => 'John',
            'Jo' => 'John',
            '1 John' => '1 John',
            '2 John' => '2 John',
            '3 John' => '3 John',
            '1 Joh' => '1 John',
            '2 Joh' => '2 John',
            '3 Joh' => '3 John',
            '1 Jo' => '1 John',
            '2 Jo' => '2 John',
            '3 Jo' => '3 John',
            '1 Jn' => '1 John',
            '2 Jn' => '2 John',
            '3 Jn' => '3 John',
            '1 Jon' => '1 John',
            '2 Jon' => '2 John',
            '3 Jon' => '3 John',
            'Nu' => 'Numbers',
            'Job' => 'Job',
            'Mark' => 'Mark',
            'Joel' => 'Joel',
            'Amos' => 'Amos',
            'Zep' => 'Zephaniah',
            '1 Pe' => '1 Peter',
            '2 Pe' => '2 Peter',
            'Sura' => 'Sura',
            'Suras' => 'Sura',
            'Jona' => 'Jonah',
            'Ruth' => 'Ruth',
            'Ca' => 'Solomon',
            'Cant' => 'Solomon',
            'Sol' => 'Solomon',
            '1 Macc' => '1 Maccabees',
            '2 Macc' => '2 Maccabees',
            '1 Machabees' => '1 Maccabees',
            '2 Machabees' => '2 Maccabees',
            'Wisdom' => 'Wisdom',
            'Lam' => 'Lamentations',
            'La' => 'Lamentations',
            'Mormon' => 'Mormon',
            'Moroni' => 'Moroni',
            'Ether' => 'Ether',
            'Apoc' => 'Apocalypse',
            'Mosiah' => 'Mosiah',
            'Alma' => 'Alma',
            '1 Nephi' => '1 Nephi',
            '2 Nephi' => '2 Nephi',
            '3 Nephi' => '3 Nephi',
            'Helaman' => 'Helaman',
            'Apostles' => 'Acts',

            'To' => '',
            'At' => '',
            'And' => '',
            'Around' => '',
            'About' => '',
            'Between' => '',
            'Until' => '',
            'By' => '',
            'Was' => '',
            'From' => '',
            'Till' => '',
            'Through' => '',
        ];
        foreach (array_values($conversion) as $array_value){
            $conversion[$array_value] = $array_value;
        }
        $conversion = array_change_key_case($conversion, CASE_LOWER);
        self::$conversion = $conversion;
    }
    public static function ConvertName($book){
        $book = ucwords(rtrim($book, '.'));
        if(is_numeric($book) || empty($book)) return;
        if(is_numeric($book[0]) && $book[1] != ' ') $book = $book[0].' '.substr($book, 1);
        $normalName = (BibleBooks::$conversion[strtolower($book)] ?? null);
        if($normalName === null) {
            $book = preg_replace('/\s+/', ' ', $book);
            $book = str_replace('First', '1', $book);
            $book = str_replace('Second', '2', $book);
            $book = str_replace('Third', '3', $book);
            $normalName = (BibleBooks::$conversion[strtolower($book)] ?? null);
        }
        if($normalName === null) {
            $book = ltrim($book, '123 ');
            $normalName = (BibleBooks::$conversion[strtolower($book)] ?? null);
        }
        if($normalName === null) {
            return false;
        }
        if($normalName === '') return null;
        return $normalName;
    }
}
BibleBooks::Init();

class PublicationCodes {
    public static $codeToName = [
        'All' => 'All',
        //'ws' => 'Watchtower',
        'ws' => null, //Watchtower Simplified
        'w' => 'Watchtower',
        'wp' => 'Watchtower',
        'km' => 'Kingdom Ministry',
        'mwb' => 'Kingdom Ministry',

        'yb' => 'Year Book',
        'g' => 'Awake',
        'brch' => 'Brochures',
        'bklt' => 'Brochures',
        'bk' => 'Books',

        'bi' => null,
        'gloss' => null,
        'it' => null,
    ];
    public static function GetCategory($info){
        $category = PublicationCodes::$codeToName[$info->Category] ?? null;
        if(empty($info->Category)) return null;
        if($info->UndatedReferenceTitle == 'Aid' || preg_match('/ws\d+/', $info->Symbol)){//Watchtower simplified
            return null;
        }
        return $category;
    }
}

function writeLine($text){
    echo($text."<br/>");
}
function recursive_key_sort(&$by_ref_array)
{
    ksort($by_ref_array, SORT_NATURAL);
    foreach ($by_ref_array as $key => $value) {
        if (is_array($value))
        {
            recursive_key_sort($by_ref_array[$key]);
        }
    }
}

function ForeachLine($file, $action){
    $handle = fopen($file, "r");
    if ($handle) {
        while (($line = fgets($handle)) !== false) {
            $action($line);
        }
        fclose($handle);
    }
}

class PercentReporter
{
    public $steps;
    public $step;
    public $lastPercent;
    public function __construct($steps)
    {
        $this->steps = $steps;
        echo("<div id='percent'>0%</div>");
    }

    public function Step($status, $force = false){
        $this->step++;
        $percent = intval(($this->step / $this->steps) * 100);
        if($percent > $this->lastPercent || $force){
            $status = json_encode($status);
            echo("<script>document.getElementById('percent').innerHTML = '{$percent}% - {$status}';</script>");
            $this->lastPercent = $percent;
            flush();
            ob_flush();
        }
    }
}

function WriteJSON($filename, $data){
    $json = json_encode($data, JSON_NUMERIC_CHECK);
    file_put_contents($filename, $json);

//    $gz = gzopen($filename.".gz",'w9');
//    gzwrite($gz, $json);
//    gzclose($gz);

    file_put_contents($filename.".gz", gzencode($json, 9));
    return $json;
}