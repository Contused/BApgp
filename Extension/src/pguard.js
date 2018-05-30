/**
 * Created by Alexander on 03.05.2018.
 */
var today = new Date();
var newAPI = true;
var trennZeichen = "§";
var dseOrigins = ["lcm", "playstore", "link_guesser", "app", "mtd", "manuall"];
var route = "get_infai_dataset_by_bundle_id";
var token = "uni_leipzig_ba_prull_2018_01_17_Aihungaem5ie7opheeme";
var verbosity = "0";
var priority = "1";
var trgDsePlay = "false";
var trgLinkGuess = "false";
var trgDseLcm = "false";
var trgDseMtd = "false";
var trgDseInApp = "false";
var urlWholeDataSetNoRequest = "https://139.18.2.209:9595/"+ route +"?api_token="+ token
    +"&verbosity="+ verbosity +"&priority="+ priority + "&trigger_dse_playstore_download="+ trgDsePlay
    +"&trigger_link_guesser="+ trgLinkGuess + "&trigger_dse_lcm_download="+ trgDseLcm
    +"&trigger_dse_mtd_download="+ trgDseMtd +"&trigger_dse_inapp_search="+ trgDseInApp +"&bundle_id=";
var urlTriggerNewAnalysis = "https://139.18.2.209:9595/"+ route +"?api_token="+ token
    +"&verbosity="+ "3" +"&priority="+ priority + "&trigger_dse_playstore_download="+ "true"
    +"&trigger_link_guesser="+ "true" + "&trigger_dse_lcm_download="+ "true"
    +"&trigger_dse_mtd_download="+ "true" +"&trigger_dse_inapp_search="+ "true" +"&bundle_id=";


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

function isRedLine(id) {
    $.getJSON(chrome.extension.getURL("lib/data/IB_texte.json"), function (texte) {
        for (var i = 0; i < texte.length; i++) {
            if (id === texte[i].id && texte[i].is_red_line === "true") {
                console.log("RED");
                return true;
            }
        }
        return false;
    });
}

