eval(require('fs').readFileSync("utils.js", "utf8"))
eval(require('fs').readFileSync("PolarPoint.js", "utf8"))
eval(require('fs').readFileSync("Edge.js", "utf8"))
eval(require('fs').readFileSync("Node.js", "utf8"))
eval(require('fs').readFileSync("Layouter.js", "utf8"))
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

function testCoordinates (name, should, are) {
    assert(name + " x", true, floateq.curry(should[0]), [are[0]])
    assert(name + " y", true, floateq.curry(should[1]), [are[1]])
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
    assert("copy has the same value", true, delay(copy.eq(fourfour)))
    assert("copy is different from oneone", false, delay(copy.eq(oneone)))
    fourfour.rho = 0
    assert("copy has no longer the same value", false, delay(copy.eq(fourfour)))
    testCoordinates("polarpoint copy worked", [4, 4], copy.toComplex())
    testCoordinates("polarpoint copy worked", [0, 0], fourfour.toComplex())
    var cc = pp.follow(toPolar(10, 10)).follow(toPolar(10, 0))
    testCoordinates("polarpoint multiple follow worked", [20, 10], cc.toComplex())
    var dist = oneone.distance(copy)
    assert("distance is correct", true, floateq.curry(Math.sqrt(3 * 3 + 3 * 3)), [dist])
    var dist2 = copy.distance(oneone)
    assert("distance is correct", true, floateq.curry(Math.sqrt(3 * 3 + 3 * 3)), [dist2])
    var dist3 = cc.distance(pp)
    assert("distance is correct", true, floateq.curry(Math.sqrt(20 * 20 + 10 * 10)), [dist3])
}

