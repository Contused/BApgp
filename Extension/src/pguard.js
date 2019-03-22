/**
 * Created by Alexander on 03.05.2018.
 */
var today = new Date();
var ibJson = [];
var isStorageWorking;
var db;
var usedStorage = "indexedDB";
var ibCardTemplate = document.createElement("div");
var innerCollapseTemplate = document.createElement("div");
var trennZeichen = "|";
var dseOrigins = ["lcm", "playstore", "link_guesser", "app", "mtd", "manuall"];
var urlTriggerNewAnalysis = "https://infaibackend.pguard-tools.de/get_infai_dataset_by_bundle_id" +
    "?api_token=uni_leipzig_ba_prull_2018_01_17_Aihungaem5ie7opheeme&verbosity=3&priority=5" +
    "&trigger_dse_playstore_download=true&trigger_link_guesser=true&trigger_dse_lcm_download=true" +
    "&trigger_dse_mtd_download=true&trigger_dse_inapp_search=true&bundle_id=";

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
            e.code === 22 ||
            e.code === 1014 ||
            e.name === 'QuotaExceededError' ||
            e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
            storage.length !== 0;
    }
}

//Abrufen von gespeicherten Datensätzen
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
            console.log("Warnung: Kein Speicher aktiv!");
    }
    return appInfo;
}

//Abspeichern von angefragten Datensätzen
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
            };
            break;
        default:
            console.log("Warnung: Kein Speicher aktiv!");
    }
}

//Laedt neugewonnene Daten in den localStorage des Browsers
function castDseToStorageString(dse){
    var extractionDate;
    var ibString = "";
    var ibs = [];

    //Auf Tage runden.
    extractionDate = Math.floor(today.getTime() /86400000);

    for(var o = 0; o < dse.infoboxes.length; o++){
        // 20 und 28 werden ignoriert
        if(dse.infoboxes[o].id !== 28 && dse.infoboxes[o].id !== 20){
            // 13 und 21 setzten mehrere Elemente bei den jeweiligen Eigenschaften voraus
            //Aktuell werden 13 und 21 ignoriert, da bei verbosity 3 die Information fehlt.
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

    return "" + extractionDate + trennZeichen + ibString;
}

//Auslesen der IB_texte.json
function getInfoForIB(attr, ib){
        for(var i = 0; i < ibJson.length; i++){
            if(ib === ibJson[i].id){
                return ibJson[i][attr];
            }
        }
        return "";
}

//Erstellt mithilfe der ausgelesenen Informationen das Popover
function createPopover(parentElement, ibArray){
    var eleToRemove;
    $(parentElement).attr({"data-toggle": "popover","data-trigger": "focus"});
    var cardContainer = document.createElement("div");
    cardContainer.id = "accordion";

    //Mapping eines Eintrags aus der IB_texte.json auf das Template
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
            cardTemplate.getElementsByClassName("description")[0].children[0]
                .innerText = getInfoForIB("description", ibArray[i]);
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
            cardTemplate.getElementsByClassName("recommendations")[0].nextElementSibling.children[0]
                .innerText = getInfoForIB("recommendations", ibArray[i]);
        }
        cardContainer.appendChild(cardTemplate);
    }
    return cardContainer;

}

