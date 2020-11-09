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
	params.radiusScale = d3.scaleLinear().range([5,10]).domain(d3.extent(params.data, function(d){ return +d.final_mass_source; }));

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

//want to start at a point in between the edge of a triangle and arc to point in between
//https://stackoverflow.com/questions/64423115/d3-js-multiple-relationship-visual-linkhorizontal-tangled-tree
//http://using-d3js.com/05_01_paths.html
function drawCurvedTriangle(tri){
	const context = d3.path();

	//creating points around the triangle accounting for the circles.  I will assume that the top is provided first
	//need to calculate the angles

	context.moveTo(tri[0].x, tri[0].y - tri[0].r);
	context.arc(tri[0].x, tri[0].y, tri[0].r, 3*Math.PI/2, 0);
	context.lineTo(tri[1].x + tri[1].r, tri[1].y);
	context.arc(tri[1].x, tri[1].y, tri[1].r, 0, Math.PI/2);
	context.lineTo(tri[2].x, tri[2].y + tri[2].r);
	context.arc(tri[2].x, tri[2].y, tri[2].r, Math.PI/2., Math.PI);
	context.lineTo(tri[0].x - tri[0].r, tri[0].y)
	context.arc(tri[0].x, tri[0].y, tri[0].r, Math.PI, 3*Math.PI/2);


	return context + "";
};

function populatePlot(){
//add the data to the plot
	console.log('populating plot ...');
	var xNorm = (params.data.length+1);
	var xOffset = 1.2; //multiplied by a random number between 0.5 and 1 (negative or positive)  below for look




	// //construct the line data
	// var lineData = [];
	// for (var i=0; i<params.data.length; i+=1){
	// 	var d = params.data[i];

	// 	var x = +d.index/xNorm*params.xAxisScale.domain()[1];

	// 	var y0 = +d.mass_2_source;
	// 	if (y0 == null || y0 == 0) y0 = +d.mass_1_source;

	// 	var y1 = +d.final_mass_source;
	// 	if (y1 == null || y1 == 0) y1 = +d.mass_1_source;

	// 	var lne = [{'x':x,'y':y0},{'x':x,'y':y1}]
	// 	lineData.push(lne);
	// }

	// var line = d3.line()
	// 	.x(function(d){ return params.xAxisScale(d.x); })
	// 	.y(function(d){ return params.yAxisScale(d.y); });

	// params.svg.selectAll(".line.m12f")
	// 	.data(lineData).enter()
	// 	.append("path")
	// 		.attr("class", "line m12f")
	// 		.attr("fill", "none")
	// 		.attr("stroke", "white")
	// 		.attr("stroke-width", 2)
	// 		.style("opacity",0.85)
	// 		.attr("d", line)	

	//construct the triangle data and draw
	var triangleData = [];
	for (var i=0; i<params.data.length; i+=1){
		var d = params.data[i];

		//final mass in middle
		var x0 = +d.index/xNorm*params.xAxisScale.domain()[1];
		var y0 = +d.final_mass_source;
		var r0 = +d.final_mass_source;

		//keep the order clockwise
		var mr = d.mass_1_source;
		var ml = d.mass_2_source;
		if (d.random > 0){
			mr = d.mass_2_source;
			ml = d.mass_1_source
		}
		var x1 = +(d.index + xOffset*Math.abs(d.random))/xNorm*params.xAxisScale.domain()[1];
		var y1 = +mr;
		var r1 = +mr;

		//m2 
		var x2 = +(d.index - xOffset*Math.abs(d.random))/xNorm*params.xAxisScale.domain()[1];
		var y2 = +ml;
		var r2 = +ml;

		if (y0 == null || y0 == 0) {
			x0 = x1;
			y0 = y1;
			r0 = r1;
		}

		if (y2 == null || y2 == 0) {
			x2 = x1;
			y2 = y1;
			r2 = r1;
		}

		var lne = [{'x':params.xAxisScale(x0),'y':params.yAxisScale(y0),'r':params.radiusScale(r0)}, 
				   {'x':params.xAxisScale(x1),'y':params.yAxisScale(y1),'r':params.radiusScale(r1)}, 
				   {'x':params.xAxisScale(x2),'y':params.yAxisScale(y2),'r':params.radiusScale(r2)}];
		var path = drawCurvedTriangle(lne);
		params.svg.append("path")
			.attr('stroke', 'red')
			.attr('fill', '#00BFFF')	
			//.attr('fill', 'none')	
			.style("opacity",0.5)
			.attr("d", path.toString())
			.on('mouseover',function(d){
				d3.select(this).transition().duration(200).style("opacity",1)
				d3.select(this).classed("inFront",true);
			})
			.on('mouseout',function(d){
				d3.select(this).transition().duration(200).style("opacity",0.5)
				d3.select(this).classed("inFront",false);
			})

		triangleData.push(lne);
	}
	//console.log('triangles', triangleData)

	// // prepare a helper function
	// // curve explorer: http://bl.ocks.org/d3indepth/b6d4845973089bc1012dec1674d3aff8
	// var line = d3.line()
	// 	.curve(d3.curveCardinalClosed.tension(0.2))
	// 	.x(function(d){ return d.x; })
	// 	.y(function(d){ return d.y; })

	// // Add the path using this helper function
	// params.svg.selectAll(".triangle")
	// 	.data(triangleData).enter()
	// 	.append("path")
	// 		.attr("class", "triangle")
	// 		.attr('stroke', '#00BFFF')
	// 		.attr('fill', '#00BFFF')	
	// 		// .attr('fill', 'none')	
	// 		.style("opacity",0.3)
	// 		.attr('d', line);


	//add all the dots for final masses
	var op = 0.5
	var co = "white"; //'#00BFFF'
	params.svg.selectAll(".dot.mf")
		.data(params.data).enter()
		.append("circle").filter(function(d) { return d.final_mass_source != null })
			.attr("class", "dot mf")
			.attr("r", function(d){return params.radiusScale(+d.final_mass_source)})
			.attr("cx", function(d) {return params.xAxisScale(+(d.index/xNorm*params.xAxisScale.domain()[1])); })
			.attr("cy", function(d) {return params.yAxisScale(+d.final_mass_source); })
			.style("fill", co)
			.style("opacity",op)

	params.svg.selectAll(".dot.m1")
		.data(params.data).enter()
		.append("circle").filter(function(d) { return d.mass_1_source != null })
			.attr("class", "dot m1")
			.attr("r", function(d){return params.radiusScale(+d.mass_1_source)})
			.attr("cx", function(d) {return params.xAxisScale(+((d.index - xOffset*d.random)/xNorm*params.xAxisScale.domain()[1])); })
			.attr("cy", function(d) {return params.yAxisScale(+d.mass_1_source); })
			//.style("fill", 'red')
			.style("fill", co)
			.style("opacity",op)

	params.svg.selectAll(".dot.m2")
		.data(params.data).enter()
		.append("circle").filter(function(d) { return d.mass_2_source != null })
			.attr("class", "dot m2")
			.attr("r", function(d){return params.radiusScale(+d.mass_2_source)})
			.attr("cx", function(d) {return params.xAxisScale(+((d.index + xOffset*d.random)/xNorm*params.xAxisScale.domain()[1])); })
			.attr("cy", function(d) {return params.yAxisScale(+d.mass_2_source); })
			//.style("fill", 'orange')
			.style("fill", co)
			.style("opacity",op);
}



function resizePlot(){
	//resize the plot when the user resizes the window
	//for now I'll just redraw
	d3.select('#svg').remove();
	createPlot();
}