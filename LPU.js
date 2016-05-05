// type Pos  = Int
// data Node = Node Kind Link Link Link
// type Kind = Void | Node Int
// type Port = 0 | 1 | 2
// type Link = Link Port Pos

// *Space -> Pos -> Kind -> Link -> Link -> Link -> ()
function node(S, i, k, x, y, z){
    S[i*4+0] = k;
    S[i*4+1] = x;
    S[i*4+2] = y;
    S[i*4+3] = z;
};

// *Space -> Pos -> ()
var tick = function(S, i){
    var ak = S[(i+0)*4+0], ax = S[(i+0)*4+1], ay = S[(i+0)*4+2], az = S[(i+0)*4+3],
        bk = S[(i+1)*4+0], bx = S[(i+1)*4+1], by = S[(i+1)*4+2], bz = S[(i+1)*4+3],
        ck = S[(i+2)*4+0], cx = S[(i+2)*4+1], cy = S[(i+2)*4+2], cz = S[(i+2)*4+3];

    // move
    // air air nod -> nod air air
    // nod nod air -> nod air nod
    if (ak === 0 && bk === 0 && ck !== 0)
        ak = ck, ax = cx, ay = cy, az = cz,
        ck =  0, cx =  0, cy =  0, cz =  0;
    if (ak !== 0 && bk !== 0 && ck === 0)
        ck = bk, cx = bx, cy = by, cz = bz,
        bk =  0, bx =  0, by =  0, bz =  0;

    // substitute
    // sub air nod -> air air nod
    if (ak === 1 && ax === -cx) cx = ay, ak = 0, ax = 0, ay = 0, az = 0;
    if (ak === 1 && ax === -cy) cy = ay, ak = 0, ax = 0, ay = 0, az = 0;
    if (ak === 1 && ax === -cz) cz = ay, ak = 0, ax = 0, ay = 0, az = 0;
    if (ck === 1 && cx === -ax) ax = cy, ck = 0, cx = 0, cy = 0, cz = 0;
    if (ck === 1 && cx === -ay) ay = cy, ck = 0, cx = 0, cy = 0, cz = 0;
    if (ck === 1 && cx === -az) az = cy, ck = 0, cx = 0, cy = 0, cz = 0;

    // pass
    // nod air nod -> nod air nod
    if (ak > 0 && bk === 0 && ck > 0 && ((ax > 0 && cx < 0) || (ak === 1 && ck !== 1 && ax > 0) || (ck === 1 && ck !== 1 && cx < 0))){
        ak = ak+ck, ck = ak-ck, ak = ak-ck;
        ax = ax+cx, cx = ax-cx, ax = ax-cx;
        ay = ay+cy, cy = ay-cy, ay = ay-cy;
        az = az+cz, cz = az-cz, az = az-cz;
        if (ax === -cx) ax *= -1, cx *= -1;
        if (ax === -cy) ax *= -1, cy *= -1;
        if (ax === -cz) ax *= -1, cz *= -1;
        if (ay === -cx) ay *= -1, cx *= -1;
        if (ay === -cy) ay *= -1, cy *= -1;
        if (ay === -cz) ay *= -1, cz *= -1;
        if (az === -cx) az *= -1, cx *= -1;
        if (az === -cy) az *= -1, cy *= -1;
        if (az === -cz) az *= -1, cz *= -1;
        //setTimeout(()=>console.log(ax, cx));
    };

    // duplicate
    // air dup air -> nod air nod
    //   a        x    z
    // ~ k ~ =>  a    b 
    //   b        y    w
    //x y z w
    //y w x z
    //if (ak === 0 && bk < -1 && ck === 0){
        ////var r = (1103515245 * (bx>0?bx:-bx) + 12345) % 4294967296;
        //ak = -bk, ax = by, ay = bx>0?bx+1:-(-bx+1), az = bx>0?bx+2:-(-bx+3), 
        //ck = -bk, cx = bz, cy = bx>0?bx+3:-(-bx+2), cz = bx>0?bx+4:-(-bx+4),
        //bk = 0  , bx = 0 , by = 0                 , bz = 0;
    //};
    if (ak < -1 && bk === 0){
        var A = ak, B = ax, C = ay, D = az;
        ak = -A, ax = C, ay = B>0?B+0:-(-B+0), az = B>0?B+1:-(-B+2), 
        bk = -A, bx = D, by = B>0?B+2:-(-B+1), bz = B>0?B+3:-(-B+3);
    };

    // annihilate
    // nod air nod -> sub air sub
    // a     d      a = e
    //  c ~ c    =>    
    // b     e      b = d
    if (ak > 1 && bk === 0 && ck > 1 && ax === -cx && ak === ck)
        ak = 1, ax = ay, ay = cy,
        ck = 1, cx = az, cy = cz,
        az = 0, cz = 0;

    // commute
    // nod air nod -> dup air dup
    // a     d     c  c       a   d  
    //  c ~ c  =>  a  e       c   c
    // b     e     b  d       b   e 
    if (ak > 1 && bk === 0 && ck > 1 && ax === -cx && ak !== ck){
        var r = (next+=5);
        ak = ak+ck, ck = ak-ck, ak = ak-ck, ak = -ak, ck = -ck, ax = r, cx = -r;
    };

    S[(i+0)*4+0] = ak, S[(i+0)*4+1] = ax, S[(i+0)*4+2] = ay, S[(i+0)*4+3] = az,
    S[(i+1)*4+0] = bk, S[(i+1)*4+1] = bx, S[(i+1)*4+2] = by, S[(i+1)*4+3] = bz,
    S[(i+2)*4+0] = ck, S[(i+2)*4+1] = cx, S[(i+2)*4+2] = cy, S[(i+2)*4+3] = cz;
};
next = 64;

