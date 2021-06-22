/////////////////////////////
//attach events

//attach resize event
window.addEventListener('resize', resizePlot);

//attach event to move tooltip
//window.addEventListener('mousemove', moveTooltip);
d3.select('body').on('click',hideTooltip);

//attach the controls
d3.select('#hamburger').on('mousedown',toggleControls);
d3.selectAll('.controlsTitle').on('mousedown',dropdown);

d3.selectAll('.radioLabel.sort').on('mousedown', sortPlot);
d3.selectAll('.checkboxLabel.toggle').on('mousedown', togglePlot);
d3.selectAll('.radioLabel.view').on('mousedown', changeView);

d3.select('#maxPointSize').on('input',changePointSizes);
d3.select('#minPointSize').on('input',changePointSizes);

d3.select('#arrowWidth').on('input',changeArrowSizes);

d3.selectAll('.textInput').on('keyup',function(){ 
	params[this.id] = this.value; 
	params[this.id+'changed'] = true;
});
d3.select('#renderButton').on('click',renderToImage);

//get the heights for all the dropdown menus first, then hide them
d3.selectAll('.dropdown-content').each(function(d) {
	params.dropdownHeights[this.parentNode.id] = this.getBoundingClientRect().height;
	d3.select(this)
		.style('height',0)
		.style('visibility','hidden');
});

d3.select('#renderX').attr('placeholder',params.renderX);
d3.select('#renderY').attr('placeholder',params.renderY);
d3.selectAll('.radioLabel.aspect').on('mousedown', changeAspect);

params.sizeScaler = window.innerWidth/params.targetWidth;
params.sizeScalerOrg = params.sizeScaler;

//////////////////////////////
//read in the data and reformat

//first, read in the data file
d3.json("src/data/GWOSCdata.json").then(function(data){ 
	params.inputGWdata = data;
	compileData(); //this will compile the data and then create the plot
});


