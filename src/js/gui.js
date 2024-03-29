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
	d3.select('#plotSVG').transition().duration(params.controlsTransitionDuration)
		.style('transform', 'translate(' + (margin.left + params.controlsX/2) + 'px,' + margin.top + 'px)scaleX(' + params.SVGscale + ')')


}

//handle the dropdown menus
function dropdown(){
	var doDrop = true;
	if (params.viewType != 'default' && this.id.includes('sort')) doDrop = false;

	//expand the dropdown (is there a way to do this purely in css with unknown height?)
	var dropdown = d3.select('#'+this.id+'Dropdown')
	if (dropdown.node()){
		dropdown = dropdown.select('.dropdown-content');
		if (dropdown.node()){
			var shown = dropdown.classed('show-dropdown');

			if (doDrop || shown){
				//rotate the triangle
				var navi = d3.select(this).select('.navi');
				navi.classed('rotate180', !navi.classed('rotate180')); 

				if (shown){
					dropdown
						.style('visibility','hidden')
						.style('opacity',0)
						.style('height',0)
						.classed('show-dropdown', false)
				} else {
					dropdown
						.style('visibility','visible')
						.style('opacity',1)
						.style('height',params.dropdownHeights[this.parentNode.id] + 'px')
						.classed('show-dropdown', true)
				}
			}

		}
	}

}

//resizing the plot elements based on input from the controls panel
function moveData(messenger,sortKey, reset=false, dur=params.sortTransitionDuration, ease=d3.easePolyInOut){
	//sortKey = 'risingIndex';
	//sortKey = 'fallingIndex';
	//sortKey = 'peakIndex';
	//sortKey = 'valleyIndex';


	console.log('moving data', messenger, sortKey);

	params[messenger+'sortKey'] = sortKey;

	params.mainPlot.selectAll('.dot.'+messenger).transition().ease(ease).duration(dur)
		.attr('cx', function(d) {
			var x = defineXpos(d,d3.select(this).attr('class'),null,reset);
			if (x) return x;
		})
		.attr('cy', function(d) {
			var y = defineYpos(d,null,reset);
			if (y) return y;
		})
		.attr('r', function(d) {
			var r = defineRadius(d)
			if (r) return r;
		})

	params.mainPlot.selectAll('.text.qmark.'+messenger).transition().ease(ease).duration(dur)
		.attr('x', function(d) {
			var x = defineXpos(d,d3.select(this).attr('class'),null,reset);
			if (x) return x;
		})
		.attr('y', function(d) {
			var y = defineYpos(d,null,reset) + 0.5*defineRadius(d);
			if (y) return y; 
		})
		.style('font-size',function(d) {
			var s = defineRadius(d);
			if (s) return 1.5*s+'px';
		})

	if (messenger == 'GW' && params.viewType == 'default'){
		params.mainPlot.selectAll('.arrow.GW').transition().ease(ease).duration(dur)
			.attr('transform',function(d){
				var x = params.xAxisScale(d[sortKey]/params.xNorm*params.xAxisScale.domain()[1]);
				var y = 0;
				if (x) return 'translate(' + x +',' + y + ')';
			})
	}
}

function sortPlot(){
	if (params.viewType == 'default'){
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
			params[messenger + 'sortKey'] = srt+'Index';
			moveData(messenger,srt+'Index');
		}
	}
}

