/**
 * Created by Alexander on 03.05.2018.
 */
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
                    testSpan.textContent = "Funde: " + data[0].infoboxes.length;
                } else {
                    testSpan.textContent = "Funde: 0";
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