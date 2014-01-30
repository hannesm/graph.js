function Graph (canv) {
    this.nodes = []
    this.edges = []
    this.selectedNode = null
    this.allroots = []
    this.context = null
    if (canv) this.context = canv.getContext('2d')
    this.canvas = canv
}

Graph.prototype = {
    clear: function () {
        this.nodes = []
        this.edges = []
        this.selectNode = null
        this.allroots = []
    },

    layout: function () {
        //console.log("laying out " + this.nodes.length)
        this.nodes.forEach(function (x) { x.edge = null ; x.position = null })
        var subgraphs = this.findsubgraphs()
        for (var i = 0; i < subgraphs.length; i++) {
            var roots = this.getRoots(subgraphs[i])
            for (var r = 0; r < roots.length; r++) {
                var root = roots[r]
                var x = this.canvas.width / (2 * subgraphs.length) + (this.canvas.width * i / subgraphs.length)
                var y = this.canvas.height / (2 * roots.length) + (this.canvas.height * r / roots.length)
                console.log("putting root at ", x, ", ", y)
                root.position = toPolar(x, y)
                this.allroots.push(root)
            }
        }
        //console.log("set " + this.allroots.length + "positions")
        var cb = function (graph, x) { x.place(graph) }
        this.visit(cb.curry(this), 'down')
        this.edges.forEach(cb.curry(this))
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
        return this.outEdges(node).map(getProp.curry("destination"))
    },

    inEdges: function (node) {
        return this.edges.filter(eq.curry(node).compose(getProp.curry("destination")))
    },

    parents: function (node) {
        return this.inEdges(node).map(getProp.curry("source"))
    },

    neighbours: function (node) {
        return this.children(node).concat(this.parents(node))
    },

    disconnect: function (node1, node2) {
        var edge = this.outEdges(node1).filter(function (e) { return e.destination == node2 })
        console.log("e: " + this.edges.length + " disconnecting " + node1.identifier + " from " + node2.identifier + " edges: " + edge.length)
        if (edge.length != 1)
            throw "Better not happen!"
        this.edges = this.edges.filter(neq.curry(edge[0]))
        console.log("e now " + this.edges.length)
    },

    connect: function (node1, node2, type) {
        console.log("connecting " + node1.identifier + " with " + node2.identifier)
        if (this.children(node1).filter(eq.curry(node2)).length == 0) {
            var edge = new Edge(node1, node2, type)
            this.edges.push(edge)
            console.log("success")
            return edge
        }
        console.log("were already connected")
    },

    insert: function (node) {
        this.nodes.push(node)
        return node
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

    findsubgraphs: function () {
        //implements a breadth-first search
        var todo = []
        var visited = []
        var subgraph = []
        function doVisit (graph) {
            while (todo.length > 0) {
                var node = todo.shift()
                if (visited.filter(eq.curry(node)).length == 0) {
                    subgraph.push(node)
                    visited.push(node)
                    graph.neighbours(node).forEach(function (x) { todo.push(x) })
                }
            }
        }

        var subgraphs = []
        //find remaining, disconnected nodes
        for (var i = 0; i < this.nodes.length; i++)
            if (visited.filter(eq.curry(this.nodes[i])).length == 0) {
                //console.log("disconnected graph!")
                subgraph = []
                todo.push(this.nodes[i])
                doVisit(this)
                subgraphs.push(subgraph)
            }
        return subgraphs
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
        //implements a breadth-first search
        var todo = []
        this.allroots.forEach(function (r) { todo.push(r) })
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
