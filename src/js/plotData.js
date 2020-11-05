function createPlot(){
//set up the plot axes, etc.
	console.log('creating plot object ...');

	params.SVGwidth = window.innerWidth - params.SVGmargin.left - params.SVGmargin.right; 
	params.SVGheight = window.innerHeight - params.SVGmargin.top - params.SVGmargin.bottom; 

	//define the SVG element that will contain the plot
	params.svg = d3.select('body').append('svg')
		.attr('id','svg')
		.style('height',params.SVGheight)
		.style('width',params.SVGwidth)
		.style('background-color',params.SVGbackground)
		.attr("transform", "translate(" + params.SVGmargin.left + "," + params.SVGmargin.top + ")")
		.append("g")
			.attr('id','mainPlot')
			.attr("transform", "translate(" + params.SVGpadding.left + "," + params.SVGpadding.top + ")");

	//define the radius scaling
	params.radiusScale = d3.scaleLinear().range([10,30]).domain(d3.extent(params.data, function(d){ return +d.final_mass_source; }));

	//define the axes
	params.xAxisScale = d3.scaleLinear().range([0, params.SVGwidth - params.SVGpadding.left - params.SVGpadding.right]);
	params.yAxisScale = d3.scaleLog().range([params.SVGheight - params.SVGpadding.top - params.SVGpadding.bottom, 1]);

	params.xAxisScale.domain([0, params.SVGwidth - params.SVGpadding.left - params.SVGpadding.right]); //pixels on screen
	//params.yAxisScale.domain(d3.extent(params.data, function(d){if (d.final_mass_source != null) return +d.final_mass_source; })); //masses
	params.yAxisScale.domain(d3.extent([1, 160])); //masses

	params.yAxis = d3.axisLeft(params.yAxisScale)
		.scale(params.yAxisScale)
		.tickSize(-(params.SVGwidth - params.SVGpadding.left - params.SVGpadding.right))
		.tickFormat(d3.format("d"))
		.tickValues([1,2,5,10,20,50,100,160]);

	params.svg.append("g")
		.attr("class", "axis yaxis")
		.call(params.yAxis);

	params.svg.selectAll('.axis').selectAll('line')
		.style('stroke-width','2px')
	params.svg.select('.yaxis').selectAll('.domain').remove();

	params.svg.append("text")
		.attr("class", "axisLabel yaxis")
		.attr("transform", "rotate(-90)")
		.attr("x", 0)
		.attr("y", -(params.SVGpadding.left-2))
		.attr("dy", ".71em")
		.style("text-anchor", "end")
		.text("Solar Masses")


	populatePlot();

}


function populatePlot(){
//add the data to the plot
	console.log('populating plot ...');
	var xNorm = (params.data.length+1)

	//add all the dots for final masses
	params.svg.selectAll(".dot.mf")
		.data(params.data).enter()
		.append("circle").filter(function(d) { return d.final_mass_source != null })
			.attr("class", "dot mf")
			.attr("r", function(d){return params.radiusScale(+d.final_mass_source)})
			.attr("cx", function(d) {return params.xAxisScale(+(d.index/xNorm*params.xAxisScale.domain()[1])); })
			.attr("cy", function(d) {return params.yAxisScale(+d.final_mass_source); })
			.style("fill", '#00BFFF')
			.style("opacity",0.85)

	params.svg.selectAll(".dot.m1")
		.data(params.data).enter()
		.append("circle").filter(function(d) { return d.mass_1_source != null })
			.attr("class", "dot m1")
			.attr("r", function(d){return params.radiusScale(+d.mass_1_source)})
			.attr("cx", function(d) {return params.xAxisScale(+(d.index/xNorm*params.xAxisScale.domain()[1])); })
			.attr("cy", function(d) {return params.yAxisScale(+d.mass_1_source); })
			.style("fill", 'red')
			.style("opacity",0.85)

	params.svg.selectAll(".dot.m2")
		.data(params.data).enter()
		.append("circle").filter(function(d) { return d.mass_2_source != null })
			.attr("class", "dot m2")
			.attr("r", function(d){return params.radiusScale(+d.mass_2_source)})
			.attr("cx", function(d) {return params.xAxisScale(+(d.index/xNorm*params.xAxisScale.domain()[1])); })
			.attr("cy", function(d) {return params.yAxisScale(+d.mass_2_source); })
			.style("fill", 'orange')
			.style("opacity",0.85);

	//construct the line data
	var lineData = [];
	for (var i=0; i<params.data.length; i+=1){
		var d = params.data[i];

		var x = +d.index/xNorm*params.xAxisScale.domain()[1];

		var y0 = +d.mass_2_source;
		if (y0 == null || y0 == 0) y0 = +d.mass_1_source;

		var y1 = +d.final_mass_source;
		if (y1 == null || y1 == 0) y1 = +d.mass_1_source;

		var lne = [{'x':x,'y':y0},{'x':x,'y':y1}]
		lineData.push(lne);
	}

	var line = d3.line()
		.x(function(d){ return params.xAxisScale(d.x); })
		.y(function(d){ return params.yAxisScale(d.y); });

	params.svg.selectAll(".line.m12f")
		.data(lineData).enter()
		.append("path")
			.attr("class", "line m12f")
			.attr("fill", "none")
			.attr("stroke", "white")
			.attr("stroke-width", 2)
			.style("opacity",0.85)
			.attr("d", line)		
}

function resizePlot(){
	//resize the plot when the user resizes the window
	//for now I'll just redraw
	d3.select('#svg').remove();
	createPlot();
}