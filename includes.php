<?php

if(!defined('INCLUDED_BUMPERLANE_PUBLIC_API_CLIENT')){
    define('INCLUDED_BUMPERLANE_PUBLIC_API_CLIENT', 1);
    $autoloadFile = __DIR__ . '/../vendor/autoload.php';
    if(file_exists($autoloadFile)){
        include_once($autoloadFile);
    }

    include_once(__DIR__ . '/Core/IApiClient.php');
    include_once(__DIR__ . '/Core/ClientModuleBase.php');
    include_once(__DIR__ . '/ApiClient.php');
    include_once(__DIR__ . '/Core/ApiRequest.php');
}