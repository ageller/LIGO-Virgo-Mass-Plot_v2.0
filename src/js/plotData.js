function createPlot(width=null, height=null){
//set up the plot axes, etc.
	//console.log('creating plot object ...');

	params.plotReady = false;

	var margin = {};
	var padding = {};
	var keys = Object.keys(params.SVGmargin);
	for (var i=0; i<keys.length; i++) margin[keys[i]] = params.SVGmargin[keys[i]]*params.sizeScaler;
	var keys = Object.keys(params.SVGpadding);
	for (var i=0; i<keys.length; i++) padding[keys[i]] = params.SVGpadding[keys[i]]*params.sizeScaler;

	if (!width) width = window.innerWidth; 
	if (!height) height = window.innerHeight;

	params.SVGwidth = width - margin.left*params.sizeScaler - margin.right; 
	params.SVGheight = height - margin.top - margin.bottom; 

	//define the SVG element that will contain the plot
	params.SVG = d3.select('body').append('svg')
		.attr('id','svg')
		.style('height',params.SVGheight)
		.style('width',params.SVGwidth)
		.style('background-color',params.SVGbackground)

	var credits = params.SVG.append("text")
		.attr("class", "credits")
		.attr("x", params.SVGwidth/2. + 'px')
		.attr("y", params.SVGheight + 'px')
		.attr("dx", padding.left/2. + "px")
		.attr("dy", "-10px")
		.style('font-size', 0.02*params.SVGwidth)
		.text("LIGO-Virgo | Aaron Geller | Northwestern");

	var title = params.SVG.append("text")
		.attr("class", "title")
		.attr("x", params.SVGwidth/2. + 'px')
		.attr("y", '0px')
		.attr("dx", padding.left/2. + "px")
		.style('font-size', 0.05*params.SVGwidth)
		.text("Masses in the Stellar Graveyard");
	var titleBbox = title.node().getBoundingClientRect();
	title.attr("dy", titleBbox.height*0.8)

	var legend = params.SVG.append('g').attr('id','legend')

	var GWBH = legend.append("text")
		.attr("class", "legendText")
		.attr("x", padding.left + 'px')
		.attr("y", '0px')
		.attr("dx", '0px')
		.attr("dy", "0px")
		.style('fill',params.colors.GWBH)
		.style('font-size', 0.015*params.SVGwidth)
		.text("LIGO-Virgo Black Holes");
	var offset = GWBH.node().getBoundingClientRect().width + 0.01*params.SVGwidth;
	var GWNS = legend.append("text")
		.attr("class", "legendText")
		.attr("x", padding.left + offset + 'px')
		.attr("y", '0px')
		.attr("dx", '0px')
		.attr("dy", "0px")
		.style('fill',params.colors.GWNS)
		.style('font-size', 0.015*params.SVGwidth)
		.text("LIGO-Virgo Neutron Stars");
	offset += GWNS.node().getBoundingClientRect().width + 0.01*params.SVGwidth;
	var EMBH = legend.append("text")
		.attr("class", "legendText")
		.attr("x", padding.left + offset + 'px')
		.attr("y", '0px')
		.attr("dx", '0px')
		.attr("dy", "0px")
		.style('fill',params.colors.EMBH)
		.style('font-size', 0.015*params.SVGwidth)
		.text("EM Black Holes");
	offset += EMBH.node().getBoundingClientRect().width + 0.01*params.SVGwidth;
	var EMNS = legend.append("text")
		.attr("class", "legendText")
		.attr("x", padding.left + offset + 'px')
		.attr("y", '0px')
		.attr("dx", '0px')
		.attr("dy", "0px")
		.style('fill',params.colors.EMNS)
		.style('font-size', 0.015*params.SVGwidth)
		.text("EM Neutron Stars");

	var legendBbox = legend.node().getBoundingClientRect();
	var legendY = legendBbox.height + titleBbox.height;
	var legendX = (params.SVGwidth - padding.left - legendBbox.width)/2.
	legend.attr('transform','translate(' +legendX + ',' + legendY + ')')

	var top = title.node().getBoundingClientRect().height + legend.node().getBoundingClientRect().height + padding.top;

	params.mainPlot = params.SVG.append("g")
			.attr('id','mainPlot')
			.attr("transform", "translate(" + padding.left + "," + top + ")");

	//define the radius scaling
	params.radiusScale = d3.scaleLinear().range([params.sizeScaler*params.minRadius, params.sizeScaler*params.maxRadius]).domain(d3.extent(params.data, function(d){ return +d.final_mass_source; }));

	//define the axes
	params.xAxisScale = d3.scaleLinear().range([0, params.SVGwidth - padding.left - padding.right]);
	params.yAxisScale = d3.scaleLog().range([params.SVGheight - top - padding.bottom, 1]);

	params.xAxisScale.domain([0, params.SVGwidth - padding.left - padding.right]); //pixels on screen
	//params.yAxisScale.domain(d3.extent(params.data, function(d){if (d.final_mass_source != null) return +d.final_mass_source; })); //masses
	params.yAxisScale.domain(d3.extent([1, 200])); //masses

	params.yAxis = d3.axisLeft(params.yAxisScale)
		.scale(params.yAxisScale)
		.tickSize(-(params.SVGwidth - padding.left - padding.right))
		.tickFormat(d3.format("d"))
		.tickValues([1,2,5,10,20,50,100,200]);

	params.mainPlot.append("g")
		.attr("class", "axis yaxis")
		.style('font-size', 0.015*params.SVGwidth)
		.call(params.yAxis);

	params.mainPlot.selectAll('.axis').selectAll('line')
		.style('stroke-width','2px')
	params.mainPlot.select('.yaxis').selectAll('.domain').remove();

	var axisLabel = params.mainPlot.append("text")
		.attr("class", "axisLabel yaxis")
		.attr("transform", "rotate(-90)")
		.attr("x", 0)
		.attr("y", 0)
		.style("text-anchor", "end")
		.style('font-size',0.03*params.SVGwidth)
		.text("Solar Masses")
	axisLabel.attr('dy','-'+axisLabel.node().getBoundingClientRect().width+'px')

	params.SVG.style('transform', 'translate(' + (margin.left + params.controlsX/2) + 'px,' + margin.top + 'px)scaleX(' + params.SVGscale + ')')


	populatePlot();

}


