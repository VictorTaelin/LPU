module.exports = (function LPU(){
    var ln = require("./lamnet.js");
    var lc = require("./lambda.js");

    // *Space -> Pos -> Kind -> Link -> Link -> Link -> ()
    function node(S, i, k, x, y, z){
        S[i*4+0] = k;
        S[i*4+1] = x;
        S[i*4+2] = y;
        S[i*4+3] = z;
    };

    // *Space -> Pos -> Bool
    function tick(S, i){
        var applied_rule = 0;
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
        if (ak === 1 && bk === 0 && ck !== 0 && ax === -cx) cx = ay, ak = 0, ax = 0, ay = 0, az = 0;
        if (ak === 1 && bk === 0 && ck !== 0 && ax === -cy) cy = ay, ak = 0, ax = 0, ay = 0, az = 0;
        if (ak === 1 && bk === 0 && ck !== 0 && ax === -cz) cz = ay, ak = 0, ax = 0, ay = 0, az = 0;
        if (ck === 1 && bk === 0 && ck !== 0 && cx === -ax) ax = cy, ck = 0, cx = 0, cy = 0, cz = 0;
        if (ck === 1 && bk === 0 && ck !== 0 && cx === -ay) ay = cy, ck = 0, cx = 0, cy = 0, cz = 0;
        if (ck === 1 && bk === 0 && ck !== 0 && cx === -az) az = cy, ck = 0, cx = 0, cy = 0, cz = 0;
        if (ay === -az && ay < 0) ay *= -1, az *= -1; // adjust direction
        if (by === -bz && by < 0) by *= -1, bz *= -1; // adjust direction
        if (cy === -cz && cy < 0) cy *= -1, cz *= -1; // adjust direction
        if (ak === 1 && ax === -ay) ak = 0, ax = 0, ay = 0, az = 0; // self subs = erase
        if (ck === 1 && cx === -cy) ck = 0, cx = 0, cy = 0, cz = 0; // self subs = ercse

        // pass
        // nod air nod -> nod air nod
        if (ak > 0 && bk === 0 && ck > 0 && ((ax > 0 && cx < 0) || (ak === 1 && ck !== 1 && ax > 0) || (ck === 1 && ak !== 1 && cx < 0))){
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
        };

        // duplicate
        // air dup air -> nod air nod
        //   a        x    z
        // ~ k ~ =>  a    b 
        //   b        y    w
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
            applied_rule = 1,
            ak = 1, ax = ay, ay = cy,
            ck = 1, cx = az, cy = cz,
            az = 0, cz = 0;

        // commute
        // nod air nod -> dup air dup
        // a     d     c  c       a   d  
        //  c ~ c  =>  a  e       c   c
        // b     e     b  d       b   e 
        if (ak > 1 && bk === 0 && ck > 1 && ax === -cx && ak !== ck){
            var r = 64+(~~(Math.random()*Math.pow(2,31)));
            applied_rule = 1;
            ak = ak+ck, ck = ak-ck, ak = ak-ck, ak = -ak, ck = -ck, ax = r, cx = -r;
        };

        S[(i+0)*4+0] = ak, S[(i+0)*4+1] = ax, S[(i+0)*4+2] = ay, S[(i+0)*4+3] = az,
        S[(i+1)*4+0] = bk, S[(i+1)*4+1] = bx, S[(i+1)*4+2] = by, S[(i+1)*4+3] = bz,
        S[(i+2)*4+0] = ck, S[(i+2)*4+1] = cx, S[(i+2)*4+2] = cy, S[(i+2)*4+3] = cz;

        return applied_rule;
    };

    // *Space -> String
    function render(S){
        var lines = ["", "", "", ""];
        function n(n){
            var k = (n>0?n:-n)%256;
            var s = k.toString(16);
            while (s.length<3) s = " "+s;
            if (s[0]===" ") s = "|"+s.slice(1);
            return s+(n>0?">":"<");
        }
        for (var i=0, l=Math.min(S.length/4, 64); i<l; ++i){
            var k = S[i*4+0], a = S[i*4+1], b = S[i*4+2], c = S[i*4+3];
            var focus = S.cursor === i || S.cursor === i-1 || S.cursor === i-2;
            var kn = (k<16 ? ":" : "") + k.toString(16);
            var col = k === 0 ? ["|:::"           , "|   ", "|   ", "|   "]
                    : k === 1 ? ["|%%:"           , n(a)  , n(b)  , "|   "]
                    : k <= -2 ? ["|DD:"           , n(a)  , n(b)  , n(c)  ]
                    :           ["|"+kn+":", n(a) , n(b)   , n(c) ];
            for (var j=0; j<4; ++j) lines[j] += col[j];
        };
        for (var j=0; j<4; ++j) lines[j] += "|";
        return lines.map((l)=>l.slice(0,256)).join("\n");
    };

    // *Space -> {String:Bool} -> {result: *Space, stats: Stats}
    function reduce(S, opts){
        var stats = {
            memory         : 0,
            clocks         : 0,
            history        : [render(S)],
            graph_rewrites : 0};

        // Repeat this a ton of times
        for (var t=0; t<Math.pow(2,20); ++t){

            // The "parallel" loop.
            // Call the tick function for each 3 consecutive cells.
            for (var i=t%3; i<S.length/4-2; i+=3)
                stats.graph_rewrites += tick(S, i) ? 1 : 0;

            // Some simple adjustments on the size of the array.
            while (!S[S.length-12] && !S[S.length-8] && !S[S.length-4]) S.length -= 4;
            while (S[S.length-8] || S[S.length-4]) S.push(0,0,0,0);

            // Statistics.
            stats.memory = Math.max(S.length*4, stats.memory);
            if (opts.get_history) stats.history.push(render(S));
            ++stats.clocks;

            // Checks if we're done (no active port, holes or subs).
            var done = 1, last = 1;
            for (var i=0; i<S.length/4; i+=2){
                if (S[i*4+1] > 0 || last === 0 && S[i*4+1] !== 0 || S[i*4+0] === 1){
                    done = 0;
                    break;
                }; 
                last = S[i*4+1]; 
            };
            if (done) break;
        };
        // Fluff
        if (opts.save_file)
            require("fs").writeFileSync(opts.save_file, stats.history.join("\n"));
        if (opts.interactive){
            var time = 0;
            require("./interactive_shell")(function(key){
                if (key === "h") ++S.cursor;
                if (key === "l") S.cursor = Math.max(S.cursor-1, 0);
                if (key === "k") time = Math.min(time+1, stats.history.length-1);
                if (key === "j") time = Math.max(time-1, 0);
                return stats.history[time]+"\n"+time;
            });
        };
        return {result: S, stats: stats};
    };

    // *Space -> Net -> Space
    function from_net(S, net){
        var S = [];
        S.cursor = 0;
        function adjust_signs(text){
            var seen = {1:1};
            var see = (n) => seen[n] ? -n : (seen[n]=1, n);
            return text.map((n) => [n[0], see(n[1]), see(n[2]), see(n[3])]);
        };
        adjust_signs(ln.text(net)).map(function(n, i){
            node(S, i*2+1, 0, 0, 0, 0);
            node(S, i*2, n[0]+1, n[1], n[2], n[3]);
        });
        while (S[S.length-4] === 0) S.length -= 4;
        return S;
    };

    // *Space -> Term -> Space
    function from_term(S, term){
        return from_net(S, ln.encode(term));
    };

    return {
        node      : node,
        tick      : tick,
        render    : render,
        reduce    : reduce,
        from_net  : from_net,
        from_term : from_term};
})();
