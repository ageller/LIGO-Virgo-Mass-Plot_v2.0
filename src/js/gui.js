//open the controls panel and resize the plot
function toggleControls(){
	//change the hamburger symbol
	d3.select('#hamburger').node().classList.toggle('change');
	d3.select('#controls').style('display','inline-block');


	//move the controls into view
	var bbox = d3.select('#controls').node().getBoundingClientRect();
	params.controlsX = -bbox.width;
	if (!d3.select('#hamburger').classed('change')){
		params.controlsX = 0;
	}
	d3.select('#controls').transition().duration(params.controlsTransitionDuration)
		.style('transform', 'translateX('+params.controlsX+'px)')

	var margin = {};
	var keys = Object.keys(params.SVGmargin);
	for (var i=0; i<keys.length; i++) margin[keys[i]] = params.SVGmargin[keys[i]]*params.sizeScaler;


	params.SVGscale = 1. - Math.abs(params.controlsX/window.innerWidth);
	d3.select('#plotSVG').transition().duration(params.controlsTransitionDuration)
		.style('transform', 'translate(' + (margin.left + params.controlsX/2) + 'px,' + margin.top + 'px)scaleX(' + params.SVGscale + ')')


}

//handle the dropdown menus
function dropdown(){
	var doDrop = true;
	if (params.viewType == 'packing' && this.id.includes('sort')) doDrop = false;

	//expand the dropdown (is there a way to do this purely in css with unknown height?)
	var dropdown = d3.select('#'+this.id+'Dropdown').select('.dropdown-content')
	var shown = dropdown.classed('show-dropdown');

	if (doDrop || shown){
		//rotate the triangle
		var navi = d3.select(this).select('.navi');
		navi.classed("rotate180", !navi.classed("rotate180")); 

		if (shown){
			dropdown
				.style('visibility','hidden')
				.style('opacity',0)
				.style('height',0)
				.classed("show-dropdown", false)
		} else {
			dropdown
				.style('visibility','visible')
				.style('opacity',1)
				.style('height',params.dropdownHeights[this.parentNode.id] + 'px')
				.classed("show-dropdown", true)
		}
	}



}

//resizing the plot elements based on input from the controls panel
function moveData(messenger,sortKey, reset=false, dur=params.sortTransitionDuration, ease=d3.easePolyInOut){
	//sortKey = 'risingIndex';
	//sortKey = 'fallingIndex';
	//sortKey = 'peakIndex';
	//sortKey = 'valleyIndex';


	console.log('moving data', messenger, sortKey);

	params[messenger+'sortKey'] = sortKey;

	d3.selectAll('.dot.'+messenger).transition().ease(ease).duration(dur)
		.attr("cx", function(d) {return defineXpos(d,d3.select(this).attr('class'),reset);})
		.attr("cy", function(d) {return defineYpos(d,d3.select(this).attr('class'),reset);})
		.attr("r", function(d) {return defineRadius(d,d3.select(this).attr('class'),reset);})

	d3.selectAll('.text.qmark.'+messenger).transition().ease(ease).duration(dur)
		.attr("x", function(d) {return defineXpos(d,d3.select(this).attr('class'),reset);})
		.attr("y", function(d) {return defineYpos(d,d3.select(this).attr('class'),reset) + 0.5*defineRadius(d,d3.select(this).attr('class'),reset);})
		.style('font-size',function(d) {return 1.5*defineRadius(d,d3.select(this).attr('class'),reset)+"px";})

	if (messenger == 'GW' && params.viewType == 'default'){
		d3.selectAll('.arrow.GW').transition().ease(ease).duration(dur)
			.attr('transform',function(d){
				var x = params.xAxisScale(d[sortKey]/params.xNorm*params.xAxisScale.domain()[1]);
				var y = 0;
				return 'translate(' + x +',' + y + ')';
			})
	}
}

function sortPlot(){
	if (params.viewType == 'default'){
		var classes = d3.select(this).attr('class').split(' ');

		var messenger = null;
		if (classes.indexOf('GW') != -1){
			messenger = 'GW'
		}
		if (classes.indexOf('EM') != -1){
			messenger = 'EM'
		}	

		if (messenger){
			srt = classes[classes.length-1];
			moveData(messenger,srt+'Index');
		}
	}
}

