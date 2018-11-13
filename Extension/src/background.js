/**
 * Created by Alexander on 04.04.2018.
 */
chrome.runtime.onInstalled.addListener(function() {
    //removeRules, braucht declarativeContent permission, 1 = liste an regeln(undefined = keine Eingabe), 2= function nach loeschen
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
        //siehe removeRules, wird am ende von remove rules aufgerufen.
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: [new chrome.declarativeContent.PageStateMatcher({
                pageUrl: { schemes: ['https'], hostContains: 'play.google.com', pathContains:"/store/apps"}
            })
            ],
            actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);
    });
});
