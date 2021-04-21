function getAllIndexes(arr, val){
	//get all indices where val occurs in arr
	var indexes = [];
	for (var i = 0; i<arr.length; i+=1){
		if (arr[i] === val)
			indexes.push(i);
	}
	return indexes;
}

function indexOfMax(arr){
	//get the max value and the index of the max value
	if (arr.length === 0){
		return {'value':null,'index':-1};;
	}

	var max = arr[0];
	var maxIndex = 0;

	for (var i=0; i<arr.length; i+=1){
		if (arr[i] > max){
			maxIndex = i;
			max = arr[i];
		}
	}

	return {'value': max,'index':maxIndex};
}

function cleanString (s){
	//return s.replace(/sub\>/g,'').replace(/\s/g,'').replace(/[^a-zA-Z ]/g, "").toLowerCase();
	return s.replace(/[\W]+/g,"");
}

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

function sortWithIndices(toSort) {
	for (var i = 0; i < toSort.length; i++) {
		toSort[i] = [toSort[i], i];
	}
	toSort.sort(function(left, right) {
		return left[0] < right[0] ? -1 : 1;
	});
	toSort.sortIndices = [];
	for (var j = 0; j < toSort.length; j++) {
		toSort.sortIndices.push(toSort[j][1]);
		toSort[j] = toSort[j][0];
	}
	return toSort;
}

function shuffle(array) {
	var currentIndex = array.length, temporaryValue, randomIndex;

	// While there remain elements to shuffle...
	while (0 !== currentIndex) {

		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		// And swap it with the current element.
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}

	return array;
}

Number.prototype.countDecimals = function () {
    if(Math.floor(this.valueOf()) === this.valueOf()) return 0;
    return this.toString().split(".")[1].length || 0; 
}