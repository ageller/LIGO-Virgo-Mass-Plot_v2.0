function createPlot(){
//set up the plot axes, etc.
	console.log('creating plot object ...');

	params.SVGwidth = window.innerWidth - params.SVGmargin.left - params.SVGmargin.right; 
	params.SVGheight = window.innerHeight - params.SVGmargin.top - params.SVGmargin.bottom; 

	//define the SVG element that will contain the plot
	params.SVG = d3.select('body').append('svg')
		.attr('id','svg')
		.style('height',params.SVGheight)
		.style('width',params.SVGwidth)
		.style('background-color',params.SVGbackground)
		.attr("transform", "translate(" + params.SVGmargin.left + "," + params.SVGmargin.top + ")")
		.append("g")
			.attr('id','mainPlot')
			.attr("transform", "translate(" + params.SVGpadding.left + "," + params.SVGpadding.top + ")");

	//define the radius scaling
	params.radiusScale = d3.scaleLinear().range([5,20]).domain(d3.extent(params.data, function(d){ return +d.final_mass_source; }));

	//define the axes
	params.xAxisScale = d3.scaleLinear().range([0, params.SVGwidth - params.SVGpadding.left - params.SVGpadding.right]);
	params.yAxisScale = d3.scaleLog().range([params.SVGheight - params.SVGpadding.top - params.SVGpadding.bottom, 1]);

	params.xAxisScale.domain([0, params.SVGwidth - params.SVGpadding.left - params.SVGpadding.right]); //pixels on screen
	//params.yAxisScale.domain(d3.extent(params.data, function(d){if (d.final_mass_source != null) return +d.final_mass_source; })); //masses
	params.yAxisScale.domain(d3.extent([1, 200])); //masses

	params.yAxis = d3.axisLeft(params.yAxisScale)
		.scale(params.yAxisScale)
		.tickSize(-(params.SVGwidth - params.SVGpadding.left - params.SVGpadding.right))
		.tickFormat(d3.format("d"))
		.tickValues([1,2,5,10,20,50,100,200]);

	params.SVG.append("g")
		.attr("class", "axis yaxis")
		.call(params.yAxis);

	params.SVG.selectAll('.axis').selectAll('line')
		.style('stroke-width','2px')
	params.SVG.select('.yaxis').selectAll('.domain').remove();

	params.SVG.append("text")
		.attr("class", "axisLabel yaxis")
		.attr("transform", "rotate(-90)")
		.attr("x", 0)
		.attr("y", -(params.SVGpadding.left-2))
		.attr("dy", ".71em")
		.style("text-anchor", "end")
		.text("Solar Masses")


	populatePlot();

}


//https://stackoverflow.com/questions/64423115/d3-js-multiple-relationship-visual-linkhorizontal-tangled-tree
//http://using-d3js.com/05_01_paths.html
function createArrow(d, sortKey){

	//var x = d[sortKey]/params.xNorm*params.xAxisScale.domain()[1];

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

	//draw the path for the arrow
	const context = d3.path();

	//tail
	context.moveTo(x - params.arrowThickBottom - params.arrowCurveTail,    y1 + params.arrowHeadStart + r1);
	context.quadraticCurveTo(x - params.arrowThickBottom, y1 + dist/2. + r1, x - params.arrowThickBottom, y0 - r0);
	context.lineTo(x + params.arrowThickBottom, y0 - r0);
	context.quadraticCurveTo(x + params.arrowThickBottom, y1 + dist/2. + r1, x + params.arrowThickBottom + params.arrowCurveTail, y1 + params.arrowHeadStart + r1);

	//head
	var theta0 = 0.25*Math.PI;
	var arrowx = params.arrowThickBottom + params.arrowCurveTail + params.arrowThickTop;
	var rad = arrowx/Math.cos(theta0);
	var arrowy1 = rad*Math.sin(theta0);
	var arrowy = rad - arrowy1;
	context.moveTo(x + params.arrowThickBottom + params.arrowCurveTail + params.arrowThickTop,    y1 + params.arrowHeadStart + arrowy + r1);
	context.lineTo(x, y1 + r1);
	context.lineTo(x - params.arrowThickBottom - params.arrowCurveTail - params.arrowThickTop,    y1 + params.arrowHeadStart + arrowy + r1);

	context.arc(x, y1 + params.arrowHeadStart + rad + r1, rad, Math.PI + theta0, 2.*Math.PI - theta0);


	return context.toString();
};





function populatePlot(){
//add the data to the plot
	plotData();
}

function circleColor(tp,mass){
	if (tp == 'GW'){
		if (mass > params.BHMinMass){ 
			return '#00BFFF'; //black hole
		} 
		return '#d78122'; //neutron star
	}
	if (tp == 'EM'){
		if (mass > params.BHMinMass){ 
			return '6b509f'; //black hole
		} 
		return '#dfc23f'; //neutron star
	}

}

