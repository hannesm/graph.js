Function.prototype.compose  = function (argFunction) {
    var invokingFunction = this
    return function () {
        return  invokingFunction.call(this, argFunction.apply(this, arguments))
    }
}

Function.prototype.curry = function () {
  // wir merken uns f
  var f = this
  if (arguments.length < 1) {
    return f //nothing to curry with - return function
  }
  var a = toArray(arguments)
  return function () {
    var b = toArray(arguments)
    return f.apply(this, a.concat(b))
  }
}

function toArray (xs) {
  return Array.prototype.slice.call(xs)
}

function getProp (property, object) {
    return object[property]
}

function eq (a, b) {
    return a == b
}

function neq (a, b) {
    return a != b
}
