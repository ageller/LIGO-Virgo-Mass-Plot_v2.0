/////////////////////////////
//attach events

//attach resize event
window.addEventListener('resize', resizePlot);

//attach event to move tooltip
//window.addEventListener('mousemove', moveTooltip);
d3.select('body').on('click',hideTooltip);

params.sizeScaler = window.innerWidth/params.targetWidth;
params.sizeScalerOrg = params.sizeScaler;

//attach the controls
function attachControls(){
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

	d3.selectAll('.checkboxLabel.whiteBackground').on('mousedown', changeBackground);
}



//////////////////////////////
//read in the data and reformat

//first, read in the data file
Promise.all([
	d3.json('src/data/GWOSCdata.json'),
	d3.json('src/data/EMdata.json')
]).then(function(data) {
	console.log('data',data)
	params.inputGWdata = data[0];
	params.inputEMdata = data[1];
	compileData(); //this will compile the data and then create the plot
})


function getRem(mass){
	if (mass < params.BHMinMass) return 'NS';
	return 'BH';
}
function compileData(){
	//identify the GW events to use; only want those with masses and then only the most recent version
	console.log('compiling data ...');
	params.data = [];
	params.plotData = [];

	//compile the EMdata
	var EMevents = Object.keys(params.inputEMdata);
	params.EMdata = [];
	for (var i =0; i<EMevents.length; i+=1){
		params.EMdata.push(params.inputEMdata[EMevents[i]])
	}

	var events = Object.keys(params.inputGWdata.events)
	var useEvents = {'name':[],'id':[],'version':[]}
	//take only those with masses
	//and only use those with "confident" in the catalog name
	for (var i =0; i<events.length; i+=1){
		e = events[i];
		if (params.inputGWdata.events[e].mass_1_source != null && params.inputGWdata.events[e]['catalog.shortName'].includes('confident')){
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

	// console.log('checking', useEvents)
	// //exclude those from the O3_Discovery_Papers, and GWTC-3-marginal
	// for (var i=0; i<useEvents.id.length; i+=1){
	// 	var e = useEvents.name[i];
	// 	var dat = params.inputGWdata.events[e];
	// 	if (dat["catalog.shortName"] == "O3_Discovery_Papers" || dat["catalog.shortName"].includes("marginal")) toRemove.push(i);
	// }

	//now only take those for the final data product
	var GWmasses = [];
	var GWmasses2 = [];
	var GWdates = [];
	var GWdistances = [];
	var GWchirp = [];
	var GWchi = [];
	var GWSNR = [];
	var num = 0;
	for (var i=0; i<useEvents.id.length; i+=1){
		var e = useEvents.name[i];
		if (toRemove.indexOf(i) == -1){
			var dat = params.inputGWdata.events[e];
			dat.messenger = 'GW';
			dat.mass = params.inputGWdata.events[e].final_mass_source;
			dat.GWindex = num;
			num += 1;
			if (params.inputGWdata.events[e].final_mass_source == null || params.inputGWdata.events[e].final_mass_source_upper == null){
				if (params.inputGWdata.events[e].total_mass_source) dat.mass = params.inputGWdata.events[e].total_mass_source;
			} 
			params.data.push(dat);
			params.commonNames.push(dat.commonName)
			GWmasses.push(dat.mass);
			GWmasses2.push(dat.mass_2_source);
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
	var sortedGWMasses2 = sortWithIndices(GWmasses2);
	var sortedGWDates = sortWithIndices(GWdates);
	var sortedGWDistances = sortWithIndices(GWdistances);
	var sortedGWChirp = sortWithIndices(GWchirp);
	var sortedGWChi = sortWithIndices(GWchi);
	var sortedGWSNR = sortWithIndices(GWSNR);

	var GWside = 1.;
	var GWindices = [];
	var GWdx = params.data.length/(GWmasses.length + 1); //+1 so that it doesn't reach all the way to the edges
	var GWusedx = 0;
	var diamondBottomIndex = 5; //index to start choosing random values for the bottom half of the diamond
	//generate random indices for the bottom half of diamond
	var diamondRandom = [];
	var ii = 0;
	for (var i =0; i<sortedGWMasses.length; i+=1){
		if ((ii+1) % 2 == 0) GWusedx += GWdx;
		if (i < sortedGWMasses.length/2 && i > diamondBottomIndex) {
			diamondRandom.push(params.data.length/2. + 2.*GWside*GWusedx + GWdx);
			ii += 1
		}
		GWside = -GWside;
	}
	diamondRandom = shuffle(diamondRandom);
	var j = 0;
	GWusedx = 0;
	GWside = 1.;
	var usedDiamondIndices = []
	for (var i =0; i<sortedGWMasses.length; i+=1){
		if ((i+1) % 2 == 0) GWusedx += GWdx;
		
		var k1 = sortedGWMasses.sortIndices[i];
		params.data[k1].valleyIndex = params.data.length/2. + GWside*GWusedx;

		var k2 = sortedGWMasses.sortIndices[sortedGWMasses.length-1 - i];
		params.data[k2].peakIndex = params.data.length/2. + GWside*GWusedx;

		//top of the diamond
		if (i < sortedGWMasses.length/2){
			params.data[k2].diamondIndex = params.data.length/2. + 2.*GWside*GWusedx;// - GWdx;		
			params.data[k2].diamondRandIndex = params.data.length/2. + 2.*GWside*GWusedx; 
			usedDiamondIndices.push(k2)
		}

		GWside = -GWside;

		GWindices.push((i + 1)*params.data.length/GWmasses.length);
	}
	//bottom of the diamond
	var GWusedx2 = 0;
	var GWside2 = 1.;
	var ii2 = 0;
	for (var i =0; i<sortedGWMasses2.length; i+=1){
		var k1 = sortedGWMasses2.sortIndices[i];

		if (!(usedDiamondIndices.includes(k1))){
			if ((ii2+1) % 2 == 0) GWusedx2 += GWdx;

			params.data[k1].diamondIndex = params.data.length/2. + 2.*GWside2*GWusedx2 + GWdx; 

			if (i <= diamondBottomIndex){
				params.data[k1].diamondRandIndex = params.data.length/2. + 2.*GWside2*GWusedx2; 
			} else {
				params.data[k1].diamondRandIndex = diamondRandom[j];
				j += 1;
			}	
			ii2 += 1;
			GWside2 = -GWside2;
		}
	}
	//quick check
	var minD = params.data.length;
	var maxD = 0;
	for (var i =0; i<sortedGWMasses.length; i+=1){
		var k1 = sortedGWMasses.sortIndices[i];
		if ('diamondIndex' in params.data[k1]) {
			if (params.data[k1].diamondIndex < 0 || params.data[k1].diamondIndex > params.data.length){
				console.log('!!!WARNING: bad GW diamondIndex', k1, params.data[k1].diamondIndex)
			} else {
				minD = Math.min(minD, params.data[k1].diamondIndex);
				maxD = Math.max(maxD, params.data[k1].diamondIndex);
			}
		} else {
			console.log('!!!WARNING: GW diamondIndex not set', k1, params.data[k1])
		}
	}
	console.log('min, max GW diamondIndex', minD, maxD);

	var sortedEMMasses = sortWithIndices(EMmasses);
	var EMside = 1;
	var EMindices = [];
	var EMdx = params.data.length/(EMmasses.length + 1); //+1 so that it doesn't reach all the way to the edges
	var EMusedx = 0;
	for (var i =0; i<sortedEMMasses.length; i+=1){
		if ((i+1) % 2 == 0) EMusedx += EMdx;
		
		var k1 = sortedEMMasses.sortIndices[i] + GWmasses.length;
		params.data[k1].valleyIndex = params.data.length/2. + EMside*EMusedx;

		var k2 = sortedEMMasses.sortIndices[sortedEMMasses.length-1 - i] + GWmasses.length;
		params.data[k2].peakIndex = params.data.length/2. + EMside*EMusedx;

		if (i < sortedEMMasses.length/2){
			params.data[k1].diamondIndex = params.data.length/2. + 2.*EMside*EMusedx + 0.5*EMdx; 
			params.data[k2].diamondIndex = params.data.length/2. + 2.*EMside*EMusedx - 0.5*EMdx; 
		}

		EMside = -EMside;

		EMindices.push((i + 1)*params.data.length/EMmasses.length);
	}
	//quick check
	for (var i =0; i<sortedEMMasses.length; i+=1){
		var k1 = sortedEMMasses.sortIndices[i];
		if (!('diamondIndex' in params.data[k1])) console.log('!!!WARNING: EM diamondIndex not set', k1, params.data[k1])
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

			var cat = d['catalog.shortName'].replace('-confident','').replace('.','-');

			//check if this is a new source
			var clsAddOn = '';
			if (params.newData.includes(d.commonName)) clsAddOn = ' newData ';

			//normal sources
			if (d.final_mass_source != null) params.plotData.push({'dataIndex':i, 'mass':d.final_mass_source, 'classString':'name-'+cleanString(d.commonName) + ' ' + getRem(d.final_mass_source) + ' '+ cat +' dot mf GW clickable' + clsAddOn,'qmark':qmark,'parent':true,'commonName':d.commonName,'catalog':cat});
			if (d.mass_1_source != null) params.plotData.push({'dataIndex':i, 'mass':d.mass_1_source, 'classString':'name-'+cleanString(d.commonName)+ ' ' + getRem(d.mass_1_source) + ' '+ cat + ' dot m1 GW clickable' + clsAddOn,'qmark':false,'parent':false,'commonName':d.commonName, 'catalog':cat});
			if (d.mass_2_source != null) params.plotData.push({'dataIndex':i, 'mass':d.mass_2_source, 'classString':'name-'+cleanString(d.commonName)+ ' ' + getRem(d.mass_2_source) + ' '+ cat + ' dot m2 GW clickable' + clsAddOn,'qmark':false,'parent':false,'commonName':d.commonName, 'catalog':cat});

			//add any without final masses
			if (d.final_mass_source == null && d.total_mass_source != null) params.plotData.push({'dataIndex':i, 'mass':d.total_mass_source, 'classString':'name-'+cleanString(d.commonName)+ ' ' + getRem(d.total_mass_source) + ' '+ cat + ' dot mf no_final_mass GW clickable' + clsAddOn,'qmark':true,'parent':true,'commonName':d.commonName, 'catalog':cat});
		}
		if (d.messenger == 'EM' && d.mass != null) params.plotData.push({'dataIndex':i, 'mass':d.mass, 'classString':'name-'+cleanString(d.commonName)+ ' ' + getRem(d.mass) + ' dot mf EM clickable', 'qmark':(d.special==2),'parent':true,'commonName':d.commonName, });
		

	}
	//give everything a key for the index for easy searching later
	var cats = [];
	params.plotData.forEach(function(d,i){
		d.idx = i;
		if ('catalog' in d) cats.push(d.catalog)
	});


	//Add toggle buttons for the different catalogs
	var ucat = cats.filter(onlyUnique).sort();
	//for newData
	if (params.newData.length > 0) ucat.push('newData');
	console.log('unique catalogs', ucat)
	var tog = d3.select('#toggleDropdown').select('.checkboxButtons.dropdown-content');

	ucat.forEach(function(c){
		var lab = tog.append('label')
			.attr('class','checkboxLabel toggle '+c+'toggle')
			.text(c.replace('2-1','2.1').replaceAll('_',' '))
		lab.append('input')
			.attr('type','checkbox')
			.attr('checked',true)
		lab.append('span')
			.attr('class','checkboxCheckmark')
	})

	//attach the controls
	attachControls();

	//create the plot
	createPlot(d3.select('#plotSVG')); //this also calls populate plot

}