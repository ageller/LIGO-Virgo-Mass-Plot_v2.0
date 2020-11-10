function moveTooltip(){
	var coord = d3.pointer(event);
	var bbox = d3.select('#tooltip').node().getBoundingClientRect()
	d3.select('#tooltip')
		//.style('transform','translate(' + coord[0] + 'px, ' + coord[1] + 'px)')
		.style('left',coord[0] - bbox.width/2. +'px')
		.style('top',coord[1] - bbox.height + 'px')


}

function formatTooltip(name){

	d3.select('#tooltip')
		.html(name + " ... more info coming soon")

}