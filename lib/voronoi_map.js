
voronoiMap = function(map) {
  var pointTypes = d3.map(),
      points = [],
      lastSelectedPoint;

  var voronoi = d3.geom.voronoi()
      .x(function(d) { return d.x; })
      .y(function(d) { return d.y; });

  var selectPoint = function() {
    d3.selectAll('.selected').classed('selected', false);

    var cell = d3.select(this),
        point = cell.datum();

    lastSelectedPoint = point;
    cell.classed('selected', true);

    d3.select('#selected h1')
      .html('')
      .append('a')
        .text(point.bikes +" / " + (point.bikes+point.free) + " bikes available")
        .attr('target', '_blank')   
  }

  var drawWithLoading = function(e){
    d3.select('#loading').classed('visible', true);
    if (e && e.type == 'viewreset') {
      d3.select('#overlay').remove();
    }
    setTimeout(function(){
      draw();
      d3.select('#loading').classed('visible', false);
    }, 0);
  }

  var draw = function() {
    d3.select('#overlay').remove();

    var bounds = map.getBounds(),
        topLeft = map.latLngToLayerPoint(bounds.getNorthWest()),
        bottomRight = map.latLngToLayerPoint(bounds.getSouthEast()),
        existing = d3.set(),
        drawLimit = bounds.pad(0.4);

      //only draw points within the bounds
    filteredPoints = points.filter(function(d) {
      var latlng = new L.LatLng(d.lat/1000000, d.lng/1000000);
      if (!drawLimit.contains(latlng)) { return false };
      var point = map.latLngToLayerPoint(latlng);
      key = point.toString();
      //filter to remove same points
      if (existing.has(key)) { return false };
      existing.add(key);  
      d.x = point.x;
      d.y = point.y;
      return true;
    });

    voronoi(filteredPoints).forEach(function(d) { d.point.cell = d; });

    var svg = d3.select(map.getPanes().overlayPane).append("svg")
      .attr('id', 'overlay')
      .attr("class", "leaflet-zoom-hide")
      .style("width", map.getSize().x + 'px')
      .style("height", map.getSize().y + 'px')
      .style("margin-left", topLeft.x + "px")
      .style("margin-top", topLeft.y + "px");

    var g = svg.append("g")
      .attr("transform", "translate(" + (-topLeft.x) + "," + (-topLeft.y) + ")");

    var svgPoints = g.attr("class", "points")
      .selectAll("g")
        .data(filteredPoints)
      .enter().append("g")
        .attr("class", "point");
 
    var buildPathFromPoint = function(point) {
      return "M" + point.cell.join("L") + "Z";
    }

    svgPoints.append("path")
      .attr("class", "point-cell")
      .style('fill', '#48486B')
      .style('opacity', function(d) {return d.bikes / (d.bikes+d.free);})   
      .attr("d", buildPathFromPoint) 
      .on('click', selectPoint)
      .classed("selected", function(d) { return lastSelectedPoint == d} );

    svgPoints.append("circle")
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
      .style('fill',  'none' )
      .style('stroke', '#FFA347')
      .style('stroke-opacity', '.8')
      .style('stroke-width', '2')
      .attr("r",3)
  }

  var mapLayer = {
    onAdd: function(map) {
      map.on('viewreset moveend', drawWithLoading);
      drawWithLoading();
    }
  };



  map.on('ready', function() {
    $.getJSON("http://api.citybik.es/citi-bike-nyc.json", function(stations) {
      points = stations.slice(); 
      points.forEach(function(point) {
        pointTypes.set(point.id, {type: point.id, color: "FF3488"});
       

      })
      drawWithLoading();
       d3.select('#loading').classed('visible', false);
      map.addLayer(mapLayer);
    }); 
  });
}