function testGraphBasic () {
    var graph = new Graph()
    var n10 = new Node(10)
    graph.insert(n10)
    assert("graph insert works", 1, delay(graph.nodes.length))
    assert("self-loop prohibited", null, graph.connect.curry(n10), [n10])
    var n20 = new Node(20)
    graph.insert(n20)
    assert("graph insert works", 2, delay(graph.nodes.length))
    assert("connection worked", true, delay(graph.connect(n10, n20) != null))
    assert("one edge in graph", 1, delay(graph.edges.length))
    assert("n10 has one neighbour", 1, delay(graph.neighbours(n10).length))
    assert("n10 has one child", 1, delay(graph.children(n10).length))
    assert("n10 has one outedge", 1, delay(graph.outEdges(n10).length))
    assert("n10 has no parent", 0, delay(graph.parents(n10).length))
    assert("n10 has no inedges", 0, delay(graph.inEdges(n10).length))
    assert("n10 neighbour is n20", n20, delay(graph.neighbours(n10)[0]))
    assert("n10 child is n20", n20, delay(graph.children(n10)[0]))
    assert("n10 outedge source is n10", n10, delay(graph.outEdges(n10)[0].source))
    assert("n10 outedge destination is n20", n20, delay(graph.outEdges(n10)[0].destination))
    assert("n20 has one neighbour", 1, delay(graph.neighbours(n20).length))
    assert("n20 has no child", 0, delay(graph.children(n20).length))
    assert("n20 has no outedge", 0, delay(graph.outEdges(n20).length))
    assert("n20 has one parent", 1, delay(graph.parents(n20).length))
    assert("n20 has one inedges", 1, delay(graph.inEdges(n20).length))
    assert("n20 neighbour is n10", n10, delay(graph.neighbours(n20)[0]))
    assert("n20 parent is n10", n10, delay(graph.parents(n20)[0]))
    assert("n20 inedge source is n10", n10, delay(graph.inEdges(n20)[0].source))
    assert("n20 inedge destination is n20", n20, delay(graph.inEdges(n20)[0].destination))
    assert("second connection failed", false, delay(graph.connect(n10, n20) != null))
    assert("one edge in graph", 1, delay(graph.edges.length))
    assert("n10 has one neighbour", 1, delay(graph.neighbours(n10).length))
    assert("n10 has one child", 1, delay(graph.children(n10).length))
    assert("n10 has one outedge", 1, delay(graph.outEdges(n10).length))
    assert("n10 has no parent", 0, delay(graph.parents(n10).length))
    assert("n10 has no inedges", 0, delay(graph.inEdges(n10).length))
    assert("n10 neighbour is n20", n20, delay(graph.neighbours(n10)[0]))
    assert("n10 child is n20", n20, delay(graph.children(n10)[0]))
    assert("n10 outedge source is n10", n10, delay(graph.outEdges(n10)[0].source))
    assert("n10 outedge destination is n20", n20, delay(graph.outEdges(n10)[0].destination))
    assert("n20 has one neighbour", 1, delay(graph.neighbours(n20).length))
    assert("n20 has no child", 0, delay(graph.children(n20).length))
    assert("n20 has no outedge", 0, delay(graph.outEdges(n20).length))
    assert("n20 has one parent", 1, delay(graph.parents(n20).length))
    assert("n20 has one inedges", 1, delay(graph.inEdges(n20).length))
    assert("n20 neighbour is n10", n10, delay(graph.neighbours(n20)[0]))
    assert("n20 parent is n10", n10, delay(graph.parents(n20)[0]))
    assert("n20 inedge source is n10", n10, delay(graph.inEdges(n20)[0].source))
    assert("n20 inedge destination is n20", n20, delay(graph.inEdges(n20)[0].destination))

    assert("disconnect works", true, delay(graph.disconnect(n10, n20)))
    assert("no edge in graph", 0, delay(graph.edges.length))
    assert("n10 has no neighbour", 0, delay(graph.neighbours(n10).length))
    assert("n10 has no child", 0, delay(graph.children(n10).length))
    assert("n10 has no outedge", 0, delay(graph.outEdges(n10).length))
    assert("n10 has no parent", 0, delay(graph.parents(n10).length))
    assert("n10 has no inedges", 0, delay(graph.inEdges(n10).length))
    assert("n20 has no neighbour", 0, delay(graph.neighbours(n20).length))
    assert("n20 has no child", 0, delay(graph.children(n20).length))
    assert("n20 has no outedge", 0, delay(graph.outEdges(n20).length))
    assert("n20 has no parent", 0, delay(graph.parents(n20).length))
    assert("n20 has no inedges", 0, delay(graph.inEdges(n20).length))

    assert("disconnect a second time fails", false, delay(graph.disconnect(n10, n20)))
    assert("disconnect another edge fails", false, delay(graph.disconnect(n20, n10)))


    graph.remove(n10)
    assert("remove removes the node", 1, delay(graph.nodes.length))
    assert("remove removes the correct node", n20, delay(graph.nodes[0]))

    graph.insert(n10)
    assert("graph insert works", 2, delay(graph.nodes.length))
    assert("connection worked", true, delay(graph.connect(n10, n20) != null))
    assert("one edge in graph", 1, delay(graph.edges.length))

    graph.remove(n10)
    assert("remove removes the node", 1, delay(graph.nodes.length))
    assert("remove removes the correct node", n20, delay(graph.nodes[0]))
    assert("remove removed the edge", 0, delay(graph.edges.length))
}