function changeView(event, classes=null){
	params.plotReady = false;
	if (event) classes = d3.select(event.target).attr('class');
	if (classes.includes('radioCheckmark')) classes = d3.select(event.target.parentNode).attr('class');

	//stop the simulation if running
	if (params.parentSimulation) params.parentSimulation.stop();

	//remove any extra nodes from the plotData
	params.plotData = params.plotData.filter(function(d){return !('extraNode' in d)});

	//remove the links and the extra nodes
	params.mainPlot.select('.links').selectAll('line').remove();
	params.mainPlot.selectAll('.extraNode').remove();

	console.log('!!!Changing view', classes)

	//default
	if (classes.includes('default')){
		params.viewType = 'default';


		//enable the sorting
		d3.select('#sortGWDropdown').classed('disabled', null);
		d3.select('#sortGWDropdown').select('.navi').classed('disabled', null);
		d3.select('#sortGWDropdown').selectAll('input').attr('disabled', null);
		d3.select('#sortEMDropdown').classed('disabled', null);
		d3.select('#sortEMDropdown').select('.navi').classed('disabled', null);
		d3.select('#sortEMDropdown').selectAll('input').attr('disabled', null);
		d3.select('.massGaptoggle').classed('disabled', null);
		d3.select('.massGaptoggle').select('input').attr('disabled', null);

		//turn on the axes
		params.mainPlot.selectAll('.axis').transition().duration(params.fadeTransitionDuration).style('opacity',1);

		//reset the radius scaling
		params.sizeScaler = params.sizeScalerOrg;
		params.radiusScale.range([params.sizeScaler*params.minRadius, params.sizeScaler*params.maxRadius]);

		//determine with sort method is used (there is likely a better way to do this)
		srtGW = 'diamond'
		d3.selectAll('.radioLabl.sort.GW').each(function(d){
			var cls = d3.select(this).attr('class').split(' ');
			if (this.checked == 'checked') srtGW = cls[cls.length - 1];
		});
		srtEM = 'valley'
		d3.selectAll('.radioLabl.sort.EM').each(function(d){
			var cls = d3.select(this).attr('class').split(' ');
			if (this.checked == 'checked') srtEM = cls[cls.length - 1];
		});

		//move and resize the data
		moveData('GW',params.GWsortKey);
		moveData('EM',params.EMsortKey);

		//reset the opacities (which will also turn on the arrows)
		//now handled below
		//setTimeout(togglePlot,1.1*params.sortTransitionDuration);

	}

	//circle packing
	if (classes.includes('packing') || classes.includes('linkedPacking') || classes.includes('nodes') ){
		if (classes.includes('packing')) params.viewType = 'packing';
		if (classes.includes('linkedPacking')) params.viewType = 'linkedPacking';
		if (classes.includes('nodes')) params.viewType = 'nodes';

		//gray out and disable the sorting
		d3.select('#sortGWDropdown').classed('disabled', true);
		d3.select('#sortGWDropdown').select('.navi').classed('disabled', true);
		d3.select('#sortGWDropdown').selectAll('input').attr('disabled', true);
		d3.select('#sortEMDropdown').classed('disabled', true);
		d3.select('#sortEMDropdown').select('.navi').classed('disabled', true);
		d3.select('#sortEMDropdown').selectAll('input').attr('disabled', true);
		d3.select('.massGaptoggle').classed('disabled', true);
		d3.select('.massGaptoggle').select('input').attr('disabled', true);

		//increase the radius scaling
		params.sizeScaler = params.sizeScalerOrg*2.
		params.radiusScale.range([params.sizeScaler*params.minRadius, params.sizeScaler*params.maxRadius]);

		//turn off the axes and arrows
		params.mainPlot.selectAll('.axis').classed('toggledOff',true).transition().duration(params.fadeTransitionDuration).style('opacity',0);
		params.mainPlot.selectAll('.arrow').classed('toggledOff',true).transition().duration(params.fadeTransitionDuration).style('opacity',0);
		params.mainPlot.selectAll('.massGap').classed('toggledOff',true).transition().duration(params.fadeTransitionDuration).style('opacity',0);

		//get the size of the area and offset for the center
		var offsetX = -(params.SVGpadding.left - 0.5*params.radiusScale.invert(params.maxRadius));
		var offsetY = d3.select('#legend').node().getBoundingClientRect().height;
		var width = params.SVGwidth - params.SVGpadding.right - params.radiusScale.invert(params.maxRadius);
		var height = params.SVGheight - params.SVGpadding.top - params.SVGpadding.bottom - d3.select('#credits').node().getBoundingClientRect().height - d3.select('#legend').node().getBoundingClientRect().height - params.radiusScale.invert(params.maxRadius); 

		//determine the links
		var links = [];
		if (params.viewType == 'nodes' || params.viewType == 'linkedPacking'){
			params.plotData.filter(function(d){return d.parent}).forEach(function(parent){
				var children = params.plotData.filter(function(d){return d.commonName == parent.commonName && !d.parent});
				if (children.length > 0){
					children.forEach(function(child){
						links.push({'source':parseInt(parent.idx),'target':parseInt(child.idx)})
					})
				}
			})
		}

		//force strength
		var mbStrength = 10;
		var coStrength = 0.75;
		var ceStrength = 0.02;
		var liStrength = 2;

		var extraNodes = [];
		var extraLinks = [];
		if (params.viewType == 'nodes'){
			mbStrength = -1;
			ceStrength = 0.015;
			coStrength = 0.1;
			liStrength = 0.25;

			var ln = parseInt(params.plotData.length);
			//add the nodes links for the GW, EM, BH and NS nodes
			extraNodes = [{'x':width/2.,'y':height/4,'r':height/5.,'mass':1,'idx':ln,    'extraNode':'GW', 'classString':'GW extraNode','commonName':'','qmark':false,'parent':false},
							  {'x':width/2.,'y':3*height/4,'r':height/5.,'mass':1,'idx':ln + 1,'extraNode':'EM', 'classString':'EM extraNode','commonName':'','qmark':false,'parent':false}]
							  // {'x':500,'y':100,'r':100,'mass':1,'idx':ln + 2,'extraNode':'BH', 'classString':'','commonName':'','qmark':false,'parent':false},
							  // {'x':700,'y':100,'r':100,'mass':1,'idx':ln + 3,'extraNode':'NS', 'classString':'','commonName':'','qmark':false,'parent':false}];

			params.plotData.filter(function(d){return d.classString.includes('GW') && d.parent}).forEach(function(d){
				extraLinks.push({'source':parseInt(ln),'target':parseInt(d.idx)});
			});
			params.plotData.filter(function(d){return d.classString.includes('EM') && d.parent}).forEach(function(d){
				extraLinks.push({'source':parseInt(ln + 1),'target':parseInt(d.idx)});
			});
			// params.plotData.filter(function(d){return d.classString.includes('BH')}).forEach(function(child){
			// 	extraLinks.push({'source':parseInt(ln + 2),'target':parseInt(child.idx)});
			// });
			// params.plotData.filter(function(d){return d.classString.includes('NS')}).forEach(function(child){
			// 	extraLinks.push({'source':parseInt(ln + 3),'target':parseInt(child.idx)});
			// });


			extraNodes.forEach(function(d){
				params.plotData.push(d)
				//add in the extra dots for these nodes
				params.mainPlot.selectAll('.extraNode').data(extraNodes).enter()
					.append('circle')
						.attr('class', function(d){return d.classString;})
						.attr('r', function(d){return d.r/5.})
						.attr('cx', function(d){return d.x})
						.attr('cy', function(d){return d.y})
						.style('fill', 'black')
						.style('fill-opacity',1)
						.style('stroke', 'silver')
						.style('stroke-opacity', 1)
						.style('stroke-width', 2*params.sizeScaler + 'px')
						.style('cursor', 'pointer')
						.call(d3.drag() // call specific function when circle is dragged
							.on('start', dragstarted)
							.on('drag', dragged)
							.on('end', dragended));
				params.mainPlot.selectAll('.extraNode.label').data(extraNodes).enter()
					.append('text')
						.attr('class', function(d){return d.classString + ' label';})
						.attr('x', function(d){return d.x})
						.attr('y', function(d){return d.y + d.r/15.})
						.style('fill','silver')
						.style('font-size',function(d){return d.r/5.+'px';})
						.style('text-anchor', 'middle')
						.style('cursor', 'pointer')
						.text(function(d){return d.extraNode})
						.call(d3.drag() // call specific function when circle is dragged
							.on('start', dragstarted)
							.on('drag', dragged)
							.on('end', dragended));
						});
			extraLinks.forEach(function(d){links.push(d)});


		}		

		//create the lines
		d3.select('.links').selectAll('line').data(links).enter()
			.append('line')
				.attr('class',function(d){
					var addOn = '';
					if (('extraNode' in params.plotData[d.source])) addOn = ' extraNode';
					return params.plotData[d.target].classString.replace('dot','link') + addOn;
				})
				.attr('stroke-linecap', 'round')
				.style('stroke',function(d){
					var cls = params.plotData[d.target].classString;
					//if (('extraNode' in params.plotData[d.source])) return 'white';
					if (cls.includes('GW') && cls.includes('BH')) return params.colors.GWBH;
					if (cls.includes('GW') && cls.includes('NS')) return params.colors.GWNS;
					if (cls.includes('EM') && cls.includes('BH')) return params.colors.EMBH;
					if (cls.includes('EM') && cls.includes('NS')) return params.colors.EMNS;
					return 'white';
				})
				.style('stroke-width',function(d){
					if (('extraNode' in params.plotData[d.source])) return '1px';
					return '3px'
				})
				.style('opacity',function(d){
					if (('extraNode' in params.plotData[d.source])) return 0.5;
					return 0.75
				})
				.style('display','none') //will be reset with togglePlot




		setTimeout(function(){
		//resize the circles and question marks
			params.mainPlot.selectAll('.dot').transition().duration(params.fadeTransitionDuration)
				.attr('r', function(d) {return defineRadius(d);})

			params.mainPlot.selectAll('.text.qmark').transition().duration(params.fadeTransitionDuration)
				.style('font-size',function(d) {return 1.5*defineRadius(d)+'px';})




			// define the collision force
			params.forceCollide = d3.forceCollide()
				.radius(function(d){
					if ('extraNode' in d) return d.r;
					return params.radiusScale(+d.mass) + 2;
				})
				.strength(coStrength)
				.iterations(1)


			//define the link force
			params.forceLink = d3.forceLink()
				.distance(function(d){
					if (!('extraNode' in d.target)) return Math.abs(params.yAxisScale(d.target.mass) - params.yAxisScale(d.source.mass)); //reversed because 0 is up
					return d.target.r;
				})
				.strength(liStrength)

			//modify the nodes and links during the simulation
			params.ticker = function(){

				//update the nodes
				params.mainPlot.selectAll('.dot').each(function(d){
					if (d){
						d.x = clamp(d.x,offsetX,width + offsetX);
						d.y = clamp(d.y,offsetY,height + offsetY);

						if (d.x && d.y){
							//move the dots
							d3.select(this)
								.attr('cx', d.x)
								.attr('cy', d.y);

							//move the question marks
							var cls = '.'+d3.select(this).attr('class').replace('dot','').replaceAll(' ','.').replaceAll('..','.');
							d3.selectAll(cls)
								.attr('x', d.x)
								.attr('y', d.y + 0.5*d.r);
						}
					}
				});

				params.mainPlot.selectAll('.extraNode').each(function(d){
					if (d){
						d.x = clamp(d.x,offsetX,width + offsetX);
						d.y = clamp(d.y,offsetY,height + offsetY);

						if (d.x && d.y){
							//move the dots and text (and attempt to center the text)
							d3.select(this)
								.attr('x', d.x)
								.attr('y', d.y + parseFloat(this.style.fontSize)/3.)
								.attr('cx', d.x)
								.attr('cy', d.y);
						}
					}
				});

				d3.select('.links').selectAll('line').each(function(d){
					if (d.source.x && d.source.y && d.target.x && d.target.y){
						d3.select(this)
							.attr('x1', d.source.x)
							.attr('y1', d.source.y)
							.attr('x2', d.target.x)
							.attr('y2', d.target.y)
					}
				});



			}

			//start the simulation
			// Once the force algorithm is happy with positions ('alpha' value is low enough), simulations will stop.
			params.parentSimulation = d3.forceSimulation()
				.nodes(params.plotData)// Apply these forces to the nodes and update their positions.
				.force('center', d3.forceCenter().x(offsetX + width/2).y(offsetY + height/2).strength(ceStrength)) // Attraction to the center of the svg area
				.force('charge', d3.forceManyBody().strength(mbStrength)) // Nodes are attracted one each other of value is > 0
				.force('collide', params.forceCollide) // Force that avoids circle overlapping
				.force('link', params.forceLink.links(links))
				.on('tick', params.ticker);


		}, params.fadeTransitionDuration);

		setTimeout(function(){
			// if a tooltip is active, reset the opacities (for the links, since they are removed and redrawn each time)
			if (params.selectedElement) {
				showTooltip(params.selectedElement);
			}
		}, 2.2*params.fadeTransitionDuration);

	}

	console.log('view', params.viewType)
	setTimeout(function(){
		params.plotReady = true; //not sure if this is going to fire at the right time
		togglePlot();
	},(params.sortTransitionDuration + params.fadeTransitionDuration));


}

