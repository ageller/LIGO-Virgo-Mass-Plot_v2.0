//all "global" variables are contained within params object
  
var params = new function() {

	//holds the data from GWOSC
	this.inputGWdata;
	this.inputEMdata;
	this.EMdata;
	this.data = []; //this will hold the data as read in from GWOSC (3 BHs per entry) and our EM database
	this.plotData = []; //this will hold reformatted data for the plot where each of the GW sources have 3 entries (and point back to this.data)
	this.commonNames = [];

	//axes scaling
	this.xAxisScale;
	this.yAxisScale;
	this.xAxis;
	this.yAxis;
	this.xNorm = 1;

	//radius scaling
	this.radiusScale;
	this.maxRadius = 20;
	this.minRadius = 5;

	this.targetWidth = 1920;//pixels for a target window width to scale point sizes
	this.sizeScaler = 1;
	this.sizeScalerOrg = 1;

	//sorting
	this.GWsortKey = 'diamondRandIndex';
	this.EMsortKey = 'valleyIndex';

	//SVG setup
	this.SVG = d3.select('#plotSVG')
	this.mainPlot;
	this.SVGbackground = 'black';
	this.SVGmargin = {'top': 10,'bottom':10,'left': 10,'right':10};
	this.SVGpadding = {'top': 10, 'bottom':60,'left': 70,'right':10};
	this.SVGwidth = window.innerWidth - this.SVGmargin.left - this.SVGmargin.right; 
	this.SVGheight = window.innerHeight - this.SVGmargin.top - this.SVGmargin.bottom; 
	
	this.plotReady = false;

	//this will be modified if the controls gui is open
	this.SVGscale = 1.;
	this.controlsX = 0.;

	//this.colors = {'GWBH':'#00BFFF','GWNS':'#d78122', 'EMBH':'#6b509f', 'EMNS':'#dfc23f' };
	this.colors = {'GWBH':'#00BFFF','GWNS':'#d78122', 'EMBH':'#D81B60', 'EMNS':'#dbed9f' };

	//default opacities for objects
	this.opMass = 0.75;
	this.opArrow = 0.5;

	this.BHMinMass = 3; //minimum mass for coloring as a black hole in GW sources

	//for rendering
	this.renderX = window.innerWidth; //will be updated from button
	this.renderXchanged = false;
	this.renderY = window.innerHeight;
	this.renderYchanged = false;
	this.renderAspect = this.renderY/this.renderX; // default to keep the screen size
	this.fixedAspect = false;
	
	this.filename = 'Masses_of_Dead_Stars_LIGO_Virgo.png';

	this.tooltipTransitionDuration = 200;
	this.sortTransitionDuration = 400;
	this.fadeTransitionDuration = 400;
	this.packingTransitionDuration = 1000;
	this.controlsTransitionDuration = 200;
	this.selectedElement = null;

	//arrow settings
	this.arrowThickBottom = 2;
	this.arrowCurveTail = 3;
	this.arrowThickTop = 10;
	this.arrowHeadStart = 15;
	this.arrowScale = 0.6;

	this.dropdownHeights = {};

	this.hidden = {'BH':false,'NS':false,'GW':false,'EM':false,'plotTitle':false,'massGap':true};

	this.massGap = [2.74, 4.9];

	//for changing the view 
	this.viewType = 'default';
	//for the circle packing
	this.parentSimulation = null;
	this.forceCollide = null;
	this.forceLink = null;
	this.ticker;

	//build in a hook to show only the new data, for highlighting in Photoshop
	this.newData = [];//['GW190403_051519','GW190426_190642','GW190725_174728','GW190805_211137','GW190916_200658','GW190917_114630','GW190925_232845','GW190926_050336'];

	//holder for intervals
	this.readyCheck;

	this.whiteRenderBackground = false;

	//to hold a list of particles that need to be swapped
	this.swapList = [];

	//for searching
	this.searchTimeout = null;
};


