'use strict';

const AWS = require('aws-sdk');
const s3 = new AWS.S3({signatureVersion: 'v4'});
const ddb = new AWS.DynamoDB({apiVersion: '2012-08-10',});
var srcBucket;
var targetBucket;
var uploadsTable;
var albumsTable;
var imagesTable;
var galleryID;
var galleryDir;


async function copyDynamoRecord(src_filename, dest_filename) {
    try {
        const getParams = {
            TableName: uploadsTable,
            Key: {
                'filename': {S: src_filename}
            }
        };

        ddb.getItem(getParams, function (err, data) {
            if (err) {
                console.log("Error", err);
                return err;
            } else {
                console.log("Found image " + src_filename);
                console.log("image data: ", data.Item);
                const image = data.Item;

                const putParams = {
                    TableName: imagesTable,
                    Item: {
                        'galleryID': {S: galleryID},
                        'filepath': {S: dest_filename},
                        'name': {S: image.name.S},
                        'event': {S: image.event_name.S},
                        'email': {S: image.email.S}
                    }
                };

                ddb.putItem(putParams, function (err, data) {
                    if (err) {
                        console.log("Error: " + err);
                    } else {
                        console.log("DB record inserted for ", dest_filename);
                    }
                });
            }
        });
    } catch (err) {
        console.log("ERROR: ", err);
        // callback(new Error(err))
    }
}

async function copyFile(src_filename, dest_filename) {
    console.log("Copying image: " + src_filename);

    try {
        const copyParams = {
            CopySource: srcBucket + "/" + src_filename,
            Bucket: targetBucket,
            Key: dest_filename,
            ACL: 'public-read'
        };

        return s3.copyObject(copyParams).promise();
    } catch (err) {
        console.log("ERROR: ", err);
    }
}

async function copyFiles(files_list) {
    // console.log("FILES_LIST: ", files_list);

    await Promise.all(files_list.map(async (src_filepath) => {

        var filepath_parts = src_filepath.split("/");
        var filename = filepath_parts[1];
        var dest_image_filepath = "albums/" + galleryDir + "/images/" + filename;
        var dest_thumbnail_filepath = "albums/" + galleryDir + "/thumbnails/" + filename;

        // console.log("src_filepath: ", src_filepath);
        // console.log("dest_image_filepath: ", dest_image_filepath);
        // console.log("dest_thumbnail_filepath: ", dest_thumbnail_filepath);
        // console.log("filename: ", filename);


        await copyDynamoRecord(src_filepath, dest_image_filepath)
            .then((data) => {
                console.log("DB record copied: ", filename);
            })
            .catch((err) => {
                console.log(err);
            })
        await copyFile("images/" + src_filepath, dest_image_filepath)
            .then((data) => {
                console.log("images/" + src_filepath + " copied OK");
            })
            .catch((err) => {
                console.log(err);
            })
        await copyFile("thumbnails/" + src_filepath, dest_thumbnail_filepath)
            .then((data) => {
                console.log("thumbnails/" + src_filepath + " copied OK");
            })
            .catch((err) => {
                console.log(err);
            })
    }));
}


async function buildIndexJSON() {
    var albumsList = [];

    var ddbParams = {
        TableName: albumsTable,
    };

    ddb.scan(ddbParams, function (err, data) {
        if (err) {
            console.log("Error", err);
        } else {
            var albums = data.Items;
            albums.forEach(function (album, index, array) {
                console.log(album);
                albumsList.push({
                    name: album.name.S,
                    dir: album.dir.S
                })
            });

            var bodyText = JSON.stringify(albumsList);
            console.log("bodyText: ", bodyText);

            var params = {
                Bucket: targetBucket,
                Key: "albums/albums.json",
                Body: bodyText,
                ACL: 'public-read'
            };

            console.log(params);

            s3.upload(params, function (err, data) {
                if (err) {
                    console.log("File create failed");
                    console.log(err, err.stack);
                } else {
                    console.log("File created ok");
                    console.log(data);
                }
            });
        }
    });
}

async function buildGalleryJSON() {
    var gallery_files_list = [];

    var ddbParams = {
        TableName: imagesTable,
        ExpressionAttributeValues: {
            ':galleryID': {S: galleryID}
        },
        FilterExpression: 'galleryID = :galleryID',
    };

    ddb.scan(ddbParams, function (err, data) {
        if (err) {
            console.log("Error", err);
        } else {
            var images = data.Items;
            images.forEach(function (image, index, array) {
                var filename = image.filepath.S.split("/")[3];
                gallery_files_list.push({
                    filename: filename,
                    name: image.name.S,
                    event_name: image.event.S
                })
            });

            var bodyText = JSON.stringify(gallery_files_list);

            var params = {
                Bucket: targetBucket,
                Key: "albums/" + galleryDir + "/images.json",
                Body: bodyText,
                ACL: 'public-read'
            };

            s3.upload(params, function (err, data) {
                if (err) {
                    console.log("File create failed");
                    console.log(err, err.stack);
                } else {
                    console.log("File created ok");
                    console.log(data);
                }
            });
        }
    });
}

exports.handler = async (event, context, callback) => {
    console.log(event);
    targetBucket = process.env['s3_target_bucket'];
    if (!targetBucket) {
        callback(new Error(`S3_target_bucket not set`));
    }

    srcBucket = process.env['s3_src_bucket'];
    if (!srcBucket) {
        callback(new Error(`S3_src_bucket not set`));
    }

    uploadsTable = process.env['uploadsTable'];
    if (!uploadsTable) {
        callback(new Error('uploadsTable missing'));
        return;
    }

    albumsTable = process.env['albumsTable'];
    if (!albumsTable) {
        callback(new Error('albumsTable missing'));
        return;
    }

    imagesTable = process.env['imagesTable'];
    if (!imagesTable) {
        callback(new Error('imagesTable missing'));
        return;
    }

    galleryID = event['galleryID'];
    if (!galleryID) {
        callback(new Error('galleryID missing'));
        return;
    }

    galleryDir = event['galleryDir'];
    if (!galleryDir) {
        callback(new Error('galleryDir missing'));
        return;
    }

    const files_list = event['files_list'];
    if (!files_list) {
        callback(new Error('files_list missing'));
        return;
    }

    await copyFiles(files_list)
        .then(() => {
            console.log("copy done");
            buildGalleryJSON();
            buildIndexJSON();
            console.log("HTML done");
            callback(null, {status: "OK"});
        })
        .catch((err) => {
            console.log("Failed: ", err);
            callback(new Error(err));
        });

};