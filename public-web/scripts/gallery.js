$(document).ready(function () {
    $.ajaxSetup({ cache: false });
    populateAlbumList();
});

function populateAlbumList() {
    $("#navbar-mid").html('Select album');
    $("#content").empty();
    $("#navbar-left").empty();
    $("#navbar-right").html('<a href="upload.html"><i class="fas fa-file-upload"></i> Upload images</a>');
    $.getJSON("albums/albums.json", function (data) {
        data.forEach(album => {
            $("#content").append('<div class="album col-12" onclick="viewAlbum(\'' + album.dir + '\')"><i class="far fa-images"></i> ' + album.name + '</div>');
        });
    });
}


function viewAlbum(albumDir) {
    $("#navbar-left").html('<button class="btn btn-sm btn-primary" onclick="populateAlbumList()"><i class="fas fa-arrow-left"></i></btn>')
    $("#navbar-mid").html('Select image');
    $("#navbar-right").empty();
    $("#content").empty();
    $.getJSON("albums/" + albumDir + "/images.json", function (data) {
        data.forEach(image => {
            var thumbnail_path = "albums/" + albumDir + "/thumbnails/" + image.filename;
            $("#content").append('<div class="albumImage" onclick="viewImage(\'' + albumDir + '\',\'' + image.filename + '\',\'' + image.name + '\',\'' + image.event_name + '\')"><img class="thumbnail" src="' + thumbnail_path + '"></div>');
        });
    });
}

function viewImage(albumDir, filename, name, event_name) {
    var filepath = "albums/" + albumDir + "/images/" + filename;
    $("#fullSizeImage").attr("src", filepath);
    $("#author").html(event_name + ". Photo credit: " + name);
    $("#imageModal").modal();
}