// *Space -> String
function render(S){
    var lines = ["", "", "", ""];
    var digits = "abcdefghijklmnopqrstuvwzyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789&^~+@*^~#";
    function n(n){
        var k=n>0?n:-n;
        var s = (k).toString(16);
        if (s.length<2) s = " "+s;
        return n>0?s+"~":"~"+s;
    }
    for (var i=0, l=Math.min(S.length/4, 64); i<l; ++i){
        var k = S[i*4+0], a = S[i*4+1], b = S[i*4+2], c = S[i*4+3];
        var focus = S.cursor === i || S.cursor === i-1 || S.cursor === i-2;
        var col = k === 0 ? [focus?"|||":" . "        , "   ", "   ", "   "]
                : k === 1 ? [focus?"|%|":" % "        , n(a) , n(b) , "   "]
                : k <= -2 ? [focus?"|D|":" D "        , n(a) , n(b) , n(c) ]
                :           [focus?"|"+k+"|":" "+k+" ", n(a) , n(b) , n(c) ];
        for (var j=0; j<4; ++j) lines[j] += col[j];
    };
    return lines.map((l)=>l.slice(0,256)).join("\n");
};

var lc = require("./lambda.js"), L = lc.Lam, V = lc.Var, A = lc.App;
var ln = require("./lamnet.js");
var net = ln.text(ln.encode(lc.nat(2)));
function from_lam(S, term){
    var cells = 65536;
    var S = [];
    for (var i=0; i<cells*4; ++i)
        S[i] = 0;
    S.cursor = 0;
    function adjust_signs(text){
        var seen = {1:1};
        var see = (n) => seen[n] ? -n : (seen[n]=1, n);
        return text.map((n) => [n[0], see(n[1]), see(n[2]), see(n[3])]);
    };
    adjust_signs(ln.text(ln.encode(term))).map(function(n, i){
        //console.log(n, i);
        node(S, i*2, n[0]+1, n[1], n[2], n[3]);
    });
    return S;
};

var n = lc.nat;
var S = from_lam(S, A(n(2), n(2)));
var history = [render(S)];
console.log(reduce());

function reduce(){
    for (var t=0; t<1024; ++t){
        var last = JSON.stringify(S);
        for (var j=0; j<3; ++j){
            var air_streak = 0;
            for (var i=0; i<S.length/4-3; i+=3){
                tick(S, i+j);
                air_streak = S[i*4+0]===0 ? air_streak + 1 : 0;
                if (air_streak > 6)
                    break;
            };
            history.push(render(S));
        };
        if (JSON.stringify(S) === last)
            return history.length;
    };
};

// TEST
var time = 0;
require("./interactive_shell")(function(key){
    if (key === "h") ++S.cursor;
    if (key === "l") S.cursor = Math.max(S.cursor-1, 0);
    if (key === "k") time = Math.min(time+1, history.length-1);
    if (key === "j") time = Math.max(time-1, 0);
    return history[time]+"\n"+time;
});








//for (var i=0; i<10; ++i)
    //console.log(history[i]);

//if (key === "space"){
    //for (var i=0; i<S.length/4-3; i+=3)
        //tick(S, i+(ticks%3));
    //++ticks;
//};






//console.log(lc.pretty(lc.nat(2)));
//console.log(net);
//console.log(lc.pretty(L(V(0))));


















// Space
// Church-encoded 2^2
//var S = (function (){
    //var S = []; for (var i=0; i<60*4; ++i) S[i] = 0; S.cursor = 0;
    //node(S,  0,  2,   1,   9,  -23);
    //node(S,  3,  2,  -1,   2,   8);
    //node(S,  6,  3,  -2,   3,   4);
    //node(S,  9,  2,  -3,   5,   6);
    //node(S, 10,  2,  -4,  -6,   7);
    //node(S, 12,  2,  -8,  -5,  -7);
    //node(S, 13,  2,  -9,  10,  15);
    //node(S, 15,  4, -10,  11,  12);
    //node(S, 19,  2, -11,  16,  13);
    //node(S, 20,  2, -12, -13,  14);
    //node(S, 24,  2, -15, -16, -14);
    //return S;
//})();