//https://stackoverflow.com/questions/64423115/d3-js-multiple-relationship-visual-linkhorizontal-tangled-tree
//http://using-d3js.com/05_01_paths.html
function createArrow(d){

	//var x = d[params.sortKey]/params.xNorm*params.xAxisScale.domain()[1];
	var x=0;

	//find all the points for the arrow
	var y0 = +d.mass_2_source;
	var r0 = +d.mass_2_source;

	var y1 = +d.final_mass_source;
	var r1 = +d.final_mass_source;

	if (y0 == null || y0 == 0) {
		y0 = +d.mass_1_source;
		r0 = +d.mass_1_source;
	}

	if (y1 == null || y1 == 0) {
		y1 = +d.total_mass_source;
		r1 = +d.total_mass_source;
	}
	if (y1 == null || y1 == 0) {
		y1 = +d.mass_1_source;
		r0 = +d.mass_1_source;
	}

	//scale the points
	x = params.xAxisScale(x);
	y0 = params.yAxisScale(y0);
	y1 = params.yAxisScale(y1);
	r0 = params.radiusScale(r0);
	r1 = params.radiusScale(r1);

	var dist = Math.abs(y1 - y0);

	var scaleX = params.arrowScale*params.sizeScaler;
	var scaleY = params.sizeScaler;

	//draw the path for the arrow
	const context = d3.path();

	//tail
	context.moveTo(x - (params.arrowThickBottom + params.arrowCurveTail)*scaleX,    y1 + params.arrowHeadStart*scaleY + r1);
	context.quadraticCurveTo(x - params.arrowThickBottom*scaleX, y1 + dist/2. + r1, x - params.arrowThickBottom*scaleX, y0 - r0);
	context.lineTo(x + params.arrowThickBottom*scaleX, y0 - r0);
	context.quadraticCurveTo(x + params.arrowThickBottom*scaleX, y1 + dist/2. + r1, x + (params.arrowThickBottom + params.arrowCurveTail)*scaleX, y1 + params.arrowHeadStart*scaleY + r1);

	//head
	var theta0 = 0.25*Math.PI;
	var arrowx = (params.arrowThickBottom + params.arrowCurveTail + params.arrowThickTop)*scaleX;
	var rad = arrowx/Math.cos(theta0);
	var arrowy1 = rad*Math.sin(theta0);
	var arrowy = rad - arrowy1;
	context.moveTo(x + (params.arrowThickBottom + params.arrowCurveTail + params.arrowThickTop)*scaleX,    y1 + (params.arrowHeadStart*scaleY + arrowy) + r1);
	context.lineTo(x, y1 + r1);
	context.lineTo(x - (params.arrowThickBottom + params.arrowCurveTail + params.arrowThickTop)*scaleX,    y1 + (params.arrowHeadStart*scaleY + arrowy) + r1);

	context.arc(x, y1 + params.arrowHeadStart*scaleY + rad + r1, rad, Math.PI + theta0, 2.*Math.PI - theta0);


	return context.toString();
};





