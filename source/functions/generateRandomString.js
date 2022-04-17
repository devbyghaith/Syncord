module.exports = function(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    var charactersLength = characters.length;

    for (var index = 0; index < length; index++) {
        result += (index <= length ? characters.substring(0,  62) : characters).charAt(Math.floor(Math.random() * charactersLength));
    };

    return result;
};
