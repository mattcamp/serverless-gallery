//=============== AWS IDs ===============
var region = 'eu-west-2';
var userPoolId = 'eu-west-2_5WaPUHP1c';
var clientId = '1jva1aj3h7rbsc9vtcg9chhobc';
var identityPoolId = 'eu-west-2:37a42613-5bfb-43b0-b14b-615bff19627f';
var s3UploadBucket = "mtest-gallery-uploads";
var galleryAdminFunction = "gallery-admin";
var albumsTable = "gallery-albums";
//=============== AWS IDs ===============

var cognitoUser;
var idToken;
var userPool;
var files;
var s3;
var galleries;

var poolData = {
    UserPoolId: userPoolId,
    ClientId: clientId
};

$(document).ready(function () {
    getCurrentLoggedInSession();
});

function switchToLogInView() {
    $("#userNameInput").val('');
    $("#passwordInput").val('');
    $("#loginForm").show();
    $("#completeRegistrationForm").hide();
    $("#loggedInView").hide();
    $("#usePhotosButton").hide();
    $("#logOutButton").hide();
}

function switchToLoggedInView() {
    $("#loginForm").hide();
    $("#completeRegistrationForm").hide();
    $("#loggedInView").show();
    $("#logOutButton").show();
    $("#dirList").html("Loading S3 bucket contents...");
    getAWSS3BucketObjects();
}

function clearLogs() {
    $('#log').empty();
}

function logOut() {
    if (cognitoUser != null) {
        $("#loader").show();
        cognitoUser.signOut();
        switchToLogInView();
        logMessage('Logged out!');
        $("#loader").hide();
    }
}

function logIn() {

    if (!$('#userNameInput').val() || !$('#passwordInput').val()) {
        logMessage('Please enter Username and Password!');
    } else {
        var authenticationData = {
            Username: $('#userNameInput').val(),
            Password: $("#passwordInput").val(),
        };
        var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);

        var userData = {
            Username: $('#userNameInput').val(),
            Pool: userPool
        };
        cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

        $("#loader").show();
        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: function (result) {
                logMessage('Logged in!');
                getCurrentLoggedInSession();

                idToken = result.getIdToken().getJwtToken();
                getCognitoIdentityCredentials();
                $("#loader").hide();
            },

            onFailure: function (err) {
                logMessage(err.message);
                $("#loader").hide();
            },

            newPasswordRequired: function (userAttributes) {
                delete userAttributes.email_verified;
                localStorage.setItem('userAttributes', JSON.stringify(userAttributes));

                $("#loginForm").hide();
                $("#loader").hide();
                $("#completeRegistrationForm").show();
            }
        });
    }
}

function completeRegistration() {
    console.log("in completeRegistration()");
    var userAttributes = JSON.parse(localStorage.getItem('userAttributes'));
    console.log(userAttributes);
    userAttributes.name = $("#nameInput").val();
    if ($("#newPassword").val() == $("#confirmNewPassword").val()) {
        var newPassword = $("#newPassword").val();
        cognitoUser.completeNewPasswordChallenge(newPassword, userAttributes, {
            onSuccess: function (result) {
                logMessage("confirm complete");
                switchToLoggedInView();
            },
            onFailure: function (err) {
                console.log("Failed to complete user registration");
                logMessage(err.message);
                $("#loader").hide();
            }
        });
    } else {
        alert("Passwords do not match");
    }
}

function getCognitoIdentityCredentials() {
    AWS.config.region = region;

    var loginMap = {};
    loginMap['cognito-idp.' + region + '.amazonaws.com/' + userPoolId] = idToken;

    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: identityPoolId,
        Logins: loginMap
    });

    AWS.config.credentials.clearCachedId();

    AWS.config.credentials.get(function (err) {
        if (err) {
            logMessage(err.message);
        } else {
            // logMessage('AWS Access Key: '+ AWS.config.credentials.accessKeyId);
            // logMessage('AWS Secret Key: '+ AWS.config.credentials.secretAccessKey);
            // logMessage('AWS Session Token: '+ AWS.config.credentials.sessionToken);

            // var sts = new AWS.STS();
            // var params = {};
            // sts.getCallerIdentity(params, function(err, data) {
            //     if (err) console.log(err, err.stack); // an error occurred
            //     else     console.log(data);           // successful response
            // });
        }

        $("#loader").hide();
    });
}

function getDirs() {
    $("#dirList").empty();
    $("#dirList").show();
    $("#fileList").empty();
    $("#fileList").hide();
    $("#usePhotosButton").hide();
    $("#navbar-left").empty();
    $("#navbar-mid").html("Select upload directory");
    for (var dir in files) {
        $("#dirList").append('<a href="#" id="' + dir + '" onclick="viewAlbum(this)">' + dir + '</a><br>');
    }
}

