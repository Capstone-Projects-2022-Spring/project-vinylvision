function Hello() {
    var data = {
    'api_token': '7c1042cd5831c7c617a466cdf3f6c1a4',
    'url': 'https://audd.tech/example.mp3',
    'return': 'apple_music,spotify',
};
$.getJSON("https://api.audd.io/?jsonp=?", data, function(result){
    document.write(result.artistName);
});
}