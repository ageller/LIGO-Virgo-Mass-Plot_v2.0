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
	d3.select('#svg').transition().duration(params.controlsTransitionDuration)
		.style('transform', 'translate(' + (margin.left + params.controlsX/2) + 'px,' + margin.top + 'px)scaleX(' + params.SVGscale + ')')


}

//handle the dropdown menus
function dropdown(){
	//rotate the triangle
	var navi = d3.select(this).select('.navi');
	navi.classed("rotate180", !navi.classed("rotate180")); 

	//expand the dropdown (is there a way to do this purely in css with unknown height?)
	var dropdown = d3.select('#'+this.id+'Dropdown').select('.dropdown-content')
	var shown = dropdown.classed('show-dropdown');
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

//resizing the plot elements based on input from the controls panel
function moveData(messenger,sortKey){
	//sortKey = 'risingIndex';
	//sortKey = 'fallingIndex';
	//sortKey = 'peakIndex';
	//sortKey = 'valleyIndex';


	console.log('moving data', messenger, sortKey)

	params[messenger+'sortKey'] = sortKey;

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
		srt = classes[classes.length-1];
		moveData(messenger,srt+'Index');
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

function resetOpacities(cls='', off=false, dur=params.tooltipTransitionDuration){
	//normal opacities
	if (off){
		d3.selectAll(cls+'.arrow').transition().duration(dur).style("opacity",0).on('end',function(){d3.selectAll(cls+'.arrow').style('display','none')});
		d3.selectAll(cls+'.dot').transition().duration(dur)
			.style("fill-opacity",0)
			.style("stroke-opacity",0)
			.on('end',function(){d3.selectAll(cls+'.dot').style('display','none')})
		d3.selectAll(cls+'.text').transition().duration(dur).style("opacity",0).on('end',function(){d3.selectAll(cls+'.text').style('display','none')});
	} else {
		d3.selectAll(cls+'.arrow').transition().duration(dur).style("opacity",params.opArrow).on('start',function(){d3.selectAll(cls+'.arrow').style('display','block')})
		d3.selectAll(cls+'.dot').transition().duration(dur)
			.style("fill-opacity",params.opMass)
			.style("stroke-opacity",1)
			.on('start',function(){d3.selectAll(cls+'.dot').style('display','block')})
		d3.selectAll(cls+'.text').transition().duration(dur).style("opacity",1).on('end',function(){d3.selectAll(cls+'.text').style('display','block')})
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
					.on('start',function(){d3.selectAll('.'+keys[i]).style('display','block')});
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
					.on('end',function(){d3.selectAll('.'+keys[i]).style('display','none')});
			}
		}
	}

	//fix the arrows for combined NS BH
	if (params.hidden['BH'] && params.hidden['NS']) resetOpacities('.BHNS', true, params.fadeTransitionDuration);

}


function changeArrowSizes(){
	params.arrowScale = +d3.select('#arrowWidth').node().value*0.1; //scale goes between 1 and 20, but I want 0.1 - 2

	params.mainPlot.selectAll('.arrow.GW').attr("d", function(d){return createArrow(d)})

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
		d3.select('#svg').remove();
		createPlot(params.renderX, params.renderY);

		//wait until drawing in is complete
		var imgCheck = setInterval(function(){ 
			if (params.plotReady){
				console.log('plot is ready')
				clearInterval(imgCheck);
				saveImage();
				params.SVGscale = saveSVGscale;
				params.controlsX = saveControlsX;
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