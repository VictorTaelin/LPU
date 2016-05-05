module.exports = (function(){
    // Map String String
    var base64_chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    // Map String String
    var base64_bits  = {};
    for (var i=0, l=base64_chars.length; i<l; ++i){
        var bits = i.toString(2);
        var bits = ("000000"+bits).slice(bits.length);
        base64_bits[base64_chars[i]] = bits;
    };

    // String -> String
    function from_bits(bits){
        var string = [];
        for (var i=0, b=bits, l=b.length; i<l; i+=6){
            for (var idx=0, j=0; j<6; ++j)
                idx += Number(b[i+j]||"0")*Math.pow(2,5-j);
            string.push(base64_chars[idx]);
        };
        return string.join("");
    };

    // String -> String
    function to_bits(chars){
        var string = [];
        for (var i=0, l=chars.length; i<l; ++i)
            string.push(base64_bits[chars[i]]);
        return string.join("");
    };

    return {from_bits: from_bits, to_bits: to_bits};
})();
