onmessage = function(e){
    window.setTimeout(done, 2000);
};

function done(){
    // Send back the results to the parent page
    postMessage("done");
}