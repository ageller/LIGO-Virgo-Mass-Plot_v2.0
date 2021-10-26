//define the search box
var bbox = d3.select('#controls').node().getBoundingClientRect();
d3.select('#searchContainer')
	.attr('class', 'controlsTitle')
	.style('width',bbox.width - 24 + 'px' )
	.style('height','200px') 
	.style('padding-top','0px') 
	.style('float','left')

d3.select('#searchInput')
	.attr('type','text')
	.attr('placeholder','Enter ID')
	.attr('autocomplete','off')
	.style('float', 'left')
	//.style('width',params.searchWidth - params.buttonHeight - 1 + 'px' )
	.style('width',bbox.width - 24 + 'px' )
	.style('border-bottom', '1px solid black')
	.style('border-right', '1px solid black')
	.on('click',function(){
		d3.select(this)
			.attr('value',null)
	})
	.on('keydown',function(){
		var value = this.value;
		var inp = String.fromCharCode(event.keyCode);
		if (/[a-zA-Z0-9-_ ]/.test(inp)) value += event.key;

		//show the box
		if (value.length == 0) d3.select('#searchList').style('display','none');

		if (event.keyCode == 13) {
			//if user types enter
			showTooltip(d3.select('.name-'+cleanString(value)).node() )
		} else {
			checkSearchInput(value);
		}
	})
	.on('keyup', function(){
		if (this.value.length == 0){
			d3.select('#searchList').style('display','none');
			hideTooltip();
		} else {
			if (event.keyCode != 13) checkSearchInput(this.value);
		}
	})

d3.select('#searchList')
	.style('overflow-y','auto')
	.style('float','left')
	.style('height', '100px') 
	.style('margin-bottom', '100px') 
	.style('border', '1px solid black') 
	.style('border-radius', '3px')
	.style('display', 'none') 
	.style('width',bbox.width - 22 +'px' )
	.style('background-color', 'white');

//clear the input on any mouse click?
// params.container.on('click', function(){clearSearch(event)});

//search through the input objects for names that match
function checkSearchInput(value = null){
	if (!value) value = document.getElementById('searchInput').value;

	//console.log("Searching", value, value.length)

	//is there a faster way to do this? (maybe but this seems fast enough)
	var indices = [];
	if (value.length > 0){
		iden = [];
		params.commonNames.forEach(function(d,i){
			//console.log(d.substring(0,value.length).toUpperCase(), value.toUpperCase())
			if (d.substring(0,value.length).toUpperCase() == value.toUpperCase()) indices.push(i);
		})
	} else {
		indices = null;
	}
	//console.log('have indices', indices)
	showNames(indices);
}


//show a list of names in the div below the search box
function showNames(indices = null){
	d3.select('#searchList').selectAll('.listNames').remove();
	d3.select('#searchList').selectAll('.searchInfo').remove();

	if (indices){
		if (indices.length > 0){
			d3.select('#searchList').style('display','block')
			d3.select('#searchList').selectAll('.listNames')
				.data(indices).enter()
				.append('div')
					.attr('class','listNames')
					.classed('listNamesHover', true)
					.attr('id',function(i) {return 'listName-' + params.data[i].commonName;})
					.on('click', function() {
						var target = event.target || event.srcElement;
						var text = target.textContent || target.innerText;
						d3.select('#searchInput').node().value = text;
						showTooltip(d3.select('.name-'+cleanString(text)).node() );
					})
					.text(function(i){return params.data[i].commonName;})
		} else {
			d3.select('#searchList').append('div')
				.attr('class','searchInfo')
				.style('color','gray')
				.style('font-size','12px')
				.text('No results')
		}
	}
}