//Baut den entsprechenden Banner fuer die Multi-App-Ansicht.
function createPanel(parentNode, appDataArray, hasResults, isSinglePage){
    var ibArray;
    var popover;

    //Für die große Kachel wird kein Banner angelegt
    if(isSinglePage){
        if(hasResults){
            ibArray = appDataArray.slice(1,appDataArray.length + 1);
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
            ibArray = appDataArray.slice(1,appDataArray.length + 1);
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

//Dummy-DSEs haben Vorang. Ansonsten wird die neuste DSE verwendet. Gibt es 2 DSE zum gleichen Analyse-Datum
//wird die aus der bevorzugten Quelle gewaehlt.
function getNewestDseFromData(data){
    var newestDse = null;

    for (var i = 0; i < data.dses.length; i++) {

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

//Erstellt die Header fuer die Multi-App-Ansicht
function loadInfoPanels(parentNode, isSinglePage) {
    var appID;
    if(isSinglePage){
        var currentURL = new URL(location.href);
        appID = currentURL.searchParams.get("id");
    } else {
        if($(parentNode).attr("data-docid")){
            appID = $(parentNode).attr("data-docid");
        }else {
            appID = $(parentNode.children[0].children[0].children[3].children[0]).attr("href").split("id=")[1];
        }
    }
    //Wurde eine App-ID gefunden?
    if (appID) {

        var appDataString = getStorageItem(appID);

        var useStorageItem = function(item) {
            var appDataArray = [];
            //Prueft ob bereits Daten im localStorage vorhanden und aktuell sind.
            if(isStorageWorking && item && item.split(trennZeichen)[0]){
                var lastUpdate = new Date(item.split(trennZeichen)[0] * 86400000);
                if((lastUpdate.getTime() + 259200000) >= today.getTime()){
                    appDataArray = item.split(trennZeichen);
                }
            }
            //Falls Daten vorhanden, baue das Element darauss
            if(isStorageWorking && appDataArray.length === 1){
                createPanel(parentNode, appDataArray, false , isSinglePage);
            } else if(isStorageWorking && appDataArray.length > 1){
                createPanel(parentNode, appDataArray, true , isSinglePage);
            } else {

                //Anfrage an die Background.js zum Einholen der Informationen vom Backend
                chrome.runtime.sendMessage(
                    {contentScriptQuery: "appIDQuery", appID: appID},function (response) {
                        if (response.dses && response.dses.length > 0) {
                            var storageString = castDseToStorageString(getNewestDseFromData(response));
                            setStorageItem(appID,storageString);
                            console.log("Neuer Eintrag angelegt: ", appID, storageString);
                            appDataArray = storageString.split(trennZeichen);
                            createPanel(parentNode, appDataArray, true, isSinglePage);
                        } else {
                            console.log("Keine DSE vorhanden für: ", appID);
                            setStorageItem(appID,""+ Math.floor(today.getTime() /86400000));

                            createPanel(parentNode, [], false, isSinglePage);
                        }
                    });
            }
        };

        //Erzeugt Promise mit Storage-Element
        if (typeof appDataString === 'object' && usedStorage === "indexedDB") {
            appDataString.onsuccess = function() {
                if(appDataString.result){
                    useStorageItem(appDataString.result.data);
                } else {
                    useStorageItem();
                }
            };

        } else {
            useStorageItem(appDataString);
        }
    }
}

//Liesst alle geladenen Kacheln aus und übergibt diese zum Einfügen der Informationen
function fillApps(){
        //Anfrage, ob Extension aktiv ist.
        chrome.runtime.sendMessage(
            {extensionState: "get"}, function (response) {

                if(response == "on"){
                    console.log("PGuard-AppRating online");

                    //Prueft, ob Single-App-Ansicht (Detailseite) oder Multi-App-Ansicht
                    if(document.getElementsByClassName("card")[0]){
                        $(".card").each(function () {
                            loadInfoPanels(this, false);
                        });
                    } else {
                        if(document.getElementsByClassName("JHTxhe")[0]){
                            loadInfoPanels(document.getElementsByClassName("JHTxhe")[0], true);
                        }
                        $(".Vpfmgd").each(function (){
                            loadInfoPanels(this, false);
                        });
                    }
                } else {
                    console.log("PGuard-AppRating offline");
                }
            }

        );
}

//Laedt lokale Json-Bibliothek
$.getJSON(chrome.extension.getURL("lib/data/IB_texte.json"), function (input) {
    ibJson = input;
    $(ibCardTemplate).load(chrome.extension.getURL("lib/templates/ibCardTemplate.html"), function (data) {
        $(innerCollapseTemplate).load(chrome.extension.getURL("lib/templates/innerCollapseTemplate.html"), function(){
            //Überprüft auf Storage-Nutzung
            if((usedStorage === "localStorage" || usedStorage === "indexedDB") && storageAvailable(usedStorage)){
                isStorageWorking = true;
                if(usedStorage === "indexedDB"){
                    var openRequest = indexedDB.open("pguardExt",1);

                    openRequest.onupgradeneeded = function(e){
                        var thisDB = e.target.result;
                        if(!thisDB.objectStoreNames.contains("apps")){
                            var appsOS = thisDB.createObjectStore("apps",{keyPath: "appID"});
                        }
                    };

                    openRequest.onsuccess = function (ev) {
                        console.log("IndexedDB initialisiert");
                        db = ev.target.result;
                        fillApps();
                    };

                    openRequest.onerror = function (ev) {
                        console.log("IndexedDB: Fehler beim Initialisieren!");
                        console.dir(ev);
                    }
                }
                else if(usedStorage === "localStorage"){
                    console.log("localStorage initialisiert");
                    fillApps();
                }
            } else {
                console.log("Kein lokaler Speicher verfügbar!");
                isStorageWorking = false;
                fillApps();
            }
        });
    });
});