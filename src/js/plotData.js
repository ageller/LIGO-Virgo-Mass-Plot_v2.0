function createPlot(svg, width=null, height=null, resizing=false, saveSizes=true){
//set up the plot axes, etc.
	//console.log('creating plot object ...');

	params.plotReady = false;

	if (!width) width = window.innerWidth; 
	if (!height) height = window.innerHeight;

	var SVGwidth = width - params.SVGmargin.left - params.SVGmargin.right; 
	var SVGheight = height - params.SVGmargin.top - params.SVGmargin.bottom; 

	var SVGpadding = {'top': 10, 'bottom':0.07*SVGheight,'left': 0.05*SVGwidth,'right':10};

	//define the SVG element that will contain the plot
	svg
		.style('height',SVGheight + 'px')
		.style('width',SVGwidth + 'px')
		.style('background-color',params.SVGbackground)
		.style('font-family','sans-serif')
		.style('transform', 'translate(' + (params.SVGmargin.left + params.controlsX/2) + 'px,' + params.SVGmargin.top + 'px)scaleX(' + params.SVGscale + ')')

	var annotations = addPlotAnnotations(svg, SVGwidth, SVGheight, SVGpadding);

	//add a linear gradient for the mass-gap objects
	var gradient = svg.append('linearGradient')
		.attr('id','BHNSgrad')
		.attr('x1','0')
		.attr('x2','0')
		.attr('y1','0')
		.attr('y2','100%');
	gradient.append('stop')
		.attr('offset','50%')
		.attr('stop-color',params.colors.GWBH)
	gradient.append('stop')
		.attr('offset','50%')
		.attr('stop-color',params.colors.GWNS)

	var top = annotations.title.node().getBoundingClientRect().height + annotations.legend.node().getBoundingClientRect().height + SVGpadding.top;

	//in case I need this for rendering
	var saveMainPlot = params.mainPlot;

	svg.select('#mainPlot').remove();
	params.mainPlot = svg.append('g')
			.attr('id','mainPlot')
			.attr('transform', 'translate(' + SVGpadding.left + ',' + top + ')');

	params.mainPlot.append('g').attr('class','links toggledOn'); //will hold the links for the circle packing

	if (params.newData.length > 0 || params.transparentBackground == true) {
		console.log('have newData')
		d3.select('body').style('background-color','rgba(0,0,0,0)')
		svg.style('background-color','rgba(0,0,0,0)')
	}

	if (saveSizes){
		params.SVGwidth = SVGwidth;
		params.SVGheight = SVGheight;
		params.SVGpadding = SVGpadding;
	}

	if (params.viewType == 'default' || resizing){


		//define the radius scaling
		var radiusScale = d3.scaleLinear().range([params.sizeScaler*params.minRadius, params.sizeScaler*params.maxRadius]).domain(d3.extent(params.data, function(d){ return +d.final_mass_source; }));

		//define the axes
		var xAxisScale = d3.scaleLinear().range([0, SVGwidth - SVGpadding.left - SVGpadding.right]);
		var yAxisScale = d3.scaleLog().range([SVGheight - top - SVGpadding.bottom, 1]);

		xAxisScale.domain([0, SVGwidth - SVGpadding.left - SVGpadding.right]); //pixels on screen
		//params.yAxisScale.domain(d3.extent(params.data, function(d){if (d.final_mass_source != null) return +d.final_mass_source; })); //masses
		yAxisScale.domain(d3.extent([1, 300])); //masses

		var yAxis = d3.axisLeft(yAxisScale)
			.scale(yAxisScale)
			.tickSize(-(SVGwidth - SVGpadding.left - SVGpadding.right))
			.tickFormat(d3.format('d'))
			.tickValues([1,2,5,10,20,50,100,200]);

		params.mainPlot.append('g')
			.attr('class', 'axis yaxis toggledOn')
			.style('font-size', 0.015*SVGwidth + 'px')
			.call(yAxis);

		params.mainPlot.selectAll('.axis').selectAll('line')
			.style('stroke-width','2px')
		params.mainPlot.select('.yaxis').selectAll('.domain').remove();

		var axisLabel = params.mainPlot.append('text')
			.attr('class', 'axis axisLabel yaxis toggledOn')
			.attr('transform', 'rotate(-90)')
			.attr('x', 0)
			.attr('y', 0)
			.style('text-anchor', 'end')
			.style('font-size',0.022*SVGwidth + 'px')
			.text('Solar Masses')
		axisLabel.attr('dy','-'+(axisLabel.node().getBoundingClientRect().width/params.SVGscale + 10)+'px')

		//mass Gap
		params.mainPlot.append('rect')
			.attr('class','massGap toggledOff')
			.attr('x',xAxisScale(0))
			.attr('y',yAxisScale(params.massGap[1]))
			.attr('width',(xAxisScale(SVGwidth - SVGpadding.left - SVGpadding.right)) + 'px')
			.attr('height',(yAxisScale(params.massGap[0]) - yAxisScale(params.massGap[1])) + 'px')
			.attr('fill','#404040')
			.style('opacity',0)

		params.mainPlot.append('text')
			.attr('class','massGap  toggledOff')
			.attr('x', SVGwidth/2. + 'px')
			.attr('y', (yAxisScale(params.massGap[0]) + yAxisScale(params.massGap[1]))/2. + 'px')
			.attr('dx', -0.025*SVGwidth*2. + 'px')
			.attr('dy', (yAxisScale(params.massGap[0]) - yAxisScale(params.massGap[1]))/2. - 0.025*SVGwidth/2. + 'px')
			.style('text-anchor', 'middle')
			.style('font-size', 0.025*SVGwidth)
			.style('font-weight', 'bold')
			.style('color','black')
			.style('opacity',0)
			.text('Mass Gap?')

		plotDefaultData(radiusScale, xAxisScale, yAxisScale);

		if (saveSizes){
			params.radiusScale = radiusScale;
			params.xAxisScale = xAxisScale;
			params.yAxisScale = yAxisScale;
			params.yAxis = yAxis;
		}
	} else {
		params.plotReady = true;

		//add in the circles 
		if (saveMainPlot){
			var scaleX =  width/window.innerWidth;
			var scaleY = height/window.innerHeight;

			saveMainPlot.selectAll('.dot,.link,.extraNode,.text').each(function(){
				var clone = this.cloneNode(true);
				clone.style.transform = 'scale(' + scaleX + ',' + scaleY + ')';
        		clone.style.transformOrigin = "0px 0px";
				params.mainPlot.node().appendChild(clone);
			})
		}
	}

}

