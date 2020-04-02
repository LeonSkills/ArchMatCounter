var reader = new ChatBoxReader();
reader.readargs = {
    colors: [
        a1lib.mixcolor(255, 255, 255), //Common Mats
        a1lib.mixcolor(255, 128, 0), //Uncommon Mats
        a1lib.mixcolor(255, 165, 0), //Scavenging comps
        a1lib.mixcolor(255, 0, 0) //Rare Mats
    ],
    backwards: true
};
reader.find();

//Attempt to show a temporary rectangle around the chatbox.  skip if overlay is not enabled.
try {
    var p = reader.pos;
    alt1.overLayRect(a1lib.mixcolor(255, 255, 255), p.mainbox.rect.x, p.mainbox.rect.y, p.mainbox.rect.width, p.mainbox.rect.height, 2000, 1);
} catch { }

var chatCheck = reader.read();

var count, mats, index;
var actions = 0;

function readChatbox() {
    var opts = reader.read() || [];
    var chat = "";
    reader.find();

    for (a in opts) {
        chat += opts[a].text + " ";
    }

    if (chat.length === 0) //Check if chat is null, to reduce some console errors.
        return;
    //Match "You find some <material>"
    var material = chat.match(/\d+ x \w+( \w+)?[^\d+:]|You find some .+|Your auto-screener .+/g)[0].trim();
    if (material !== null) {
        actions++;
        let name = "";
        if (material.indexOf("You find some") > -1)
            name = material.split("You find some ")[1].trim().replace("'", "")
        else
            name = material.split("Your auto-screener spits out some ")[1].trim().replace("'", "")
        materials.forEach(mat => {
            if (mat.name.replace("'", "") === name) {
                console.log()
                mat.qty++;
                tidyTable(name);
            }
        })
    }
}

function buildTable() {
    materials.forEach(mat => {
        let name = mat.name.replace("'", "")
        $(".mats").append(`<tr data-name="${name}"><td title="${mat.location}">${mat.name}</td><td class='qty'>${mat.qty}</td></tr>`);
    })
}

function tidyTable(name) {
    localStorage.mats = JSON.stringify(materials);
    materials.forEach(mat => {
        let name = mat.name.replace("'", "")
        document.querySelector("[data-name='" + name + "'] > .qty").innerText = mat.qty;
    })
    $(`[data-name="${name}"]`).css({ "background-color": "lime" }).animate({
        backgroundColor: $.Color("rgba(0, 0, 0, 0)")
    }, 500, function () { $(this).removeAttr("style") });
    $(".actions").text(actions);
}

buildTable();
tidyTable();

$(".edit").change(function () {
    if ($(this).is(':checked')) {
        if ($(".tracker").text() == "Stop") {
            $(".tracker").click();
        }
        $("tr:hidden").show();
        $(".qty").attr('contenteditable', 'true').focus(function () { document.execCommand('selectAll', false, null) });
    } else {
        $(".qty").removeAttr('contenteditable');
        materials.forEach(mat => {
            mat.qty = parseInt($(`[data-name='${mat.name}'] .qty`).text());
        })
        tidyTable();
    }
});

$("button.tracker").click(function () {
    if ($(this).html() == "Start") {
        console.log("Starting tracker");
        tracking = setInterval(function () { readChatbox(); }, 600);
        $(this).html("Stop");
    } else {
        console.log("Stopping tracker");
        $(this).html("Start");
        clearInterval(tracking);
    }
}).click();

$("button.clear").click(function () {
    localStorage.removeItem("mats");
    materials.forEach(mat => {
        mat.qty = 0;
    })
    actions = 0;
    location.reload();
});

$(".toggleMenu").click(function () {
    $(".options").toggle();
});

$(".export").click(function () {
    var str = 'ComponentName,Quantity\n'; // column headers
    materials.forEach(mat => {
        str = `${str}${mat.name},${mat.qty}\n`;
    })
    var blob = new Blob([str], { type: 'text/csv;charset=utf-8;' });
    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, "componentExport.csv");
    } else {
        var link = document.createElement("a");
        if (link.download !== undefined) { // feature detection
            // Browsers that support HTML5 download attribute
            var url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "archMatsExport.csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
});