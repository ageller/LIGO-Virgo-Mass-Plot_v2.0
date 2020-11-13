function mouseOver(){
	//lighten everything
	d3.selectAll('.dot').transition().duration(params.tooltipTransitionDuration)
		.style("fill-opacity",0.1)
		.style("stroke-opacity",0.2)
	d3.selectAll('.arrow').transition().duration(params.tooltipTransitionDuration).style("opacity",0.1)
	d3.selectAll('.text').transition().duration(params.tooltipTransitionDuration).style("opacity",0.2)

	//darken the selected object
	var cls = d3.select(this).attr('class').split(" ")[0];
	d3.select('.arrow.GW.'+cls).transition().duration(params.tooltipTransitionDuration).style("opacity",1)
	d3.selectAll('.dot.'+cls).transition().duration(params.tooltipTransitionDuration).style("fill-opacity",1)
	d3.selectAll('.text.'+cls).transition().duration(params.tooltipTransitionDuration).style("opacity",1)
	d3.selectAll('.'+cls).classed("inFront",true);


	//display the tooltip
	formatTooltip(d3.select(this).attr('data-name'));
	d3.select('#tooltip').transition().duration(params.tooltipTransitionDuration).style("opacity",1);

	//move the tooltip into position
	var bbox = d3.select('.dot.mf.'+cls).node().getBoundingClientRect();
	coord = [bbox.x, bbox.y]
	var tbbox = d3.select('#tooltip').node().getBoundingClientRect();
	var targetLeft = coord[0] + 20;
	if (targetLeft > window.innerWidth/2.) targetLeft = coord[0] - 20 - tbbox.width;
	var left = Math.min(Math.max(targetLeft , 0), window.innerWidth - tbbox.width);
	var top = Math.min(Math.max(coord[1] - tbbox.height, 0), window.innerHeight - tbbox.height);
	d3.select('#tooltip')
		.style('left',left +'px')
		.style('top',top + 'px')
}

function mouseOut(){
	//normal opacities
	d3.selectAll('.arrow').transition().duration(params.tooltipTransitionDuration).style("opacity",params.opArrow)
	d3.selectAll('.dot').transition().duration(params.tooltipTransitionDuration)
		.style("fill-opacity",params.opMass)
		.style("stroke-opacity",1)
	d3.selectAll('.text').transition().duration(params.tooltipTransitionDuration).style("opacity",1)

	//back to normal ordering
	var cls = d3.select(this).attr('class').split(" ")[0];
	d3.selectAll('.'+cls).classed("inFront",false);

	//remove tooltip
	d3.select('#tooltip').transition().duration(params.tooltipTransitionDuration).style("opacity",0)
		.on("end", function(){
			d3.select('#tooltip').style('left','-500px')});

}

function moveTooltip(){
	var coord = d3.pointer(event);
	var bbox = d3.select('#tooltip').node().getBoundingClientRect();
	var top = Math.min(Math.max(coord[1] - 10 - bbox.height, 0), window.innerHeight - bbox.height);
	d3.select('#tooltip')
		//.style('transform','translate(' + coord[0] + 'px, ' + coord[1] + 'px)')
		//.style('left',coord[0] - bbox.width/2. +'px')
		.style('top',top + 'px')


}

function formatTooltip(name){

	var index = params.commonNames.indexOf(name);
	var d = params.data[index];
	var str = ''
	str += '<span style="font-size:16px"><b>Name : </b>'+name + '</span><br/>';
	if (d.messenger != null) str += '<b>messenger : </b>'+d.messenger.replace('GW','Gravitational Waves').replace('EM','Electromagnetic') + '<br/>';
	if (d.final_mass_source != null) str += '<b>m_final : </b>'+d.final_mass_source + ' (+' + d.final_mass_source_upper + ' '+d.final_mass_source_lower + ') ' + d.final_mass_source_unit.replace('M_sun','Solar Masses') + '<br/>'; 
	if (d.messenger == 'GW' && d.final_mass_source == null) str += '<b>m_final</b> : unknown <br/>';
	if (d.total_mass_source != null) str += '<b>m_total : </b>'+d.total_mass_source + ' (+' + d.total_mass_source_upper + ' '+d.total_mass_source_lower + ') ' + d.total_mass_source_unit.replace('M_sun','Solar Masses') + '<br/>'; 
	if (d.mass_1_source != null) str += '<b>m_1 : </b>'+d.mass_1_source + ' (+' + d.mass_1_source_upper + ' '+d.mass_1_source_lower + ') ' + d.mass_1_source_unit.replace('M_sun','Solar Masses') + '<br/>'; 
	if (d.mass_2_source != null) str += '<b>m_2 : </b>'+d.mass_2_source + ' (+' + d.mass_2_source_upper + ' '+d.mass_2_source_lower + ') ' + d.mass_2_source_unit.replace('M_sun','Solar Masses') + '<br/>'; 
	if (d.chirp_mass_source != null) str += '<b>chirp mass : </b>'+d.chirp_mass_source + ' (+' + d.chirp_mass_source_upper + ' '+d.chirp_mass_source_lower + ') ' + d.chirp_mass_source_unit.replace('M_sun','Solar Masses') + '<br/>'; 
	if (d.chi_eff != null) str += '<b>chi_eff : </b>'+d.chi_eff + ' (+' + d.chi_eff_upper + ' '+d.chi_eff_lower + ') ' + d.chi_eff_unit + '<br/>'; 
	if (d.redshift != null) str += '<b>redshift : </b>'+d.redshift + ' (+' + d.redshift_upper + ' '+d.redshift_lower + ')'+ '<br/>'; 
	if (d.luminosity_distance != null) str += '<b>D_L : </b>'+d.luminosity_distance + ' (+' + d.luminosity_distance_upper + ' '+d.luminosity_distance_lower + ') ' + d.luminosity_distance_unit + '<br/>'; 
	if (d['catalog.shortName'] != null) str += '<b>catalog : </b>' + d['catalog.shortName'] + '<br/>';
	if (d.GPS != null) str += '<b>GPS : </b>' + d.GPS + '<br/>';

	d3.select('#tooltip')
		.html(str)

}