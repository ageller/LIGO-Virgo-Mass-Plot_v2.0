//all "global" variables are contained within params object
  
var params = new function() {

	//holds the data from GWOSC
	this.inputGWdata;
	this.data = [];
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

	//sorting
	this.GWsortKey = 'diamondIndex';
	this.EMsortKey = 'valleyIndex';

	//SVG setup
	this.SVG;
	this.mainPlot;
	this.SVGbackground = getComputedStyle(document.documentElement).getPropertyValue('--plot-background-color');
	this.SVGmargin = {'top': 10,'bottom':10,'left': 10,'right':10};
	this.SVGpadding = {'top': 10, 'bottom':100,'left': 120,'right':10};
	this.SVGwidth = window.innerWidth - this.SVGmargin.left - this.SVGmargin.right; 
	this.SVGheight = window.innerHeight - this.SVGmargin.top - this.SVGmargin.bottom; 

	this.colors = {'GWBH':'#00BFFF','GWNS':'#d78122', 'EMBH':'#6b509f', 'EMNS':'#dfc23f' };

	//default opacities for objects
	this.opMass = 0.5;
	this.opArrow = 0.5;

	this.BHMinMass = 3; //minimum mass for coloring as a black hole in GW sources

	this.tooltipTransitionDuration = 200;
	this.sortTransitionDuration = 400;
	this.controlsTransitionDuration = 200;

	//arrow settings
	this.arrowThickBottom = 2;
	this.arrowCurveTail = 3;
	this.arrowThickTop = 10;
	this.arrowHeadStart = 20;
	this.arrowScale = 1;
};


