graph.js
========

A pure JavaScript graph data structure, together with placing and
drawing on a canvas.

The coordinate system used are polar coordinates. Geometric operations
are implemented.

At the moment, there are two kinds of Nodes, either ``CircleNode`` or
``EllipseNode``, which are drawn either as a circle or an ellipse.

Documentation
=============

A graph consists of an array of nodes and an array of edges. Currently
only directed graphs are supported.

A Graph constructor should receive a ``canvas``, or (mainly for
testing) a ``width`` and ``height`` argument.

``Graph (<canvas>, <width>, <height>)``

Utility function such as ``insert`` and ``connect`` are provided in
the Graph.prototype.

Layouting a graph (``layout``) consists of placing all the nodes,
placing all the edges, and then drawing the objects.

To visit all nodes, the independent subgraphs are computed
(``Graph.getSubgraphs()``) and cached.

Afterwards, all ``roots`` (where the number of in-edges is zero) are
placed on the available context (widht/height is taken from the
canvas). Afterwards all children are placed around the node (nodes
adjust their size in the ``afterplace`` method.

Each node has a value (string) to display, an identifier, a position
(initially null). Furthermore, some utility functions such as
``intersects`` with a given vector, ``overlapping`` (given a theta, it
computes the rho from its center point; used to draw edges to the node
border).

The node placement and their sizes is used to place the edges. Each
edge has arrows pointing from the source to the destination.

Afterwards the graph can be drawn (``draw``), which calls ``redraw``
on all nodes and edges.

Selection of the node at the current mouse pointer position (for
``onclick``) is available via the ``Graph.findNodeAt(x, y)`` function.

The ``setselected`` method sets the ``isselected`` property of the
selected node, and the ``selectedNode`` property of the
graph. Afterwards it calls ``redraw`` on both nodes, which implements
highlighting if selected.
