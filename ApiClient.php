<?php

namespace Virteom\ApiClient\Php;
include_once('includes.php');

class ApiClient {

    public static function Create($api, string $clientId = MODERN_API_CLIENT_ID, string $clientSecret = MODERN_API_CLIENT_SECRET, string $baseUrl = MODERN_API_SITE_URL){
        $apiObject = $api;
        if(is_string($api)){
            if(!class_exists($api)){
                trigger_error("The api passed into the ApiClient is not a class that could be found. Method called: ApiClient::Create; Api passed: $api;", E_USER_WARNING);
                return null;
            }

            $apiObject = new $api;
        }

        if(!is_a($apiObject, Core\ClientModuleBase::class)){
            trigger_error("The api class passed into the ApiClient does not inherit from '" . Core\ClientModuleBase::class . "'. Api class passed: '" . get_class($apiObject) . "';", E_USER_WARNING);
            return null;
        }

        $apiObject->BaseUrl = $baseUrl;
        $apiObject->ClientId = $clientId;
        $apiObject->ClientSecret = $clientSecret;

        return $apiObject;
    }

}       