//Requires d3
; (function (global) {
    'use strict';
 
    function oneGauge(gaugeSettings) {
 
        var settings = configGauge(gaugeSettings);
        //var currentValue;
 
        function configGauge(config) {
            var gauge = {};
 
            //Gauge Size Arc and Background
            gauge.containerId = config.containerId;
            gauge.background = config.background || false;
            gauge.size = config.size || 250;// gauge is box so default is 250 by 250 pixels... well think about smaller gauges that are semicirle            
            gauge.r = gauge.size / 2;
            gauge.startAngle = config.startAngle || Math.PI * - 0.75;//should be relative to 12 o'clock
            gauge.endAngle = config.endAngle || Math.PI * 0.75;//should be relative to 12 o'clock
 
            //ScaleOptions
            gauge.colors = config.colors || [{ color: 'red', start: gauge.rangeBegin }];
            gauge.majorTicks = config.majorTicks || [];//[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
            gauge.majorTickTextHide = config.majorTickTextHide || false;
            gauge.minorTickIncrement = config.minorTickIncrement || 0;
            gauge.rangeBegin = config.rangeBegin || 0;
            gauge.rangeEnd = config.rangeEnd || 100;
            gauge.scaleWidth = config.scaleWidth || 0.2 * gauge.r;
            //currentValue = gauge.rangeBegin;
 
            //IndicatorOptions
            gauge.indicatorFillColor = config.indicatorFillColor || false;
            gauge.indicatorFillWidth = config.indicatorFillWidth || gauge.scaleWidth;
            gauge.indicatorValueHide = config.indicatorValueHide || false;
            gauge.indicatorNumberFormat = config.indicatorNumberFormat || 'd';
            gauge.pointerType = config.pointerType || 'speedo';
 
            //Calculated values
            gauge.ratio = (gauge.endAngle - gauge.startAngle) / (gauge.rangeEnd - gauge.rangeBegin);
            gauge.maxValue = (Number(gauge.rangeEnd) + (0.05 * Math.PI / gauge.ratio));
            gauge.minValue = (Number(gauge.rangeBegin) - (0.05 * Math.PI / gauge.ratio));
 
            //various radii
            var widthPercentage = gauge.scaleWidth / gauge.r;
            gauge.r1 = gauge.r - 2;//outer radius with 1px padding; background ring outter
            gauge.r2 = gauge.r - (0.08 * gauge.r1);//background ring innner
            gauge.r3 = gauge.r - (0.10 * gauge.r1);//scale outer, minor tick outer, major tick outer
            gauge.r4 = gauge.r - (((widthPercentage * 0.25) + 0.10) * gauge.r1);//minor tick inner, needle point 1/4 of the scale width
            gauge.r5 = gauge.r - ((widthPercentage + 0.10) * gauge.r1);//scale inner, major tick inner
            gauge.r6 = gauge.r - ((widthPercentage + 0.22) * gauge.r1);//text radius
            gauge.r7 = gauge.r - (0.88 * gauge.r1);//needle blue circle
            gauge.r8 = gauge.r5 + gauge.indicatorFillWidth;//indicator fill outerRadius
 
            //set svg go container id
            gauge.svg = d3.select(config.container)
                .append('svg')
                .attr('width', config.size)
                .attr('height', config.size)
                .style('font-family', 'arial')
                .style('font-weight', '700');
 
            return gauge;
        }
 
        function drawBackground() {
            //gradient defs
            var gbg001 = settings.svg.append('defs')
                .append('radialGradient')
                .attr('id', 'gbg001');
            gbg001.append('stop')
                .attr('offset', '0%')
                .attr('stop-color', 'white');
            gbg001.append('stop')
                .attr('offset', '100%')
                .attr('stop-color', 'lightgrey');
 
            //white background circle
            settings.svg.append('circle')
                .attr('cx', settings.r)
                .attr('cy', settings.r)
                .attr('r', settings.r1)
                .attr('stroke', 'slategray')
                .attr('stroke-width', 2)
                .style('fill', 'rgb(247,247,247)');
 
            //"grey" ring around gauge
            var arc1 = d3.arc()
                .innerRadius(settings.r2)
                .outerRadius(settings.r1)
                .startAngle(0)
                .endAngle(2 * Math.PI);
            settings.svg.append('svg:path').style('fill', 'url(#gbg001)')
                .attr('d', arc1())
                .attr('transform', 'translate(' + settings.r + ',' + settings.r + ')');
        }
 
        function drawIndicator() {
            var sa = settings.startAngle;
            //draw fill path if needed
            if (settings.indicatorFillColor) {
                settings.svg.append('svg:path')
                    .datum({ endAngle: sa })
                    .style('fill', settings.indicatorFillColor)
                    .attr('id', 'indicatorFill')
                    .attr('d', d3.arc()
                        .innerRadius(settings.r5)
                        .outerRadius(settings.r8)
                        .startAngle(sa))
                    .attr('transform', 'translate(' + settings.r + ',' + settings.r + ')');
            }
 
            //draw indicator value if needed
            if (!settings.indicatorValueHide) {
                //draw inital Value as rangeBegin;
                settings.svg.append('text')
                    .attr('id', 'gaugeValue')
                    .attr('x', settings.r)
                    .attr('y', (settings.r + settings.r5))
                    .style('fill', 'black')
                    .style('text-anchor', 'middle')
                    .style('font-size', 25)
                    .text(settings.rangeBegin);
            }
 
            //draw indicator pointer and any other peices based on selection
            switch (settings.pointerType) {
                case 'simple':
                    drawIndicatorPointer("black", "", 1);
                    break;
                // case 'speedo':
                default:
                    drawIndicatorPointer("rgb(227, 113, 86)", "rgb(200, 59, 27)", 0.7);
                    //drawCircle
                    settings.svg.append('circle')
                        .attr('cx', settings.r)
                        .attr('cy', settings.r)
                        .attr('r', settings.r7)
                        .attr('stroke', 'slategray')
                        .attr('stroke-width', 2)
                        .style('fill', 'rgb(70, 132, 238)');
                    break;
            }
 
            function drawIndicatorPointer(fill, stroke, opacity) {
                //get needle path points
                var points = [];
                var needleWidth = 5;
                function needleSide(rl) {
                    return [{ x: settings.r, y: settings.r - settings.r4 },
                    { x: settings.r + rl * needleWidth, y: settings.r1 },
                    { x: settings.r, y: settings.r1 }];
                }
                points = needleSide(1);
                Array.prototype.push.apply(points, needleSide(-1).reverse());
 
                //draw needle path
                var pointerLine = d3.line().x(function (d) { return d.x; }).y(function (d) { return d.y; }).curve(d3.curveBasis);
                settings.svg.append('svg:path')
                    .datum(points)
                    .attr("d", pointerLine)
                    .attr("id", 'indicator' + settings.containerId)
                    .style("fill", fill)
                    .style("stroke", stroke)
                    .style("fill-opacity", opacity)
                    .attr("text-anchor", "middle")
                    .attr('transform', 'rotate(' + radToDeg(sa) + ' ' + settings.r + ' ' + settings.r + ')');
            }
        }
 
        function drawScale() {
            var sa = settings.startAngle,
                rat = settings.ratio;
 
            //Draw Color Bars ON scale
            settings.colors.map(function (item, i) {
                var end = (settings.rangeEnd * rat);
                var start = item.start * rat;
                if (settings.colors[i + 1] && settings.colors[i + 1].start * rat < end) {
                    end = settings.colors[i + 1].start * rat;
                }
 
                settings.svg.append('svg:path').style('fill', item.color)
                    .attr('d', d3.arc()
                        .innerRadius(settings.r5)
                        .outerRadius(settings.r3)
                        .startAngle(start + sa)
                        .endAngle(end + sa))
                    .attr('transform', 'translate(' + settings.r + ',' + settings.r + ')');
            });
 
            //Draw minor ticks on scale
            if (settings.minorTickIncrement) {
                d3.range(settings.rangeBegin, settings.rangeEnd, settings.minorTickIncrement).map(function (item, i) {
                    var tickRadO = settings.r3,
                        tickRadI = settings.r4,
                        xrat = Math.sin((item * rat) + sa),
                        yrat = Math.cos((item * rat) + sa);
 
                    settings.svg.append('line')
                        .attr("x1", (xrat * tickRadO) + settings.r)
                        .attr("y1", (yrat * tickRadO * - 1) + settings.r)
                        .attr("x2", (xrat * tickRadI) + settings.r)
                        .attr("y2", (yrat * tickRadI * - 1) + settings.r)
                        .style("stroke", "black")
                        .style("stroke-width", "1px");
                });
            }
 
            //Draw Major Ticks and Text
            if (settings.majorTicks) {
                settings.majorTicks.map(function (item, i) {
                    var textRad = (settings.r6),
                        tickRadO = settings.r3,
                        tickRadI = settings.r5,
                        xrat = Math.sin((item * rat) + sa),
                        yrat = Math.cos((item * rat) + sa);
 
                    if (!settings.majorTickTextHide) {
                        settings.svg.append('text')
                            .attr('x', (xrat * textRad) + settings.r)
                            .attr('y', (yrat * textRad * - 1) + settings.r + 3)
                            .style('fill', 'rgb(51, 51, 51)')
                            .style('text-anchor', 'middle')
                            .style('font-size', 14)
                            .text(item);
                    }
                    
                    settings.svg.append('line')
                        .attr("x1", (xrat * tickRadO) + settings.r)
                        .attr("y1", (yrat * tickRadO * - 1) + settings.r)
                        .attr("x2", (xrat * tickRadI) + settings.r)
                        .attr("y2", (yrat * tickRadI * - 1) + settings.r)
                        .style("stroke", "black")
                        .style("stroke-width", "2px");
                });
            }
 
        }
        var lastValue = radToDeg(settings.startAngle);
        function setValue(newValue) {
            var sa = settings.startAngle,
                rat = settings.ratio,
                cA = degToRad(lastValue),//degToRad(d3.select('#indicator'+ settings.containerId).attr('transform').split(' ')[0].slice(7)),
                nA = (newValue * rat) + sa,
                delta = nA - cA,
                intAngle = d3.interpolate(cA, nA),
                cappedAngle = function (t) {                    
                    return delta > 0 ? Math.min(intAngle(t), (settings.maxValue * rat) + sa) : Math.max(intAngle(t), (settings.minValue * rat) + sa);
                };
 
            //transition tween the pointer
            settings.svg.select('#indicator'+ settings.containerId)
                .transition()
                .ease(d3.easePolyOut)
                .duration(3000)
                .attrTween('transform', function (d, i, a) {
                    return function (t) {
                        lastValue = radToDeg(cappedAngle(t));
                        return 'rotate(' + radToDeg(cappedAngle(t)) + ' ' + settings.r + ' ' + settings.r + ')';
                    };
                });
 
            //transition tween indicator fill if needed
            if (settings.indicatorFillColor) {
                settings.svg.select('#indicatorFill')
                    .transition()
                    .ease(d3.easePolyOut)
                    .duration(3000)
                    .attrTween('d', function (d, i, a) {
                        return function (t) {
                            var rotateAngle = cappedAngle(t);
                            d.endAngle = rotateAngle;//sets the data right for next time it is set
                            return d3.arc()
                                .innerRadius(settings.r5)
                                .outerRadius(settings.r8)
                                .startAngle(sa)
                                .endAngle(rotateAngle)();
                        };
                    });
            }
 
            //transistion tweein indicator Value if needed
            if (!settings.indicatorValueHide) {
                settings.svg.select('#gaugeValue')
                    .transition()
                    .ease(d3.easePolyOut)
                    .duration(3000)
                    .attrTween('text', function (d) {
                        var currentElement = d3.select(this);
                        var currentInterpolation = d3.interpolateNumber(currentElement.text(), newValue);
                        return function (t) {
                            var result = d3.format(settings.indicatorNumberFormat)(currentInterpolation(t));
                            //only parseFloat to get rid of .0 when not moving
                            if (t === 1) {
                                currentElement.text(parseFloat(result));
                            }
                            else {
                                currentElement.text(result);
                            }
                        };
                    });
            }
        }
 
        function drawGauge() {
            if (settings.background) {
                drawBackground();
            }
            drawScale(settings);
            drawIndicator(settings);
        }
 
        function degToRad(deg) {
            return (deg * Math.PI) / 180;
        }
 
        function radToDeg(rad) {
            return (rad * 180) / Math.PI;
        }
 
        var gaugeI = {
            drawGauge: drawGauge,
            setValue: setValue
        };
        return gaugeI;
    }
 
    //AMD.
    if (typeof define === 'function' && define.amd) {
        define(function () {
            return oneGauge;
        });
        // Node and other CommonJS-like environments that support module.exports.
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = oneGauge;
        //Browser.
    } else {
        global.oneGauge = oneGauge;
    }
})(this);