function populatePlot(){
//add the data to the plot
	plotData();
}

function getColor(tp,mass){
	var rem = 'BH'
	if (mass < params.BHMinMass) rem = 'NS';

	var key = tp+rem;

	return params.colors[key];

}

function plotData(){
	//console.log('populating plot ...');
	params.xNorm = (params.data.length + 2);

	//construct the arrows for GW sources
	params.mainPlot.selectAll('.arrow.GW')
		.data(params.data).enter().filter(function(d) { return d.messenger == 'GW'})
		.append("path")
			.attr("class",function(d){return 'name-'+cleanString(d.commonName) + " arrow GW"})
			.attr("data-name", function(d){return d.commonName})
			.attr('stroke', 'none')
			.attr('fill', 'white')	
			.style("opacity",0.5)
			.style("cursor", "arrow")
			.attr('transform',function(d){
				var x = params.xAxisScale(d[params.GWsortKey]/params.xNorm*params.xAxisScale.domain()[1]);
				var y = 0;
				return 'translate(' + x +',' + y + ')';
			})
			.attr("d", function(d){return createArrow(d)})
			.on('mouseover',mouseOver)
			.on('mouseout',mouseOut);


	//add all the circles for all the masses
	params.mainPlot.selectAll(".dot.mf.GW")
		.data(params.data).enter().filter(function(d) { return d.messenger == 'GW' && d.final_mass_source != null })
		.append("circle")
			.attr("class", function(d){return 'name-'+cleanString(d.commonName) + " dot mf GW";})
			.attr("data-name", function(d){return d.commonName;})
			.attr("r", function(d){return params.radiusScale(+d.final_mass_source);})
			.attr("cx", function(d) {return params.xAxisScale(+(d[params.GWsortKey]/params.xNorm*params.xAxisScale.domain()[1]));})
			.attr("cy", function(d) {return params.yAxisScale(+d.final_mass_source);})
			.style("fill", function(d){return getColor(d.messenger, d.final_mass_source);})
			.style("fill-opacity",params.opMass)
			.style("stroke", function(d){return getColor(d.messenger, d.final_mass_source);})
			.style("stroke-opacity", 1)
			.style("stroke-width", 2*params.sizeScaler)
			.style("cursor", "arrow")
			.on('mouseover',mouseOver)
			.on('mouseout',mouseOut);

	params.mainPlot.selectAll(".dot.m1.GW")
		.data(params.data).enter().filter(function(d) { return d.messenger == 'GW' && d.mass_1_source != null })
		.append("circle")
			.attr("class", function(d){return 'name-'+cleanString(d.commonName) + " dot m1 GW";})
			.attr("data-name", function(d){return d.commonName;})
			.attr("r", function(d){return params.radiusScale(+d.mass_1_source);})
			.attr("cx", function(d) {return params.xAxisScale(+d[params.GWsortKey]/params.xNorm*params.xAxisScale.domain()[1]);})
			.attr("cy", function(d) {return params.yAxisScale(+d.mass_1_source);})
			.style("fill", function(d){return getColor(d.messenger, d.mass_1_source);})
			.style("fill-opacity",params.opMass)
			.style("stroke", function(d){return getColor(d.messenger, d.mass_1_source);})
			.style("stroke-opacity", 1)
			.style("stroke-width", 2*params.sizeScaler)
			.style("cursor", "arrow")
			.on('mouseover',mouseOver)
			.on('mouseout',mouseOut);

	params.mainPlot.selectAll(".dot.m2.GW")
		.data(params.data).enter().filter(function(d) { return d.messenger == 'GW' && d.mass_2_source != null })
		.append("circle")
			.attr("class", function(d){return 'name-'+cleanString(d.commonName) + " dot m2 GW";})
			.attr("data-name", function(d){return d.commonName;})
			.attr("r", function(d){return params.radiusScale(+d.mass_2_source);})
			.attr("cx", function(d) {return params.xAxisScale(+d[params.GWsortKey]/params.xNorm*params.xAxisScale.domain()[1]);})
			.attr("cy", function(d) {return params.yAxisScale(+d.mass_2_source);})
			.style("fill", function(d){return getColor(d.messenger, d.mass_2_source);})
			.style("fill-opacity",params.opMass)
			.style("stroke", function(d){return getColor(d.messenger, d.mass_2_source);})
			.style("stroke-opacity", 1)
			.style("stroke-width", 2*params.sizeScaler)
			.style("cursor", "arrow")
			.on('mouseover',mouseOver)
			.on('mouseout',mouseOut);

	//add any without final masses?
	params.mainPlot.selectAll(".dot.mf.no_final_mass.GW")
		.data(params.data).enter().filter(function(d) { return d.messenger == 'GW' && d.final_mass_source == null && d.total_mass_source != null})
		.append("circle")
			.attr("class", function(d){return 'name-'+cleanString(d.commonName) + " dot mf no_final_mass GW";})
			.attr("data-name", function(d){return d.commonName;})
			.attr("r", function(d){return params.radiusScale(+d.total_mass_source);})
			.attr("cx", function(d) {return params.xAxisScale(+(d[params.GWsortKey]/params.xNorm*params.xAxisScale.domain()[1]));})
			.attr("cy", function(d) {return params.yAxisScale(+d.total_mass_source);})
			.style("fill", function(d){return getColor(d.messenger, d.total_mass_source);})
			.style("fill-opacity",params.opMass)
			.style("stroke", function(d){return getColor(d.messenger, d.total_mass_source);})
			.style("stroke-opacity", 1)
			.style("stroke-width", 2*params.sizeScaler)
			.style("cursor", "arrow")
			.on('mouseover',mouseOver)
			.on('mouseout',mouseOut)

	//add question marks to these w/o final masses
	params.mainPlot.selectAll(".text.mf.no_final_mass.GW")
		.data(params.data).enter().filter(function(d) {return d.messenger == 'GW' && d.final_mass_source == null && d.total_mass_source != null})	
		.append("text")		
			.attr("class", function(d){return 'name-'+cleanString(d.commonName) + " text mf no_final_mass GW";})
			.attr("data-name", function(d){return d.commonName;})
			.attr("x", function(d) {return params.xAxisScale(+(d[params.GWsortKey]/params.xNorm*params.xAxisScale.domain()[1]));})
			.attr("y", function(d) {return params.yAxisScale(+d.total_mass_source) + 0.5*params.radiusScale(+d.total_mass_source);})
			.style('fill','white')
			.style('font-family',"sans-serif")
			.style('font-size',function(d) {return 1.5*params.radiusScale(+d.total_mass_source)+"px";})
			.style("text-anchor", "middle")
			.style("cursor", "arrow")
			.text("?")
			.on('mouseover',mouseOver)
			.on('mouseout',mouseOut)

	//add the EM data
	params.mainPlot.selectAll(".dot.mf.EM")
		.data(params.EMdata).enter().filter(function(d) { return d.messenger == 'EM' && d.mass != null })
		.append("circle")
			.attr("class", function(d){return 'name-'+cleanString(d.commonName) + " dot mf EM";})
			.attr("data-name", function(d){return d.commonName;})
			.attr("r", function(d){return params.radiusScale(+d.mass);})
			.attr("cx", function(d) {return params.xAxisScale(+d[params.EMsortKey]/params.xNorm*params.xAxisScale.domain()[1]);})
			.attr("cy", function(d) {return params.yAxisScale(+d.mass);})
			.style("fill", function(d){return getColor(d.messenger, d.mass);})
			.style("fill-opacity",params.opMass)
			.style("stroke", function(d){return getColor(d.messenger, d.mass);})
			.style("stroke-opacity", 1)
			.style("stroke-width", 2*params.sizeScaler)
			.style("cursor", "arrow")
			.on('mouseover',mouseOver)
			.on('mouseout',mouseOut);

	params.plotReady = true;
}


function resizePlot(){
	//resize the plot when the user resizes the window
	//for now I'll just redraw
	params.sizeScaler = window.innerWidth/params.targetWidth;

	d3.select('#svg').remove();
	createPlot();
}