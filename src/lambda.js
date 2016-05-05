// ~~~~~~~~~~~~~~~~~~~~~~ Lambda_Calculus.js ~~~~~~~~~~~~~~~~~~~~~~
// A simple implementation of the λ-calculus written in JavaScript.
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
module.exports = (function lambda_calculus(){
    var base64 = require("./base64.js");

    // A term is either a lambda, an application or a variable:
    //     data Term = Lam Term | App Term Term | Var Int

    var VAR = 1, LAM = 2, APP = 3;

    // Lam :: Term -> Term
    // Creates an abstraction.
    function Lam(body){ 
        return {type:LAM, body:body}; 
    };

    // App :: Term -> Term -> Term
    // The application of two terms.
    function App(left,right){ 
        return {type:APP, left:left, right:right};
    };

    // Var :: Int -> Term
    // A bruijn-indexed variable.
    function Var(index){ 
        return {type:VAR, index:index}; 
    };

    // reduce :: Term -> Term
    // Reduces a term to normal form. Will fail to terminate if the term isn't
    // strongly normalizing - that is, λ-combinator and similar absurds are banned.
    function reduce(term){
        switch (term.type){
            case VAR: return term;
            case LAM: return Lam(reduce(term.body));
            case APP: 
                var left  = reduce(term.left);
                var right = reduce(term.right);
                switch (left.type){
                    case LAM : return reduce(substitute(right, true, 0, -1, left.body));
                    case APP : return App(left,right);
                    default  : return App(left, right);
                };
        };
        function substitute(value, subs, depth, wrap, term){
            switch (term.type){
                case VAR: return subs && term.index === depth
                    ? substitute(Var(0), false, -1, depth, value)
                    : Var(term.index + (term.index > depth ? wrap : 0));
                case LAM: return Lam(substitute(value, subs, depth+1, wrap, term.body));
                case APP: return App(
                    substitute(value, subs, depth, wrap, term.left),
                    substitute(value, subs, depth, wrap, term.right));
            };
        };
    };

    // fold :: (Int -> a) -> (a -> a -> a) -> (a -> a) -> Term -> a
    function fold(var_,lam,app){
        return function go(term){
            switch (term.type){
                case VAR: return var_(term.index);
                case LAM: return lam(go(term.body));
                case APP: return app(go(term.left),go(term.right));
            };
        };
    };

    // foldScoped :: (Int -> t -> t) -> (t -> t -> t) -> (Int -> t) -> Term -> t
    function fold_scoped(var_, lam, app){
        return (function(term){
            return fold(
                function(idx) {return function(d){return var_(d-1-idx) }},
                function(body){return function(d){return lam(d, body(d+1)) }},
                function(a, b){return function(d){return app(a(d), b(d)) }})(term)(0);
        })
    };

    // nat :: Number -> Term
    // Converts a JavaScript number to a λ-calculus church number.
    function nat(x){
        return Lam(Lam((function go(x){return x===0?Var(0):App(Var(1),go(x-1))})(x)));
    };

    // nat_ :: Term -> Number
    // Converts a λ-calculus church number to a JavaScript number. 
    // TODO: do this decently.
    function nat_(x){
        return size(x)-1;
    };

    // print :: Term -> IO ()
    function print(x){
        console.log(pretty(x));
        return x;
    };

    // size :: Term -> Int
    // Number of variables on a λ-term. 
    // TODO: that isn't the usual definition of size, dumb.
    var size = fold(
        function(idx){ return 1; },
        function(body){ return body; },
        function(left,right){ return left+right; });

    // pretty :: Term -> String
    var pretty = fold(
        function(index){ return index; },
        function(body){ return "λ" + body; },
        function(left,right){ return "(" + left + " " + right + ")"; });

    // parse :: String -> Term
    //function parse(str){
        //var i = 0, j = 0;
        //return (function go(){
            //return 
                //( str[i] === "λ" || str[i] === "L"
                //? ++i, Lam(go())
                //: str[i] === "(" 
                //? App(go(), (++i, go())),
                //: (function(){
                    //for (var j = i, c; c=str[i].charCodeAt(0), c>=48 && c<= 57; ++i){};
                    //var num = Number(str.slice(i, j));
                    //i = j;
                    //return num;
                //})()
        //})();
    //};

    // show :: Term -> String
    var show = fold(
        function(index){ return "Var(" + index + ")"; },
        function(body){ return "Lam(" + body + ")"; },
        function(left,right){ return "App(" + left + "," + right + ")"; });

    // from_js :: JSTerm -> Term
    // Converts a JS function to a λ-calculus term.
    function from_js(value){
        var nextVarId = 0;
        return (function normalize(value){
            return function(depth){
                function app(variable){
                    function get_arg(arg){
                        return arg===null 
                            ? variable
                            : app(function(depth){
                                return App(
                                    variable(depth),
                                    normalize(arg)(depth));
                            });
                    };
                    get_arg.is_app = true;
                    return get_arg;
                };
                if (value.is_app) 
                    return value(null)(depth);
                else if (typeof value === "function") {
                    var body = normalize(value(app(function(d){
                            return Var(d-1-depth);
                        })))(depth+1);
                    return Lam(body);
                } else return value;
            };
        })(value)(0);
    };

    // to_js :: Term -> JSTerm
    // Converts a λ-calculus term to a JS function.
    function to_js(term){
        return (function go(term, args){
            if (term.type === LAM){
                return function(arg){
                    return go(term.body, {head:arg, tail:args});
                };
            } else if (term.type === APP){
                var left = go(term.left, args);
                var right = go(term.right, args);
                return left(right);
            } else if (term.type === VAR){
                for (var i=0, nth=term.index; i<nth; ++i)
                    args = args.tail;
                return args.head;
            };
        })(term, null, 0);
    };

    // to_compiled_js :: Term -> JSTerm
    function to_compiled_js(term){
        return eval(generate_js(term));
    };

    // (String -> String -> String) -> (String -> String -> String) -> Term -> String
    // Converts a λ-calculus term to a specific language's source code. 
    function transmogrify(lam, app){
        return fold_scoped(
            function(varid)      { return "v"+varid; },
            function(varid, body){ return lam("v"+varid,body); },
            function(left, right){ return app(left,right); });
    };

    // Term -> String
    // Converts a λ-calculus term to a JS source code.
    var generate_js = transmogrify(
        function(var_, body){ return "(function("+var_+"){return "+body+"})"; },
        function(a, b)      { return a+"("+b+")"; });

    // Term -> Term
    // Reduces a term using HOAS
    function reduce_using_hoas(term){
        function to_hoas(term){
            return (function go(term, args, depth){
                if (term.type === APP){
                    var a = go(term.left, args, depth);
                    var b = go(term.right, args, depth);
                    return typeof a === "function" ? a(b) : App(a,b);
                } else if (term.type === LAM)
                    return function(arg){
                        return go(term.body, {h:arg,t:args}, depth+1);
                    };
                else {
                    for (var i=0, l=term.index; i<l; ++i)
                        args = args.t;
                    return args.h;
                };
            })(term, null, 0);
        };
        function from_hoas(hoas){
            return (function go(term, depth){
                if (typeof term === "function")
                    return Lam(go(term(depth), depth+1));
                if (typeof term === "number")
                    return Var(depth-1-term);
                return App(go(term.left, depth), go(term.right, depth));
            })(hoas, 0);
        };
        function from_hoas_manual_stack(hoas){
            var stack = [];
            var retur = null;
            var index = -1;
            function CALL(term, depth){ stack[index+1] = {cont:0, term:term, depth:depth, left:null}; ++index; };
            function RETURN(val){ retur = val; --index; };
            CALL(hoas, 0);
            while (index>=0){
                var st    = stack[index];
                var cont  = st.cont;
                var term  = st.term;
                var depth = st.depth;
                if (cont === 0){
                    if (typeof term === "function"){
                        CALL(term(depth), depth+1);
                        st.cont = 1;
                    } else if (typeof term === "number"){
                        RETURN(Var(depth-1-term));
                    } else {
                        CALL(term.left, depth);
                        st.cont = 2;
                    };
                } else if (cont === 1){
                    RETURN(Lam(retur));
                } else if (cont === 2){
                    st.retur = retur;
                    CALL(term.right, depth);
                    st.cont = 3;
                } else {
                    RETURN(App(st.retur, retur));
                };
            };
            return retur;
        };
        return from_hoas(to_hoas(term));
    };

    // Term -> Term
    // Reduces a term by converting it to JavaScript,
    // running, and converting back to a term.
    function reduce_using_js(term){
        return from_js(to_js(term));
    };

    // Term -> Term
    // Same as above, except the conversion to JavaScript
    // is done by producing a textual source code and then
    // using `eval` on it, generating compilated code.
    function reduce_using_compiled_js(term){
        return from_js(to_compiled_js(term));
    };

    // Term -> String
    function parse_blc(source){
        var index = 0;
        return (function go(){
            if (source[index] === "0")
                return source[index+1] === "0"
                    ? (index+=2, Lam(go()))
                    : (index+=2, App(go(), go()));
            for (var i=0; index<source.length && source[index+i]!=="0"; ++i);
            index += i + 1;
            return Var(i-1);
        })();
    };

    // Term -> String
    var generate_blc = fold(
        function(idx) { for (var i=0, s=""; i<=idx; ++i) s+="1"; return s+"0"; },
        function(body){ return "00" + body; },
        function(a,b) { return "01" + a + b; });

    // Term -> String
    function generate_blc64(term){
        return base64.from_bits(generate_blc(term));
    };

    // String -> Term
    function parse_blc64(source){
        return parse_blc(base64.to_bits(source));
    };

    // Export a pattern-matching function instead. 
    // TODO: APP/LAM/VAR are internal tags and shouldn't be exported. 
    return {
        APP                      : APP,
        LAM                      : LAM,
        VAR                      : VAR,
        Lam                      : Lam,
        App                      : App,
        Var                      : Var,
        reduce                   : reduce,
        fold                     : fold,
        nat                      : nat,
        nat_                     : nat_,
        print                    : print,
        size                     : size,
        pretty                   : pretty,
        show                     : show,
        fold_scoped              : fold_scoped,
        parse_blc                : parse_blc,
        generate_blc             : generate_blc,
        parse_blc64              : parse_blc64,
        generate_blc64           : generate_blc64,
        reduce_using_hoas        : reduce_using_hoas,
        reduce_using_js          : reduce_using_js,
        reduce_using_compiled_js : reduce_using_compiled_js};
})();
