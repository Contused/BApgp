/**
 * Created by Alexander on 03.05.2018.
 */
var today = new Date();
var ibJson = [];
var trennZeichen = "§";
var dseOrigins = ["lcm", "playstore", "link_guesser", "app", "mtd", "manuall"];
var route = "get_infai_dataset_by_bundle_id";
var token = "uni_leipzig_ba_prull_2018_01_17_Aihungaem5ie7opheeme";
var verbosity = "0";
var priority = "5";
var trgDsePlay = "false";
var trgLinkGuess = "false";
var trgDseLcm = "false";
var trgDseMtd = "false";
var trgDseInApp = "false";
//var forceExec = "&force_execution=true";
var urlWholeDataSetNoRequest = "https://infaibackend.pguard-tools.de/"+ route +"?api_token="+ token
    +"&verbosity="+ verbosity +"&priority="+ priority + "&trigger_dse_playstore_download="+ trgDsePlay
    +"&trigger_link_guesser="+ trgLinkGuess + "&trigger_dse_lcm_download="+ trgDseLcm
    +"&trigger_dse_mtd_download="+ trgDseMtd +"&trigger_dse_inapp_search="+ trgDseInApp +"&bundle_id=";
var urlTriggerNewAnalysis = "https://infaibackend.pguard-tools.de/"+ route +"?api_token="+ token
    +"&verbosity="+ "3" +"&priority="+ priority + "&trigger_dse_playstore_download="+ "true"
    +"&trigger_link_guesser="+ "true" + "&trigger_dse_lcm_download="+ "true"
    +"&trigger_dse_mtd_download="+ "true" +"&trigger_dse_inapp_search="+ "true"+ "&bundle_id=";

