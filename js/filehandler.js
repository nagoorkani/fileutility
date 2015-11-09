var fileHandler = function () {
    var fuh = {};

    fuh.fileLoader = function (file, tmpl, cb) {
        var reader = new FileReader();
        reader.readAsText(file);

        reader.onload = function (event) {
            var csv = event.target.result;
            var data = $.csv.toArrays(csv);

            console.log("File length: " + data.length);

            //try {
                file.columns = data.shift(); // remove col header from file data

                fuh.fileValidator(file, tmpl, function (resp) {
                    if (resp === "OK") {
                        fuh.processCSVData(data, tmpl, function (processedData) {
                            cb(processedData);
                        });
                    } else {
                        console.log("File validator failed...!");
                        cb(null);
                    }
                });

            //} catch (e) {
            //    alert("File error: " + e);
            //    cb(null);
            //}

        }; // End - reader.onload

        reader.onerror = function () {
            alert('Unable to read ' + file.fileName);
            cb(null)
        };
    }

    fuh.fileValidator = function (fileObj, tmpl, cb) {
        var errors = [];

        if (fileObj.size > 1000000) {  // file size
            errors.push({"size": "File is too big to handle!"});
        }

        if (fileObj.name.split(".")[1] !== "csv") { // file type
            errors.push({"filetype": "Invalid file format, re-upload .CSV file!"});
        }

        var fileCols = fileObj.columns;

        if (fileCols.length !== tmpl.columns.length) {
            errors.push({"columns": "File columns and template columns not matching!"});
            console.log( "File columns==> " + JSON.stringify(fileCols) + " \n Template columns==> " + JSON.stringify(tmpl.columns) );
        } else {
            var colCheck = this.fileColumnsValidator(tmpl.columns, fileCols);
            if (colCheck.length > 0) {
                errors.push({"columns": "Invalid columns! " + colCheck});
            }
        }

        if (errors.length) {
            alert(JSON.stringify(errors));
            cb(errors);
        } else {
            cb("OK")
        }
    };

    fuh.fileColumnsValidator = function (a1, a2) {
        var temp = [];

        for (var i = 0; i < a2.length; i++) {
            a2[i] = a2[i].toLowerCase();
        }

        a1.forEach(function (i, k) {
            if (a2.indexOf(i.title) === -1) {
                temp.push(a2[k]);
            }
        });

        return temp;
    };

    fuh.showStats = function (array) {
        var successLists = [], duplicateLists = [], otherLists = [], invalidLists = [];

        for (var i = 0; i < array.length; i++) {
            if (array[i].status === "success") {
                successLists.push(array[i]);
            } else if (array[i].status === "failed") {
                invalidLists.push(array[i]);
            } else if (array[i].status === "duplicate") {
                duplicateLists.push(array[i]);
            } else {
                otherLists.push(array[i]);
            }
        }

        console.log("Actual size: " + array.length);
        console.log("Success size: " + successLists.length);

        return {
            totalResults: array.length,
            success: successLists,
            failed: invalidLists,
            others: otherLists,
            duplicate: duplicateLists
        };
    };

    fuh.processCSVData = function (data, fo, cb) {
        var itemData = [];

        data.sort(); // sort the collection

        for (var row = 0; row < data.length; row++) {
            var itemRow = [];

            fo.columns.forEach(function (i, k) {
                var status = "", val = "";

                var pk = fo.primaryKey !== undefined ? 0 : fo.primaryKey - 1;

                val = data[row][k];
                switch (i.type) {
                    case "number":
                        status = !isNaN(val*1) ? "success" : "failed" ;
                        break;
                    case "string":
                        status = val.trim().length ? "success" : "failed" ;
                        break;
                    case "currency":
                        // currency validation 1,000.00 or $100,00.00 or 1000 or $1000
                        var regexCurrency = /^\$?[0-9][0-9,]*[0-9]\.?[0-9]{0,2}$/i;
                        status = regexCurrency.test(val) ? "success" : "failed";
                        break;
                }

                if (row > 0 && data[row - 1][pk] === val) {
                    status = "duplicate";
                }

                if ( status  === "failed" ) {
                    status = "Invalid " + i.type + " at " + i.title;
                }

                itemRow.push({"value": val, "type": i.name, "status": status });

                // set row status based on primary column
                if (k > 0) {
                    status = itemRow[pk] === status ? status : itemRow[pk].status;
                }

                //console.log( "PrimaryKey: " + fo.primaryKey + " -- " + status );
                itemRow.status = status; // row status
            });

            var key = data[row][fo.primaryKey - 1]; // key or unique column
            itemRow.id = key;
            itemData.push(itemRow);

            if (row === data.length - 1) {
                cb(itemData);
            }
        }
    };

    fuh.loadFileTemplate = function (cb) {
        var xhr = new XMLHttpRequest();
        xhr.overrideMimeType("application/json");
        xhr.open('GET', 'fileTemplate.json', true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == "200") {
                cb(xhr.responseText);
            }
        };
        xhr.send(null);
    };

    return fuh;
}
