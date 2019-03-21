/**
 * Created by Alexander on 08.05.2018.
 */

function togglePowerButton(){
    console.log("klappt");
        chrome.runtime.sendMessage(
            {extensionState: "get"}, function (response) {
                console.log("re: "+response);
                chrome.runtime.sendMessage({extensionState: "set", state: response});
            });

}

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('powerButton').addEventListener('click', togglePowerButton);
});