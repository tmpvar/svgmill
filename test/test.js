var assert = require('assert');
var _offset = require('../offset');
var Vec2 = require('vec2');
var Canvas = require('canvas');
var canvas = new Canvas(800, 600);
var ctx = canvas.getContext('2d');
var fs = require('fs');
var segseg = require('segseg');

var drawPoint = function(point, color) {
  ctx.fillStyle = color;
  ctx.fillRect(point.x-2, point.y-2, 4, 4);
};

assert.near = function(a, b) {
  if (Math.abs(a-b) > 0.00000000001) {
    throw new Error();
  }
};

var drawPath = function(path, c, stroke) {
  c = c || 'green';
  ctx.strokeStyle = stroke || c;
  ctx.fillStyle = c;

  ctx.moveTo(path[0].x, path[0].y);
  ctx.beginPath();

  path.forEach(function(point) {
    ctx.lineTo(point.x, point.y);
  });

  ctx.closePath();
  ctx.fill();
  ctx.stroke();


  path.forEach(function(point) {
    drawPoint(point, 'white');
  });
};


var savePng = function(outfile, fn) {
  var stream = canvas.createJPEGStream({
    bufsize: 4096,
    quality: 100
  });

  stream.pipe(fs.createWriteStream(__dirname + '/out/' + outfile + '.jpg'))
  stream.on('end', fn);
};

var offset = function(orig, delta, auto) {

  if (delta < 0) {
    drawPath(orig, '#666', '#aaa');
  }

  var path = _offset(orig, delta)
  assert.ok(path.length);
  drawPath(path, '#2A7B24', '#0f0');

  if (delta > 0) {
    drawPath(orig, '#666', '#aaa');
  }

  path.forEach(function(point, idx) {
    var prevIdx = (idx>0) ? idx-1 : path.length-1;
    var prevPoint = path[prevIdx];
    var pathDiff = point.subtract(path[prevIdx], true).skew().normalize();

    // TODO: why do I have to multiply twice here to get an intersection?
    pathDiff.multiply(delta);
    pathDiff.multiply(delta/5);

    var isect, isect2, d1, d2, center, iv, iv2;

    if (delta < 0) {
      center = point.add(prevPoint, true).divide(2);
      drawPath([center, center.add(pathDiff, true)], 'orange')
      isect = segseg(center, center.add(pathDiff, true), orig[prevIdx], orig[idx]);
    } else {
      center = orig[idx].add(orig[prevIdx], true).divide(2);
      drawPath([center, center.add(pathDiff, true)], 'orange');
      isect = segseg(center, center.add(pathDiff, true), prevPoint, point);

    }

    if (isect) {
      iv = Vec2.fromArray(isect);

      var distance = center.subtract(iv, true).length();
      console.log(Math.abs(distance-Math.abs(delta)) > 0.0000001, distance, iv.toArray(), center.toArray());
      if (Math.abs(distance-Math.abs(delta)) > 0.0000001) {
        drawPoint(iv, 'red');
        throw new Error();
      } else {
        drawPoint(iv, '#ff0');
      }
    } else {
      drawPoint(center, 'red');
    }


/*
    if (delta < 0) {
      var center = orig[idx].add(orig[prevIdx], true).divide(2);
      compare = point;
      comparePrev = prevPoint;
      isect = segseg(point, point.add(pathDiff, true), orig[prevIdx], orig[idx]);
      isect2 = segseg(prevPoint, prevPoint.add(pathDiff, true), orig[prevIdx], orig[idx]);
    } else {
      var center = orig[idx].add(orig[prevIdx], true).divide(2);
      compare = orig[idx];
      comparePrev = orig[prevIdx];
      isect = segseg(point, prevPoint, orig[idx], orig[idx].add(pathDiff, true));
      isect2 = segseg(point, prevPoint, orig[prevIdx].add(pathDiff, true), orig[prevIdx]);
    }

    //if (!isect) {
      if (delta < 0) {
        drawPath([center, center.subtract(pathDiff, true)], 'orange')
      } else {
        drawPath([center, center.add(pathDiff, true)], 'orange')
      }
    //}
return;
    if (!isect2) {
      drawPath([orig[prevIdx].add(pathDiff), orig[prevIdx]], 'yellow');
    }

    assert.ok(isect);
    assert.ok(isect2);
    var vi = Vec2.fromArray(isect);


    var vi2 = Vec2.fromArray(isect2);
    try {
      assert.ok(Math.abs(vi.distance(compare) - Math.abs(delta)) < 0.00000000001);
    } catch (e) {
      drawPath([vi, compare], 'red');
      ctx.fillStyle = "red";
      ctx.font = "20px sans-serif"
      ctx.fillText(Number(vi.distance(compare)).toFixed(4), vi.x + 10, vi.y + 10);

      throw e;
    }


    try {
      assert.ok(Math.abs(vi2.distance(comparePrev) - Math.abs(delta)) < 0.00000000001);
    } catch (e) {
      drawPath([vi2, comparePrev], 'red');
      ctx.fillStyle = "red";
      ctx.font = "20px sans-serif"
      ctx.fillText(Number(vi2.distance(comparePrev)).toFixed(4), vi2.x + 10, vi2.y + 10);

      throw e;
    }
    */
  });



  return path;
};