function getRem(mass){
	if (mass < params.BHMinMass) return 'NS';
	return 'BH';
}
function compileData(){
	//identify the GW events to use; only want those with masses and then only the most recent version
	console.log('compiling data ...');
	params.data = [];
	params.plotData = [];

	var events = Object.keys(params.inputGWdata.events)
	var useEvents = {'name':[],'id':[],'version':[]}
	//take only those with masses
	for (var i =0; i<events.length; i+=1){
		e = events[i];
		if (params.inputGWdata.events[e].mass_1_source != null){
			var id = e;
			var version = 0;
			var p = e.indexOf('-v');
			if (p != -1) {
				id = e.substring(0,p);
				version = e.substring(p+2,e.length);
			}
			useEvents.name.push(e)
			useEvents.id.push(id)
			useEvents.version.push(version)
		}
	};

	//identify the most recent versions
	var toRemove = [];
	var toSkip = [];
	for (var i=0; i<useEvents.id.length; i+=1){
		id = useEvents.id[i];
		if (toSkip.indexOf(i) == -1){ //so that we don't double the work
			var matches = getAllIndexes(useEvents.id, id);
			if (matches.length > 1){
				var versions = [];
				matches.forEach(function(j){
					versions.push(parseInt(useEvents.version[j]));
				})
				var max = indexOfMax(versions);
				versions.forEach(function(v,j){
					if (j != max.index && toRemove.indexOf(matches[j]) == -1){
						toRemove.push(matches[j]);
					}
				})
				//console.log(id, matches, versions, max.index, toRemove, toSkip, i)
				toSkip = toSkip.concat(matches);

			}
		}
	};

	//now only take those for the final data product
	GWmasses = [];
	GWdates = [];
	GWdistances = [];
	GWchirp = [];
	GWchi = [];
	GWSNR = [];
	var num = 0;
	for (var i=0; i<useEvents.id.length; i+=1){
		e = useEvents.name[i];
		if (toRemove.indexOf(i) == -1){
			var dat = params.inputGWdata.events[e]
			dat.messenger = 'GW';
			dat.mass = params.inputGWdata.events[e].final_mass_source;
			dat.GWindex = num;
			num += 1;
			if (params.inputGWdata.events[e].final_mass_source == null || params.inputGWdata.events[e].final_mass_source_upper == null){
				console.log("check",params.inputGWdata.events[e]);
				if (params.inputGWdata.events[e].total_mass_source) dat.mass = params.inputGWdata.events[e].total_mass_source;
			} 
			params.data.push(dat);
			params.commonNames.push(dat.commonName)
			GWmasses.push(dat.mass);
			GWdates.push(dat.GPS);
			GWdistances.push(dat.luminosity_distance);
			GWchirp.push(dat.chirp_mass_source);
			GWchi.push(dat.chi_eff);
			GWSNR.push(dat.network_matched_filter_snr);
		} else {
			console.log('removing : ',e)
		}
	}
	console.log(useEvents.id.length)
	console.log(params.data)


	//add in the EMdata
	EMmasses = [];
	for (var i=0; i<params.EMdata.length; i+=1){
		var dat = params.EMdata[i];
		dat.final_mass_source = null;
		dat.mass_1_source = null;
		dat.mass_2_source = null;
		dat.total_mass_source = null;
		dat.EMindex = i;
		params.data.push(dat);
		params.commonNames.push(dat.commonName)
		EMmasses.push(dat.mass);
	}

	//now sort the full data set for plotting
	//risingIndex will sort by mass
	//fallingIndex will reverse sort by mass
	//peakIndex will sort with most massive in the middle
	//valleyIndex will sort with most massive in the middle
	//
	var sortedGWMasses = sortWithIndices(GWmasses);
	var sortedGWDates = sortWithIndices(GWdates);
	var sortedGWDistances = sortWithIndices(GWdistances);
	var sortedGWChirp = sortWithIndices(GWchirp);
	var sortedGWChi = sortWithIndices(GWchi);
	var sortedGWSNR = sortWithIndices(GWSNR);

	var GWside = 1;
	var GWside2 = 1;
	var flipped = false;
	var j;
	var GWindices = [];
	//can this be simplified??
	for (var i =0; i<sortedGWMasses.length; i+=1){
		var j = (i+1)*params.data.length/GWmasses.length;
		var k = sortedGWMasses.sortIndices[i]
		params.data[k].valleyIndex = params.data.length/2. + GWside*j/2.;
		if (GWside > 0){
			params.data[k].peakIndex = j/2.;
		} else {
			params.data[k].peakIndex = params.data.length - j/2.;
		}
		GWside = -GWside;


		params.data[k].diamondIndex = params.data.length/2. - GWside2*j*0.9; //can I improve this to center it better?
		if (flipped) {
			if (GWside > 0){
				params.data[k].diamondIndex = j - params.data.length/2.;
			} else {
				params.data[k].diamondIndex = 3*params.data.length/2. - j;
			}
		}
		GWside2 = -GWside2;
		if (i > sortedGWMasses.length/2 && !flipped) {
			flipped = true;
		}
		GWindices.push(j);
	}

	var sortedEMMasses = sortWithIndices(EMmasses);
	var EMside = 1;
	var EMside2 = 1;
	var flipped = false;
	var EMindices = [];
	for (var i =0; i<sortedEMMasses.length; i+=1){
		var j = (i+1)*params.data.length/EMmasses.length;
		var k = sortedEMMasses.sortIndices[i] + GWmasses.length;
		if (EMside > 0){
			params.data[k].peakIndex = j/2.;
			params.data[k].valleyIndex = params.data.length/2. - j/2.;
		} else {
			params.data[k].peakIndex = params.data.length - j/2.;
			params.data[k].valleyIndex = params.data.length/2. + j/2.;
		}
		EMside = -EMside;

		params.data[k].diamondIndex = params.data.length/2. - EMside2*j*0.9; //can I improve this to center it better?
		if (flipped) {
			if (EMside > 0){
				params.data[k].diamondIndex = j - params.data.length/2.;
			} else {
				params.data[k].diamondIndex = 3*params.data.length/2. - j;
			}
		}
		EMside2 = -EMside2;
		if (i > sortedEMMasses.length/2 && !flipped) {
			flipped = true;
		}
		EMindices.push(j);
	}

	GWindices = shuffle(GWindices);
	EMindices = shuffle(EMindices);
	for (var i=0; i<params.data.length; i+=1){
		var j = 1;
		var jDate = 1;
		var jDist = 1;
		var jChirp = 1;
		var jChi = 1;
		var jSNR = 1;

		if (params.data[i].messenger == 'GW'){
			j = (sortedGWMasses.sortIndices.indexOf(params.data[i].GWindex) + 1)*params.data.length/GWmasses.length;
			jDate = (sortedGWDates.sortIndices.indexOf(params.data[i].GWindex) + 1)*params.data.length/GWdates.length;
			jDist = (sortedGWDistances.sortIndices.indexOf(params.data[i].GWindex) + 1)*params.data.length/GWdistances.length;
			jChirp = (sortedGWChirp.sortIndices.indexOf(params.data[i].GWindex) + 1)*params.data.length/GWchirp.length;
			jChi = (sortedGWChi.sortIndices.indexOf(params.data[i].GWindex) + 1)*params.data.length/GWchi.length;
			jSNR = (sortedGWSNR.sortIndices.indexOf(params.data[i].GWindex) + 1)*params.data.length/GWSNR.length;
			params.data[i].randomIndex = GWindices[i];
		}
		if (params.data[i].messenger == 'EM'){
			j = (sortedEMMasses.sortIndices.indexOf(params.data[i].EMindex) + 1)*params.data.length/EMmasses.length;
			params.data[i].randomIndex = EMindices[i - GWindices.length];
		}

		params.data[i].risingIndex = j;		
		params.data[i].fallingIndex = params.data.length - j;

		params.data[i].dateIndex = jDate;		
		params.data[i].distanceIndex = jDist;		
		params.data[i].chirpIndex = jChirp;		
		params.data[i].chiIndex = jChi;		
		params.data[i].SNRIndex = jSNR;	


		//add to the plotData
		var dat = {};
		var d = params.data[i];
		if (d.messenger == 'GW'){
			//check for necessary question marks for the final masses
			var qmark = false
			if (d.final_mass_source != null && d.final_mass_source_upper == null) qmark = true;

			//normal sources
			if (d.final_mass_source != null) params.plotData.push({'dataIndex':i, 'mass':d.final_mass_source, 'classString':'name-'+cleanString(d.commonName) + ' ' + getRem(d.final_mass_source) + ' dot mf GW clickable','qmark':qmark,'parent':true,'commonName':d.commonName});
			if (d.mass_1_source != null) params.plotData.push({'dataIndex':i, 'mass':d.mass_1_source, 'classString':'name-'+cleanString(d.commonName)+ ' ' + getRem(d.mass_1_source) + ' dot m1 GW clickable','qmark':false,'parent':false,'commonName':d.commonName});
			if (d.mass_2_source != null) params.plotData.push({'dataIndex':i, 'mass':d.mass_2_source, 'classString':'name-'+cleanString(d.commonName)+ ' ' + getRem(d.mass_2_source) + ' dot m2 GW clickable','qmark':false,'parent':false,'commonName':d.commonName});

			//add any without final masses
			if (d.final_mass_source == null && d.total_mass_source != null) params.plotData.push({'dataIndex':i, 'mass':d.total_mass_source, 'classString':'name-'+cleanString(d.commonName)+ ' ' + getRem(d.total_mass_source) + ' dot mf no_final_mass GW clickable','qmark':true,'parent':true,'commonName':d.commonName});
		}
		if (d.messenger == 'EM' && d.mass != null) params.plotData.push({'dataIndex':i, 'mass':d.mass, 'classString':'name-'+cleanString(d.commonName)+ ' ' + getRem(d.mass) + ' dot mf EM clickable', 'qmark':(d.special==2),'parent':true,'commonName':d.commonName});
		

	}
	//give everything a key for the index for easy searching later
	params.plotData.forEach(function(d,i){d.idx = i});

	//create the plot
	createPlot(); //this also calls populate plot

}