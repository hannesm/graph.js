function Graph (canvas, width, height) {
    this.modified = false
    this.nodes = []
    this.edges = []
    this.selectedNode = null
    this.context = null
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
    copy: function () {
        if (this.modified) {
            var g = new Graph(this.canvas)
            g.nodes = this.nodes.slice(0)
            g.edges = this.edges.slice(0)
            g.layouter = this.layouter
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

    draw: function () {
        this.context.clearRect(0, 0, 800, 300)
        var cb = function (ctx, graph, x) { x.draw(ctx, graph) }
        this.visit(cb.curry(this.context, this))
    },

    findNodeAt: function (x, y) {
        var pos = toPolar(x, y)
        var hit = this.nodes.filter(function (x) { return x.intersects(pos) })
        if (hit.length > 1) {
            console.log("multiple hits: ", hit.length)
            hit.forEach(function (x) { console.log("  " + x.value) })
        }
        if (hit.length > 0)
            return hit[0]
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
        this.breadthfirst(cb, node1, direction)
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
            if (node1)
                if (node2)
                    if (node1 != node2) {
                        if (this.children(node1).filter(eq.curry(node2)).length == 0) {
                            this.modified = true
                            this.subgraphs = []
                            var edge = new Edge(node1, node2)
                            this.edges.push(edge)
                            return edge
                        } else
                            console.log("were already connected")
                    }
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
        var n = new EllipseNode(val, id)
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
        this.insert(n)
        return n
    },

    setselected: function (node) {
        var old = this.selectedNode
        if (old && node && old == node) { }
        else {
            if (old) {
                old.isselected = false
                old.redraw(this.context, this)
                this.selectedNode = null
            }

            if (node) {
                this.selectedNode = node
                node.isselected = true
                node.redraw(this.context, this)
            }
        }
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
        function doVisit (graph) {
            while (todo.length > 0) {
                var node = todo.shift()
                if (visited.filter(eq.curry(node)).length == 0) {
                    callback(node)
                    visited.push(node)
                    if (direction && direction == 'up')
                        graph.parents(node).forEach(function (x) { todo.push(x) })
                    if (direction && direction == 'down')
                        graph.children(node).forEach(function (x) { todo.push(x) })
                    if (direction == null)
                        graph.neighbours(node).forEach(function (x) { todo.push(x) })
                }
            }
        }

        doVisit(this)
    },
}
