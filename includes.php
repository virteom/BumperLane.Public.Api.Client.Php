<?php

if(!defined('INCLUDED_BUMPERLANE_PUBLIC_API_CLIENT')){
    define('INCLUDED_BUMPERLANE_PUBLIC_API_CLIENT', 1);
    include_once(__DIR__ . '/Core/IApiClient.php');
    include_once(__DIR__ . '/Core/ClientModuleBase.php');
    include_once(__DIR__ . '/ApiClient.php');
    include_once(__DIR__ . '/Core/ApiRequest.php');
}  