function changeView(){
	var classes = d3.select(this).attr('class');

	//default
	if (classes.includes('default')){
		params.parentSimulation.stop();
		// params.childSimulations.forEach(function(d){d.stop()});
		params.childSimulations.forEach(function(d){clearInterval(d)});

		params.viewType = 'default';

		//enable the sorting
		d3.select('#sortGWDropdown').classed('disabled', false);
		d3.select('#sortGWDropdown').select('.navi').classed('disabled', false);
		d3.select('#sortGWDropdown').selectAll('input').attr('disabled', false);
		d3.select('#sortEMDropdown').classed('disabled', false);
		d3.select('#sortEMDropdown').select('.navi').classed('disabled', false);
		d3.select('#sortEMDropdown').selectAll('input').attr('disabled', false);
		d3.select('.massGaptoggle').classed('disabled', false);
		d3.select('.massGaptoggle').select('input').attr('disabled', false);

		//turn on the axes
		d3.selectAll('.axis').transition().duration(params.fadeTransitionDuration).style("opacity",1);

		//reset the radius scaling
		params.sizeScaler = params.sizeScalerOrg;
		params.radiusScale.range([params.sizeScaler*params.minRadius, params.sizeScaler*params.maxRadius]);

		//determine with sort method is used (there is likely a better way to do this)
		srtGW = 'diamond'
		d3.selectAll('.radioLabl.sort.GW').each(function(d){
			var cls = d3.select(this).attr('class').split(' ');
			if (this.checked == 'checked') srtGW = cls[cls.length - 1];
		});
		srtEM= 'valley'
		d3.selectAll('.radioLabl.sort.EM').each(function(d){
			var cls = d3.select(this).attr('class').split(' ');
			if (this.checked == 'checked') srtEM = cls[cls.length - 1];
		});

		//move and resize the data
		moveData('GW',srtGW+'Index');
		moveData('EM',srtEM+'Index');

		//reset the opacities (which will also turn on the arrows)
		setTimeout(resetOpacities,1.1*params.sortTransitionDuration);

	}

	//circle packing
	if (classes.includes('packing')){
		//can I make the start smoother -- have the circles come to overlap while they are under the force?
		//make a separate plotData within compileData, with the index of the associated data.  then the plotting function can be simplified and each circle will have a data associated with it.  
		//force simulation to attract the 3 GW masses together (without collision)
		//could maintain the GW masses as separate circles with links

		params.viewType = 'packing';


		//gray out and disable the sorting
		d3.select('#sortGWDropdown').classed('disabled', true);
		d3.select('#sortGWDropdown').select('.navi').classed('disabled', true);
		d3.select('#sortGWDropdown').selectAll('input').attr('disabled', true);
		d3.select('#sortEMDropdown').classed('disabled', true);
		d3.select('#sortEMDropdown').select('.navi').classed('disabled', true);
		d3.select('#sortEMDropdown').selectAll('input').attr('disabled', true);
		d3.select('.massGaptoggle').classed('disabled', true);
		d3.select('.massGaptoggle').select('input').attr('disabled', true);

		//increase the radius scaling
		params.sizeScaler = params.sizeScalerOrg*2.
		params.radiusScale.range([params.sizeScaler*params.minRadius, params.sizeScaler*params.maxRadius]);

		//turn off the axes and arrows
		d3.selectAll('.axis').transition().duration(params.fadeTransitionDuration).style("opacity",0);
		d3.selectAll('.arrow').transition().duration(params.fadeTransitionDuration).style("opacity",0);

		setTimeout(function(){
		//resize the circles and question marks
			d3.selectAll('.dot').transition().duration(params.fadeTransitionDuration)
				.attr("r", function(d) {return defineRadius(d,d3.select(this).attr('class'));})

			d3.selectAll('.text.qmark').transition().duration(params.fadeTransitionDuration)
				.style('font-size',function(d) {return 1.5*defineRadius(d,d3.select(this).attr('class'))+"px";})


			//get the size of the area and offset for the center
			var offsetX = 0;
			var offsetY = d3.select('#legend').node().getBoundingClientRect().height + d3.select('#credits').node().getBoundingClientRect().height; //don't fully understand this measurement
			var width = params.SVGwidth - params.SVGpadding.right - params.SVGpadding.left - params.radiusScale.invert(params.maxRadius);
			var height = params.SVGheight - params.SVGpadding.top - params.SVGpadding.bottom - offsetY - 2.*params.radiusScale.invert(params.maxRadius); 

			//start the simulation
				// Features of the forces applied to the nodes:
				params.collide = d3.forceCollide()
					.strength(0.75)
					.radius(function(d){return params.radiusScale(+d.mass) + 2;})
					.iterations(2)

				params.ticker = function(){
					d3.selectAll('.dot').each(function(d){
						d.x = clamp(d.x,offsetX,width + offsetX);
						d.y = clamp(d.y,offsetY,height + offsetY);

						//move the dots
						d3.select(this)
							.attr('cx', d.x)
							.attr('cy', d.y);

						//move the question marks
						var cls = '.'+d3.select(this).attr('class').replace('dot','').replaceAll(' ','.').replaceAll('..','.');
						d3.selectAll(cls)
							.attr('x', d.x)
							.attr('y', d.y + 0.5*d.r);

					});
				}

				// Once the force algorithm is happy with positions ('alpha' value is low enough), simulations will stop.
				// parent simulation
				params.parentSimulation = d3.forceSimulation()
					.force('center', d3.forceCenter().x(offsetX + width/2).y(offsetY + height/2).strength(0.02)) // Attraction to the center of the svg area
					.force('charge', d3.forceManyBody().strength(20)) // Nodes are attracted one each other of value is > 0
					.force('collide', params.collide) // Force that avoids circle overlapping
					.nodes(params.plotData.filter(function(d){return d.parent}))// Apply these forces to the nodes and update their positions.
					.on('tick', params.ticker);

				// child simulations
				params.childSimulations = [];
				params.plotData.filter(function(d){return d.parent}).forEach(function(parent){
					var children = params.plotData.filter(function(d){return d.commonName == parent.commonName && !d.parent});
					if (children.length > 0){
						// var sim = d3.forceSimulation()
						// 	.force('center', d3.forceCenter().x(parent.x).y(parent.y).strength(0.02)) 
						// 	.force('charge', d3.forceManyBody().strength(20)) 
						// 	.nodes(children)
						// 	.on('tick', params.ticker);
						var sim = setInterval(function(){
							children.forEach(function(d){
								d.x -= (d.x - parent.x)/100.;
								d.y -= (d.y - parent.y)/100.;;
							})
						}, 10)
						params.childSimulations.push(sim);
					}
				})

		}, params.fadeTransitionDuration);



	}

	console.log('view', params.viewType)

}