function testGraph (layouter) {
    var graph = new Graph(null, 100, 100)
    graph.layouter = layouter
    var n0 = graph.insertNodeByID(0, "0")
    var n1 = graph.insertNodeByID(1, "0")
    var n2 = graph.insertNodeByID(2, "0")
    var n3 = graph.insertNodeByID(3, "0")
    var n4 = graph.insertNodeByID(4, "0")
    var n5 = graph.insertNodeByID(5, "0")
    var n6 = graph.insertNodeByID(6, "0")
    var n7 = graph.insertNodeByID(7, "0")
    graph.connect(n0, n1)
    graph.connect(n0, n2)
    graph.connect(n0, n3)
    graph.connect(n0, n4)
    graph.connect(n0, n5)
    graph.connect(n0, n6)
    graph.connect(n0, n7)
    assert("graph has a single subgraph", 1, delay(graph.getSubgraphs().length))
    graph.disconnect(n0, n2)
    assert("graph has a two subgraph", 2, delay(graph.getSubgraphs().length))
    assert("n0 has 6 childs", 6, delay(graph.children(n0).length))

    graph.layout()
    var positions = graph.nodes.map(function (x) { return x.position })
    for (var i = 0 ; i < positions.length ; i++) {
        assert("position is set", true, delay(positions[i] != null))
        for (var j = i + 1 ; j < positions.length ; j++)
            assert("position is disjoint",
                   false,
                   delay(positions[i].eq(positions[j])))
    }

    graph.remove(n0)
    assert("all edges gone", 0, delay(graph.edges.length))
    assert("graph has 7 subgraphs", 7, delay(graph.getSubgraphs().length))
    graph.connect(n1, n2)
    graph.connect(n1, n3)
    assert("graph has 5 subgraphs", 5, delay(graph.getSubgraphs().length))
    graph.connect(n6, n5)
    graph.connect(n4, n5)
    graph.remove(n7)
    assert("graph has 2 subgraphs", 2, delay(graph.getSubgraphs().length))
    assert("graph has 4 edges", 4, delay(graph.edges.length))
    assert("first subgraph has 3 nodes", 3, delay(graph.getSubgraphs()[0].length))
    assert("second subgraph has 3 nodes", 3, delay(graph.getSubgraphs()[1].length))
    assert("first subgraph has n1 as root", n1, delay(graph.getRoots(graph.getSubgraphs()[0])[0]))
    assert("second subgraph has two roots", 2, delay(graph.getRoots(graph.getSubgraphs()[1]).length))
    graph.connect(n3, n1)
    assert("first subgraph still has n1 as root", n1, delay(graph.getRoots(graph.getSubgraphs()[0])[0]))
    graph.connect(n2, n1)
    graph.connect(n3, n2)
    graph.connect(n2, n3)
    assert("first subgraph still has n1 as root", n1, delay(graph.getRoots(graph.getSubgraphs()[0])[0]))
    assert("the first subgraph is fully connected, outedges", true,
           delay((graph.outEdges(n1).length == 2)
                && (graph.outEdges(n2).length == 2)
                 && (graph.outEdges(n3).length == 2)))
    assert("the first subgraph is fully connected, inedges", true,
           delay((graph.inEdges(n1).length == 2)
                && (graph.inEdges(n2).length == 2)
                 && (graph.inEdges(n3).length == 2)))
    assert("the first subgraph is fully connected, connectededges", true,
           delay((graph.connectedEdges(n1).length == 4)
                && (graph.connectedEdges(n2).length == 4)
                 && (graph.connectedEdges(n3).length == 4)))
    assert("the first subgraph is fully connected, neighbours", true,
           delay((graph.neighbours(n1).length == 2)
                && (graph.neighbours(n2).length == 2)
                 && (graph.neighbours(n3).length == 2)))
    assert("the first subgraph is fully connected, children", true,
           delay((graph.children(n1).length == 2)
                && (graph.children(n2).length == 2)
                 && (graph.children(n3).length == 2)))
    assert("the first subgraph is fully connected, parents", true,
           delay((graph.parents(n1).length == 2)
                && (graph.parents(n2).length == 2)
                 && (graph.parents(n3).length == 2)))
}


testUtils()
testPolar()
testGraphBasic()
testGraph(new RandomLayouter(100, 100))
testGraph(new CircularLayouter(100, 100))
testGraph(new HierarchicLayouter(100, 1000))

console.log("In", count, "assertions I failed to find any defects")
