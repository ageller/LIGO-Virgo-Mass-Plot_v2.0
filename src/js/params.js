//all "global" variables are contained within params object
  
var params = new function() {

	this.inputGWdata;
	this.data = [];

	this.svg;
	this.xAxisScale;
	this.yAxisScale;
	this.xAxis;
	this.yAxis;

	this.radiusScale;
	
	this.SVGbackground = getComputedStyle(document.documentElement).getPropertyValue('--plot-background-color');
	this.SVGmargin = {'top': 10,'bottom':10,'left': 10,'right':10};
	this.SVGpadding = {'top': 50, 'bottom':50,'left': 100,'right':10};
	this.SVGwidth = window.innerWidth - this.SVGmargin.left - this.SVGmargin.right; 
	this.SVGheight = window.innerHeight - this.SVGmargin.top - this.SVGmargin.bottom; 
};


