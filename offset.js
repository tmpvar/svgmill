var edgeNormal = require('./edgeNormal');
var Vec2 = require('vec2');
var segseg = require('segseg');

module.exports = function(poly, delta) {
  var ret = [], lines = [];

  for (var polyIndex = 0; polyIndex < poly.length; polyIndex++) {
    var current = poly[polyIndex];
    var next = (polyIndex<poly.length-1) ? poly[polyIndex+1] : poly[0];
    var prev = (polyIndex>0) ? poly[polyIndex-1] : poly[poly.length-1];
    var normal = edgeNormal(current, next, delta);

    var length = next.subtract(current, true).length();
    var rotated = normal.normalize(true).skew().multiply(length*length);

    var negativeNormal = normal.negate(true).multiply(delta);

    lines.push([
       normal.add(current, true).subtract(rotated),
       normal.add(next, true).add(rotated)
    ]);
  }

  lines.forEach(function(line, idx) {
    var prev = (idx === 0) ? lines[lines.length-1] : lines[idx-1];

    var i = segseg(line[0], line[1], prev[0], prev[1]);
    i && i!==true && ret.push(Vec2.fromArray(i));
  });

  return ret;
};
