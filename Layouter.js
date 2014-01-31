function Layouter () {
}
Layouter.prototype = {
    width: 0,
    height: 0,

    resetLayout: function (graph) {
        var cl = function (layouter, node) { layouter.resetNode(node) }
        graph.nodes.forEach(cl.curry(this))

        var cl2 = function (layouter, edge) { layouter.resetEdge(edge) }
        graph.edges.forEach(cl2.curry(this))
    },

    resetNode: function (node) {
        throw "better be implemented"
    },

    resetEdge: function (edge) {
        throw "better be implemented"
    },

    //divides the space into regions for the graphs
    //should as a side effect set position of all nodes
    layoutGraph: function (graph) {
        throw "better be implemented"
    },

    //what strategy to apply for each node
    layoutNode: function (graph, node) {
        throw "better not happen"
    },

    layoutEdge: function (graph, edge) {
        throw "better not happen"
    },
}

function RandomLayouter (width, height) {
    this.width = width
    this.height = height
}
RandomLayouter.prototype = {
    constructor: RandomLayouter,
    __proto__: Layouter.prototype,

    resetEdge: function (edge) { },
    resetNode: function (node) { node.position = null },

    layoutGraph: function (graph) {
        var cb = function (graph, layouter, x) { layouter.layoutNode(graph, x) }
        graph.nodes.forEach(cb.curry(graph, this))

        var cbe = function (graph, layouter, x) { layouter.layoutEdge(graph, x) }
        graph.edges.forEach(cbe.curry(graph, this))
    },

    layoutNode: function (graph, node) {
        if (! node.position) {
            var x = Math.random() * this.width
            var y = Math.random() * this.height
            node.position = toPolar(x, y)
        }
    },

    layoutEdge: function (graph, edge) {
    }
}

function CircularLayouter (width, height) {
    this.width = width
    this.height = height
}
CircularLayouter.prototype = {
    constructor: CircularLayouter,
    __proto__: Layouter.prototype,

    resetEdge: function (edge) {
        edge.startposition = null
        edge.endposition = null
    },
    resetNode: function (node) {
        node.position = null
        node.edge = null
    },

    layoutgraph: function (graph) {
        var subs = graph.getSubgraphs()
        for (var i = 0; i < subs.length; i++) {
            var roots = this.getRoots(sus[i])
            for (var r = 0; r < roots.length; r++) {
                var root = roots[r]
                var x = this.width / (2 * subs.length) + (this.width * i / subs.length)
                var y = this.height / (2 * roots.length) + (this.height * r / roots.length)
                console.log("putting root at ", x, ", ", y)
                root.position = toPolar(x, y)
            }
        }
        var cb = function (graph, layouter, x) { layouter.layoutNode(graph, x) }
        graph.visit(cb.curry(graph, this), 'down')

        var cbe = function (graph, layouter, x) { layouter.layoutEdge(graph, x) }
        graph.edges.forEach(cbe.curry(graph, this))
    },

    layoutNode: function (graph, node) {
        var childs = graph.children(node)
        for (var i = 0; i < childs.length; i++) {
            //that's all not good here yet...
            if (childs[i].position == null) {
                var fact = childs.length
                if (fact % 2 == 0)
                    fact++

                var stat = 0
                var variance = Math.PI * 2
                if (node.edge) {
                    variance = Math.PI
                    stat = node.edge.theta - (Math.PI / 2)
                }

                var vec = new PolarPoint(stat + (i + 1) * (variance / fact), 90)
                //console.log("setting position of " + childs[i].value + " to ", vec.toComplex())
                childs[i].position = node.position.follow(vec)
            }
        }
        //adjust node data such as radius and size
        node.adjustposition(graph)
    },

    layoutEdge: function (graph, edge) {
        edge.adjustposition(graph)
    }
}

