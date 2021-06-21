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
		.attr("class", "title plotTitle")
		.attr("x", params.SVGwidth/2. + 'px')
		.attr("y", '0px')
		.attr("dx", padding.left/2. + "px")
		.style('font-size', 0.05*params.SVGwidth)
		.text("Masses in the Stellar Graveyard");
	var titleBbox = title.node().getBoundingClientRect();
	title.attr("dy", titleBbox.height*0.8)

	var legend = params.SVG.append('g').attr('id','legend').attr('class','plotLegend')

	var GWBH = legend.append("text")
		.attr("class", "legendText GW BH")
		.attr("x", padding.left + 'px')
		.attr("y", '0px')
		.attr("dx", '0px')
		.attr("dy", "0px")
		.style('fill',params.colors.GWBH)
		.style('font-size', 0.015*params.SVGwidth)
		.text("LIGO-Virgo Black Holes");
	var offset = GWBH.node().getBoundingClientRect().width + 0.01*params.SVGwidth;
	var GWNS = legend.append("text")
		.attr("class", "legendText GW NS")
		.attr("x", padding.left + offset + 'px')
		.attr("y", '0px')
		.attr("dx", '0px')
		.attr("dy", "0px")
		.style('fill',params.colors.GWNS)
		.style('font-size', 0.015*params.SVGwidth)
		.text("LIGO-Virgo Neutron Stars");
	offset += GWNS.node().getBoundingClientRect().width + 0.01*params.SVGwidth;
	var EMBH = legend.append("text")
		.attr("class", "legendText EM BH")
		.attr("x", padding.left + offset + 'px')
		.attr("y", '0px')
		.attr("dx", '0px')
		.attr("dy", "0px")
		.style('fill',params.colors.EMBH)
		.style('font-size', 0.015*params.SVGwidth)
		.text("EM Black Holes");
	offset += EMBH.node().getBoundingClientRect().width + 0.01*params.SVGwidth;
	var EMNS = legend.append("text")
		.attr("class", "legendText EM NS")
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
		.attr("class", "axis axisLabel yaxis")
		.attr("transform", "rotate(-90)")
		.attr("x", 0)
		.attr("y", 0)
		.style("text-anchor", "end")
		.style('font-size',0.03*params.SVGwidth)
		.text("Solar Masses")
	axisLabel.attr('dy','-'+axisLabel.node().getBoundingClientRect().width+'px')

	params.SVG.style('transform', 'translate(' + (margin.left + params.controlsX/2) + 'px,' + margin.top + 'px)scaleX(' + params.SVGscale + ')')


	//mass Gap
	params.mainPlot.append('rect')
		.attr('class','rect massGap')
		.attr('x',params.xAxisScale(0))
		.attr('y',params.yAxisScale(params.massGap[1]))
		.attr('width',params.xAxisScale(params.SVGwidth - padding.left - padding.right))
		.attr('height',params.yAxisScale(params.massGap[0]) - params.yAxisScale(params.massGap[1]))
		.attr('fill','#303030')
		.style('opacity',0)

	params.mainPlot.append('text')
		.attr('class','text massGap')
		.attr("x", params.SVGwidth/2. + 'px')
		.attr("y", (params.yAxisScale(params.massGap[0]) + params.yAxisScale(params.massGap[1]))/2. + 'px')
		.attr("dx", -0.025*params.SVGwidth*2. + "px")
		.attr("dy", (params.yAxisScale(params.massGap[0]) - params.yAxisScale(params.massGap[1]))/2. - 0.025*params.SVGwidth/2. + 'px')
		.style("text-anchor", "middle")
		.style('font-size', 0.025*params.SVGwidth)
		.style('font-weight', 'bold')
		.style('color','black')
		.style('opacity',0)
		.text('Mass Gap?')

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


function getRem(mass){
	if (mass < params.BHMinMass) return 'NS';
	return 'BH';
}