var t = function(title, fn) {
  var fileTitle = title.replace(/ /g, '-');
  it(title, function(done) {
    ctx.fillStyle = "black";
    ctx.fillRect(0,0, 800, 600);

    ctx.save()
    ctx.translate(50, 50);
    try {
      fn();

      savePng(fileTitle, done);
    } catch (e) {
      savePng(fileTitle, function() {
        throw e;
      });
    } finally {
      ctx.restore();
    }
  });

};


describe('#offset', function() {
  t('offset square', function(fn) {

    var path = offset([
      Vec2(20, 20),
      Vec2(20, 400),
      Vec2(400, 400),
      Vec2(400, 20)
    ], 30);

    assert.near(path[0].x, -10);
    assert.near(path[0].y, -10);

    assert.near(path[1].x, -10);
    assert.near(path[1].y, 430);

    assert.near(path[2].x, 430);
    assert.near(path[2].y, 430);

    assert.near(path[3].x, 430);
    assert.near(path[3].y, -10);

  });

  t('offset square negative', function() {
    var path = offset([
      Vec2(20, 20),
      Vec2(20, 400),
      Vec2(400, 400),
      Vec2(400, 20)
    ], -30);


    assert.near(path[0].x, 50);
    assert.near(path[0].y, 50);

    assert.near(path[1].x, 50);
    assert.near(path[1].y, 370);

    assert.near(path[2].x, 370);
    assert.near(path[2].y, 370);

    assert.near(path[3].x, 370);
    assert.near(path[3].y, 50);
  });


  t('offset right triangle', function() {
    var path = offset([
      Vec2(40, 40),
      Vec2(40, 400),
      Vec2(400, 400),
    ], 30);

  });

  t('offset right triangle negative', function() {
    var path = offset([
      Vec2(40, 40),
      Vec2(40, 400),
      Vec2(400, 400),
    ], -30);

    assert.near(path[0].x, 70);
    assert.near(path[1].y, 370);
    assert.near(path[1].x, 70);
    assert.near(path[2].y, 370);
  });

  t('offset obtuse triangle negative', function() {
    var path = offset([
      Vec2(200, 170),
      Vec2(500, 40),
      Vec2(50, 40)
    ], -30);
  });

  t('offset obtuse triangle', function() {
    var path = offset([
      Vec2(200, 170),
      Vec2(500, 40),
      Vec2(50, 40)
    ], 30);
  });

  t('offset acute triangle', function() {
    var path = offset([
      Vec2(50, 50),
      Vec2(50, 200),
      Vec2(500, 125)
    ], 30);
  });

  t('offset acute triangle negative', function() {
    var path = offset([
      Vec2(50, 50),
      Vec2(50, 200),
      Vec2(500, 125)
    ], -30);
  });

  t('offset random', function() {
    var path = offset([
      Vec2(300, 300),
      Vec2(320, 350),
      Vec2(300, 400),
      Vec2(400, 400),
      Vec2(450, 450),
      Vec2(400, 200),
      Vec2(400, 100)
    ], 30);
  });

  t('offset random negative', function() {
    var path = offset([
      Vec2(300, 300),
      Vec2(320, 350),
      Vec2(300, 400),
      Vec2(400, 400),
      Vec2(450, 450),
      Vec2(400, 200),
      Vec2(400, 100)
    ], -30);
  });

  t('offset j', function() {
    var path = offset([
      Vec2(49.695,157.942125),
      Vec2(64.15875,149.188875),
      Vec2(64.15875,149.188875),
      Vec2(65.20075415039062,151.00175170898436),
      Vec2(66.81693008422852,153.499410736084),
      Vec2(67.99480490112305,154.95822830200194),
      Vec2(69.3050012512207,156.20520089721683),
      Vec2(70.79207528686523,157.2002020568848),
      Vec2(72.50058316040038,157.9031053161621),
      Vec2(74.47508102416991,158.2737842102051),
      Vec2(75.576,158.322),
      Vec2(75.576,158.322),
      Vec2(76.64462869262694,158.29419369506834),
      Vec2(78.62132528686523,158.0527842590332),
      Vec2(80.36906900024412,157.52151461791993),
      Vec2(81.87001364135742,156.64982744750978),
      Vec2(83.10631301879882,155.38716542358395),
      Vec2(84.0601209411621,153.68297122192385),
      Vec2(84.71359121704103,151.48668751831056),
      Vec2(85.0488776550293,148.7477569885254),
      Vec2(85.09162499999998,147.159),
      Vec2(85.09162499999998,86.769),
      Vec2(102.85274999999999,86.769),
      Vec2(102.85274999999999,147.41025),
      Vec2(102.85274999999999,147.41025),
      Vec2(102.82133684921263,149.10556217193604),
      Vec2(102.57323628616334,152.3212155075073),
      Vec2(102.08522480392455,155.30558740997313),
      Vec2(101.36584811782836,158.06109377288817),
      Vec2(100.42365194320678,160.59015048980717),
      Vec2(99.26718199539182,162.8951734542847),
      Vec2(97.90498398971557,164.97857855987547),
      Vec2(96.34560364150998,166.8427817001343),
      Vec2(94.59758666610718,168.49019876861576),
      Vec2(92.66947877883909,169.92324565887455),
      Vec2(90.56982569503784,171.14433826446538),
      Vec2(88.3071731300354,172.1558924789429),
      Vec2(85.8900667991638,172.96032419586183),
      Vec2(83.3270524177551,173.56004930877683),
      Vec2(80.62667570114135,173.9574837112427),
      Vec2(77.79748236465453,174.15504329681397),
      Vec2(76.33725,174.179625),
      Vec2(76.33725,174.179625),
      Vec2(75.02262072372436,174.1582446556091),
      Vec2(72.49675368118285,173.99040819168087),
      Vec2(70.10642249679564,173.6629291191101),
      Vec2(67.84884378433226,173.18435754776002),
      Vec2(64.70529794311523,172.2019051208496),
      Vec2(60.95255886840819,170.4429458312988),
      Vec2(57.68072872924804,168.23351852416994),
      Vec2(54.86754043579101,165.64202407836913),
      Vec2(52.49072689819336,162.73686337280276),
      Vec2(50.52802102661132,159.58643728637693),
      Vec2(49.69499999999999,157.94062499999998)
    ].reverse(), 30);
  });

});