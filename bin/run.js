#!/usr/bin/env node

var argv = require('optimist').argv;
var reader = require('../SVGReader');
var offset = require('../offset');
var Vec2 = require('vec2');

if (argv.i) {
  var svg = "";
  process.stdin.on('data', function(d) {
    svg += d;
  });

  process.stdin.on('end', function() {
    var paths = reader.parse(svg, {}).allcolors,
    gcode,
    path;


    var idx = paths.length;
    var scale = argv.scale || 1;
    while(idx--) {
      var subidx = paths[idx].length;
      var bounds = { x : Infinity , y : Infinity, x2 : -Infinity, y2: -Infinity, area : 0};

      // find lower and upper bounds
      while(subidx--) {

        paths[idx][subidx].multiply(new Vec2(argv.scale, argv.scale))
        if (paths[idx][subidx].x < bounds.x) {
          bounds.x = paths[idx][subidx].y;
        }

        if (paths[idx][subidx].y < bounds.y) {
          bounds.y = paths[idx][subidx].y;
        }

        if (paths[idx][subidx].x > bounds.x2) {
          bounds.x2 = paths[idx][subidx].x;
        }
        if (paths[idx][subidx].y > bounds.y2) {
          bounds.y2 = paths[idx][subidx].y;
        }
      }

      // calculate area
      bounds.area = (1 + bounds.x2 - bounds.x) * (1 + bounds.y2-bounds.y);
      paths[idx].bounds = bounds;
    }

    // cut the inside parts first
    paths.sort(function(a, b) {
      // sort by area
      return (a.bounds.area < b.bounds.area) ? -1 : 1;
    });

    // detect winding
    var ax = paths[0][1].x - paths[0][0].x,
        ay = paths[0][1].y - paths[0][0].y,
        bx = paths[0][2].x - paths[0][1].y,
        by = paths[0][2].x - paths[0][1].y,
        sign = (ax * by) - (ay * bx);

    var path = (sign < 0) ? paths[0] : paths[0].reverse();

    var offsetPath = offset(path, 6.35/2);
    var cleanOffsetPath = [offsetPath[0]];
    for (var i=1; i<offsetPath.length; i++) {
      var seg = offsetPath[i];
      var invalid = false;
      for (var j=0; j<path.length; j++) {
        if (path[j].equal(seg)) {
          invalid = true;
          break;
        }
      }

      if (invalid) {
        continue;
      }

      if (Math.abs(seg.x - cleanOffsetPath[cleanOffsetPath.length-1].x) > .000001 ||
          Math.abs(seg.y - cleanOffsetPath[cleanOffsetPath.length-1].y) > .000001)
      {
        cleanOffsetPath.push(seg);
      }
    }

    var gcode = ['G1 Z1', 'M4 S6000'];
    function move(coords) {
      var parts = [
        'G1',
      ];

      for (var coord in coords) {
        if (coords.hasOwnProperty(coord)) {
          parts.push(coord.toUpperCase() + coords[coord]);
        }
      }

      gcode.push(parts.join(' '));
    }

    var materialWidth = 5;
    var cutZ = argv.z || 1;

    for (var depth = 0; depth<=materialWidth; depth+=.1) {
      cleanOffsetPath.forEach(function(item, i) {
        item && move({
          x : item.x,
          y : item.y,
          f : 2000
        });
        if (i === 0) {
          move({ z: cutZ + depth, f: 200 });
        }
      });
    }

    gcode.push('G4 P2')
    gcode.push('M5');
    move({ z : 0, f: 200 });
    move({ x : 0, y: 0, f: 1000 });
    console.log(gcode.join('\n'));

  });

  process.stdin.resume();
}