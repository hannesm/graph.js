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

function delay (stuff) {
    return function () { return stuff }
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

var epsilon = 0.001

function samesame (x, y) {
    return Math.abs(x - y) < epsilon
}

function testCoordinates (name, should, are) {
    assert(name + " x", true, samesame.curry(should[0]), [are[0]])
    assert(name + " y", true, samesame.curry(should[1]), [are[1]])
}

function testPolar () {
    var pp = new PolarPoint()
    assert("polarpoint complex has correct x", 0, delay(pp.toComplex()[0]))
    assert("polarpoint complex has correct y", 0, delay(pp.toComplex()[1]))
    var oneone = pp.follow(toPolar(1, 1))
    testCoordinates("polarpoint follow worked", [1, 1], oneone.toComplex())
    var fourfour = oneone.scale(4)
    testCoordinates("polarpoint scale worked", [4, 4], fourfour.toComplex())
    var copy = fourfour.copy()
    fourfour.rho = 0
    testCoordinates("polarpoint copy worked", [4, 4], copy.toComplex())
    testCoordinates("polarpoint copy worked", [0, 0], fourfour.toComplex())
    var cc = pp.follow(toPolar(10, 10)).follow(toPolar(10, 0))
    testCoordinates("polarpoint multiple follow worked", [20, 10], cc.toComplex())
    var dist = oneone.distance(copy)
    assert("distance is correct", true, samesame.curry(Math.sqrt(3 * 3 + 3 * 3)), [dist])
    var dist2 = copy.distance(oneone)
    assert("distance is correct", true, samesame.curry(Math.sqrt(3 * 3 + 3 * 3)), [dist2])
    var dist3 = cc.distance(pp)
    assert("distance is correct", true, samesame.curry(Math.sqrt(20 * 20 + 10 * 10)), [dist3])
}

testPolar()


function testGraph () {
    var graph = new Graph()
    var n10 = new Node(10)
    graph.insert(n10)
    assert("graph insert works", 1, delay(graph.nodes.length))

}

testGraph()

console.log("In", count, "assertions I failed to find any defects")
