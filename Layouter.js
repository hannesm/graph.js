function Layouter () {
}
Layouter.prototype = {
    width: 0,
    height: 0,
    direction: null, //passed to visit in graph


    resetLayout: function (graph) {
        var cl = function (layouter, node) { node.edge = null ; node.initialposition = null }
        graph.nodes.forEach(cl.curry(this))

        var cl2 = function (layouter, edge) { edge.startposition = null; edge.endposition = null }
        graph.edges.forEach(cl2.curry(this))
    },

    //divides the space into regions for the graphs
    layoutGraph: function (graph) {
        var cb = function (graph, layouter, x) { layouter.layoutNode(graph, x) }
        graph.visit(cb.curry(graph, this), this.direction)

        var cbe = function (graph, layouter, x) { layouter.layoutEdge(graph, x) }
        graph.edges.forEach(cb.curry(graph, this))
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

    layoutNode: function (graph, node) {
        if (! node.initialposition) {
            var x = Math.random() * this.width
            var y = Math.random() * this.height
            node.initialposition = toPolar(x, y)
        }
    },

    layoutEdge: function (graph, edge) {
        edge.startpos = edge.source.initialposition
        edge.endpos = edge.destination.initialposition
    }

}

function CircularLayouter (width, height) {
    this.width = width
    this.height = height
    this.direction = 'down'
}
CircularLayouter.prototype = {
    constructor: CircularLayouter,
    __proto__: Layouter.prototype,

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
    },

    
}

