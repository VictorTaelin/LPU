module.exports = (function(){
    var lc = require("./lambda.js");
    function Link(node, port){
        this.node = node;
        this.port = port;
    };
    var next_name = 0;
    function Node(color){
        this.n = ++next_name;
        this.k = color;
        this.a = link(null, 0);
        this.b = link(null, 0);
        this.c = link(null, 0);
    };
    function port(node, port){
        return node ? (port === 0 ? node.a : port === 1 ? node.b : node.c) : null;
    };
    function link(node, port){
        return new Link(node, port);
    };
    function reverse(link){
        return port(link.node, link.port);
    };
    function node(color){
        return new Node(color);
    };
    function wire(a, a_port, b, b_port){
        if      (a_port === 0) a.a = link(b, b_port);
        else if (a_port === 1) a.b = link(b, b_port);
        else if (a_port === 2) a.c = link(b, b_port);
    };
    function biwire(a, a_port, b, b_port){
        wire(a, a_port, b, b_port);
        wire(b, b_port, a, a_port);
    };
    function annihilate(x, y){
        biwire(x.b.node, x.b.port, y.b.node, y.b.port);
        biwire(x.c.node, x.c.port, y.c.node, y.c.port);
    };
    function commute(x, y){
        var x2 = new Node(x.k);
        var y2 = new Node(y.k);
        biwire(y  , 0 , x.b.node , x.b.port);
        biwire(x  , 0 , y.b.node , y.b.port);
        biwire(y  , 1 , x        , 1);
        biwire(y2 , 0 , x.c.node , x.c.port);
        biwire(x2 , 0 , y.c.node , y.c.port);
        biwire(x  , 2 , y2       , 1);
        biwire(y  , 2 , x2       , 1);
        biwire(y2 , 2 , x2       , 2);
    };
    function encode(term){
        var next_color = 1;
        return (function encode(term, scope, up_link){
            switch (term.type){
                case lc.LAM: 
                    var del = new Node(0);
                    var lam = new Node(1);
                    wire(lam, 0, up_link.node, up_link.port);
                    biwire(lam, 1, del, 0);
                    biwire(del, 1, del, 2);
                    var body = encode(term.body, [lam].concat(scope), link(lam,2));
                    wire(lam, 2, body.node, body.port);
                    return link(lam, 0);
                case lc.APP:
                    var app = new Node(1);
                    wire(app, 2, up_link.node, up_link.port);
                    var left = encode(term.left, scope, link(app,0));
                    wire(app, 0, left.node, left.port);
                    var right = encode(term.right, scope, link(app,1));
                    wire(app, 1, right.node, right.port);
                    return link(app, 2);
                case lc.VAR:
                    var lam = scope[term.index];
                    if (lam.b.node.k === 0){
                        wire(lam, 1, up_link.node, up_link.port);
                        return link(lam, 1);
                    } else {
                        var dup = new Node(++next_color);
                        wire(dup, 0, lam, 1);
                        wire(dup, 1, up_link.node, up_link.port);
                        wire(dup, 2, lam.b.node, lam.b.port);
                        wire(lam.b.node, lam.b.port, dup, 2);
                        wire(lam, 1, dup, 0);
                        return link(dup, 1);
                    };
            };
        })(term, [], link(null,0));
    };
    function decode(link){
        return (function go(link, exit, depth){
            return link.node.k === 1
                ?   ( link.port === 0 ? lc.Lam(go(link.node.c, exit, (link.node.depth=depth)+1)) 
                    : link.port === 1 ? lc.Var(depth - link.node.depth - 1)
                    : lc.App(
                        go(link.node.a, exit, depth),
                        go(link.node.b, exit, depth)))
                :   go( port(link.node, link.port > 0 ? 0 : exit.head),
                        //link.node.ports[link.port > 0 ? 0 : exit.head],
                        link.port > 0 ? {head: link.port, tail: exit} : exit.tail,
                        depth)
        })(link, null, 0);
    };
    function show(link){
        var next_name = 0;
        var link_name = {};
        var visited   = {};
        return (function go(next){
            if (next.node)
                visited[next.node.n] = true;
            // Root
            if (!next.node || !next.node.k)
                return "*";
            // Top of tree
            else if (next.port === 0)
                return (function(color, text){
                    return color === 1 ? "("+text+")" : "{"+color+"| "+text+"}";
                })(next.node.k, next.node.n + ": " + go(next.node.b) + " " + go(next.node.c));
            // Active port
            else if (next.node.a.port === 0 && !visited[next.node.a.node.n])
                return go(next.node.a) + " = " + go(new Link(next.node, 0));
            // Found solid
            else
                return next[next.node.n+":"+next.port] 
                    || (next[reverse(next).node.n+":"+reverse(next).port] = ++next_name);
        })(link);
    };
    function annihilate(x, y){
        // xb       yc      xb   yc
        //    >|-|<     =>     X
        // xc       yb      xc   yb
        biwire(x.b.node, x.b.port, y.b.node, y.b.port);
        biwire(x.c.node, x.c.port, y.c.node, y.c.port);
    };
    function commute(x, y){
        // xc       yb      xb -#-|- yc
        //    >|-#<     =>       X 
        // xb       yc      xc -#-|- yb    
        var x2 = new Node(x.k);
        var y2 = new Node(y.k);
        biwire(y  , 0 , x.b.node , x.b.port);
        biwire(x  , 0 , y.b.node , y.b.port);
        biwire(y  , 1 , x        , 1);
        biwire(y2 , 0 , x.c.node , x.c.port);
        biwire(x2 , 0 , y.c.node , y.c.port);
        biwire(x  , 2 , y2       , 1);
        biwire(y  , 2 , x2       , 1);
        biwire(y2 , 2 , x2       , 2);
    };
    function reduce(link, stats_callback){
        var root = new Node(0);
        biwire(root, 1, link.node, link.port);
        var stats = {steps: 0, rewrites: 0}; 
        var solid = {};
        var exits = {};
        var visit = [reverse(link)];
        visit_a_node:
        while (visit.length > 0){
            var next = reverse(visit.pop());
            while (next !== undefined){
                var prev = reverse(next);
                ++stats.steps;
                if (solid[next.node.n]) 
                    continue visit_a_node;
                if (next.port === 0){
                    if (prev.port === 0){ 
                        var exit = port(prev.node, exits[prev.node.n]);
                        if (prev.node.k === next.node.k)
                            ++stats.rewrites,
                            annihilate(prev.node, next.node);
                        else 
                            ++stats.rewrites,
                            commute(prev.node, next.node);
                        next = reverse(exit);
                    } else {
                        solid[next.node.n] = true;
                        visit.push(reverse(next.node.c), reverse(next.node.b));
                        continue visit_a_node;
                    };
                } else {
                    exits[next.node.n] = next.port;
                    next = port(next.node, 0);
                };
            };
        };
        wire(port(root, 1).node, port(root, 1).port, null, 0);
        stats_callback && stats_callback(stats);
        return port(root, 1);
    };
    function text(link){
        var next_id = 1;
        var result  = [];
        var visited = {};
        (function go(node){
            if (node && !visited[node.n]){
                visited[node.n] = true;
                for (var i=0; i<3; ++i){
                    var link  = port(node,i);
                    var rlink = reverse(link);
                    if (!link.name && !link.node)
                        link.name = 1;
                    else if (!link.name)
                        link.name  = ++next_id,
                        rlink.name = link.name;
                };
                result.push([node.k,
                    port(node,0).name,
                    port(node,1).name,
                    port(node,2).name]);
                for (var i=0; i<3; ++i)
                    go(port(node,i).node);
            };
        })(link.node);
        return result;
    };

    return {
        encode: encode,
        decode: decode,
        reduce: reduce,
        reverse: reverse,
        wire: wire,
        link: link,
        node: node,
        show: show,
        port: port,
        text: text
    };
})();
