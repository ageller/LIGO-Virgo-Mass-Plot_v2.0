function toggleControls(){
	//change the hamburger symbol
	d3.select('#hamburger').node().classList.toggle('change');
	d3.select('#controls').style('display','inline-block');

	d3.select('#controls').style('display','inline-block');

	//move the controls into view
	var bbox = d3.select('#controls').node().getBoundingClientRect();
	var x = -bbox.width;
	if (!d3.select('#hamburger').classed('change')){
		x = 0;
	}
	d3.select('#controls').transition().duration(params.controlsTransitionDuration)
		.style('transform', 'translateX('+x+'px)')

	var margin = {};
	var keys = Object.keys(params.SVGmargin);
	for (var i=0; i<keys.length; i++) margin[keys[i]] = params.SVGmargin[keys[i]]*params.sizeScaler;


	var scl = 1. - Math.abs(x/window.innerWidth);
	d3.select('#svg').transition().duration(params.controlsTransitionDuration)
		.style('transform', 'translate(' + (margin.left +x/2) + 'px,' + margin.top + 'px)scaleX(' + scl + ')')

}

