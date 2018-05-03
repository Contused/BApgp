/**
 * Created by Alexander on 03.05.2018.
 */
function createTextElement(){
    var frame = document.createElement('div');
    frame.setAttribute('test-atr','1');

    const testSpan = document.createElement('span');
    testSpan.textContent = 'TestText';
    frame.appendChild(testSpan);

    return frame;
}


var appBoxes = document.querySelectorAll('.reason-set');
for(var i = 0; i < appBoxes.length; i++){
    appBoxes[i].appendChild(createTextElement());
}