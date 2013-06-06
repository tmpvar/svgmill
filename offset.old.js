
var Vec2 = require('vec2');

var unitNormal = function(a, b) {
  if(a[0] === b[0] && a[1] === b[1]) {
    return [0, 0];
  }

  var
  dx = b[0] - a[0],
  dy = b[1] - a[1],
  f = 1 *1.0/ Math.sqrt( dx*dx + dy*dy );

  dx *= f;
  dy *= f;
  return [dy, -dx];
};

var edgeNormal = function(current, prev, delta, center) {
  var centerPoint = (center) ? prev.add(current, true).divide(2) : current;
  var t = new Vec2(-(centerPoint.y-prev.y), centerPoint.x-prev.x);
  t.normalize();
  t.multiply(-delta)
  return t;
};


var drawPoint = function(p, color) {
  //console.log(p.x, p.y)
};

var intersect = function(p1, p2, q1, q2) {
  var
  x, y, tp, tq, t, parallel, ret = {};

  // Test if the lines are parallel to each other
  parallel = (p2.x-p1.x)*(q2.y-q1.y) - (p2.y-p1.y)*(q2.x-q1.x);

  if (parallel === 0) {
    return null;
  }

  // Test if the two lines are even near each other
  tp = ((q1.x - p1.x)*(q2.y - q1.y) - (q1.y - p1.y)*(q2.x - q1.x))/parallel;
  tq = ((p2.y - p1.y)*(q1.x - p1.x) - (p2.x - p1.x)*(q1.y - p1.y))/parallel;

  if (tp < 0 || tp > 1 || tq < 0 || tq > 1) {
    return null;
  }

  // TODO: what is this really doing?
  ret.x = p1.x + tp*(p2.x - p1.x);
  ret.y = p1.y + tp*(p2.y - p1.y);

  ret.alpha_p = p1.distance(ret) / p1.distance(p2);
  ret.alpha_q = q1.distance(ret) / q1.distance(q2);

  return ret;
};

var drawPath = function(array, color) {
  ctx.strokeStyle = color || "green";
  ctx.beginPath();
  ctx.moveTo(array[0].x, array[0].y);
  array.unshift()
  array.forEach(function(point) {
    ctx.lineTo(point.x, point.y);
  });
  ctx.closePath();
  ctx.stroke();
}


module.exports = function(poly, delta, debug) {
  var current, prev, next, x, y, x2, y2, x3, y3, vec, normal, inormal, ret = [];
  for (var i = 0; i<poly.length ; i++) {
    x = poly[i].x;
    y = poly[i].y;
    current = new Vec2(x, y);
    var currentN = new Vec2(x,y);
    currentN.normalize();

    if (i<poly.length-1) {
      x2 = poly[i+1].x;
      y2 = poly[i+1].y;
    } else {
      x2 = poly[0].x;
      y2 = poly[0].y;
    }

    next = new Vec2(x2, y2);

    if (i>0) {
      x3 = poly[i-1].x;
      y3 = poly[i-1].y;
    } else {
      x3 = poly[poly.length-1].x;
      y3 = poly[poly.length-1].y;
    }

    prev = new Vec2(x3, y3);

    var point = edgeNormal(prev, current, delta);
    var point2 = edgeNormal(current, next, delta);

    var dot = function(a, b) {
      return (a.x * b.x) + (a.y * b.y);
    }

    var negated1 = new Vec2(point.y, -point.x);
    var negate = dot(negated1, point2);



    var cn = point.add(current, true)
    debug && drawPoint(cn, 'green');

    var pn = point.add(prev, true);
    debug && drawPoint(pn, 'brown');

    var c = new Vec2((cn.x+pn.x)/2, (cn.y+pn.y)/2);
    debug && drawPoint(c);

    ret.push(pn);
    ret.push(cn);

    var sum = point.add(point2, true);
    sum.normalize();
    // TODO: thise needs to be the inverse of incoming if <0
    var distanceFromCorner = point.distance(point2);

    var offset = (Math.abs(delta) >= Math.abs(distanceFromCorner)) ? delta : distanceFromCorner;

    if (offset < 0 || negate < 0) {
      sum.negate();
    }

    sum.multiply(offset);
    sum.add(current);
    drawPoint(sum, "green");

    ret.push(sum)
  };

  var getLine = function(array, index) {
    var r = [];

    r.push(array[index]);

    if (index >= array.length-1) {
      r.push(array[0]);
    } else {
      r.push(array[index+1]);
    }

    return r;
  }


  var loop = function(array, start, fn) {
    var current = start+1;
    while (current !== start) {

      fn(array[current], current);

      current++;
      if (current >= array.length-1) {
        current = 0;
      }
    }
  };

  var near = function(a, b) {
    return Math.abs(a.x - b.x) < 0.0001 || Math.abs(a.y - b.y) < 0.0001;
  };


  var unloop = function(array) {
    var unlooped = [];
    loop(ret, 0, function(first, firstIdx) {
      var l1 = getLine(ret, firstIdx);

      var wasCollision = false
      loop(ret, firstIdx, function(second, secondIdx) {
        if (wasCollision) {
          wasCollision = false;
          return;
        }
        var l2 = getLine(ret, secondIdx);

        var cross = intersect(l1[0], l1[1], l2[0], l2[1]);
        if (cross && !wasCollision) {
          //drawPoint(cross, 'orange');
          unlooped.push([cross.x, cross.y]);
          wasCollision = cross;
        } else if (wasCollision && wasCollision.x === cross.x && wasCollision.y === cross.y) {
          unlooped.push(ret[secondIdx]);
          wasCollision = false;
        } else {
          unlooped.push(ret[secondIdx]);
        }
      });
    });
    return unlooped;
  };
  //ret = unloop(ret);
/*
  // Remove the loops
  int RemoveLoops(CoordType Points[],int NoPoints)
  {
      int n = 0;  // Start of first line segment
      int m = 2;  // Offset to n of second line segment
      int p = NoPoints;
      while (n + m + 1 < p)
      {
          CoordType Ip; // Intersection point
          if (Intersect(Points[n],Points[n+1],Points[n+m],Points[n+m+1],Ip)))
          {
              Points[n+1] = Ip;
              int d = m - 1;  // Number of points to delete
              for (int i = n + m + 1; i < p; i++)
                  Points[i - d] = Points[i];
              p -= d;
              m = 2;
              continue;   // Restart from intersection point
          }
          m ++;
          if (n + m + 1 >= p) // Reached end of line, change starting segment
          {
              m = 2;  // Reset offset
              n++;    // Increment starting segment
          }
      }
      return(p);  // Return the number of points in the new poly line
  }
*/

  return ret;
};