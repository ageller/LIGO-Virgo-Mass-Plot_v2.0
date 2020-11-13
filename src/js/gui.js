function toggleControls(){
	//change the hamburger symbol
	d3.select('#hamburger').node().classList.toggle('change');
	d3.select('#controls').style('display','inline-block');

	//move the controls into view
	var bbox = d3.select('#controls').node().getBoundingClientRect();
	var x = -bbox.width;
	if (!d3.select('#hamburger').classed('change')){
		x = 0;
	}
	d3.select('#controls').style('transform', 'translateX('+x+'px)')

}

