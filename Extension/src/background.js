chrome.runtime.onInstalled.addListener(function() {
    console.log('jup');
    //removeRules, braucht declarativeContent permission, 1 = liste an regeln(undefined = nix), 2= function nach löschen
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
});/**
 * Created by Alexander on 04.04.2018.
 */
