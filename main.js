var margin  = {top: 50, right: 50, bottom: 50, left: 50},
width   = 1400-margin.left-margin.right,
height  = 900-margin.top-margin.bottom;  

var color = d3.scale.category20();

var zoom = d3.behavior.zoom().scaleExtent([1, 8]).on("zoom", zoomed);

var focus_node = null, highlight_node = null;

var highlight_color = "red";
var highlight_trans = 0.1;

var svg = d3.select('body').append('svg')
.attr('width', width)
.attr('height', height)
.call(zoom)
.append("g");

function zoomed() {
svg.attr("transform",
  "translate(" + zoom.translate() + ")" +
  "scale(" + zoom.scale() + ")"
);
}

function interpolateZoom (translate, scale) {
var self = this;
return d3.transition().duration(350).tween("zoom", function () {
  var iTranslate = d3.interpolate(zoom.translate(), translate),
      iScale = d3.interpolate(zoom.scale(), scale);
  return function (t) {
      zoom
          .scale(iScale(t))
          .translate(iTranslate(t));
      zoomed();
  };
});
}

function zoomClick() {
var clicked = d3.event.target,
  direction = 1,
  factor = 0.2,
  target_zoom = 1,
  center = [width / 2, height / 2],
  extent = zoom.scaleExtent(),
  translate = zoom.translate(),
  translate0 = [],
  l = [],
  view = {x: translate[0], y: translate[1], k: zoom.scale()};

d3.event.preventDefault();
direction = (this.id === 'zoom_in') ? 1 : -1;
target_zoom = zoom.scale() * (1 + factor * direction);

if (target_zoom < extent[0] || target_zoom > extent[1]) { return false; }

translate0 = [(center[0] - view.x) / view.k, (center[1] - view.y) / view.k];
view.k = target_zoom;
l = [translate0[0] * view.k + view.x, translate0[1] * view.k + view.y];

view.x += center[0] - l[0];
view.y += center[1] - l[1];

interpolateZoom([view.x, view.y], view.k);
}

d3.json("https://raw.githubusercontent.com/SharathchandraBangaloreMunibairegowda/Datahub/master/data.json", function(data){
var nodes = data["nodes"];
var links = data["links"];

data.links.forEach(function (d) {
d.group = Math.floor(Math.random() * 6)
});

var linkedByIndex = {};
data.links.forEach(function(d) {
linkedByIndex[d.source + "," + d.target] = true;
});

function isConnected(a, b) {
  return linkedByIndex[a.index + "," + b.index] || linkedByIndex[b.index + "," + a.index] || a.index == b.index;
}  

var force = d3.layout.force()
.size([width, height])
.nodes(nodes)
.links(links);

force.linkDistance(width/5);

var tooltip = d3.select('body').append('div') .attr("class","tooltip");

var link = svg.selectAll('.link')
.data(links)
.enter().append('line')
.attr('class', 'link')
.attr('x1', function(d) { return nodes[d.source].x; })
.attr('y1', function(d) { return nodes[d.source].y; })
.attr('x2', function(d) { return nodes[d.target].x; })
.attr('y2', function(d) { return nodes[d.target].y; })
.style("stroke-width", function(d) { return Math.sqrt(d.value); })
.style("stroke", function(d) { return color(d.group); });

var node = svg.selectAll('.node')
.data(nodes)
.enter().append('circle')
.attr('class', 'node')
.attr('r', function(d) { return d.value; })
.attr('cx', function(d) { return d.x; })
.attr('cy', function(d) { return d.y; })
.style("fill", function(d) { return color(d.group); });

var animating = false;

var animationStep = 20;

force.on('tick', function() {

node.transition().ease('linear').duration(animationStep)
  .attr('cx', function(d) { return d.x; })
  .attr('cy', function(d) { return d.y; });

node.style('left', function (d) { return d.x + 'px'; })
   .style('top', function (d) { return d.y + 'px'; })
   .call(force.drag);

link.transition().ease('linear').duration(animationStep)
  .attr('x1', function(d) { return d.source.x; })
  .attr('y1', function(d) { return d.source.y; })
  .attr('x2', function(d) { return d.target.x; })
  .attr('y2', function(d) { return d.target.y; });

force.stop();


if (animating) {
  setTimeout(
      function() { force.start(); },
      animationStep
  );
}

});

d3.select('#advance').on('click', force.start);

d3.select('#slow').on('click', function() {

//d3.selectAll('button').attr('disabled','disabled');

animating = true;

force.start();

});  

d3.select('#zoom_in').on('click', zoomClick);
d3.select('#zoom_out').on('click', zoomClick);

var tocolor = "fill";
var towhite = "stroke";
var text_center = false;
var outline = false;
if (outline) {
  tocolor = "stroke"
  towhite = "fill"
}

var circle = node.append("path")
             .attr("d", d3.svg.symbol())
             .style(tocolor, function(d) {return color(d.group);})
             .style("stroke-width", function(d) { return Math.sqrt(d.value); })
               .style(towhite, "white");

d3.select('#searchButton').on('click', function(){
var selectedVal = document.getElementById("searchButton").value;
if (selectedVal == 'none') {}
  else {
var selected = node.filter(function (d, i) {
      return d.claimName != selectedVal;
  })
selected.style("opacity", "0");
var link = svg.selectAll(".link")
link.style("opacity", "0");
d3.selectAll(".node, .link").transition()
.duration(3000)
.style("opacity", '1');
}
});

node.on("mouseover", function(d) {
set_highlight(d)
node.on("mouseover",function(d){
tooltip.transition().style('opacity', .9).duration(200).style("left", (d3.event.pageX) + "px").style("top", (d3.event.pageY - 28) + "px")
tooltip.html(d["claimName"]);
});
node.on("mouseout",function(d){
tooltip.transition().style('opacity', 0);
});
node.on("click", function(d){

tooltip.transition().style('opacity', .9).duration(200).style("left", (d3.event.pageX) + "px").style("top", (d3.event.pageY - 28) + "px")
tooltip.html(d["info"]);
}); 
})
.on("mousedown", function(d) { d3.event.stopPropagation();
focus_node = d;
set_focus(d)
if (highlight_node === null) set_highlight(d)

}	).on("mouseout", function(d) {
  exit_highlight();

}	);

  d3.select(window).on("mouseup",  
  function() {
  if (focus_node!==null)
  {
      focus_node = null;
      if (highlight_trans<1)
      {

  circle.style("opacity", 1);
link.style("opacity", 1);
}
  }

if (highlight_node === null) exit_highlight();
  });

function exit_highlight()
{
  highlight_node = null;
if (focus_node===null)
{
  svg.style("cursor","move");
  if (highlight_color!="white")
{
  circle.style(towhite, "white");
  link.style("stroke", function(o) {return color(o.value)});
}
      
}
}

function set_focus(d)
{	
if (highlight_trans<1)  {
circle.style("opacity", function(o) {
          return isConnected(d, o) ? 1 : highlight_trans;
      });
  link.style("opacity", function(o) {
          return o.source.index == d.index || o.target.index == d.index ? 1 : highlight_trans;
      });		
}
}


function set_highlight(d)
{
svg.style("cursor","pointer");
if (focus_node!==null) d = focus_node;
highlight_node = d;

if (highlight_color!="white")
{
    circle.style(towhite, function(o) {
        return isConnected(d, o) ? highlight_color : "white";});
  link.style("stroke", function(o) {
        return o.source.index == d.index || o.target.index == d.index ? highlight_color : (color(o.value));

      });
}
}
})