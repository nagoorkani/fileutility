(function() {

    var fh = fileHandler();

    fh.loadFileTemplate(function (resp) {
        window.fileTemplate = JSON.parse(resp);
    });

    $("#btnFile").click(function () {
        var file    = document.getElementById("fileInput").files[0];
        var output  = document.getElementById("output");
        var tmpl    = window.fileTemplate.employee;

        fh.fileLoader(file, tmpl, function (data) {
            output.innerHTML = "<p>" + JSON.stringify(data) + "</p>";

            //output.innerHTML += "<br/><br/><p>"+ JSON.stringify(fh.showStats(data)) +"</p>";

        });

    });

})();

