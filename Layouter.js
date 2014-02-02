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

    layoutGraph: function (graph) {
        var subs = graph.getSubgraphs()
        for (var i = 0; i < subs.length; i++) {
            var roots = graph.getRoots(subs[i])
            for (var r = 0; r < roots.length; r++) {
                var root = roots[r]
                var x = this.width / (2 * subs.length) + (this.width * i / subs.length)
                var y = this.height / (2 * roots.length) + (this.height * r / roots.length)
                console.log("putting root " + root + " at ", x, ", ", y)
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

function HierarchicLayouter (width, height) {
    this.width = width
    this.height = height
}
HierarchicLayouter.prototype = {
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

    layoutGraph: function (graph) {
        var subs = graph.getSubgraphs()
        //filter out subgraphs only consisting of data flow nodes
        var rsub = subs.filter(function (x) { return ! x.every(function (x) { return x.fillStyle == "lightblue" }) })
        this.subgraphs = rsub
        for (var i = 0; i < rsub.length; i++) {
            var cfg = rsub[i].filter(function (x) { return x.fillStyle == "orange" })
            var root = cfg[0]
            if (! cfg.slice(1).every(function (x) { return graph.connected(root, x) } ))
                console.log("disconnected cfg!!!!")
            var x = this.width / (2 * rsub.length) + (this.width * i / rsub.length)
            var y = 60
            console.log("putting root " + root + " at ", x, ", ", y)
            root.position = toPolar(x, y)
            var cb = function (graph, layouter, x) { layouter.layoutNode(graph, x) }
            graph.breadthfirst(cb.curry(graph, this), [root], 'down')
        }

        var cbe = function (graph, layouter, x) { layouter.layoutEdge(graph, x) }
        graph.edges.forEach(cbe.curry(graph, this))
    },

    layoutNode: function (graph, node) {
        if (node.position) {
            //we go level by level
            //and better have a position!
            var childs = graph.children(node)
            var rchild = childs.filter(function (c) { return c.fillStyle == "orange" })
            var fst = Math.PI / (rchild.length + 1)
            for (var i = 0 ; i < rchild.length ; i++) {
                if (rchild[i].position == null) {
                    //vary between 0 and pi
                    var vec = new PolarPoint(fst + i * (Math.PI / (rchild.length + 1)), 50)
                    rchild[i].position = node.position.follow(vec)
                }
            }

            var dnodesup = graph.parents(node).filter(function (c) { return c.fillStyle == "lightblue" && c.position == undefined })
            var fstp = Math.PI + Math.PI / (2 * (dnodesup.length + 1))
            for (var i = 0; i < dnodesup.length ; i++) {
                var vec = new PolarPoint(fstp + i * (Math.PI / (2 * (dnodesup.length + 1))), 30)
                dnodesup[i].position = node.position.follow(vec)
                dnodesup[i].adjustposition(graph)
            }

            var dnodesdown = graph.children(node).filter(function (c) { return c.fillStyle == "lightblue" && c.position == undefined })
            for (var i = 0; i < dnodesdown.length ; i++) {
                var vec = new PolarPoint((i / dnodesdown.length) * (Math.PI / 8), 30)
                dnodesdown[i].position = node.position.follow(vec)
                dnodesdown[i].adjustposition(graph)
            }
            //adjust node data such as radius and size
            node.adjustposition(graph)
        }
    },

    layoutEdge: function (graph, edge) {
        if (edge.source.position && edge.destination.position)
            edge.adjustposition(graph)
    }
}