function addPlotAnnotations(svg, SVGwidth, SVGheight, SVGpadding){
	svg.select('#annotations').remove();

	var annotations = svg.append('g').attr('id','annotations');
	
	var credits = annotations.append('text')
		.attr('id', 'credits')
		.attr('class', 'credits')
		.attr('x', SVGwidth/2. + 'px')
		.attr('y', SVGheight + 'px')
		.attr('dx', SVGpadding.left/2. + 'px')
		.attr('dy', '-10px')
		.style('font-size', 0.02*SVGwidth + 'px')
		.text('LIGO-Virgo-KAGRA | Aaron Geller | Northwestern');

	var title = annotations.append('text')
		.attr('id', 'title')
		.attr('class', 'title plotTitle toggledOn')
		.attr('x', SVGwidth/2. + 'px')
		.attr('y', '0px')
		.attr('dx', SVGpadding.left/2. + 'px')
		.style('font-size', 0.05*SVGwidth + 'px')
		.text('Masses in the Stellar Graveyard');
	var titleBbox = title.node().getBoundingClientRect();
	title.attr('dy', titleBbox.height*0.8)

	var legend = annotations.append('g').attr('id','legend').attr('class','plotLegend toggledOn')

	var x0 = SVGpadding.left*params.SVGscale;
	var GWBH = legend.append('text')
		.attr('class', 'legendText GW BH toggledOn')
		.attr('x', x0 + 'px')
		.attr('y', '0px')
		.attr('dx', '0px')
		.attr('dy', '0px')
		.style('fill',params.colors.GWBH)
		.style('font-size', 0.015*SVGwidth + 'px')
		.text('LIGO-Virgo-KAGRA Black Holes');
	var offset = (GWBH.node().getBoundingClientRect().width + 0.01*SVGwidth)/params.SVGscale;
	var GWNS = legend.append('text')
		.attr('class', 'legendText GW NS toggledOn')
		.attr('x', x0 + offset + 'px')
		.attr('y', '0px')
		.attr('dx', '0px')
		.attr('dy', '0px')
		.style('fill',params.colors.GWNS)
		.style('font-size', 0.015*SVGwidth + 'px')
		.text('LIGO-Virgo-KAGRA Neutron Stars');
	offset += (GWNS.node().getBoundingClientRect().width + 0.01*SVGwidth)/params.SVGscale;
	var EMBH = legend.append('text')
		.attr('class', 'legendText EM BH toggledOn')
		.attr('x', x0 + offset + 'px')
		.attr('y', '0px')
		.attr('dx', '0px')
		.attr('dy', '0px')
		.style('fill',params.colors.EMBH)
		.style('font-size', 0.015*SVGwidth + 'px')
		.text('EM Black Holes');
	offset += (EMBH.node().getBoundingClientRect().width + 0.01*SVGwidth)/params.SVGscale;
	var EMNS = legend.append('text')
		.attr('class', 'legendText EM NS toggledOn')
		.attr('x', x0 + offset + 'px')
		.attr('y', '0px')
		.attr('dx', '0px')
		.attr('dy', '0px')
		.style('fill',params.colors.EMNS)
		.style('font-size', 0.015*SVGwidth + 'px')
		.text('EM Neutron Stars');

	var legendBbox = legend.node().getBoundingClientRect();
	var legendY = legendBbox.height + titleBbox.height;
	var legendX = (SVGwidth - SVGpadding.left - legendBbox.width)/2.*params.SVGscale
	legend.attr('transform','translate(' +legendX + ',' + legendY + ')')

	return {'title':title, 'legend':legend,'credits':credits};
}