//Erstellt die Header für die Multiapp-Ansicht
function createTextElement(appSquare) {
    var appID = $(appSquare).attr("data-docid");
    //Wurde eine App-ID gefunden?
    if (appID) {
        //Wird die neue API verwendet?
        if(newAPI){
            var appDataString = localStorage.getItem(appID);
            var appDataArray = [];
            //Prüft ob bereits Daten im localStorage vorhanden und aktuell sind.
            if(appDataString && appDataString.split(trennZeichen)[0]){
                var lastUpdate = new Date(appDataString.split(trennZeichen)[0]);
                //TODO nach besseren origin fragen?
                if((lastUpdate.getDate() + 3) >= today.getDate()){
                    appDataArray = appDataString.split(trennZeichen);
                } else {
                    console.log("Aktuallisiere Daten für " + appID);
                }
            }
            if(appDataArray.length > 0){

            } else {

                console.log("Frage erstmalig Daten ab für " + appID);
                $.ajax({
                    url: urlWholeDataSetNoRequest + "" +appID,
                    method: "POST",
                    success: function (response) {
                        var data = response.data;
                        console.log(appID, data);
                        var frame = document.createElement('div');
                        frame.classList.add("pguard");

                        var testSpan = document.createElement('span');
                        var clickDiv = document.createElement('div');
                        var useDummy = false;
                        //Wurden bereits DSEs für die App gefunden?
                        if (data.dses) {
                            console.log(data.dses);
                            frame.style.backgroundColor = "#adccff";
                            var newestDse = null;
                            //Dummy-DSEs haben Vorang, ansonsten werden die Analysezeiträume in ein Array aufgenommen
                            for (var i = 0; i < data.dses.length; i++) {
                                if(data.dses[i].origin === "dummy"){
                                    newestDse = data.dses[i];
                                    break;
                                }
                                else{
                                    if(!newestDse){
                                        newestDse = data.dses[i];
                                    } else {
                                        var candidateTimeStamp = new Date(data.dses[i].date_infobox_calculation_finished);
                                        var dseTimeStamp = new Date(newestDse.date_infobox_calculation_finished);
                                        if(candidateTimeStamp.getTime() < dseTimeStamp.getTime()){
                                            newestDse = data.dses[i];
                                        } else if (candidateTimeStamp.getTime() === dseTimeStamp.getTime()){
                                            if(dseOrigins.indexOf(data.dses[i].origin) < dseOrigins.indexOf(newestDse.origin)){
                                                newestDse = data.dses[i];
                                            }
                                        }
                                    }
                                }
                            }
                            //Wurde eine Dummy-DSE gefunden?
                            if(!useDummy){
                                dseDates.sort();
                                console.log("Daten: " + dseDates + " " + dseDates.length);
                                var sameDseDateCounter = 0;
                                //Zeitgleiche Analysen?
                                if(dseDates.length > 1){
                                    for(var j = 0; j < dseDates.length - 1; j++){
                                        if(dseDates[j].getTime() !== dseDates[j+1].getTime()){
                                            sameDseDateCounter = j;
                                            break;
                                        }
                                    }
                                }
                                var originDataCandidates = [];
                                console.log(sameDseDateCounter);
                                if(sameDseDateCounter > 0){
                                    //Alle Origins von zeitgleichen Analysen werden aufgenommen
                                    for(var k = 0; k < data.dses.length; k++){
                                        var originCandidate = new Date(data.dses[k].date_infobox_calculation_finished);
                                        if(dseDates[0].getTime() === originCandidate.getTime()){
                                            originDataCandidates[k] = data.dses[k].origin;
                                        }
                                    }
                                    foundDse:
                                        //Origins werden nach Priorität abgelaufen
                                        for(var m = 0; m < dseOrigins.length; m++){
                                            for(var n = 0; n < originDataCandidates.length; n++){
                                                if(dseOrigins[m] === originDataCandidates[n]){
                                                    newestDse = data.dses[n];
                                                    break foundDse;
                                                }
                                            }
                                        }
                                } else {
                                    //Falls ein eindeutiger Zeitpunkt existiert, wird die DSE mit diesem herausgesucht.
                                    for(var l = 0; l < data.dses.length; l++){
                                        var candidate = new Date(data.dses[l].date_infobox_calculation_finished);
                                        if(dseDates[0].getTime() === candidate.getTime()){
                                            newestDse = data.dses[l];
                                            break;
                                        }
                                    }
                                }
                            }
                            var ibCouter = 0;
                            //Dse nicht leer?
                            if(newestDse){
                                for(var o = 0; o < newestDse.infoboxes.length; o++){
                                    // 20 und 28 werden ignoriert
                                    if(newestDse.infoboxes[o].id !== 28 && newestDse.infoboxes[o].id !== 20 && newestDse.infoboxes[o].result.short === "yes"){
                                        // 13 und 21 setzten mehrere Elemente bei den jeweiligen Eigenschaften voraus
                                        if((newestDse.infoboxes[o].id !== 13 && newestDse.infoboxes[o].id !== 21) || (newestDse.infoboxes[o].id === 13 && newestDse.infoboxes[o].result.details.which_device_infos.length > 1) ||
                                            (newestDse.infoboxes[o].id === 21 && newestDse.infoboxes[o].result.details.which_third_parties.length > 1)){
                                            ibCouter++;
                                        }
                                    }
                                }
                            }
                            testSpan.textContent = "Funde: " + ibCouter;

                            var infoHover = document.createElement("i");
                            var popoverWrapper = document.createElement("a");
                            $(popoverWrapper).attr({"data-toggle": "popover"});
                            //var resultBody = load(chrome.extension.getURL("lib/templates/showResults.html"));

                            infoHover.classList.add("far", "fa-question-circle");
                            clickDiv.classList.add("questionmark");
                            popoverWrapper.appendChild(infoHover);
                            clickDiv.appendChild(popoverWrapper);



                        } else {
                            testSpan.textContent = "Ergebnisse anzeigen";
                            $(testSpan).click(function () {
                                console.log("hole Ergebnisse");
                                $.ajax({
                                    url: urlTriggerNewAnalysis,
                                    method: "POST",
                                    success: function(data){
                                        testSpan.textContent = "Neue Analyse angefragt";
                                        console.log("Anfrage erfolgreich: " + data);
                                    },
                                    dataType: "json"
                                })
                            });
                            frame.style.backgroundColor = "#d1d1d1";
                        }
                        frame.appendChild(testSpan);
                        frame.appendChild(clickDiv);

                        appSquare.insertBefore(frame, appSquare.childNodes[0]);

                        $(clickDiv).click(function () {
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

                            console.log("HI!");
                            //$(this).load(chrome.extension.getURL("lib/templates/showResults.html")).fadeIn(100);
                        });
                    },
                    dataType: "json"
                });
            }
        } else {
            $.ajax({
                url: "https://pgadmin.datenschutz-scanner.de/api/apps?bundleId=" + appID,
                data: null,
                success: function (data) {
                    console.log($(appSquare).attr("data-docid"));
                    console.log(data);

                    var frame = document.createElement('div');
                    frame.setAttribute('test-atr', '1');

                    var testSpan = document.createElement('span');
                    var clickDiv = document.createElement('div');
                    if (data[0]) {
                        frame.style.backgroundColor = "#adccff";
                        for (var i = 0; i < data[0].infoboxes.length; i++) {
                            var redLine = isRedLine(data[0].infoboxes[i].id);
                            if (redLine) {
                                frame.style.backgroundColor = "#d85443";
                                break;
                            }
                        }
                        testSpan.textContent = "Funde: " + data[0].infoboxes.length;
                        var infoHover = document.createElement("i");
                        infoHover.classList.add("far", "fa-question-circle");
                        clickDiv.classList.add("questionmark");
                        clickDiv.appendChild(infoHover);



                    } else {
                        testSpan.textContent = "Ergebnisse anzeigen";
                        frame.style.backgroundColor = "#d1d1d1";
                    }
                    frame.appendChild(testSpan);
                    frame.appendChild(clickDiv);

                    appSquare.insertBefore(frame, appSquare.childNodes[0]);

                    $(clickDiv).click(function () {
                        console.log("HI!");
                        $(this).load(chrome.extension.getURL("lib/templates/showResults.html")).fadeIn(100);
                    });
                },
                dataType: "json"
            });
        }

    }
}
if(storageAvailable("localStorage")){
    $(".square-cover").each(function () {
        createTextElement(this);
    });
} else {
    console.log("kein local Storage verfügbar.")
}