function plotData(){
	//console.log('populating plot ...');
	params.xNorm = (params.data.length + 2);

	//construct the arrows for GW sources
	params.mainPlot.selectAll('.arrow.GW')
		.data(params.data).enter().filter(function(d) { return d.messenger == 'GW'})
		.append("path")
			.attr("class",function(d){
				var rem = [];
				if (d.final_mass_source != null){
					rem.push(getRem(d.final_mass_source));
				} else {
					rem.push(getRem(d.total_mass_source));
				}
				if (d.mass_1_source != null){
					rem.push(getRem(d.mass_1_source));
				}
				if (d.mass_2_source != null){
					rem.push(getRem(d.mass_2_source));
				}
				var urem = rem.filter(onlyUnique);
				var crem = '';
				for (var i=0; i<urem.length; i+=1) crem += urem[i];
				return 'name-'+cleanString(d.commonName) + " " + crem + " arrow GW clickable"
			})
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
			//.on('mouseover',mouseOver)
			//.on('mouseout',mouseOut);
			.on('click',showTooltip)


	//add all the circles for all the GW sources
	params.mainPlot.selectAll(".dot.mf.GW")
		.data(params.data).enter().filter(function(d) { return d.messenger == 'GW' && d.final_mass_source != null })
		.append("circle")
			.attr("class", function(d){return 'name-'+cleanString(d.commonName) + " " + getRem(d.final_mass_source) + " dot mf GW clickable";})

	//GW m1
	params.mainPlot.selectAll(".dot.m1.GW")
		.data(params.data).enter().filter(function(d) { return d.messenger == 'GW' && d.mass_1_source != null })
		.append("circle")
			.attr("class", function(d){return 'name-'+cleanString(d.commonName)+ " " + getRem(d.mass_1_source) + " dot m1 GW clickable";})

	//GW m2
	params.mainPlot.selectAll(".dot.m2.GW")
		.data(params.data).enter().filter(function(d) { return d.messenger == 'GW' && d.mass_2_source != null })
		.append("circle")
			.attr("class", function(d){return 'name-'+cleanString(d.commonName)+ " " + getRem(d.mass_2_source) + " dot m2 GW clickable";})


	//add any without final masses?
	params.mainPlot.selectAll(".dot.mf.no_final_mass.qmark.GW")
		.data(params.data).enter().filter(function(d) { return d.messenger == 'GW' && d.final_mass_source == null && d.total_mass_source != null})
		.append("circle")
			.attr("class", function(d){return 'name-'+cleanString(d.commonName)+ " " + getRem(d.total_mass_source) + " dot mf no_final_mass qmark GW clickable";})

	//add the EM data
	params.mainPlot.selectAll(".dot.mf.EM")
		.data(params.EMdata).enter().filter(function(d) { return d.messenger == 'EM' && d.mass != null })
		.append("circle")
			.attr("class", function(d){return 'name-'+cleanString(d.commonName)+ " " + getRem(d.mass) + " dot mf EM clickable";})


	//add question marks to these w/o final masses
	params.mainPlot.selectAll(".text.mf.no_final_mass.qmark.GW")
		.data(params.data).enter().filter(function(d) {return d.messenger == 'GW' && d.final_mass_source == null && d.total_mass_source != null})	
		.append("text")		
			.attr("class", function(d){return 'name-'+cleanString(d.commonName)+ " " + getRem(d.total_mass_source) + " text mf no_final_mass qmark GW clickable";})

	//any without uncertainties on final masses
	//add question marks to these w/o final masses
	params.mainPlot.selectAll(".text.mf.no_final_mass_error.qmark.GW")
		.data(params.data).enter().filter(function(d) { return d.messenger == 'GW' && d.final_mass_source != null && d.final_mass_source_upper == null})
		.append("text")		
			.attr("class", function(d){return 'name-'+cleanString(d.commonName)+ " " + getRem(d.final_mass_source) + " text mf no_final_mass_error qmark GW clickable";})


	//any EM question marks
	params.mainPlot.selectAll(".text.mf.qmark.EM")
		.data(params.data).enter().filter(function(d) { return d.messenger == 'EM' && d.special == 2})
		.append("text")		
			.attr("class", function(d){return 'name-'+cleanString(d.commonName)+ " " + getRem(d.mass) + " text mf qmark EM clickable";})


	//now add all the points
	d3.selectAll('circle').each(function(d){
		d3.select(this)
			.attr("data-name", d.commonName)
			.attr("r", defineRadius(d,d3.select(this).attr('class')))
			.attr("cx", defineXpos(d,d3.select(this).attr('class')))
			.attr("cy", defineYpos(d,d3.select(this).attr('class')))
			.style("fill", defineColor(d,d3.select(this).attr('class')))
			.style("fill-opacity",params.opMass)
			.style("stroke", defineColor(d,d3.select(this).attr('class')))
			.style("stroke-opacity", 1)
			.style("stroke-width", 2*params.sizeScaler)
			.style("cursor", "arrow")
			//.on('mouseover',mouseOver)
			//.on('mouseout',mouseOut);
			.on('click',showTooltip)
			.call(d3.drag() // call specific function when circle is dragged
				.on('start', dragstarted)
				.on('drag', dragged)
				.on('end', dragended));

	});

	//add all the question marks
	d3.selectAll('.qmark').each(function(d){
		d3.select(this)
			.attr("data-name", d.commonName)
			.attr("x", defineXpos(d,d3.select(this).attr('class')))
			.attr("y", defineYpos(d,d3.select(this).attr('class')) + 0.5*defineRadius(d,d3.select(this).attr('class')))
			.style('fill','white')
			.style('font-family',"sans-serif")
			.style('font-size', 1.5*defineRadius(d,d3.select(this).attr('class'))+"px")
			.style("text-anchor", "middle")
			.style("cursor", "arrow")
			.text("?")
			//.on('mouseover',mouseOver)
			//.on('mouseout',mouseOut)
			.on('click',showTooltip)
			.call(d3.drag() // call specific function when circle is dragged
				.on('start', dragstarted)
				.on('drag', dragged)
				.on('end', dragended));
	})

	params.plotReady = true;
}