//https://stackoverflow.com/questions/64423115/d3-js-multiple-relationship-visual-linkhorizontal-tangled-tree
//http://using-d3js.com/05_01_paths.html
function createArrow(d, radiusScale=null, xAxisScale=null, yAxisScale=null){

	if (!radiusScale) radiusScale = params.radiusScale;
	if (!xAxisScale) xAxisScale = params.xAxisScale;
	if (!yAxisScale) yAxisScale = params.yAxisScale;

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
	x = xAxisScale(x);
	y0 = yAxisScale(y0);
	y1 = yAxisScale(y1);
	r0 = radiusScale(r0);
	r1 = radiusScale(r1);

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


function plotDefaultData(radiusScale, xAxisScale, yAxisScale){
//add the data to the plot
	//console.log('populating plot ...');
	params.xNorm = (params.data.length + 2);

	//construct the arrows for GW sources
	params.mainPlot.selectAll('.arrow.GW')
		.data(params.data).enter().filter(function(d) { return d.messenger == 'GW'})
		.append('path')
			.attr('class',function(d){
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

				//check if this is a new source
				var clsAddOn = '';
				if (params.newData.includes(d.commonName)) clsAddOn = ' newData ';
				return 'name-'+cleanString(d.commonName) + ' ' + crem + ' ' + d['catalog.shortName'].replace('-confident','').replace('.','-') + ' arrow GW clickable toggledOn' + clsAddOn;
			})
			.attr('data-name', function(d){return d.commonName})
			.attr('stroke', 'none')
			.attr('fill', 'white')	
			.style('opacity',0.5)
			.style('cursor', 'pointer')
			.attr('transform',function(d){
				var x = xAxisScale(d[params.GWsortKey]/params.xNorm*xAxisScale.domain()[1]);
				var y = 0;
				return 'translate(' + x +',' + y + ')';
			})
			.attr('d', function(d){return createArrow(d, radiusScale, xAxisScale, yAxisScale)})
			//.on('mouseover',mouseOver)
			//.on('mouseout',mouseOut);
			.on('click',showTooltip)



	//create elements for all the circles
	params.mainPlot.selectAll('.dot').data(params.plotData).enter()
		.append('circle')
			.attr('class', function(d){return d.classString+' toggledOn';});

	//create elements for the question marks
	params.mainPlot.selectAll('.qmark').data(params.plotData).enter().filter(function(d){return d.qmark;})
		.append('text')
			.attr('class', function(d){return d.classString.replace('dot','text') + ' qmark toggledOn';})


	//now add all the circles
	params.mainPlot.selectAll('circle').each(function(d){
		d3.select(this)
			.attr('data-name', params.data[d.dataIndex].commonName)
			.attr('r', defineRadius(d, radiusScale))
			.attr('cx', defineXpos(d, d3.select(this).attr('class'), xAxisScale))
			.attr('cy', defineYpos(d, yAxisScale))
			.style('fill', function(){
				var color = defineColor(d,d3.select(this).attr('class'));
				//special handling for GW mass-gap objects
				if (this.classList.contains('GW') && d.mass > params.massGap[0] && d.mass < params.massGap[1]){
					color = "url(#BHNSgrad)";
				}
				return color;
			})
			.style('fill-opacity',params.opMass)
			.style('stroke', function(){
				var color = defineColor(d,d3.select(this).attr('class'));
				//special handling for GW mass-gap objects
				if (this.classList.contains('GW') && d.mass > params.massGap[0] && d.mass < params.massGap[1]){
					color = "url(#BHNSgrad)";
				}
				return color;
			})
			.style('stroke-width', function(){
				var size = 2*params.sizeScaler;
				// if (this.classList.contains('GW') && d.mass > params.massGap[0] && d.mass < params.massGap[1]){
				// 	size = defineRadius(d, radiusScale)/2.
				// }
				return size + 'px';
			})
			.style('stroke-opacity', 1)
			.style('cursor', 'pointer')
			//.on('mouseover',mouseOver)
			//.on('mouseout',mouseOut);
			.on('click',showTooltip)
			.call(d3.drag() // call specific function when circle is dragged
				.on('start', dragstarted)
				.on('drag', dragged)
				.on('end', dragended));

	});

	//add all the question marks
	params.mainPlot.selectAll('.qmark').each(function(d){
		d3.select(this)
			.attr('data-name', params.data[d.dataIndex].commonName)
			.attr('x', defineXpos(d, d3.select(this).attr('class'), xAxisScale))
			.attr('y', defineYpos(d, yAxisScale) + 0.5*defineRadius(d, radiusScale))
			.style('fill','black')
			.style('font-family','sans-serif')
			.style('font-weight','bold')
			.style('font-size', 1.5*defineRadius(d,  radiusScale)+'px')
			.style('text-anchor', 'middle')
			.style('cursor', 'pointer')
			.text('?')
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

function defineXpos(d, classStr, scale=null, reset=false){
	if (d){
		if ('dataIndex' in d) dUse = params.data[d.dataIndex];
		if (reset) return d.x;

		if (!scale) scale = params.xAxisScale;

		var cls = '.'+classStr.replace('clickable','').replaceAll(' ','.');

		var skey = params.GWsortKey;
		if (cls.includes('EM')) skey = params.EMsortKey;
		var x = scale(+(dUse[skey]/params.xNorm*scale.domain()[1]));

		d.x = x;
		return x;
	}
}

function defineYpos(d, scale=null, reset=false){
	if (d){
		if (reset) return d.y;

		if (!scale) scale = params.yAxisScale;

		var y = scale(+d.mass);

		d.y = y;
		return y;
	}
}

function defineRadius(d, scale=null){
	if (d){
		if (!scale) scale = params.radiusScale;

		var r = scale(+d.mass);

		d.r = r;
		return r;
	}
}

function defineColor(d, classStr){
	if (d){
		var cls = '.'+classStr.replace('clickable','').replaceAll(' ','.');

		var tp = 'GW';
		if (cls.includes('.EM')) tp = 'EM';

		var rem = 'BH'
		if (d.mass < params.BHMinMass) rem = 'NS';

        // if there is a type in EM data, use that
        if (tp == 'EM'){
            if ('type' in params.data[d.dataIndex]){
                let check = params.data[d.dataIndex].type;
                if (check == 'EM' | check == 'BH') rem = check;
            }
        }

		var key = tp+rem;

		return params.colors[key];
	}

}

function resizePlot(){
	//resize the plot when the user resizes the window
	//for now I'll just redraw in the default mode
	params.plotReady = true;
	var saveView = params.viewType;
	//remove the tooltip
	d3.select('#tooltip').style('opacity',0).style('left','-500px');
	params.selectedElement = null;
	
	if (params.viewType == 'packing'|| params.viewType == 'linkedPacking' || params.viewType == 'nodes') {
		//reset to default
		params.plotReady = false;
		d3.selectAll('.view').select('input').node().checked = false;
		d3.select('.view.default').select('input').node().checked = true;
		changeView(null, ['default']);
	}

	clearInterval(params.readyCheck);
	params.readyCheck = setInterval(function(){ 
		if (params.plotReady){
			clearInterval(params.readyCheck);
			params.sizeScaler = window.innerWidth/params.targetWidth;
			params.sizeScalerOrg = params.sizeScaler;
			console.log('checking render settings 0', params.renderX, params.renderY, params.renderXchanged, params.renderYchanged)

			if (!params.renderXchanged) params.renderX = window.innerWidth;
			if (!params.renderYchanged) params.renderY = window.innerHeight;

			//not sure if it is correct to set it here.
			if (params.fixedAspect) params.renderY = Math.round(params.renderAspect*params.renderX);

			d3.select('#renderX').attr('placeholder',params.renderX);
			d3.select('#renderY').attr('placeholder',params.renderY);
			console.log('checking render settings 1', params.renderX, params.renderY)

			createPlot(d3.select('#plotSVG'), null, null, true);
			params.readyCheck = setInterval(function(){ 
				if (params.plotReady){
					clearInterval(params.readyCheck);
					togglePlot();
					console.log('checking render settings 2', params.renderX, params.renderY)
					// params.viewType = saveView;
					// changeView(null, [saveView]);
				} 
			}, 100);
		} 
	}, 100);


}

// What happens when a circle is dragged
function dragstarted(event, d) {
	if (params.viewType == 'packing' || params.viewType == 'linkedPacking' || params.viewType == 'nodes'){
		if (!event.active && d.parent && params.parentSimulation) params.parentSimulation.alphaTarget(.01).restart();
		d.fx = d.x;
		d.fy = d.y;
	}
}
function dragged(event, d) {
	if (params.viewType == 'packing' || params.viewType == 'linkedPacking' || params.viewType == 'nodes'){
		d.fx = event.x;
		d.fy = event.y;
		if (!d.parent){
			d.x = event.x;
			d.y = event.y;
		}
	}
}
function dragended(event, d) {
	if (params.viewType == 'packing' || params.viewType == 'linkedPacking' || params.viewType == 'nodes'){
		if (!event.active && d.parent && params.parentSimulation) params.parentSimulation.alphaTarget(.01);
		d.fx = null;
		d.fy = null;
	}
}