//Funktion von Mozilla die Browser auf localStorage-Verfügbarkeit überprüft.
function storageAvailable(type) {
    try {
        var storage = window[type],
            x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    }
    catch(e) {
        return e instanceof DOMException && (
                // everything except Firefox
            e.code === 22 ||
            // Firefox
            e.code === 1014 ||
            // test name field too, because code might not be present
            // everything except Firefox
            e.name === 'QuotaExceededError' ||
            // Firefox
            e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
            // acknowledge QuotaExceededError only if there's something already stored
            storage.length !== 0;
    }
}

//Lädt neugewonnene Daten in den localStorage des Browsers
function castDseToStorageString(dse){
    var extractionDate;
    var ibString = "";
    var freqCount = "1";
    var ibs = [];
    if(dse.origin === "dummy"){
        extractionDate = new Date(dse.date_extracted);
    } else {
        extractionDate = new Date(dse.date_infobox_calculation_finished);
    }
    //Auf Tage runden.
    extractionDate = Math.floor(extractionDate.getTime() /86400000);

    console.log("Wähle: ", dse.origin , dse.date_infobox_calculation_finished);
    for(var o = 0; o < dse.infoboxes.length; o++){
        // 20 und 28 werden ignoriert
        if(dse.infoboxes[o].id !== 28 && dse.infoboxes[o].id !== 20 && dse.infoboxes[o].result.short === "yes"){
            // 13 und 21 setzten mehrere Elemente bei den jeweiligen Eigenschaften voraus
            if((dse.infoboxes[o].id !== 13 && dse.infoboxes[o].id !== 21) || (dse.infoboxes[o].id === 13 && dse.infoboxes[o].result.details.which_device_infos.length > 1) ||
                (dse.infoboxes[o].id === 21 && dse.infoboxes[o].result.details.which_third_parties.length > 1)){
                ibs.push("" + dse.infoboxes[o].id);
            }
        }
    }

    for(var i = 0; i < ibs.length; i++){
        if(i === (ibs.length - 1)){
            ibString += ibs[i];
        } else {
            ibString += ibs[i] + trennZeichen;
        }
    }

    return "" + extractionDate + trennZeichen + freqCount + trennZeichen + ibString;
}

//Baut den entsprechenden Banner für die Multiapp-Ansicht
function createPanel(appSquare, appDataArray, hasResults){
    var ibs = appDataArray.slice(2,appDataArray.length + 1);
    var redLine = false;
    var banner = document.createElement("div");
    banner.classList.add("pguard");
    var funde = document.createElement("span");
    // appSquare.insertBefore(dummy,appSquare.childNodes[0]);
    // $(dummy).attr({"data-toggle": "popover"});

    // for(var j = 0; j < ibs.length; j++){
    //     for(i = 0; i < ibJson.length; i++){
    //         if(ibs[j] === ibJson[i].id){
    //         }
    //     }
    // }

    if(hasResults){
        console.log("result works");
        funde.textContent = "Funde: ";

        var badge = document.createElement("span");
        badge.classList.add("badge", "badge-secondary", "float-right");
        badge.textContent = "" + ibs.length;
        funde.appendChild(badge);
        for(var j = 0; j < ibs.length; j++){
            for(var i = 0; i < ibJson.length; i++){
                if(ibs[j] === ibJson[i].id && ibJson[i].is_red_line === "true"){
                    redLine = true;
                    break;
                }
            }
        }

        if(redLine){
            banner.style.backgroundColor = "#ff8c8c";
        }else{
            banner.style.backgroundColor = "#99ccff";
        }

        $(banner).attr({"data-toggle": "popover"});
        $(banner).click(function () {
            $.get(chrome.extension.getURL("lib/templates/showResults.html")).then(function (data) {
                $('[data-toggle="popover"]').popover({
                    html: true,
                    content: function(){
                        return data;
                    }
                });
            }, function (reason) {
                console.log("nä"+reason);
            });

            console.log("Popover triggered");
        });
    } else {
        console.log("no result works");
        funde.textContent = "Keine Ergebnisse";
        banner.style.backgroundColor = "#d1d1d1";
        // testSpan.textContent = "Ergebnisse anzeigen";
        // $(testSpan).click(function () {
        //     console.log("hole Ergebnisse");
        //     $.ajax({
        //         url: urlTriggerNewAnalysis,
        //         method: "POST",
        //         success: function(data){
        //             testSpan.textContent = "Neue Analyse angefragt";
        //             console.log("Anfrage erfolgreich: " + data);
        //         },
        //         dataType: "json"
        //     })
        // });
        // frame.style.backgroundColor = "#d1d1d1";
    }

    banner.appendChild(funde);
    appSquare.insertBefore(banner,appSquare.childNodes[0]);
}

function getNewestDseFromData(data){
    var newestDse = null;
    //Dummy-DSEs haben Vorang. Ansonsten wird die neuste DSE verwendet. Gibt es 2 DSE zum gleichen Analyse-Datum wird die aus der bevorzugten Quelle gewählt.
    for (var i = 0; i < data.dses.length; i++) {
        //Dummy
        if(data.dses[i].origin === "dummy"){
            newestDse = data.dses[i];
            break;
        }
        else{
            //Erste gefundene
            if(!newestDse){
                newestDse = data.dses[i];
            } else {
                //Vergleich mit vorher gefundener DSE
                var candidateTimeStamp = new Date(data.dses[i].date_infobox_calculation_finished);
                var dseTimeStamp = new Date(newestDse.date_infobox_calculation_finished);
                if(candidateTimeStamp.getTime() > dseTimeStamp.getTime()){
                    newestDse = data.dses[i];
                } else if (candidateTimeStamp.getTime() === dseTimeStamp.getTime()){
                    if(dseOrigins.indexOf(data.dses[i].origin) < dseOrigins.indexOf(newestDse.origin)){
                        newestDse = data.dses[i];
                    }
                }
            }
        }
    }
    return newestDse;
}

//Erstellt die Header für die Multiapp-Ansicht
function loadInfoPanels(appSquare) {
    var appID = $(appSquare).attr("data-docid");
    //Wurde eine App-ID gefunden?
    if (appID) {
        var appDataString = localStorage.getItem(appID);
        var appDataArray = [];
        //Prüft ob bereits Daten im localStorage vorhanden und aktuell sind.
        if(appDataString && appDataString.split(trennZeichen)[0]){
            var lastUpdate = new Date(appDataString.split(trennZeichen)[0] * 86400000);
            console.log(appDataString.split(trennZeichen)[0]);
            console.log("getdate?:", (lastUpdate.getTime() / 86400000) , today.getTime() / 86400000, (lastUpdate.getTime() / 86400000 + 3) <= today.getTime() / 86400000);
            if((lastUpdate.getTime() + 259200000) >= today.getTime()){
                console.log("Die aktuelle DSE ist weniger als 3 Tage alt.");
                appDataArray = appDataString.split(trennZeichen);
            } else {
                console.log("Die aktuelle DSE ist älter als 3 Tage.");
                console.log("Aktuallisiere Daten für " + appID);
            }
        }
        //Falls Daten vorhanden baue das Element darauß
        if(appDataArray.length > 0){
            console.log("STORAGE GEFUNDEN: ", appID, appDataArray);
            createPanel(appSquare, appDataArray, true);
            //Ansonsten lade die Informationen aus dem Backend
        } else {
            console.log("Frage erstmalig Daten ab für " + appID);
            $.ajax({
                url: urlWholeDataSetNoRequest + "" +appID,
                method: "POST",
                success: function (response) {
                    var data = response.data;
                    console.log(data);
                    //Wurden bereits DSEs für die App gefunden?
                    if (data.dses && data.dses.length > 0) {
                        var storageString = castDseToStorageString(getNewestDseFromData(data));
                        localStorage.setItem(appID, storageString);
                        console.log("STORAGE ANGELEGT", appID, storageString);
                        appDataArray = storageString.split(trennZeichen);
                        createPanel(appSquare, appDataArray, true);
                    } else {
                        console.log("KEINE DSE VORHANDEN", appID);
                            $.ajax({
                                url: urlTriggerNewAnalysis,
                                method: "POST",
                                success: function(data){
                                    console.log("Anfrage erfolgreich: " + data);
                                },
                                dataType: "json"
                            });
                        createPanel(appSquare, [], false);
                    }
                },
                dataType: "json"
            });
        }
    }
}

//Lädt lokale Json-Bibliothek für Infoboxen
$.getJSON(chrome.extension.getURL("lib/data/IB_texte.json"), function (input) {
    ibJson = input;
    console.log("Lokale Json geladen.");

    if(storageAvailable("localStorage")){
        $(".square-cover").each(function () {
            loadInfoPanels(this);
        });
    } else {
        console.log("kein local Storage verfügbar.")
    }

    //TODO SingleApp
    $(".JHTxhe").load(chrome.extension.getURL("lib/templates/showResults.html"));
});
