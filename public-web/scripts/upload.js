var signerURL = "https://i4nci62990.execute-api.eu-west-2.amazonaws.com/live/get_url";
var files = [];
var done = 0;

String.prototype.cleanup = function () {
    return this.toLowerCase().replace(/[^a-zA-Z0-9]+/g, "");
}

function presignUrl(file) {
    var event = $("#event").val();
    var event_clean = event.cleanup();
    var name = $("#name").val();
    var name_clean = name.cleanup();
    var email = $("#email").val();
    var filename = event_clean + "-" + name_clean + "/" + file.name;
    var post_data = '{"object_key": "' + filename + '", "name": "' + name + '", "email": "' + email + '", "event_name": "' + event + '"}';

    $.ajax({
        url: signerURL,
        data: post_data,
        type: "POST",
        contentType: "application/json",
        dataType: "json",
        cache: false,
    })
        .done(function (data) {
            if (data.error) {
                console.error(data.error);
                // return false;
            } else {
                console.log("uploadFile: " + file.name + " : " + file.size + " : " + data.url);
                uploadFile(file, data.url);
                // return false;
            }
        })
        .fail(function (e) {
            console.error("S3 Upload not supported", e);
            $(".progress").hide();
            $("#submitbutton").show();
            $('#test').text("Upload failed - check console for logs");
            return false;
        });
}

function uploadFile(file, s3presignedUrl) {
    console.log("Uploading " + file.size + "bytes");
    $.ajax({
        url: s3presignedUrl,
        type: "PUT",
        data: file,
        dataType: "text",
        cache: false,
        contentType: file.type,
        processData: false
    })
        .done(function () {
            // var newFileUrl = s3presignedUrl.split('?')[0].substr(6);
            // console.info("s3-upload done: ", newFileUrl); // REMOVE ME FOR PRODUCTION USE
            done = done + 1;
            pc_done = (done / files.length) * 100;

            $('#total_progressbar').css('width', pc_done + '%').attr('aria-valuenow', pc_done);
            if (pc_done == 100) {
                $(".progress").hide();
                $('#test').text("Upload complete, your photos will be reviewed soon. Thanks!");
            }
        })
        .fail(function (e) {
            console.error("s3-upload failed", e);
        });
}

$(function () {
    $(".progress").hide();
    var uploader = $("#uploadhere");

    uploader[0].onchange = function () {
        files = this.files;
        $("#submitbutton").show();
        $("#test").hide();
    };

    $("#submitbutton").click(function () {
        var ok = true;

        if (!$("#name").val()) {
            $("#name").addClass("is-invalid");
            ok = false;
        } else {
            $("#name").removeClass("is-invalid");
        }

        if (!$("#email").val()) {
            $("#email").addClass("is-invalid");
            ok = false;
        } else {
            $("#email").removeClass("is-invalid");
        }

        if (!$("#event").val()) {
            $("#event").addClass("is-invalid");
            ok = false;
        } else {
            $("#event").removeClass("is-invalid");
        }

        if (!$("#agreetnc")[0].checked) {
            $("#agreetnc").addClass("is-invalid");
            ok = false;
        } else {
            $("#agreetnc").removeClass("is-invalid");
        }

        if (!files.length) {
            ok = false;
        }

        if (!ok) {
            return false;
        }

        $("#submitbutton").hide();
        $("#test").show();
        $("#test").html('Uploading files <img src="ajax-loader.gif"><br>');
        $(".progress").show();
        var fileCounter = files.length;

        for (var file, i = 0; i < fileCounter; i++) {
            file = files[i];
            presignUrl(file);
        }
        // return false;
    });
});