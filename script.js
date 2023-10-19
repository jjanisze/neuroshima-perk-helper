$(document).ready(function() {
    console.log("A");
    fetch("perks.json").then(response => response.json()).then(data => {
        $("#test").text(data.PERK_ARAMIS.Name);
    });
    console.log("B");
    
});