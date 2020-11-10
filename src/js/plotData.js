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
	params.radiusScale = d3.scaleLinear().range([5,25]).domain(d3.extent(params.data, function(d){ return +d.final_mass_source; }));

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
function drawArrow(pts){
	const context = d3.path();

	var dist = Math.abs(pts[1].y - pts[0].y);

	//tail
	context.moveTo(pts[0].x - params.arrowThickBottom - params.arrowCurveTail,    pts[1].y + params.arrowHeadStart);
	context.quadraticCurveTo(pts[0].x - params.arrowThickBottom, pts[1].y + dist/2., pts[0].x - params.arrowThickBottom, pts[0].y);
	context.lineTo(pts[0].x + params.arrowThickBottom, pts[0].y);
	context.quadraticCurveTo(pts[0].x + params.arrowThickBottom, pts[1].y + dist/2., pts[0].x + params.arrowThickBottom + params.arrowCurveTail, pts[1].y + params.arrowHeadStart);

	//head
	var theta0 = 0.25*Math.PI;
	var x1 = params.arrowThickBottom + params.arrowCurveTail + params.arrowThickTop;
	var rad = x1/Math.cos(theta0);
	var y1 = rad*Math.sin(theta0);
	var y2 = rad - y1;
	context.moveTo(pts[0].x + params.arrowThickBottom + params.arrowCurveTail + params.arrowThickTop,    pts[1].y + params.arrowHeadStart + y2);
	context.lineTo(pts[0].x, pts[1].y);
	context.lineTo(pts[0].x - params.arrowThickBottom - params.arrowCurveTail - params.arrowThickTop,    pts[1].y + params.arrowHeadStart + y2);

	context.arc(pts[0].x, pts[1].y + params.arrowHeadStart + rad, rad, Math.PI + theta0, 2.*Math.PI - theta0);

	//context.lineTo(pts[0].x + params.arrowThickBottom + params.arrowCurveTail + params.arrowThickTop,    pts[1].y + params.arrowHeadStart);
	//context.quadraticCurveTo(pts[0].x + params.arrowThickBottom + params.arrowCurveTail + params.arrowThickTop/2.,  pts[1].y + 0.8*params.arrowHeadStart, pts[0].x + params.arrowThickBottom + params.arrowCurveTail + params.arrowThickTop,    pts[1].y + params.arrowHeadStart);
	// context.moveTo(pts[0].x + params.arrowThickBottom + params.arrowCurveTail + params.arrowThickTop,    pts[1].y + params.arrowHeadStart);
	// context.lineTo(pts[0].x, pts[1].y);
	// context.lineTo(pts[0].x - params.arrowThickBottom - params.arrowCurveTail - params.arrowThickTop,    pts[1].y + params.arrowHeadStart);
	// context.arc(pts[0].x, pts[1].y + params.arrowHeadStart + 2.*params.arrowThickTop, 2.*params.arrowThickTop, 1.2*Math.PI, 1.8*Math.PI);

	// context.lineTo(pts[0].x, pts[1].y);
	// context.lineTo(pts[0].x - params.arrowThickBottom - params.arrowCurveTail - params.arrowThickTop,    pts[1].y + params.arrowHeadStart);
	// context.arc(pts[0].x, pts[1].y + params.arrowHeadStart + 2.*params.arrowThickTop, 2.*params.arrowThickTop, 1.2*Math.PI, 1.5*Math.PI);
	// context.lineTo(pts[0].x - params.arrowThickBottom - params.arrowCurveTail, pts[1].y + params.arrowHeadStart);



	return context + "";
};

function populatePlot(){
//add the data to the plot
	console.log('populating plot ...');
	var xNorm = (params.data.length+1);



	//construct the line data
	for (var i=0; i<params.data.length; i+=1){
		var d = params.data[i];

		var x = +d.index/xNorm*params.xAxisScale.domain()[1];

		var y0 = +d.mass_2_source;
		if (y0 == null || y0 == 0) y0 = +d.mass_1_source;

		var y1 = +d.final_mass_source;
		if (y1 == null || y1 == 0) y1 = +d.mass_1_source;

		var lne = [{'x':params.xAxisScale(x),'y':params.yAxisScale(y0)},
				   {'x':params.xAxisScale(x),'y':params.yAxisScale(y1)}];
		var path = drawArrow(lne);
		params.SVG.append("path")
			.attr("class",d.commonName + " arrow")
			//.attr('stroke', 'red')
			.attr('stroke', 'none')
			.attr('fill', 'white')	
			//.attr('fill', 'none')	
			.style("opacity",0.5)
			.attr("d", path.toString())
			.on('mouseover',function(){
				var name = d3.select(this).attr('class').split(" ")[0];
				d3.selectAll('.'+name).transition().duration(200).style("opacity",1)
				d3.selectAll('.'+name).classed("inFront",true);
			})
			.on('mouseout',function(){
				var name = d3.select(this).attr('class').split(" ")[0];
				d3.selectAll('.arrow.'+name).transition().duration(200).style("opacity",params.opArrow)
				d3.selectAll('.dot.'+name).transition().duration(200).style("opacity",params.opMass)
				d3.selectAll('.'+name).classed("inFront",false);
			})

	}	


	//add all the dots for all the masses
	var co = '#00BFFF'
	params.SVG.selectAll(".dot.mf")
		.data(params.data).enter()
		.append("circle").filter(function(d) { return d.final_mass_source != null })
			.attr("class", function(d){return d.commonName + " dot mf ";})
			.attr("r", function(d){return params.radiusScale(+d.final_mass_source)})
			.attr("cx", function(d) {return params.xAxisScale(+(d.index/xNorm*params.xAxisScale.domain()[1])); })
			.attr("cy", function(d) {return params.yAxisScale(+d.final_mass_source); })
			.style("fill", co)
			.style("opacity",params.opMass)

	params.SVG.selectAll(".dot.m1")
		.data(params.data).enter()
		.append("circle").filter(function(d) { return d.mass_1_source != null })
			.attr("class", function(d){return d.commonName + " dot m1";})
			.attr("r", function(d){return params.radiusScale(+d.mass_1_source)})
			.attr("cx", function(d) {return params.xAxisScale(+d.index/xNorm*params.xAxisScale.domain()[1]); })
			.attr("cy", function(d) {return params.yAxisScale(+d.mass_1_source); })
			//.style("fill", 'red')
			.style("fill", co)
			.style("opacity",params.opMass)

	params.SVG.selectAll(".dot.m2")
		.data(params.data).enter()
		.append("circle").filter(function(d) { return d.mass_2_source != null })
			.attr("class", function(d){return d.commonName + " dot m2";})
			.attr("r", function(d){return params.radiusScale(+d.mass_2_source)})
			.attr("cx", function(d) {return params.xAxisScale(+d.index/xNorm*params.xAxisScale.domain()[1]); })
			.attr("cy", function(d) {return params.yAxisScale(+d.mass_2_source); })
			//.style("fill", 'orange')
			.style("fill", co)
			.style("opacity",params.opMass);
}



function resizePlot(){
	//resize the plot when the user resizes the window
	//for now I'll just redraw
	d3.select('#svg').remove();
	createPlot();
}