function viewAlbum(event) {
    dir = event.id;
    $("#fileList").empty();
    $("#dirList").hide();
    $("#navbar-left").html('<button class="btn btn-sm btn-primary" onclick="getDirs()"><i class="fas fa-arrow-left"></i></btn>')
    $("#navbar-mid").html(dir);
    $("#usePhotosButton").show();


    for (var file in files[dir]) {
        filename = files[dir][file];
        filepath = dir + "/" + filename;
        thumbnail_filepath = "thumbnails/" + filepath;
        full_filepath = "images/" + filepath;
        const url = s3.getSignedUrl('getObject', {
            Bucket: s3UploadBucket,
            Key: thumbnail_filepath,
            Expires: 300
        })
        $("#fileList").append('<div class="image_outer"><input class="selectedImage" type="checkbox" id="checkbox-' + full_filepath + '" data-filepath="' + filepath + '"><br><img src="' + url + '" class="thumbnail" onclick="viewFullSizeImage(this)"></div>');
    }
    return false;
}

function viewFullSizeImage(event) {
    $("#fullSizeImage").attr("src", event.src);

    $("#imageModal").modal({
        // keyboard: false
    });
}


function showCreateModal() {
    $("#createModal").modal({
        // keyboard: false
    });
    getGalleriesList();
}

function useImages() {
    var galleryID;
    var galleryDir;
    var dropdown = $("#existingGallery");

    if (dropdown.val() == "createnew") {
        var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
        var params = {
            TableName: albumsTable,
            Item: {
                'ID': {S: uuidv4()},
                'name': {S: $("#newGallery").val()},
                'dir': {S: $("#newGallery").val().cleanup()},
                'created': {S: new Date().toLocaleString()}
            }
        };

        $("#createMsg").html("Adding gallery to database");
        ddb.putItem(params, function (err, data) {
            if (err) {
                console.log("Error in ddb.putItem: ", err.message);
                alert("Error: " + err);
            } else {
                $("#createMsg").html("Gallery added to database");
                galleryID = params.Item.ID.S;
                galleryDir = params.Item.dir.S;
                copyImagesToGallery(galleryID, galleryDir);
            }
        });
    } else {
        galleryID = $('#existingGallery').val();
        galleryDir = $('#existingGallery option:selected').text().cleanup();
        copyImagesToGallery(galleryID, galleryDir);
    }

}

function copyImagesToGallery(galleryID, galleryDir) {
    console.log("in copyImagesToGallery("+galleryID+","+galleryDir+")");
    var files_list = [];
    $(".selectedImage:checked").each(function (index) {
        var filepath = $(this).attr('data-filepath');
        files_list.push(filepath);
    });

    var payload = {
        files_list: files_list,
        galleryID: galleryID,
        galleryDir: galleryDir
    };

    var lambda = new AWS.Lambda();
    var params = {
        FunctionName: galleryAdminFunction,
        InvocationType: "RequestResponse",
        LogType: "Tail",
        Payload: JSON.stringify(payload)
    };

    lambda.invoke(params, function (err, data) {
        if (err) {
            alert("Failed to copy images - check console log");
            console.log(err, err.stack);
        } else {
            $("#createMsg").html("Images copied to gallery");
            $("#createModal").modal('hide');
            alert(files_list.length + " images added to gallery");
        }
    });
}

function getGalleriesList() {
    var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
    var params = {
        TableName: albumsTable
    };

    ddb.scan(params, function (err, data) {
        if (err) {
            console.log("Error", err);
        } else {
            galleries = data.Items;
            $('#existingGallery').empty();
            $('#existingGallery').append($('<option>', {
                value: "createnew",
                text: "[Create new gallery]"
            }));
            galleries.forEach(function (element, index, array) {
                $('#existingGallery').append($('<option>', {
                    value: element.ID.S,
                    text: element.name.S
                }));
            });
        }
    });
}


function getAWSS3BucketObjects() {
    s3 = new AWS.S3();

    var params = {
        Bucket: s3UploadBucket
    };

    s3.listObjects(params, function (err, data) {
        if (err) {
            console.log("ERROR in s3.listObjects: ", err.message);
            alert(err.message);

        } else {
            files = {};

            data.Contents.forEach(element => {
                var key = element.Key;
                var splitkey = key.split("/");
                var topdir = splitkey[0];
                var dir = splitkey[1];
                var file = splitkey[2];
                if (topdir == "images") {
                    if (!files.hasOwnProperty(dir)) {
                        files[dir] = [];
                    }
                    files[dir].push(file);
                }

            });
            getDirs();

        }

        $("#loader").hide();
    });
}

function getCurrentLoggedInSession() {

    $("#loader").show();
    userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    cognitoUser = userPool.getCurrentUser();

    if (cognitoUser != null) {
        cognitoUser.getSession(function (err, session) {
            if (err) {
                console.log("ERROR1: ", err.message);
                alert(err.message);
            } else {
                // logMessage('Session found! Logged in.');

                idToken = session.getIdToken().getJwtToken();
                getCognitoIdentityCredentials();
                switchToLoggedInView();


            }
            $("#loader").hide();
        });
    } else {
        // logMessage('Session expired. Please log in again.');
        $("#loader").hide();
    }

}

function logMessage(message) {
    $('#log').append(message + '</br>');
}

String.prototype.cleanup = function () {
    return this.toLowerCase().replace(/[^a-zA-Z0-9]+/g, "");
}

function uuidv4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}