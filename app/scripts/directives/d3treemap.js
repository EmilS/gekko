'use strict';

angular.module('geckoApp')
  .directive('treemap', ['TreemapDataService', '$rootScope', function (TreemapDataService, $rootScope) {
      var margin = {top: 40, right: 10, bottom: 10, left: 10},
              width = 920 - margin.left - margin.right,
              height = 500 - margin.top - margin.bottom;

      return {
        restrict: 'E',
        transclude: true,
        scope: {
          date: '='
        },
        link: function (scope, element, attrs) {
          var color = d3.scale.category20c(),
                tip = d3.tip().attr('class', 'd3-tip').html(function(d) { return d.name; });
          
          var treemap = d3.layout.treemap()
                                 .size([width, height])
                                 .sticky(true)
                                 .value(function(d) { return d.weight; });
  
          var svg = d3.select(element[0]).append('div')
                      .style('position', 'relative')
                      .style('width', (width + margin.left + margin.right) + 'px')
                      .style('height', (height + margin.top + margin.bottom) + 'px')
                      .style('margin', '0 auto')
                      .append("svg:svg")
                      .attr("width", width)
                      .attr("height", height)
                      .append("svg:g")
                      .attr("transform", "translate(.5,.5)");
          
          TreemapDataService.onload(function (err, data) {
            if (err) console.error(err);
            var root, node;
            node = root = data;
            svg.call(tip);
            var nodes = treemap.nodes(root)
                               .filter(function(d) { return !d.children; });

            var cell = svg.datum(data).selectAll(".cell")
                          .data(nodes)
                          .enter().append("svg:g")
                          .attr("class", "cell")
                          .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
                          .on('mouseenter', function(d) {
                            tip.attr('class', 'd3-tip animate').show(d)
                          })
                          .on('mouseleave', function(d) {
                            tip.attr('class', 'd3-tip').show(d)
                            tip.hide();
                          })
                          /*.on("click", function(d) { return zoom(node == d.parent ? root : d.parent); })*/;

            cell.append("svg:rect")
                .call(position)
                .style("fill", function(d) { return color(d.parent.name); });

            cell.append("svg:text")
                .attr("x", function(d) { return d.dx / 2; })
                .attr("y", function(d) { return d.dy / 2; })
                .attr("dy", ".35em")
                .attr("class", "font-smoothing")
                .attr("text-anchor", "middle")
                .text(function(d) { return d.name; })
                .style("writing-mode", function (d) { d.w = this.getComputedTextLength(); return d.dx < d.w && d.dy > d.w ? 'tb':'';})
                .style("opacity", function(d) { return d.dx > d.w || (d.dy > d.w) ? 1 : 0; });
              
            
            scope.$watch(function () { 
                return scope.$parent.dateSelected;
              }, 
              function(newVal, oldVal) {
                if ( newVal !== oldVal ) {
                  var newDate = angular.isDate(newVal)? newVal.toISOString().substring(0, 10) 
                                                      : newVal;
                  TreemapDataService.setDate(newDate, function (err, data) {
                    if (err) return console.error(err);
                    treemap.nodes(newDate)
                               .filter(function(d) { return !d.children; });

                    var t = svg.selectAll("g.cell")
                        .transition()
                        .duration(1500)
                        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

                    t.select("rect")
                        .attr("width", function(d) { return d.dx - 1; })
                        .attr("height", function(d) { return  d.dy - 1; })

                    t.select("text")
                        .attr("x", function(d) { return d.dx / 2; })
                        .attr("y", function(d) { return d.dy / 2; })
                        .style("opacity", function(d) { return d.dx > d.w || (d.dy > d.w) ? 1 : 0; });
                  });
                }
              }
            );
          });  
  
          function position() {
            this.style('left', function(d) { return d.x + 'px'; })
                .style('top', function(d) { return d.y + 'px'; })
                .attr('width', function(d) { return Math.max(0, d.dx - 1) + 'px'; })
                .attr('height', function(d) { return Math.max(0, d.dy - 1) + 'px'; });
          }
        }
      };
    }]);