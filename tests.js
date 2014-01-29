eval(require('fs').readFileSync("utils.js", "utf8"))
eval(require('fs').readFileSync("PolarPoint.js", "utf8"))
eval(require('fs').readFileSync("Edge.js", "utf8"))
eval(require('fs').readFileSync("Node.js", "utf8"))
eval(require('fs').readFileSync("Graph.js", "utf8"))

var count = 0

function assert (name, value, fun, args) {
    var x = null
    try {
        x = fun.apply(fun, args)
    } catch (e) {
        var msg = e.message
        throw ("test failure: " + name + " error " + msg)
    }
    if (x != value)
        throw ("test failure: " + name + " expected " + value + " got " + x)
    else
        count = count + 1
}

function testUtils () {
    function id (x) { return x }

    var foo = 23
    var xid = id.curry(foo)
    assert("curry works", 23, xid)
    assert("curry works", 23, xid)
    assert("curry works", 23, xid)

    function add (x, y) { return x + y }

    var addone = add.curry(1)
    assert("addone does work", 3, addone.curry(2))
    assert("compose works", 4, addone.compose(addone.curry(2)))
    assert("multicurry works", 4, add.curry(1).curry(3))

    assert("curried eq works", true, eq.curry(3), [3])
    assert("curried eq false works", false, eq.curry(eq), [neq])
    assert("curried eq eq works", true, eq.curry(eq), [eq])

    assert("neq is not eq", true, neq.curry(neq), [eq])
}

testUtils()

console.log("In", count, "assertions I failed to find any defects")
