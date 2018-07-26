/**
 * Created by Alexander on 08.05.2018.
 */
function toggleInfo(){
    chrome.tabs.getSelected(null, function(tab) {
        var code = 'window.location.reload();';
        chrome.tabs.executeScript(tab.id, {code: code});
    });
    console.log("JOOOOO!");
}

$("#powerButton").click(toggleInfo());

document.getElementById('powerButton').addEventListener('click', toggleInfo);
console.log("ich funktioniere");