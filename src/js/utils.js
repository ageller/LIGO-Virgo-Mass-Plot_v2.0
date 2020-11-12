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
	return s.replace(/sub\>/g,'').replace(/\s/g,'').replace(/[^a-zA-Z ]/g, "").toLowerCase();
}