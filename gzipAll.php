<?php
$it = new RecursiveDirectoryIterator("./Data");

echo("<small>");
$start = time();
// Loop through files
foreach(new RecursiveIteratorIterator($it) as $file) {
    if ($file->getExtension() == 'json') {
        $json = file_get_contents($file);
        echo($file."<br/>");
        file_put_contents($file.'.gz', gzencode($json, 9));

    }
}
$end = time();
echo("Took " .($end - $start) . "sec");