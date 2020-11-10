//all "global" variables are contained within params object
  
var params = new function() {

	//holds the data from GWOSC
	this.inputGWdata;
	this.data = [];

	//axes scaling
	this.xAxisScale;
	this.yAxisScale;
	this.xAxis;
	this.yAxis;

	//radius scaling
	this.radiusScale;
	
	//SVG setup
	this.SVG;
	this.SVGbackground = getComputedStyle(document.documentElement).getPropertyValue('--plot-background-color');
	this.SVGmargin = {'top': 10,'bottom':10,'left': 10,'right':10};
	this.SVGpadding = {'top': 50, 'bottom':50,'left': 100,'right':10};
	this.SVGwidth = window.innerWidth - this.SVGmargin.left - this.SVGmargin.right; 
	this.SVGheight = window.innerHeight - this.SVGmargin.top - this.SVGmargin.bottom; 

	//default opacities for objects
	this.opMass = 0.85
	this.opArrow = 0.5

	//arrow settings
	this.arrowThickBottom = 2;
	this.arrowCurveTail = 3;
	this.arrowThickTop = 10;
	this.arrowHeadStart = 20;
};