function resetOpacities(cls='', off=false, dur=params.tooltipTransitionDuration, toHide=[], svgElem=params.SVG){
	//normal opacities
	if (off){
		console.log('turnog off',cls)
		if (params.viewType == 'default') {
			svgElem.selectAll(cls+'.arrow.toggledOn')
				.classed('toggledOn',false).classed('toggledOff',true)
				.transition().duration(dur)
					.style('opacity',0)
					.on('end',function(){
						svgElem.selectAll(cls+'.arrow').style('display','none');
					});
		}
		svgElem.selectAll(cls+'.dot.toggledOn')
			.classed('toggledOn',false).classed('toggledOff',true)
			.transition().duration(dur)
				.style('fill-opacity',0)
				.style('opacity',0)
				.style('stroke-opacity',0)
				.on('end',function(){
					svgElem.selectAll(cls+'.dot').style('display','none');
				});
		svgElem.selectAll(cls+'.text.toggledOn')
			.classed('toggledOn',false).classed('toggledOff',true)
			.transition().duration(dur)
				.style('opacity',0)
				.on('end',function(){
					svgElem.selectAll(cls+'.text').style('display','none');
				});
		svgElem.selectAll(cls+'.legendText.toggledOn')
			.classed('toggledOn',false).classed('toggledOff',true)
			.transition().duration(dur)
				.style('opacity',0)
				.on('end',function(){
					svgElem.selectAll(cls+'.legendText').style('display','none');
				});
		svgElem.selectAll(cls+'.link.toggledOn')
			.classed('toggledOn',false).classed('toggledOff',true)
			.transition().duration(dur)
				.style('opacity',0)
				.on('end',function(){
					svgElem.selectAll(cls+'.link').style('display','none');
				});
	} else {
		console.log('turning on', cls)
		if (params.viewType == 'default') {
			svgElem.selectAll(cls+'.arrow.toggledOff')
				.classed('toggledOn',true)
				.classed('toggledOff',function(){
					if (this.classList.contains('tooltipFaded') && cls != '.tooltipFaded') return true;
					if (this.classList.contains('tooltipShowing') && cls != '.tooltipShowing') return true;
					return false;
				})
				.transition().duration(dur)
					.style('opacity',function(){
						if (this.classList.contains('tooltipFaded') && cls != '.tooltipFaded'  && params.selectedElement) return 0.2;
						if (this.classList.contains('tooltipShowing') && cls != '.tooltipShowing' && params.selectedElement) return 1;
						return params.opArrow;
					})
					.on('start',function(){
						svgElem.selectAll(cls+'.arrow').style('display','block');
					});
		}
		svgElem.selectAll(cls+'.dot.toggledOff')
			.classed('toggledOn',true)
			.classed('toggledOff',function(){
				if (this.classList.contains('tooltipFaded') && cls != '.tooltipFaded') return true;
				if (this.classList.contains('tooltipShowing') && cls != '.tooltipShowing') return true;
				return false;
			})
			.transition().duration(dur)
				.style('opacity',1)
				.style('fill-opacity',function(){
					if (this.classList.contains('tooltipFaded') && cls != '.tooltipFaded' && params.selectedElement) return 0.1;
					if (this.classList.contains('tooltipShowing') && cls != '.tooltipShowing' && params.selectedElement) return 1;
					return params.opMass;
				})
				.style('stroke-opacity',function(){
					if (this.classList.contains('tooltipFaded') && cls != '.tooltipFaded' && params.selectedElement) return 0.2;
					if (this.classList.contains('tooltipShowing') && cls != '.tooltipShowing' && params.selectedElement) return 1;
					return 1;
				})
				.on('start',function(){
					svgElem.selectAll(cls+'.dot').style('display','block');
				});
		svgElem.selectAll(cls+'.text.toggledOff')
			.classed('toggledOn',true)
			.classed('toggledOff',function(){
				if (this.classList.contains('tooltipFaded') && cls != '.tooltipFaded') return true;
				if (this.classList.contains('tooltipShowing') && cls != '.tooltipShowing') return true;
				return false;
			})
			.transition().duration(dur)
				.style('opacity',function(){
					if (this.classList.contains('tooltipFaded') && cls != '.tooltipFaded' && params.selectedElement) return 0.2;
					return 1;
				})
				.on('start',function(){
					svgElem.selectAll(cls+'.text').style('display','block');
				});
		svgElem.selectAll(cls+'.legendText.toggledOff')
			.classed('toggledOn',true)
			.classed('toggledOff',function(){
				if (this.classList.contains('tooltipFaded') && cls != '.tooltipFaded') return true;
				if (this.classList.contains('tooltipShowing') && cls != '.tooltipShowing') return true;
				return false;
			})
			.transition().duration(dur)
				.style('opacity',1)
				.on('start',function(){
					svgElem.selectAll(cls+'.legendText').style('display','block');
				});

		//the links appear to need some extra handling or else they blink at the start
		svgElem.selectAll(cls+'.link').filter(function(){
			var show = true;
			for (var i=0; i<toHide.length;i+=1) if (this.classList.contains(toHide[i])) show = false;
			return show;
		}).transition().duration(dur)
			.style('opacity',function(d){
				if (this.classList.contains('extraNode')) return 0.5;
				if (this.classList.contains('tooltipFaded') && cls != '.tooltipFaded' && params.selectedElement) return 0.2;
				if (this.classList.contains('tooltipShowing') && cls != '.tooltipShowing' && params.selectedElement) return 1;
				return 0.75
			})
			.on('start',function(){
				svgElem.selectAll(cls+'.link').filter(function(){
					var show = true;
					for (var i=0; i<toHide.length;i+=1) if (this.classList.contains(toHide[i])) show = false;
					return show;
				}).style('display','block')
			})
	}

}