function resetOpacities(cls='', off=false, dur=params.tooltipTransitionDuration){
	//normal opacities
	if (off){
		if (params.viewType == 'default') d3.selectAll(cls+'.arrow').transition().duration(dur).style("opacity",0).on('end',function(){d3.selectAll(cls+'.arrow').style('display','none')});
		d3.selectAll(cls+'.dot').transition().duration(dur)
			.style("fill-opacity",0)
			.style("stroke-opacity",0)
			.on('end',function(){d3.selectAll(cls+'.dot').style('display','none')})
		d3.selectAll(cls+'.text').transition().duration(dur).style("opacity",0).on('end',function(){d3.selectAll(cls+'.text').style('display','none')});
		d3.selectAll(cls+'.legendText').transition().duration(dur).style("opacity",0).on('end',function(){d3.selectAll(cls+'.legendText').style('display','none')});
	} else {
		if (params.viewType == 'default') d3.selectAll(cls+'.arrow').transition().duration(dur).style("opacity",params.opArrow).on('start',function(){d3.selectAll(cls+'.arrow').style('display','block')})
		d3.selectAll(cls+'.dot').transition().duration(dur)
			.style("fill-opacity",params.opMass)
			.style("stroke-opacity",1)
			.on('start',function(){d3.selectAll(cls+'.dot').style('display','block')})
		d3.selectAll(cls+'.text').transition().duration(dur).style("opacity",1).on('start',function(){d3.selectAll(cls+'.text').style('display','block')})
		d3.selectAll(cls+'.legendText').transition().duration(dur).style("opacity",1).on('start',function(){d3.selectAll(cls+'.legendText').style('display','block')});
	}
}

