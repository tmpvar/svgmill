module.exports = function(current, prev, delta, center) {
  var centerPoint = (center) ? prev.add(current, true).divide(2) : current;
  return centerPoint.subtract(prev, true).skew().normalize().multiply(-delta);
};
