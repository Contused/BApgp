/**
 * Created by Alexander on 04.04.2018.
 */
var isExtensionOn = true;

chrome.runtime.onInstalled.addListener(function() {
    //removeRules, braucht declarativeContent permission, 1 = Liste an Regeln(undefined = keine Eingabe),
    // 2= function nach Loeschen
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
        //siehe removeRules, wird am Ende von remove rules aufgerufen.
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: [new chrome.declarativeContent.PageStateMatcher({
                pageUrl: { schemes: ['https'], hostContains: 'play.google.com', pathContains:"/store/apps"}
            })
            ],
            actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);
    });
});

//Listener für Anfragen von pguard.js und popup-controller.js
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        //"get" für die Rückgabe, ob Extension aktiviert ist oder nicht
        if(request.extensionState == "get"){
            if(isExtensionOn){
                sendResponse("on");
            }else{
                sendResponse("off");
            }
        //"set" um den Status zu aktualisieren
        } else if(request.extensionState == "set"){
            if(request.state == "on"){
                $('link[href="/css/multiapp.css"]').prop('disabled', true);
                isExtensionOn = false;
            } else{
                $('link[href="/css/multiapp.css"]').prop('disabled', false);
                isExtensionOn = true;
            }

            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs){
                var code = 'window.location.reload();';
                chrome.tabs.executeScript(tabs[0].id, {code: code});
            });
        }

        //Weiterleitung der Anfrage an das Backend vom Content Skript
        if(request.contentScriptQuery == "appIDQuery") {
            var url = "https://infaibackend.pguard-tools.de/get_infai_dataset_by_bundle_id" +
                "?api_token=uni_leipzig_ba_prull_2018_01_17_Aihungaem5ie7opheeme&verbosity=3" +
                "&priority=5&trigger_dse_playstore_download=false&trigger_link_guesser=false" +
                "&trigger_dse_lcm_download=false&trigger_dse_mtd_download=false" +
                "&trigger_dse_inapp_search=false&bundle_id=" +
                encodeURIComponent(request.appID);
            $.ajax({
                url: url,
                method: "POST",
                success: function (response) {
                    var data = response.data;
                    sendResponse(data);
                },
                dataType: "json"
            });

            //für asynchrone Antwort
            return true;
        }
    });