function togglePlot(){
	var classes = d3.select(this).attr('class').split(' ');

	//get the toggle
	var j = classes.indexOf('toggle');
	var tog = classes[j+1].replace('toggle','');;

	params.hidden[tog] = !params.hidden[tog];

	var keys = Object.keys(params.hidden);

	//show the items first
	for (var i=0; i<keys.length; i+=1){
		if (!params.hidden[keys[i]]) {
			if (keys[i] == 'BH' || keys[i] == 'NS' || keys[i] == 'GW' || keys[i] == 'EM'){
				resetOpacities('.'+keys[i], false, params.fadeTransitionDuration);
			} else {
				d3.selectAll('.'+keys[i]).transition().duration(params.fadeTransitionDuration)
					.style("opacity",1)
					//.on('start',function(){d3.selectAll('.'+keys[i]).style('display','block')});
			}
		}
	}

	//then hide the items
	for (var i=0; i<keys.length; i+=1){
		if (params.hidden[keys[i]]){
			if (keys[i] == 'BH' || keys[i] == 'NS' || keys[i] == 'GW' || keys[i] == 'EM'){
				resetOpacities('.'+keys[i], true, params.fadeTransitionDuration);
			} else {
				d3.selectAll('.'+keys[i]).transition().duration(params.fadeTransitionDuration)
					.style("opacity",0)
					//.on('end',function(){d3.selectAll('.'+keys[i]).style('display','none')});
			}
		}
	}

	//fix the arrows for combined NS BH
	if (params.hidden['BH'] && params.hidden['NS']) resetOpacities('.BHNS', true, params.fadeTransitionDuration);

}

function changePointSizes(){
	//console.log(this.value);
	params.maxRadius = +d3.select('#maxPointSize').node().value;
	params.minRadius = +d3.select('#minPointSize').node().value;
	params.radiusScale.range([params.sizeScaler*params.minRadius, params.sizeScaler*params.maxRadius]);


	params.mainPlot.selectAll('.dot').attr("r", function(d){ 
		d.r = defineRadius(d,d3.select(this).attr('class'))
		return d.r
	});

	if (params.viewType == 'packing') {
		params.collide.initialize(params.parentSimulation.nodes());
		params.parentSimulation.alphaTarget(.01).restart();
		// params.childSimulations.forEach(function(d){d.alphaTarget(.01).restart()});
	}

	params.mainPlot.selectAll(".text.qmark")
		.attr("y", function(d) {return defineYpos(d,d3.select(this).attr('class')) + 0.5*defineRadius(d,d3.select(this).attr('class'));})
		.style('font-size',function(d) {return 1.5*defineRadius(d,d3.select(this).attr('class'))+"px";})

	changeArrowSizes();
}

function changeArrowSizes(){
	params.arrowScale = +d3.select('#arrowWidth').node().value*0.1; //scale goes between 1 and 20, but I want 0.1 - 2

	params.mainPlot.selectAll('.arrow.GW').attr("d", function(d){return createArrow(d)})

}

function changeAspect(){
	var classes = d3.select(this).attr('class').split(' ');

	if (classes.indexOf('free') != -1){
		if (!params.renderXchanged) params.renderX = window.innerWidth;
		if (!params.renderYchanged) params.renderY = window.innerHeight;
		params.renderAspect = params.renderY/params.renderX;
	}

	if (classes.indexOf('four_three') != -1) params.renderAspect = 3./4.;
	if (classes.indexOf('sixteen_nine') != -1) params.renderAspect = 9./16.;

	params.renderY = Math.round(params.renderAspect*params.renderX);

	d3.select('#renderX').attr('placeholder',params.renderX);
	d3.select('#renderY').attr('placeholder',params.renderY);
}

//http://bl.ocks.org/Rokotyan/0556f8facbaf344507cdc45dc3622177
//render an image from the SVG element
//in Frank's version I was able to make this simply scale the image, but here it seems like I need to redraw.  I wonder why??
function renderToImage(){
	
	var saveSVGscale = params.SVGscale;
	var saveControlsX = params.controlsX;

	if (!isNaN(params.renderX) && !isNaN(params.renderY)){	
		params.sizeScaler = params.renderX/params.targetWidth;
		params.SVGscale = 1.;
		params.controlsX = 0.;

		params.plotReady = false;
		createPlot(params.renderX, params.renderY);

		//wait until drawing in is complete
		var imgCheck = setInterval(function(){ 
			if (params.plotReady){
				console.log('plot is ready')
				clearInterval(imgCheck);
				saveImage();
				params.SVGscale = saveSVGscale;
				params.controlsX = saveControlsX;
				params.sizeScaler = params.sizeScalerOrg;
				resizePlot();
			} 
		}, 100);

	} else {
		console.log('bad image size ', params.renderX, params.renderY);
	}
}

