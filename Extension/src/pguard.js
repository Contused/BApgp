/**
 * Created by Alexander on 03.05.2018.
 */
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
    var newAPI = true;
    //Wurde eine App-ID gefunden?
    if (appID) {
        //Wird die neue API verwendet?
        if(newAPI){
            //TODO manuall oder manually?
            //URL erstellen
            var dseOrigins = ["lcm", "playstore", "link_guesser", "app", "mtd", "manuall", "dummy"];
            var route = "get_infai_dataset_by_bundle_id";
            var token = "uni_leipzig_ba_prull_2018_01_17_Aihungaem5ie7opheeme";
            var verbosity = "0";
            var priority = "1";
            var trgDsePlay = "false";
            var trgLinkGuess = "false";
            var trgDseLcm = "false";
            var trgDseMtd = "false";
            var trgDseInapp = "false";
            var urlWholeDataSetNoRequest = "https://139.18.2.209:9595/"+ route +"?api_token="+ token
                +"&verbosity="+ verbosity +"&priority="+ priority + "&trigger_dse_playstore_download="+ trgDsePlay
                +"&trigger_link_guesser="+ trgLinkGuess + "&trigger_dse_lcm_download="+ trgDseLcm
                +"&trigger_dse_mtd_download="+ trgDseMtd +"&trigger_dse_inapp_search="+ trgDseInapp +"&bundle_id="+ appID;
            var urlTriggerNewAnalysis = "https://139.18.2.209:9595/"+ route +"?api_token="+ token
                +"&verbosity="+ "3" +"&priority="+ priority + "&trigger_dse_playstore_download="+ "true"
                +"&trigger_link_guesser="+ "true" + "&trigger_dse_lcm_download="+ "true"
                +"&trigger_dse_mtd_download="+ "true" +"&trigger_dse_inapp_search="+ "true" +"&bundle_id="+ appID;
            $.ajax({
                url: urlWholeDataSetNoRequest,
                method: "POST",
                success: function (data) {
                    console.log($(appSquare).attr("data-docid"));
                    console.log(data);

                    var frame = document.createElement('div');
                    frame.classList.add("pguard");

                    var testSpan = document.createElement('span');
                    var clickDiv = document.createElement('div');
                    var useDummy = false;
                    //Wurden bereits DSEs für die App gefunden?
                    if (data.data.dses) {
                        console.log(data.data.dses);
                        frame.style.backgroundColor = "#adccff";
                        var dseDates = [];
                        var newestDse;
                        //Dummy-DSEs haben Vorang, ansonsten werden die Analysezeiträume in ein Array aufgenommen
                        for (var i = 0; i < data.data.dses.length; i++) {
                            if(data.data.dses[i].origin === "dummy"){
                                newestDse = data.data.dses[i];
                                useDummy = true;
                                break;
                            }
                            else{
                                dseDates.push(new Date(data.data.dses[i].date_infobox_calculation_finished));
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
                                for(var k = 0; k < data.data.dses.length; k++){
                                    var originCandidate = new Date(data.data.dses[k].date_infobox_calculation_finished);
                                    if(dseDates[0].getTime() === originCandidate.getTime()){
                                        originDataCandidates[k] = data.data.dses[k].origin;
                                    }
                                }
                                foundDse:
                                    //Origins werden nach Priorität abgelaufen
                                    for(var m = 0; m < dseOrigins.length; m++){
                                        for(var n = 0; n < originDataCandidates.length; n++){
                                            if(dseOrigins[m] === originDataCandidates[n]){
                                                newestDse = data.data.dses[n];
                                                break foundDse;
                                            }
                                        }
                                    }
                            } else {
                                //Falls ein eindeutiger Zeitpunkt existiert, wird die DSE mit diesem herausgesucht.
                                for(var l = 0; l < data.data.dses.length; l++){
                                    var candidate = new Date(data.data.dses[l].date_infobox_calculation_finished);
                                    if(dseDates[0].getTime() === candidate.getTime()){
                                        newestDse = data.data.dses[l];
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
$(".square-cover").each(function () {
    createTextElement(this);
});