function applyToggles(classes=null, svgElem=params.SVG, duration=params.fadeTransitionDuration){
	//get the toggle

	var tog = null;
	if (classes){
		var j = classes.indexOf('toggle');
		tog = classes[j+1].replace('toggle','');;
	}

	var doToggle = true;
	if (tog == 'massGap' && params.viewType != 'default') doToggle = false;

	if (doToggle){
		if (tog) params.hidden[tog] = !params.hidden[tog];

		var keys = Object.keys(params.hidden);
		//first get a list of the hidden keys
		var toHide = [];
		for (var i=0; i<keys.length; i+=1){
			if (params.hidden[keys[i]]) toHide.push(keys[i]);
		}

		//show the items first
		for (var i=0; i<keys.length; i+=1){
			if (!params.hidden[keys[i]]) {
				if (keys[i] == 'BH' || keys[i] == 'NS' || keys[i] == 'GW' || keys[i] == 'EM' || keys[i].includes('GWTC') || keys[i].includes('O3')){
					resetOpacities('.'+keys[i], false, duration, toHide, svgElem);
				} else {
					svgElem.selectAll('.'+keys[i]).transition().duration(duration)
						.style('opacity',1)
						//.on('start',function(){d3.selectAll('.'+keys[i]).style('display','block')});
				}
			}
		}

		//then hide the items
		for (var i=0; i<keys.length; i+=1){
			if (params.hidden[keys[i]]){
				if (keys[i] == 'BH' || keys[i] == 'NS' || keys[i] == 'GW' || keys[i] == 'EM'|| keys[i].includes('GWTC') || keys[i].includes('O3')){
					resetOpacities('.'+keys[i], true, duration, [], svgElem);
				} else {
					svgElem.selectAll('.'+keys[i]).transition().duration(duration)
						.style('opacity',0)
						//.on('end',function(){d3.selectAll('.'+keys[i]).style('display','none')});
				}
			}
		}

		//fix the arrows for combined NS BH
		if (params.hidden['BH'] && params.hidden['NS']) resetOpacities('.BHNS', true, duration, [], svgElem);
	}

	//specially handling for new data
	if (tog == 'newData' || !params.hidden['newData']){
		console.log('toggling newData')
		resetOpacities('.newData', params.hidden['newData'], duration, [], svgElem);
	}

	console.log('done toggling', tog, toHide)
}