function saveImage(){
	var svgString = getSVGString(params.SVG.node());

	console.log('saving image ', params.renderX, params.renderY);
	svgString2Image( svgString, params.renderX, params.renderY, 'png', save );

	function save( dataBlob, filesize){
		saveAs( dataBlob, params.filename ); // FileSaver.js function
	}


}


// Below are the functions that handle actual exporting:
// getSVGString ( svgNode ) and svgString2Image( svgString, width, height, format, callback )
function getSVGString( svgNode ) {
	svgNode.setAttribute('xlink', 'http://www.w3.org/1999/xlink');
	var cssStyleText = getCSSStyles( svgNode );
	appendCSS( cssStyleText, svgNode );

	var serializer = new XMLSerializer();
	var svgString = serializer.serializeToString(svgNode);
	svgString = svgString.replace(/(\w+)?:?xlink=/g, 'xmlns:xlink='); // Fix root xlink without namespace
	svgString = svgString.replace(/NS\d+:href/g, 'xlink:href'); // Safari NS namespace fix

	return svgString;

	function getCSSStyles( parentElement ) {
		var selectorTextArr = [];

		// Add Parent element Id and Classes to the list
		selectorTextArr.push( '#'+parentElement.id );
		for (var c = 0; c < parentElement.classList.length; c++)
				if ( !contains('.'+parentElement.classList[c], selectorTextArr) )
					selectorTextArr.push( '.'+parentElement.classList[c] );

		// Add Children element Ids and Classes to the list
		var nodes = parentElement.getElementsByTagName("*");
		for (var i = 0; i < nodes.length; i++) {
			var id = nodes[i].id;
			if ( !contains('#'+id, selectorTextArr) )
				selectorTextArr.push( '#'+id );

			var classes = nodes[i].classList;
			for (var c = 0; c < classes.length; c++)
				if ( !contains('.'+classes[c], selectorTextArr) )
					selectorTextArr.push( '.'+classes[c] );
		}

		// Extract CSS Rules
		var extractedCSSText = "";
		for (var i = 0; i < document.styleSheets.length; i++) {
			var s = document.styleSheets[i];
			
			try {
				if(!s.cssRules) continue;
			} catch( e ) {
					if(e.name !== 'SecurityError') throw e; // for Firefox
					continue;
				}

			var cssRules = s.cssRules;
			for (var r = 0; r < cssRules.length; r++) {
				if ( contains( cssRules[r].selectorText, selectorTextArr ) )
					extractedCSSText += cssRules[r].cssText;
			}
		}
		

		return extractedCSSText;

		function contains(str,arr) {
			return arr.indexOf( str ) === -1 ? false : true;
		}

	}

	function appendCSS( cssText, element ) {
		var styleElement = document.createElement("style");
		styleElement.setAttribute("type","text/css"); 
		styleElement.innerHTML = cssText;
		var refNode = element.hasChildNodes() ? element.children[0] : null;
		element.insertBefore( styleElement, refNode );
	}
}


function svgString2Image( svgString, width, height, format, callback ) {
	var format = format ? format : 'png';

	var imgsrc = 'data:image/svg+xml;base64,'+ btoa( unescape( encodeURIComponent( svgString ) ) ); // Convert SVG string to data URL

	var canvas = document.createElement("canvas");
	var context = canvas.getContext("2d");

	canvas.width = width;
	canvas.height = height;

	var image = new Image();
	image.onload = function() {
		context.clearRect ( 0, 0, width, height );
		context.drawImage(image, 0, 0, width, height);

		canvas.toBlob( function(blob) {
			var filesize = Math.round( blob.length/1024 ) + ' KB';
			if ( callback ) callback( blob, filesize );
		});

		
	};

	image.src = imgsrc;

}