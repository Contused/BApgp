/**
 * Created by Alexander on 03.05.2018.
 */

function isRedLine(id){
    $.getJSON(chrome.extension.getURL("lib/data/IB_texte.json"), function(texte) {
        for(var i = 0; i < texte.length; i++){
            if(id === texte[i].id && texte[i].is_red_line === "true"){
                console.log("RED");
                return true;
            }
        }
        return false;
    });
}

function createTextElement(appSquare){
    var appID = $(appSquare).attr("data-docid");
    if(appID){
        $.ajax({
            url: "https://pgadmin.datenschutz-scanner.de/api/apps?bundleId=" + appID,
            data: null,
            success: function(data) {
                console.log($(appSquare).attr("data-docid"));
                console.log(data);

                var frame = document.createElement('div');
                frame.setAttribute('test-atr','1');

                var testSpan = document.createElement('span');
                if(data[0]){
                    frame.style.backgroundColor = "#adccff";
                    for(var i = 0; i < data[0].infoboxes.length; i++){
                        var redLine = isRedLine(data[0].infoboxes[i].id);
                        if(redLine){
                            frame.style.backgroundColor = "#d85443";
                            break;
                        }
                    }
                    testSpan.textContent = "Funde: " + data[0].infoboxes.length;
                } else {
                    testSpan.textContent = "Ergebnisse anzeigen";
                }
                frame.appendChild(testSpan);

                appSquare.insertBefore(frame,appSquare.childNodes[0]);
            },
            dataType: "json"
        });
    }
}
$(".square-cover").each(function(){
    createTextElement(this);
});