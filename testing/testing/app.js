var data = {
    'api_token': 'c9406b4f36456e3730cf2cf10c7d5348',
    'url': 'https://audd.tech/example.mp3',
    'return': 'apple_music,spotify',
};

$.getJSON("https://api.audd.io/?jsonp=?", data, function (result) {
    document.write(result);
});
