/**
 * Created by Alexander on 03.05.2018.
 */
var today = new Date();
var anfragencounter = 0;
var ibJson = [];
var useLocalStorage = true;
var db;
//TODO set Storage by toggle in popup
var usedStorage = "indexedDB";
var ibCardTemplate = document.createElement("div");
var innerCollapseTemplate = document.createElement("div");
var trennZeichen = "|";
var dseOrigins = ["lcm", "playstore", "link_guesser", "app", "mtd", "manuall"];
var route = "get_infai_dataset_by_bundle_id";
var token = "uni_leipzig_ba_prull_2018_01_17_Aihungaem5ie7opheeme";
var verbosity = "3";
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

//Funktion von Mozilla die Browser auf localStorage-Verfuegbarkeit ueberprueft.
function storageAvailable(type) {
    if(type === "indexedDB" && type in window){
        return true;
    }
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

function getStorageItem(itemKey){
    var appInfo;

    switch (usedStorage){
        case "none":
            break;
        case "localStorage":
            appInfo = localStorage.getItem(itemKey);
            break;
        case "indexedDB":
            var transaction = db.transaction(["apps"], "readonly");
            var store = transaction.objectStore("apps");
            appInfo = store.get(itemKey);
            break;

        default:
            console.log("No storage method selected.");
    }
    return appInfo;
}

function setStorageItem(itemKey, itemValue){
    switch (usedStorage){
        case "none":
            break;
        case "localStorage":
            localStorage.setItem(itemKey, itemValue);
            break;
        case "indexedDB":
            var transaction = db.transaction(["apps"], "readwrite");
            var store = transaction.objectStore("apps");
            var entry = {
                appID: itemKey,
                data: itemValue
            };
            var request = store.put(entry);
            request.onerror = function (ev) {
                console.log("Error", ev.target.error);
                console.dir(ev.target);
            };
            request.onsuccess = function (ev) {
                console.log("IndexedDB funkt");
            };
            break;
        default:
            console.log("No storage method selected.");
    }
}

function deleteStorageItem(itemKey) {
    switch (usedStorage){
        case "none":
            break;
        case "localStorage":
            localStorage.removeItem(itemKey);
            break;
        case "indexedDB":
            break;
        default:
            console.log("No storage method selected.");
    }
}

//Laedt neugewonnene Daten in den localStorage des Browsers
function castDseToStorageString(dse){
    var extractionDate;
    var ibString = "";
    var freqCount = "1";
    var ibs = [];
    //Auf Tage runden.
    extractionDate = Math.floor(today.getTime() /86400000);

    console.log("Waehle: ", dse.origin , dse.date_infobox_calculation_finished);
    for(var o = 0; o < dse.infoboxes.length; o++){
        // 20 und 28 werden ignoriert
        if(dse.infoboxes[o].id !== 28 && dse.infoboxes[o].id !== 20){
            // 13 und 21 setzten mehrere Elemente bei den jeweiligen Eigenschaften voraus
            //TODO aktuell werden 13 und 21 ignoriert, da bei verbosity 3 die Information fehlt.
            if((dse.infoboxes[o].id !== 13 && dse.infoboxes[o].id !== 21)){
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
function getInfoForIB(attr, ib){
        for(var i = 0; i < ibJson.length; i++){
            if(ib === ibJson[i].id){
                return ibJson[i][attr];
            }
        }
        return "";
}
function createPopover(parentElement, ibArray){
    var eleToRemove;
    $(parentElement).attr({"data-toggle": "popover","data-trigger": "focus"});
    var cardContainer = document.createElement("div");
    cardContainer.id = "accordion";
    for(var i = 0; i < ibArray.length; i++){

        //Template
        var cardTemplate = ibCardTemplate.cloneNode(true);

        //Red-Line Markierung
        for(j = 0; j < ibJson.length; j++){
            if(ibArray[i] === ibJson[j].id && ibJson[j]["is_red_line"] === "true"){
                var cardHeader = cardTemplate.getElementsByClassName("card-header")[0];
                cardHeader.style.backgroundColor = "#ff8c8c";
                break;
            }
        }

        //Titel
        var titel = cardTemplate.getElementsByClassName("ibtitel")[0];
        titel.innerText = getInfoForIB("titel", ibArray[i]);


        //Einzigartige collapse-id
        $(titel).attr("href", "#collapse" + i);
        $(titel.parentNode.parentNode.children[1]).attr("id", "collapse" + i);

        //Beschreibung
        if (getInfoForIB("description", ibArray[i]) === "") {
            eleToRemove = cardTemplate.getElementsByClassName("theader")[0];
            eleToRemove.parentNode.removeChild(eleToRemove);
            eleToRemove = cardTemplate.getElementsByClassName("description")[0];
            eleToRemove.parentNode.removeChild(eleToRemove);
        } else {
            cardTemplate.getElementsByClassName("description")[0].children[0].innerText = getInfoForIB("description", ibArray[i]);
        }


        //Pro
        if (getInfoForIB("pros", ibArray[i]).length > 0) {
            var pros = getInfoForIB("pros", ibArray[i]);
            var proElement = cardTemplate.getElementsByClassName("pro")[0];
            for (var j = 0; j < pros.length; j++) {
                var row = document.createElement("tr");
                var tData = document.createElement("td");
                if (pros[j]["second_layer"] !== "") {
                    tData.appendChild(innerCollapseTemplate.cloneNode(true));
                    var firstLayerElement = tData.getElementsByClassName("firstlayer")[0];
                    $(firstLayerElement).attr({"href": ("#collapseSecondPro" + j + "_" + i)});
                    firstLayerElement.innerText = pros[j]["first_layer"];
                    $(firstLayerElement.parentNode.parentNode.parentNode).attr("id","accordionSecondPro" + j + "_" + i);
                    var secondLayerElement = firstLayerElement.parentNode.nextElementSibling;
                    $(secondLayerElement).attr({
                        "data-parent": ("#accordionSecondPro" + j + "_" + i),
                        "id": ("collapseSecondPro" + j + "_" + i)
                    });
                    secondLayerElement.children[0].innerText = pros[j]["second_layer"];
                } else {
                    tData.innerText = pros[j]["first_layer"];
                }

                row.appendChild(tData);
                //$(row).insertAfter(proElement.children[proElement.children.length - 1]);
                $(row).insertAfter(proElement);
            }

        } else {
            eleToRemove = cardTemplate.getElementsByClassName("pro")[0];
            eleToRemove.parentNode.removeChild(eleToRemove);
        }


        //Contra
        if (getInfoForIB("cons", ibArray[i]).length > 0) {
            var cons = getInfoForIB("cons", ibArray[i]);
            var contraElement = cardTemplate.getElementsByClassName("contra")[0];
            for (j = 0; j < cons.length; j++) {
                var rowCon = document.createElement("tr");
                var tDataCon = document.createElement("td");
                if (cons[j]["second_layer"] !== "") {
                    tDataCon.appendChild(innerCollapseTemplate.cloneNode(true));
                    firstLayerElement = tDataCon.getElementsByClassName("firstlayer")[0];
                    $(firstLayerElement).attr({"href": ("#collapseSecondCon" + j + "_" + i)});
                    firstLayerElement.innerText = cons[j]["first_layer"];
                    $(firstLayerElement.parentNode.parentNode.parentNode).attr("id","accordionSecondCon" + j + "_" + i);
                    secondLayerElement = firstLayerElement.parentNode.nextElementSibling;
                    $(secondLayerElement).attr({
                        "data-parent": ("#accordionSecondCon" + j + "_" + i),
                        "id": ("collapseSecondCon" + j + "_" + i)
                    });
                    secondLayerElement.children[0].innerText = cons[j]["second_layer"];

                } else {
                    tDataCon.innerText = cons[j]["first_layer"];
                }

                rowCon.appendChild(tDataCon);
                $(rowCon).insertAfter(contraElement);
            }

        } else {
            eleToRemove = cardTemplate.getElementsByClassName("contra")[0];
            eleToRemove.parentNode.removeChild(eleToRemove);
        }

        //Empfehlung
        if (getInfoForIB("recommendations", ibArray[i]) === "") {
            eleToRemove = cardTemplate.getElementsByClassName("recommendations")[0];
            eleToRemove.parentNode.removeChild(eleToRemove.nextElementSibling);
            eleToRemove.parentNode.removeChild(eleToRemove);
        } else {
            cardTemplate.getElementsByClassName("recommendations")[0].nextElementSibling.children[0].innerText = getInfoForIB("recommendations", ibArray[i]);
        }
        cardContainer.appendChild(cardTemplate);
    }
    console.log("Karte erstellt: ", cardContainer);
    return cardContainer;

}
//Baut den entsprechenden Banner fuer die Multiapp-Ansicht
function createPanel(parentNode, appDataArray, hasResults, isSinglePage){
    var ibArray;
    var popover;
    //TODO parentNode umbenennen
    if(isSinglePage){
        if(hasResults){
            ibArray = appDataArray.slice(2,appDataArray.length + 1);
            var infoCard = document.createElement("div");
            popover = createPopover(infoCard,ibArray);
            infoCard.appendChild(popover);
            parentNode.appendChild(infoCard);
        }
    } else {
        var redLine = false;
        var banner = document.createElement("div");
        banner.classList.add("pguard");
        var funde = document.createElement("span");

        if(hasResults){
            ibArray = appDataArray.slice(2,appDataArray.length + 1);
            funde.innerText = "Funde: ";
            var badge = document.createElement("span");
            badge.classList.add("badge", "badge-secondary", "float-right");
            badge.innerText = "" + ibArray.length;
            funde.appendChild(badge);
            for(var j = 0; j < ibArray.length; j++){
                for(var i = 0; i < ibJson.length; i++){
                    if(ibArray[j] === ibJson[i].id && ibJson[i]["is_red_line"] === "true"){
                        redLine = true;
                        break;
                    }
                }
            }
            if(redLine){
                banner.style.backgroundColor = "#FF3333";
                banner.style.color = "white";
            }else{
                banner.style.backgroundColor = "#3BCCFF";
                banner.style.color = "white";
            }

            $(banner).popover({
                title: "Details",
                html: true,
                trigger: "click",
                content: function(){
                    return createPopover(banner, ibArray);
                }
            });
        } else {
            funde.innerText = "Keine Ergebnisse";
            banner.style.backgroundColor = "#d1d1d1";
        }

        banner.appendChild(funde);
        if($(parentNode).hasClass("card")){
            banner.classList.add("multiapp");
            parentNode.insertBefore(banner,parentNode.children[0]);
        } else {
            banner.classList.add("similarapp");
            $(banner).insertBefore(parentNode);
        }
    }

}

function getNewestDseFromData(data){
    var newestDse = null;
    //Dummy-DSEs haben Vorang. Ansonsten wird die neuste DSE verwendet. Gibt es 2 DSE zum gleichen Analyse-Datum wird die aus der bevorzugten Quelle gewaehlt.
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

//Erstellt die Header fuer die Multiapp-Ansicht
function loadInfoPanels(parentNode, isSinglePage) {
    var appID;
    if(isSinglePage){
        var currentURL = new URL(location.href);
        appID = currentURL.searchParams.get("id");
    } else {
        if($(parentNode).attr("data-docid")){
            appID = $(parentNode).attr("data-docid");
            console.log("appID gefunden",appID);
        }else {
            appID = $(parentNode.children[0].children[0].children[3].children[0]).attr("href").split("id=")[1];
        }
    }
    //Wurde eine App-ID gefunden?
    if (appID) {
        var appDataString = getStorageItem(appID);

        var future = function(param) {

            var appDataArray = [];
            //Prueft ob bereits Daten im localStorage vorhanden und aktuell sind.
            if(useLocalStorage && param && param.split(trennZeichen)[0]){
                var lastUpdate = new Date(param.split(trennZeichen)[0] * 86400000);
                if((lastUpdate.getTime() + 259200000) >= today.getTime()){
                    appDataArray = param.split(trennZeichen);
                } else {
                    console.log("Aktuallisiere Daten fuer " + appID);
                }
            }
            //Falls Daten vorhanden baue das Element darauss
            if(useLocalStorage && appDataArray.length === 1){
                console.log("STORAGE OHNE ERGEBNISSE GEFUNDEN: ", appID, appDataArray);
                createPanel(parentNode, appDataArray, false , isSinglePage);
            } else if(useLocalStorage && appDataArray.length > 1){
                console.log("STORAGE GEFUNDEN: ", appID, appDataArray);
                createPanel(parentNode, appDataArray, true , isSinglePage);
                //Ansonsten lade die Informationen aus dem Backend
            } else {
                console.log("Frage (erstmalig) Daten ab fuer " + appID);
                anfragencounter ++;
                $.ajax({
                    url: urlWholeDataSetNoRequest + "" +appID,
                    method: "POST",
                    success: function (response) {
                        var data = response.data;
                        console.log(data);
                        //Wurden bereits DSEs fuer die App gefunden?
                        if (data.dses && data.dses.length > 0) {
                            var storageString = castDseToStorageString(getNewestDseFromData(data));
                            setStorageItem(appID,storageString);
                            console.log("Neuer Eintrag angelegt: ", appID, storageString);
                            appDataArray = storageString.split(trennZeichen);
                            createPanel(parentNode, appDataArray, true, isSinglePage);
                        } else {
                            console.log("KEINE DSE VORHANDEN", appID);
                            setStorageItem(appID,""+ Math.floor(today.getTime() /86400000));
                            $.ajax({
                                url: urlTriggerNewAnalysis + appID,
                                method: "POST",
                                success: function(){
                                    console.log("Anfrage erfolgreich: ");
                                },
                                dataType: "json"
                            });
                            createPanel(parentNode, [], false, isSinglePage);
                        }
                    },
                    dataType: "json"
                });
                console.log("Anfragen bisher: ",anfragencounter);
            }
        };

        // Promise
        if (typeof appDataString === 'object') {

            appDataString.onsuccess = function() {
                if(appDataString.result){
                    future(appDataString.result.data);
                } else {
                    future();
                }
            };

        } else {
            future(appDataString);
        }
    }
}

function fillApps(){
    //Prueft, ob auf Single-App-Page oder Multi-App-Page
    if(document.getElementsByClassName("card")[0]){
        $(".card").each(function () {
            loadInfoPanels(this, false);
            //createPanel(this, [], false, false)
        });
    } else {
        if(document.getElementsByClassName("JHTxhe")[0]){
            loadInfoPanels(document.getElementsByClassName("JHTxhe")[0], true);
        }
        $(".Vpfmgd").each(function (){
            loadInfoPanels(this, false);
        });
    }
}

function testStorageCap(){
    localStorage.clear();
    localStorage.setItem("1","test");
    var counter = 2;
    while(localStorage.getItem("1")){
        console.log(counter);
        localStorage.setItem(""+counter, "ABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJABCDEFGHIJ");
        counter++;
    }
}
//Laedt lokale Json-Bibliothek fuer
$.getJSON(chrome.extension.getURL("lib/data/IB_texte.json"), function (input) {
    ibJson = input;
    $(ibCardTemplate).load(chrome.extension.getURL("lib/templates/ibCardTemplate.html"), function (data) {
        $(innerCollapseTemplate).load(chrome.extension.getURL("lib/templates/innerCollapseTemplate.html"), function(){
            if((usedStorage === "localStorage" || usedStorage === "indexedDB") && storageAvailable(usedStorage)){
                // for(var z = 0; z < localStorage.length; z++){
                //     console.log("Key " + z +" :",localStorage.key(z), " Value: ", localStorage.getItem(localStorage.key(z)));
                // }
                //testStorageCap();
                //console.log(localStorage.length);
                if(usedStorage === "indexedDB"){
                    var openRequest = indexedDB.open("pguardExt",1);

                    openRequest.onupgradeneeded = function(e){
                        var thisDB = e.target.result;
                        console.log("running onupgradeneeded");
                        if(!thisDB.objectStoreNames.contains("apps")){
                            var appsOS = thisDB.createObjectStore("apps",{keyPath: "appID"});
                        }
                    };

                    openRequest.onsuccess = function (ev) {
                        console.log("DB bereit");
                        db = ev.target.result;
                        fillApps();
                    };

                    openRequest.onerror = function (ev) {
                        console.log("onerror!");
                        console.dir(ev);
                    }
                }
            } else {
                console.log("kein Storage verfuegbar.");
            }
        });
    });
    console.log("Lokale Json geladen.");
});
