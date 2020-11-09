//attach resize event
window.addEventListener("resize", resizePlot);


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
		e=events[i];
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
	//if I use random numbers, I probably want to set my own seed value (which would probably mean writing my own function)
	var num = 0;
	for (var i=0; i<useEvents.id.length; i+=1){
		e = useEvents.name[i];
		if (toRemove.indexOf(i) == -1){
			var dat = params.inputGWdata.events[e]
			dat.index = num+1;
			dat.random = (1. - Math.random()*0.5)*(Math.round(Math.random())*2 - 1); //random number between 0.5 and 1, with either signe
			params.data.push(dat);
			if (params.inputGWdata.events[e].final_mass_source == null){
				console.log("check",params.inputGWdata.events[e])
			}
			num += 1;
		} else {
			console.log('removing : ',e)
		}
	}
	console.log(num, useEvents.id.length)
	console.log(params.data)

	//create the plot
	createPlot(); //this also calls populate plot

}