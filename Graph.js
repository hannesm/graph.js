function Graph (canvas, width, height) {
    this.modified = false
    this.nodes = []
    this.edges = []
    var w = 0
    var h = 0
    if (canvas) {
        this.canvas = canvas
        this.context = canvas.getContext('2d')
        w = canvas.width
        h = canvas.height
    }
    this.layouter = new CircularLayouter(width || w, height || h)
    this.mutable = true
}
Graph.prototype = {
    constructor: Graph,
    __proto__: GraphCanvas.prototype,

    check: function () {
        var cb = function(graph, edge) {
            var s = graph.findNodeByID(edge.source.identifier)
            if (! s)
                throw "can't find source of edge in graph"
            var d = graph.findNodeByID(edge.destination.identifier)
            if (! d)
                throw "can't find destination of edge in graph"
        }
        this.edges.forEach(cb.curry(this))
    },

    copy: function () {
        if (this.modified) {
            var g = new Graph(this.canvas)
            this.nodes.forEach(function(x) {
                g.insert(x)
            })
            this.edges.forEach(function(x) {
                var s = g.findNodeByID(x.source.identifier)
                if (! s)
                    throw "trying to connect unknown node"
                var d = g.findNodeByID(x.destination.identifier)
                if (! d)
                    throw "trying to connect unknown node"
                var edge = g.connect(s, d)
                edge.strokeStyle = x.strokeStyle
            })
            g.layouter = this.layouter
            g.subgraphs = []
            g.modified = false
            return g
        } else
            return this
    },

    clear: function () {
        if (this.mutable) {
            this.nodes = []
            this.edges = []
            this.selectedNode = null
        } else
            throw "cannot clear immutable graph"
    },

    layout: function (w, h) {
        if (this.nodes.length > 0) {
            this.layouter.resetLayout(this)
            this.layouter.layoutGraph(this)
        }
    },

    outEdges: function (node) {
        return this.edges.filter(eq.curry(node).compose(getProp.curry("source")))
    },

    children: function (node) {
        var out = this.outEdges(node)
        return out.map(getProp.curry("destination"))
    },

    inEdges: function (node) {
        return this.edges.filter(eq.curry(node).compose(getProp.curry("destination")))
    },

    parents: function (node) {
        return this.inEdges(node).map(getProp.curry("source"))
    },

    neighbours: function (node) {
        var childs = this.children(node)
        var adults = this.parents(node)
        for (var i = 0 ; i < childs.length ; i++)
            if (adults.indexOf(childs[i]) == -1)
                adults.push(childs[i])
        return adults
    },

    connected: function (node1, node2, direction) {
        //check whether there is any path from node1 to node2
        var isit = false
        var cb = function (node) { isit = (isit || node == node2) }
        this.breadthfirst(cb, [node1], direction)
        return isit
    },

    connectedEdges: function (node) {
        //since I do not like^Waccept self-loops, this is ok
        return this.outEdges(node).concat(this.inEdges(node))
    },

    disconnect: function (node1, node2) {
        if (this.mutable) {
            if (node1)
                if (node2) {
                    var edge = this.outEdges(node1).filter(function (e) { return e.destination == node2 })
                    if (edge.length != 1)
                        return false
                    this.modified = true
                    this.subgraphs = []
                    this.edges = this.edges.filter(neq.curry(edge[0]))
                    return true
                }
        } else
            throw "cannot clear immutable graph"

    },

    connect: function (node1, node2) {
        if (this.mutable) {
            if (node1 && node2 && node1 != node2) {
                if (this.children(node1).filter(eq.curry(node2)).length == 0) {
                    this.modified = true
                    this.subgraphs = []
                    var edge = new Edge(node1, node2)
                    this.edges.push(edge)
                    return edge
                } else
                    throw "were already connected"
            } else
                throw "node1 or node2 undefined or the same"
        } else
            throw "cannot clear immutable graph"
    },

    remove: function (node) {
        if (this.mutable) {
            if (node) {
                //invalidate subgraphs
                this.modified = true
                this.subgraphs = []
                var edg = this.connectedEdges(node)
                for (var i = 0 ; i < edg.length ; i++)
                this.edges = this.edges.filter(neq.curry(edg[i]))
                this.nodes = this.nodes.filter(neq.curry(node))
            }
        } else
            throw "cannot clear immutable graph"
    },

    insert: function (node) {
        if (this.mutable) {
            if (node) {
                //invalidate subgraphs!
                this.modified = true
                this.subgraphs = []
                this.nodes.push(node)
                return node
            }
        } else
            throw "cannot clear immutable graph"
    },

    contains: function (node) {
        return (this.nodes.filter(eq.curry(node)).length > 0)
    },

    findNodeByID: function (id) {
        var nodes = this.nodes.filter(function (x) { return x.identifier == id })
        if (nodes.length > 1)
            throw "multiple nodes with that id exist, go away"
        if (nodes.length == 1)
            return nodes[0]
        else
            return null
    },

    insertNodeByID: function (id, val) {
        if (this.findNodeByID(id))
            throw "node with that id already exists, go away"
        var n = new EllipseNode(id)
        n.setValue(val, this)
        this.insert(n)
        return n
    },

    findNode: function (val) {
        var nodes = this.nodes.filter(function (x) { return x.value == val })
        if (nodes.length == 1)
            return nodes[0]
        else
            return null
    },

    findNodeOrInsert: function (val) {
        var node = this.findNode(val)
        if (node)
            return node
        var n = new EllipseNode(val)
        n.setValue(val)
        this.insert(n)
        return n
    },

    subgraphs: [],
    getSubgraphs: function () {
        if (this.nodes.length > 0 && this.subgraphs.length == 0) {
            var visited = []
            function doVisit (graph, r) {
                var subgraph = []
                var todo = [r]
                while (todo.length > 0) {
                    var node = todo.shift()
                    if (visited.filter(eq.curry(node)).length == 0) {
                        subgraph.push(node)
                        visited.push(node)
                        graph.neighbours(node).forEach(function (x) { todo.push(x) })
                    }
                }
                return subgraph
            }

            //find remaining, disconnected nodes
            for (var i = 0; i < this.nodes.length; i++)
                if (visited.filter(eq.curry(this.nodes[i])).length == 0) {
                    var sub = doVisit(this, this.nodes[i])
                    this.subgraphs.push(sub)
                }
        }
        return this.subgraphs
    },

    getRoots: function (nodelist) {
        var roots = []
        var cb = function (graph, x) {
            if (graph.inEdges(x).length == 0)
                roots.push(x)
        }
        nodelist.filter(cb.curry(this))
        if (roots.length == 0)
            roots.push(nodelist[0])
        return roots
    },

    visit: function (callback, direction) {
        var roots = []
        var cb = function (graph, subg) {
            graph.getRoots(subg).forEach(function (r) { roots.push(r) })
        }
        this.getSubgraphs().forEach(cb.curry(this))
        this.breadthfirst(callback, roots, direction)
    },

    breadthfirst: function (callback, start, direction) {
        //implements a breadth-first search
        var todo = start
        var visited = []
        while (todo.length > 0) {
            var node = todo.shift()
            if (visited.filter(eq.curry(node)).length == 0) {
                callback(node)
                visited.push(node)
                if (direction && direction == 'up')
                    this.parents(node).forEach(function (x) { todo.push(x) })
                if (direction && direction == 'down')
                    this.children(node).forEach(function (x) { todo.push(x) })
                if (direction == null)
                    this.neighbours(node).forEach(function (x) { todo.push(x) })
            }
        }
    },
}