function plotData(sortKey = 'valleyIndex'){
	console.log('populating plot ...');
	params.xNorm = (params.data.length + 2);

	//sortKey = 'risingIndex';
	//sortKey = 'fallingIndex';
	//sortKey = 'peakIndex';
	//sortKey = 'valleyIndex';

	//construct the arrows for GW sources
	params.SVG.selectAll('.arrow.GW')
		.data(params.data).enter().filter(function(d) { return d.messenger == 'GW'})
		.append("path")
			.attr("class",function(d){return 'name-'+cleanString(d.commonName) + " arrow GW"})
			.attr("data-name", function(d){return d.commonName})
			.attr('stroke', 'none')
			.attr('fill', 'white')	
			.style("opacity",0.5)
			.style("cursor", "arrow")
			.attr('transform',function(d){
				var x = params.xAxisScale(d[sortKey]/params.xNorm*params.xAxisScale.domain()[1]);
				var y = 0;
				return 'translate(' + x +',' + y + ')';
			})
			.attr("d", function(d){return createArrow(d, sortKey)})
			.on('mouseover',mouseOver)
			.on('mouseout',mouseOut);


	//add all the circles for all the masses
	params.SVG.selectAll(".dot.mf.GW")
		.data(params.data).enter().filter(function(d) { return d.messenger == 'GW' && d.final_mass_source != null })
		.append("circle")
			.attr("class", function(d){return 'name-'+cleanString(d.commonName) + " dot mf GW";})
			.attr("data-name", function(d){return d.commonName;})
			.attr("r", function(d){return params.radiusScale(+d.final_mass_source);})
			.attr("cx", function(d) {return params.xAxisScale(+(d[sortKey]/params.xNorm*params.xAxisScale.domain()[1]));})
			.attr("cy", function(d) {return params.yAxisScale(+d.final_mass_source);})
			.style("fill", function(d){return circleColor(d.messenger, d.final_mass_source);})
			.style("fill-opacity",params.opMass)
			.style("stroke", function(d){return circleColor(d.messenger, d.final_mass_source);})
			.style("stroke-opacity", 1)
			.style("stroke-width", 2)
			.style("cursor", "arrow")
			.on('mouseover',mouseOver)
			.on('mouseout',mouseOut);

	params.SVG.selectAll(".dot.m1.GW")
		.data(params.data).enter().filter(function(d) { return d.messenger == 'GW' && d.mass_1_source != null })
		.append("circle")
			.attr("class", function(d){return 'name-'+cleanString(d.commonName) + " dot m1 GW";})
			.attr("data-name", function(d){return d.commonName;})
			.attr("r", function(d){return params.radiusScale(+d.mass_1_source);})
			.attr("cx", function(d) {return params.xAxisScale(+d[sortKey]/params.xNorm*params.xAxisScale.domain()[1]);})
			.attr("cy", function(d) {return params.yAxisScale(+d.mass_1_source);})
			.style("fill", function(d){return circleColor(d.messenger, d.mass_1_source);})
			.style("fill-opacity",params.opMass)
			.style("stroke", function(d){return circleColor(d.messenger, d.mass_1_source);})
			.style("stroke-opacity", 1)
			.style("stroke-width", 2)
			.style("cursor", "arrow")
			.on('mouseover',mouseOver)
			.on('mouseout',mouseOut);

	params.SVG.selectAll(".dot.m2.GW")
		.data(params.data).enter().filter(function(d) { return d.messenger == 'GW' && d.mass_2_source != null })
		.append("circle")
			.attr("class", function(d){return 'name-'+cleanString(d.commonName) + " dot m2 GW";})
			.attr("data-name", function(d){return d.commonName;})
			.attr("r", function(d){return params.radiusScale(+d.mass_2_source);})
			.attr("cx", function(d) {return params.xAxisScale(+d[sortKey]/params.xNorm*params.xAxisScale.domain()[1]);})
			.attr("cy", function(d) {return params.yAxisScale(+d.mass_2_source);})
			.style("fill", function(d){return circleColor(d.messenger, d.mass_2_source);})
			.style("fill-opacity",params.opMass)
			.style("stroke", function(d){return circleColor(d.messenger, d.mass_2_source);})
			.style("stroke-opacity", 1)
			.style("stroke-width", 2)
			.style("cursor", "arrow")
			.on('mouseover',mouseOver)
			.on('mouseout',mouseOut);

	//add any without final masses?
	params.SVG.selectAll(".dot.mf.no_final_mass.GW")
		.data(params.data).enter().filter(function(d) { return d.messenger == 'GW' && d.final_mass_source == null && d.total_mass_source != null})
		.append("circle")
			.attr("class", function(d){return 'name-'+cleanString(d.commonName) + " dot mf no_final_mass GW";})
			.attr("data-name", function(d){return d.commonName;})
			.attr("r", function(d){return params.radiusScale(+d.total_mass_source);})
			.attr("cx", function(d) {return params.xAxisScale(+(d[sortKey]/params.xNorm*params.xAxisScale.domain()[1]));})
			.attr("cy", function(d) {return params.yAxisScale(+d.total_mass_source);})
			.style("fill", function(d){return circleColor(d.messenger, d.total_mass_source);})
			.style("fill-opacity",params.opMass)
			.style("stroke", function(d){return circleColor(d.messenger, d.total_mass_source);})
			.style("stroke-opacity", 1)
			.style("stroke-width", 2)
			.style("cursor", "arrow")
			.on('mouseover',mouseOver)
			.on('mouseout',mouseOut)

	//add question marks to these w/o final masses
	params.SVG.selectAll(".text.mf.no_final_mass.GW")
		.data(params.data).enter().filter(function(d) {return d.messenger == 'GW' && d.final_mass_source == null && d.total_mass_source != null})	
		.append("text")		
			.attr("class", function(d){return 'name-'+cleanString(d.commonName) + " text mf no_final_mass GW";})
			.attr("data-name", function(d){return d.commonName;})
			.attr("x", function(d) {return params.xAxisScale(+(d[sortKey]/params.xNorm*params.xAxisScale.domain()[1]));})
			.attr("y", function(d) {return params.yAxisScale(+d.total_mass_source) + 0.75*params.radiusScale(+d.total_mass_source);})
			.style('fill','white')
			.style('font-family',"sans-serif")
			.style('font-size',function(d) {return 1.5*params.radiusScale(+d.total_mass_source)+"px";})
			.style("text-anchor", "middle")
			.style("cursor", "arrow")
			.text("?")
			.on('mouseover',mouseOver)
			.on('mouseout',mouseOut)

	//add the EM data
	params.SVG.selectAll(".dot.mf.EM")
		.data(params.EMdata).enter().filter(function(d) { return d.messenger == 'EM' && d.mass != null })
		.append("circle")
			.attr("class", function(d){return 'name-'+cleanString(d.commonName) + " dot mf EM";})
			.attr("data-name", function(d){return d.commonName;})
			.attr("r", function(d){return params.radiusScale(+d.mass);})
			.attr("cx", function(d) {return params.xAxisScale(+d[sortKey]/params.xNorm*params.xAxisScale.domain()[1]);})
			.attr("cy", function(d) {return params.yAxisScale(+d.mass);})
			.style("fill", function(d){return circleColor(d.messenger, d.mass);})
			.style("fill-opacity",params.opMass)
			.style("stroke", function(d){return circleColor(d.messenger, d.mass);})
			.style("stroke-opacity", 1)
			.style("stroke-width", 2)
			.style("cursor", "arrow")
			.on('mouseover',mouseOver)
			.on('mouseout',mouseOut);
}

