//attach resize event
window.addEventListener("resize", resizePlot);

//attach event to move tooltip
//window.addEventListener('mousemove', moveTooltip);

//attach the controls
d3.select('#hamburger').on('mousedown',toggleControls)

//first, read in the data file
d3.json("src/data/GWOSCdata.json").then(function(data){ 
	params.inputGWdata = data;
	compileData(); //this will compile the data and then create the plot
});

function compileData(){
	//identify the GW events to use; only want those with masses and then only the most recent version
	console.log('compiling data ...');

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
	var num = 0;
	for (var i=0; i<useEvents.id.length; i+=1){
		e = useEvents.name[i];
		if (toRemove.indexOf(i) == -1){
			var dat = params.inputGWdata.events[e]
			dat.messenger = 'GW';
			dat.mass = params.inputGWdata.events[e].final_mass_source;
			dat.GWindex = num;
			num += 1;
			if (params.inputGWdata.events[e].final_mass_source == null){
				console.log("check",params.inputGWdata.events[e]);
				dat.mass = params.inputGWdata.events[e].total_mass_source;
			} 
			params.data.push(dat);
			params.commonNames.push(dat.commonName)
			GWmasses.push(dat.mass);
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
	//sortIndex will sort by mass
	//reverseSortIndex will reverse sort by mass
	//peakIndex will sort with most massive in the middle
	//valleyIndex will sort with most massive in the middle
	//
	var sortedGWMasses = sortWithIndices(GWmasses);
	var sortedEMMasses = sortWithIndices(EMmasses);
	var GWside = 1;
	var EMside = 1;
	var j;
	for (var i =0; i<sortedGWMasses.length; i+=1){
		var j = (i+1)*params.data.length/GWmasses.length;
		var k = sortedGWMasses.sortIndices[i]
		if (GWside > 0){
			params.data[k].peakIndex = j/2.;
			params.data[k].valleyIndex = params.data.length/2. - j/2.;
		} else {
			params.data[k].peakIndex = params.data.length - j/2.;
			params.data[k].valleyIndex =params.data.length/2. + j/2.;
		}
		GWside = -GWside;

	}
	for (var i =0; i<sortedEMMasses.length; i+=1){
		var j = (i+1)*params.data.length/EMmasses.length ;
		var k = sortedEMMasses.sortIndices[i] + GWmasses.length;
		if (EMside > 0){
			params.data[k].peakIndex = j/2.;
			params.data[k].valleyIndex = params.data.length/2. - j/2.;
		} else {
			params.data[k].peakIndex = params.data.length - j/2.;
			params.data[k].valleyIndex = params.data.length/2. + j/2.;
		}
		EMside = -EMside;

	}

	for (var i=0; i<params.data.length; i+=1){
		var j = 1;
		if (params.data[i].messenger == 'GW'){
			j = (sortedGWMasses.sortIndices.indexOf(params.data[i].GWindex) + 1)*params.data.length/GWmasses.length;
		}
		if (params.data[i].messenger == 'EM'){
			j = (sortedEMMasses.sortIndices.indexOf(params.data[i].EMindex) + 1)*params.data.length/EMmasses.length;
		}
		params.data[i].sortIndex = j;		
		params.data[i].reverseSortIndex = params.data.length - j;
	}

	//create the plot
	createPlot(); //this also calls populate plot

}