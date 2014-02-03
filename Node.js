function Node () {
}
Node.prototype = {
    constructor: Node,
    fillStyle: "orange",
    textStyle: "black",
    value: "nothing",
    identifier: 0,
    position: null,
    position: null,

    redraw: function (context, graph) {
        console.log("this better not happen")
    },

    //returns boolean whether polar is contained in node
    intersects: function (polar) {
        console.log("also better not happen here")
    },

    //returns rho
    overlapping: function (theta) {
        console.log("better not happen")
    },

    setValue: function (val, graph) {
    },

    draw: function (ctx, graph) {
        if (this.position) {
            //we better have a position
            this.redraw(ctx, graph)
            graph.outEdges(this).forEach(function (x) { x.draw(ctx, graph) })
        }
    },
}

function EllipseNode (id) {
    this.identifier = id
}
EllipseNode.prototype = {
    constructor: EllipseNode,
    __proto__ : Node.prototype,
    a: 0,
    b: 9,
    focalpoints: null,
    focaldistance: null,

    redraw: function (ctx, graph) {
        var pos = this.position.toComplex()
        var widthh = this.a
        var heighth = this.b
        ctx.beginPath()
        var kappa = .5522848
        var xm = pos[0]                // x center
        var ym = pos[1]                // y center
        var xs = xm - widthh           // x start
        var ys = ym - heighth          // y start
        var ox = widthh * kappa        // control point offset horizontal
        var oy = heighth * kappa       // control point offset vertical
        var xe = xm + widthh           // x end
        var ye = ym + heighth          // y end

        ctx.moveTo(xs, ym)
        ctx.bezierCurveTo(xs, ym - oy, xm - ox, ys, xm, ys)
        ctx.bezierCurveTo(xm + ox, ys, xe, ym - oy, xe, ym)
        ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye)
        ctx.bezierCurveTo(xm - ox, ye, xs, ym + oy, xs, ym)
        ctx.fillStyle = this.fillStyle
        ctx.fill()
        ctx.closePath()
        ctx.fillStyle = this.textStyle
        ctx.fillText(this.value, xs + (widthh / 10), ym + (heighth / 3))

        if (this.isselected) {
            var old = ctx.strokeStyle
            ctx.strokeStyle = "red"

            ctx.moveTo(xs, ym)
            ctx.bezierCurveTo(xs, ym - oy, xm - ox, ys, xm, ys)
            ctx.bezierCurveTo(xm + ox, ys, xe, ym - oy, xe, ym)
            ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye)
            ctx.bezierCurveTo(xm - ox, ye, xs, ym + oy, xs, ym)
            ctx.moveTo(xs + 1, ym)
            ctx.bezierCurveTo(xs + 1, ym - oy, xm - ox, ys, xm + 1, ys)
            ctx.bezierCurveTo(xm + ox, ys, xe - 1, ym - oy, xe - 1, ym)
            ctx.bezierCurveTo(xe - 1, ym + oy, xm + ox, ye, xm, ye)
            ctx.bezierCurveTo(xm - ox, ye, xs + 1, ym + oy, xs + 1, ym)
            ctx.stroke()
            ctx.closePath()
            ctx.strokeStyle = old
        }


    },

    setValue: function (val, graph) {
        this.value = val
        var w = 15
        if (graph.context)
            w = graph.context.measureText(val).width
        else
            console.log("have no context, defaulting to width of 15")
        var height = this.b
        var width = (w + (w / 10)) / 2
        if (height > width) {
            console.log("ALL WRONG!!!!")
            width = height + 5
        }
        this.a = width
        this.focaldistance = Math.sqrt(width * width - height * height)
    },

    getFocalPoints: function () {
        if (this.focalpoints)
            return this.focalpoints
        else {
            var pos = this.position
            var dist = this.focaldistance
            if ((pos != undefined) & (dist != undefined)) {
                this.focalpoints = [pos.follow(new PolarPoint(0, dist)), pos.follow(new PolarPoint(Math.PI, dist))]
                return this.focalpoints
            } else
                throw 'called focalpoints while pos or distance were null'
        }
    },

    intersects: function (polar) {
        //distance between ''polar'' and focal points is < 2*(width/2)
        var fp = this.getFocalPoints()
        var d = fp[0].distance(polar) + fp[1].distance(polar)
        //if (d < this.width)
        //    console.log("d " + d + " < " + (this.a * 2) + " a * 2")
        return d < (this.a * 2)
    },

    overlapping: function (theta) {
        var ab = this.a * this.b
        var below = Math.sqrt(Math.pow(this.b * Math.cos(theta), 2) + Math.pow(this.a * Math.sin(theta), 2))
        var res = new PolarPoint(theta, ab / below).toComplex()
        //console.log("overlapping for this ellipsis results in ", res[0], ", " , res[1])
        return ab / below
    }
}

function CircleNode (id) {
    this.identifier = id
}
CircleNode.prototype = {
    constructor: CircleNode,
    __proto__: Node.prototype,
    radius: 15,

    redraw: function (ctx, graph) {
        var pos = this.position.toComplex()
        ctx.beginPath()
        ctx.arc(pos[0], pos[1], this.radius + 0.5, 0, Math.PI * 2, true)
        ctx.fillStyle = this.fillStyle
        ctx.closePath()
        ctx.fill()

        if (this.isselected) {
            var old = ctx.strokeStyle
            ctx.strokeStyle = "red"
            ctx.arc(pos[0], pos[1], this.radius - 0.5, 0, Math.PI * 2, true)
            ctx.arc(pos[0], pos[1], this.radius - 1.5, 0, Math.PI * 2, true)
            ctx.closePath()
            ctx.stroke()
            ctx.strokeStyle = old
        }

        ctx.fillStyle = this.textStyle
        var size = ctx.measureText(this.value)
        ctx.fillText(this.value, pos[0] - (size.width / 2), pos[1])
    },

    setValue: function (value, graph) {
        this.value = value
        var w = 15
        if (graph.context)
            w = graph.context.measureText(value).width
        this.radius = w / 3
    },


    intersects: function (polar) {
        var nums = this.position.toComplex()
        var nums2 = polar.toComplex()
        if (nums[0] - this.radius < nums2[0] && nums[0] + this.radius > nums2[0])
            if (nums[1] - this.radius < nums2[1] && nums[1] + this.radius > nums2[1])
                return true
    },

    overlapping: function () {
        return this.radius
    }
}