function defineXpos(d, classStr, reset=false){
	if (reset) return d.x;

	var cls = '.'+classStr.replace('clickable','').replaceAll(' ','.');

	var skey = params.GWsortKey;
	if (cls.includes('EM')) skey = params.EMsortKey;
	var x = params.xAxisScale(+(d[skey]/params.xNorm*params.xAxisScale.domain()[1]));

	d.x = x;
	return x;
}

function defineYpos(d,classStr, reset=false){
	if (reset) return d.y;

	var y = params.yAxisScale(+d.mass);

	var cls = '.'+classStr.replace('clickable','').replaceAll(' ','.');
	if (cls.includes('.dot.mf.GW')) y = params.yAxisScale(+d.final_mass_source);
	if (cls.includes('.dot.m1.GW')) y = params.yAxisScale(+d.mass_1_source);
	if (cls.includes('.dot.m2.GW')) y = params.yAxisScale(+d.mass_2_source);
	if (cls.includes('.dot.mf.no_final_mass.qmark.GW')) y = params.yAxisScale(+d.total_mass_source);
	if (cls.includes('.text.mf.no_final_mass.qmark.GW')) y = params.yAxisScale(+d.total_mass_source);
	if (cls.includes('.text.mf.no_final_mass_error.qmark.GW')) y = params.yAxisScale(+d.final_mass_source);
	if (cls.includes('.dot.mf.EM')) y = params.yAxisScale(+d.mass);
	if (cls.includes('.text.mf.qmark.EM')) y = params.yAxisScale(+d.mass);

	d.y = y;
	return y;

}

function defineRadius(d,classStr, reset=false){
	//if (reset) return d.r;

	var r = params.radiusScale(+d.mass);

	var cls = '.'+classStr.replace('clickable','').replaceAll(' ','.');
	if (cls.includes('.dot.mf.GW')) r = params.radiusScale(+d.final_mass_source);
	if (cls.includes('.dot.m1.GW')) r = params.radiusScale(+d.mass_1_source);
	if (cls.includes('.dot.m2.GW')) r = params.radiusScale(+d.mass_2_source);
	if (cls.includes('.dot.mf.no_final_mass.qmark.GW')) r = params.radiusScale(+d.total_mass_source);
	if (cls.includes('.text.mf.no_final_mass.qmark.GW')) r = params.radiusScale(+d.total_mass_source);
	if (cls.includes('.text.mf.no_final_mass_error.qmark.GW')) r = params.radiusScale(+d.final_mass_source);
	if (cls.includes('.dot.mf.EM')) r = params.radiusScale(+d.mass);
	if (cls.includes('.text.mf.qmark.EM')) r = params.radiusScale(+d.mass);

	d.r = r;
	return r;
}

function defineColor(d, classStr){
	var cls = '.'+classStr.replace('clickable','').replaceAll(' ','.');

	var tp = 'GW';
	if (cls.includes('.EM')) tp = 'EM';

	var mass = d.mass;
	if (cls.includes('.dot.mf.GW')) mass = d.final_mass_source;
	if (cls.includes('.dot.m1.GW')) mass = d.mass_1_source;
	if (cls.includes('.dot.m2.GW')) mass = d.mass_2_source;
	if (cls.includes('.dot.mf.no_final_mass.qmark.GW')) mass = d.total_mass_source;
	if (cls.includes('.text.mf.no_final_mass.qmark.GW')) mass = d.total_mass_source;
	if (cls.includes('.text.mf.no_final_mass_error.qmark.GW')) mass = d.final_mass_source;
	if (cls.includes('.dot.mf.EM')) mass = d.mass;
	if (cls.includes('.text.mf.qmark.EM')) mass = d.mass;

	var rem = 'BH'
	if (mass < params.BHMinMass) rem = 'NS';

	var key = tp+rem;

	return params.colors[key];

}

function resizePlot(){
	//resize the plot when the user resizes the window
	//for now I'll just redraw
	params.sizeScaler = window.innerWidth/params.targetWidth;
	if (!params.renderXchanged) params.renderX = window.innerWidth;
	if (!params.renderYchanged) params.renderY = window.innerHeight;

	params.renderY = Math.round(params.renderAspect*params.renderX);

	d3.select('#renderX').attr('placeholder',params.renderX);
	d3.select('#renderY').attr('placeholder',params.renderY);

	d3.select('#svg').remove();
	createPlot();
}

// What happens when a circle is dragged
function dragstarted(event, d) {
	if (params.viewType == 'packing'){
		if (!event.active) params.simulation.alphaTarget(.01).restart();
		d.fx = d.x;
		d.fy = d.y;
	}
}
function dragged(event, d) {
	if (params.viewType == 'packing'){
		d.fx = event.x;
		d.fy = event.y;
	}
}
function dragended(event, d) {
	if (params.viewType == 'packing'){
		if (!event.active) params.simulation.alphaTarget(.01);
		d.fx = null;
		d.fy = null;
	}
}