function togglePlot(){
	//console.log('toggle check', event, this, this.nodeName, params.hidden);
	params.plotReady = false;

	var classes = null;
	if (this){
		if (this.nodeName) classes = d3.select(this).attr('class').split(' ');
	} else {
		if (event) {
			var elem = event.target;
			if (elem.nodeName != 'label') elem = event.target.parentNode; 
			classes = d3.select(elem).attr('class').split(' ');
		}
	}

	applyToggles(classes);

}

function changePointSizes(){
	//console.log(this.value);
	params.maxRadius = +d3.select('#maxPointSize').node().value;
	params.minRadius = +d3.select('#minPointSize').node().value;
	params.radiusScale.range([params.sizeScaler*params.minRadius, params.sizeScaler*params.maxRadius]);


	params.mainPlot.selectAll('.dot').attr('r', function(d){ 
		d.r = defineRadius(d);
		return d.r
	});

	if (params.viewType == 'packing' || params.viewType == 'linkedPacking' || params.viewType == 'nodes') {
		if (params.forceCollide) params.forceCollide.initialize(params.parentSimulation.nodes());
		if (params.parentSimulation) params.parentSimulation.alphaTarget(.01).restart();
	}

	params.mainPlot.selectAll('.text.qmark')
		.attr('y', function(d) {return defineYpos(d) + 0.5*defineRadius(d);})
		.style('font-size',function(d) {return 1.5*defineRadius(d)+'px';})

	changeArrowSizes();
}

