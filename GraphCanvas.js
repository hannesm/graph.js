function GraphCanvas () {
}
GraphCanvas.prototype = {
    constructor: GraphCanvas,

    selectedNode: null,
    context: null,
    canvas: null,

    draw: function () {
        var ymax = []
        var fmax = function (ymax, x) {
            if (x.position) {
                var y = x.position.toComplex()[1]
                if (y > ymax)
                    ymax[0] = y
            }
        }
        this.visit(fmax.curry(ymax))
        console.log("ymax is " + ymax[0])
        this.canvas.height = ymax[0] + 100
        console.log("height is " + this.canvas.height)
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
        var cb = function (ctx, graph, x) { x.draw(ctx, graph) }
        this.visit(cb.curry(this.context, this))
    },

    findNodeAt: function (x, y) {
        var pos = toPolar(x, y)
        var hit = this.nodes.filter(function (x) { if (x.position) return x.intersects(pos) })
        if (hit.length > 1) {
            console.log("multiple hits: ", hit.length)
            hit.forEach(function (x) { console.log("  " + x.value) })
        }
        if (hit.length > 0)
            return hit[0]
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


}
