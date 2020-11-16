function toggleControls(){
	//change the hamburger symbol
	d3.select('#hamburger').node().classList.toggle('change');
	d3.select('#controls').style('display','inline-block');

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
	d3.select('#svg').transition().duration(params.controlsTransitionDuration)
		.style('transform', 'translate(' + (margin.left + params.controlsX/2) + 'px,' + margin.top + 'px)scaleX(' + params.SVGscale + ')')

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
		if (classes.indexOf('diamond') != -1){ 
			moveData(messenger,'diamondIndex')
		}
		if (classes.indexOf('random') != -1){ 
			moveData(messenger,'randomIndex')
		}
		if (classes.indexOf('date') != -1){ //currently only available for GW
			moveData(messenger,'dateIndex')
		}
		if (classes.indexOf('distance') != -1){ //currently only available for GW
			moveData(messenger,'distanceIndex')
		}
	}
}

function changePointSizes(){
	//console.log(this.value);
	params.maxRadius = +d3.select('#maxPointSize').node().value;
	params.minRadius = +d3.select('#minPointSize').node().value;
	params.radiusScale.range([params.minRadius,params.maxRadius]);

	params.mainPlot.selectAll(".dot.mf.GW").attr("r", function(d){return params.radiusScale(+d.final_mass_source);});
	params.mainPlot.selectAll(".dot.m1.GW").attr("r", function(d){return params.radiusScale(+d.mass_1_source);});
	params.mainPlot.selectAll(".dot.m2.GW").attr("r", function(d){return params.radiusScale(+d.mass_2_source);});
	params.mainPlot.selectAll(".dot.mf.no_final_mass.GW").attr("r", function(d){return params.radiusScale(+d.total_mass_source);});
	params.mainPlot.selectAll(".dot.mf.EM").attr("r", function(d){return params.radiusScale(+d.mass);});

	changeArrowSizes();
}

function changeArrowSizes(){
	params.arrowScale = +d3.select('#arrowWidth').node().value*0.1; //scale goes between 1 and 20, but I want 0.1 - 2

	params.mainPlot.selectAll('.arrow.GW').attr("d", function(d){return createArrow(d)})

}

//http://bl.ocks.org/Rokotyan/0556f8facbaf344507cdc45dc3622177
//render an image from the SVG element
//in Frank's version I was able to make this simply scale the image, but here it seems like I need to redraw.  I wonder why??
function renderToImage(){
	
	if (!isNaN(params.renderX) && !isNaN(params.renderY)){	
		params.sizeScaler = params.renderX/params.targetWidth;
		params.SVGscale = 1.;
		params.controlsX = 0.;

		params.plotReady = false;
		d3.select('#svg').remove();
		createPlot(params.renderX, params.renderY);

		var imgCheck = setInterval(function(){ 
			if (params.plotReady){
				console.log('plot is ready')
				clearInterval(imgCheck);
				saveImage();
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
		//could do this in a series of callbacks, but this is easier
		var imgCheck = setInterval(function(){ 
			if (params.plotReady){
				console.log('plot is ready')
				clearInterval(imgCheck);
				saveAs( dataBlob, params.filename ); // FileSaver.js function
				//resizePlot();
			} 
		}, 100);
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