function changeArrowSizes(){
	params.arrowScale = +d3.select('#arrowWidth').node().value*0.1; //scale goes between 1 and 20, but I want 0.1 - 2

	params.mainPlot.selectAll('.arrow.GW').attr('d', function(d){return createArrow(d)})

}

function changeAspect(){
	var classes = d3.select(this).attr('class').split(' ');

	if (classes.indexOf('free') != -1){
		if (!params.renderXchanged) params.renderX = window.innerWidth;
		if (!params.renderYchanged) params.renderY = window.innerHeight;
		params.renderAspect = params.renderY/params.renderX;
		params.fixedAspect = false;
	}

	if (classes.indexOf('four_three') != -1) {
		params.renderAspect = 3./4.;
		params.fixedAspect = true;
	}
	if (classes.indexOf('sixteen_nine') != -1) {
		params.renderAspect = 9./16.;
		params.fixedAspect = true;
	}

	params.renderY = Math.round(params.renderAspect*params.renderX);

	d3.select('#renderX').attr('placeholder',params.renderX);
	d3.select('#renderY').attr('placeholder',params.renderY);
}

//https://github.com/exupero/saveSvgAsPng
//see also here: https://spin.atomicobject.com/2014/01/21/convert-svg-to-png/
function renderToImage(){
	
	//so I need to redraw, in case there is a new aspect ratio.  But I will do this in a separate SVG
	var saveSVGscale = params.SVGscale;
	var saveControlsX = params.controlsX;

	if (!isNaN(params.renderX) && !isNaN(params.renderY)){	
		params.sizeScaler = params.renderX/params.targetWidth;
		params.SVGscale = 1.;
		params.controlsX = 0.;

		params.plotReady = false;
		//make another SVG to contain the plot so that the user doesn't see it?
		var svgNode = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		document.body.appendChild(svgNode)
		createPlot(d3.select(svgNode), params.renderX, params.renderY, false, false);
		applyToggles(null, d3.select(svgNode), 0);


		//wait until drawing in is complete
		clearInterval(params.readyCheck);
		params.readyCheck = setInterval(function(){ 
			if (params.plotReady){
				console.log('plot is ready')
				clearInterval(params.readyCheck);
				setTimeout(function(){
					console.log(params.renderX, params.renderY)

					if (params.whiteRenderBackground){
						d3.select(svgNode).style('background-color','white');
						d3.select(svgNode).select('#title').style('fill','black');
						d3.select(svgNode).selectAll('.arrow').attr('fill','#36454F');
						d3.select(svgNode).selectAll('.EM.NS').style('fill','#dfc23f')
						d3.select(svgNode).selectAll('.EM.NS.dot').style('stroke','#dfc23f');
						d3.select(svgNode).selectAll('.EM.NS.link').style('stroke','#dfc23f');
						d3.select(svgNode).selectAll('.qmark').style('fill','black').style('font-weight','bold');
					}

					saveSvgAsPng(svgNode, params.filename, {'width':params.renderX, 'height':params.renderY, 'transform':'none'});

					params.SVGscale = saveSVGscale;
					params.controlsX = saveControlsX;
					params.sizeScaler = params.sizeScalerOrg;
					setTimeout(function(){
						d3.select(svgNode).remove();
						params.mainPlot = d3.select('#plotSVG').select('#mainPlot');
						//for some reason it is necessary to "move" the data back to position in case the user wants to change the view
						//otherwise, the starting positions are incorrect.  
						//I suppose somewhere these positions are being reset with the new svgNode I created here, but I can't find where that might be.
						if (params.viewType == 'default'){
							moveData('GW',params.GWsortKey);
							moveData('EM',params.EMsortKey);
						}
						//resizePlot();
					},1000)
				}, (params.sortTransitionDuration + params.fadeTransitionDuration));
			} 
		}, 100);

	} else {
		console.log('bad image size ', params.renderX, params.renderY);
	}


}

function changeBackground(){
	params.whiteRenderBackground = !params.whiteRenderBackground;
}