function moveData(messenger,sortKey){
	//sortKey = 'risingIndex';
	//sortKey = 'fallingIndex';
	//sortKey = 'peakIndex';
	//sortKey = 'valleyIndex';

	console.log('moving data', messenger, sortKey)

	d3.selectAll('.dot.'+messenger).transition().duration(params.sortTransitionDuration)
		.attr("cx", function(d) {return params.xAxisScale(+d[sortKey]/params.xNorm*params.xAxisScale.domain()[1]);})

	d3.selectAll('.text.'+messenger).transition().duration(params.sortTransitionDuration)
		.attr("x", function(d) {return params.xAxisScale(+(d[sortKey]/params.xNorm*params.xAxisScale.domain()[1]));})
		
	if (messenger == 'GW'){
		d3.selectAll('.arrow.GW').transition().duration(params.sortTransitionDuration)
			.attr('transform',function(d){
				var x = params.xAxisScale(d[sortKey]/params.xNorm*params.xAxisScale.domain()[1]);
				var y = 0;
				return 'translate(' + x +',' + y + ')';
			})
	}
}
function sortPlot(){
	var classes = d3.select(this).attr('class').split(' ');

	var messenger = null;
	if (classes.indexOf('GW') != -1){
		messenger = 'GW'
	}
	if (classes.indexOf('EM') != -1){
		messenger = 'EM'
	}	

	if (messenger){
		if (classes.indexOf('rising') != -1){
			moveData(messenger,'risingIndex')
		}
		if (classes.indexOf('falling') != -1){
			moveData(messenger,'fallingIndex')
		}
		if (classes.indexOf('peaked') != -1){
			moveData(messenger,'peakIndex')
		}
		if (classes.indexOf('valley') != -1){
			moveData(messenger,'valleyIndex')
		}
	}


}
function resizePlot(){
	//resize the plot when the user resizes the window
	//for now I'll just redraw
	d3.select('#svg').remove();
	createPlot();
}