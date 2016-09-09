var docIdToIndexMap = {};
var indexToDocIdMap = {};
var labelSet = Object.create(null);
var docLabelMap = {};
var docLabelProbMap = {};
var maxPosteriorLabelProbMap = {};//map from doc if to the maximum label prob
var allLabelDocMap = {};//label to list of documents map
var localAllLabelDocMap={};
var classificationDocLabelMap = {};
var labelToColor={};
var chosenRandDocIndex = [];
var baselineStudy = false;
var AL = false;
var doc_to_label = {};

var isFirstLabel = true;
var explorationTime = 0;
var numLabeled = 0;//keeping track of number of labeled documents after the recent click on run classifier
var load_label_docs_mode = false;
var lastLabeledDocDiv = "";
var isLabelView = false;
var docToTopicMap = {};
var topicToALTopIds = {};
var newLabel = false;//added a new label to a document
var isFirstTime=true;//first time to run classifier
var deleteALabel = false;//is true if a label was deleted
var deletedLabel = null;
var editALabel = false;//is true if a label was edited
var editedPrevLabel = null;
var editedNewLabel = null;
var deleteDocLabel = false;//deleted a document label
var deletedDocLabelId = null;
var optTopic = 0;
var optDocId = "";
var colors = ["Turquoise","IndianRed","Orchid","PaleTurquoise","ForestGreen","LightSalmon","PowderBlue","Thistle","SkyBlue","GoldenRod"
              ,"LimeGreen","Tomato","FireBrick","DodgerBlue","Orange","Brown","DarkSeaGreen","BlueViolet","DarkSlateBlue","YellowGreen","Red",
              "Salmon","CadetBlue","MediumAquaMarine","DarkTurquoise","RoyalBlue","Crimson","DarkRed","Khaki","LightPink","Aquamarine","Tan",
              "MidnightBlue","MediumOrchid","HotPink","Violet","Chocolate","DarkGoldenRod","Blue","DarkGreen","SandyBrown","DeepPink",
              "Magenta","Lime","SlateBlue","Olive","Darkorange","DarkCyan","LightCoral","MediumPurple","DarkViolet","Maroon","SteelBlue"
              ,"LightSteelBlue","SaddleBrown","Aqua","Indigo","Plum","Coral","Peru","CornflowerBlue","DeepSkyBlue","Sienna",
              "DarkSalmon","GreenYellow","Fuchsia","LawnGreen","MediumVioletRed","OrangeRed","RosyBrown","PaleVioletRed","Purple",
              "DarkMagenta","MistyRose","Gold"];

function fillDocToIndexMap(){
	cnt = 0;
	for (var d in all_docs){
		var docId = all_docs[d]["name"];
		docIdToIndexMap[docId] = cnt;
		indexToDocIdMap[cnt] = docId;
		cnt++;
	}
}
//----------------------------------------------------------------------------------------
//Adding a new label
function addLabel(){
	var seconds = new Date().getTime() / 1000;
	labelName = document.getElementById("label-form").value;
	labelName = labelName.toLowerCase().trim();
	var currMin = mainWindow.minute;
	var currSec = mainWindow.second;
	addLabelLogs(seconds, false, "<NOT_ASSIGNED>", labelName, currMin, currSec);
	if (labelName.replace(/[\.,?!-\/#!$%\^&\*;:{}=\-_`~()]/g, "") != labelName) {
		var currMin = mainWindow.minute;
		var currSec = mainWindow.second;
		invalidAddLabelLogs(labelName, seconds, currMin, currSec);
		var appearTime = new Date().getTime() / 1000;
		window.alert("Labels can only contain letters and digits.");
		var okTime = new Date().getTime() / 1000;
		var currMin = mainWindow.minute;
		var currSec = mainWindow.second;
		var str = "Labels can only contain letters and digits.";
		mainWindow.addAlertLogs(str, appearTime, okTime, currMin, currSec);
		return;
	}
	mainWindow.newLabel = true;
	addLabelName(labelName);
	mainWindow.takeLogsInServer();
	document.getElementById("label-submit-button").disabled = true;
	document.getElementById("label-form").value = "";
}
function addLabelName(labelName){
	labelName = String(labelName);
	allLabelDocMap[labelName] = [];
	localAllLabelDocMap[labelName] = [];
	var numLabels = Object.keys(labelSet).length;
	rand = Math.floor(Math.random() * colors.length);
	labelToColor[labelName] = colors[numLabels];
	colors.splice(numLabels,1);
	if (labelName.trim() in labelSet || labelName.trim().toLowerCase() in labelSet){
		var appearTime = new Date().getTime() / 1000;
		window.alert("Label ("+labelName.trim().toLowerCase()+") already exists.");
		var okTime = new Date().getTime() / 1000;
		var currMin = mainWindow.minute;
		var currSec = mainWindow.second;
		var str = "Label ("+labelName.trim().toLowerCase()+") already exists.";
		mainWindow.addAlertLogs(str, appearTime, okTime, currMin, currSec);
		return;
	}
	if (labelName == ""){
		var appearTime = new Date().getTime() / 1000;
		window.alert("A label should have et least one character. Please enter a valid label!");
		var okTime = new Date().getTime() / 1000;
		var currMin = mainWindow.minute;
		var currSec = mainWindow.second;
		var str = "A label should have et least one character. Please enter a valid label!";
		mainWindow.addAlertLogs(str, appearTime, okTime, currMin, currSec);
		return;
	}
	labelSet[labelName] = true;
	url = backend+"/DisplayData?topic=Labels";
	radioStr = "<div " +
	"\" id = \""+ "label-div-"+labelName+"\"></a>"+"<input type=\"radio\" checked name = \"label-name\" value=\""+
	labelName +"\" onchange ='enableEditDel()'>&nbsp;&nbsp;&nbsp;<a href='#' onclick = \"load_label_docs('"+url+"','"+null+"','"+labelName+"','"+0+"','"+numDocsPerPage+"',false)\"><font  color='"+labelToColor[labelName]+"'><b>"+
	labelName+"</b></font></a><br></div>";	
	radioStr = "";
	if(Object.keys(labelSet).length > 0){
		sortedLabelSet = Object.keys(labelSet).sort();
		for(j in sortedLabelSet){
			radioStr += "<div " +
			"\" id = \""+ "label-div-"+sortedLabelSet[j]+"\"></a>"+"<input type=\"radio\" checked name = \"label-name\" value=\""+
			sortedLabelSet[j] +"\" onchange ='enableEditDel()'>&nbsp;&nbsp;&nbsp;<a href='#' onclick = \"load_label_docs('"+url+"','"+null+"','"+sortedLabelSet[j]+"','"+0+"','"+numDocsPerPage+"',false)\"><font  color='"+labelToColor[sortedLabelSet[j]]+"'><b>"+
			sortedLabelSet[j]+"</b></font></a><br></div>";
		}
	}
	document.getElementById("label-display").innerHTML = radioStr;
	enableEditDel();
}
//----------------------------------------------------------------------------------------
//edit and delete a label
function enableEditDel(){
	$('#delete-label').removeAttr('disabled');
	$('#edit-label').removeAttr('disabled');
}
function disableEditDel(){
	$('#delete-label').attr('disabled', true);
	$('#edit-label').attr('disabled', true);
}
function deleteLabel(){
	//deletes the label from the ui 
	//any doc that has that label will no longer have any label
	mainWindow.deleteALabel = true;
	var clickTime = new Date().getTime() / 1000;
	labelName = $("input:radio[name=label-name]:checked").val();
	var currMin = mainWindow.minute;
	var currSec = mainWindow.second;
	mainWindow.addDeleteLabelLogs(clickTime, labelName, currMin, currSec);

	elem = document.getElementById('label-div-'+labelName); 
	elem.parentNode.removeChild(elem);
	mainWindow.deletedLabel = labelName;
	
	//update labeledTopicDocs
	if(mainWindow.global_study_condition === LA_CONDITION || mainWindow.global_study_condition === LR_CONDITION){
		var i = 0;
		while(i < Object.keys(mainWindow.baselineLabeledDocs).length){
			var docId = mainWindow.baselineLabeledDocs[i];
			var label = mainWindow.docLabelMap[docId];
			if(label === mainWindow.deletedLabel){
				var index = baselineLabeledDocs.indexOf(docId);
				baselineLabeledDocs.splice(index,1);
				i--;
			}
			i++;
		}
	}
	else{
		for (var i = 0 ; i < mainWindow.topicsnum; i++){
			var topicIndex = i;
			//add already labeled docs
			var labeled = mainWindow.labeledTopicsDocs[""+topicIndex];	//edit color
			var j = 0;
			while(j < Object.keys(labeled).length){
				var labeledDocId = labeled[j];
				var docLabel = mainWindow.docLabelMap[labeledDocId];

				if(docLabel === labelName){
					var index = labeled.indexOf(labeledDocId);
					labeled.splice(index, 1);
					j--;
				}
				j++;
			}
		}
		mainWindow.setProgressBar();
	}

	$('#label-div-'+labelName).remove(); 
	//delete from labelSet
	for(var label in labelSet) {
		if(label === labelName) {
			delete labelSet[label];
		}
	}
	//deleting from docLabelMap
	for (docId in docLabelMap){
		docIdWTopic = getDocIdWithTopic(docId);
		docLabel = docLabelMap[docId];
		if(docLabel == labelName){
			deleteUserDocLabel(docId, window);
		}

	}
	//update classificationDocLabelMap
	for (docId in classificationDocLabelMap){
		docLabel = classificationDocLabelMap[docId];
		if(docLabel == labelName){
			deleteAutoDocLabel(docId, window);
		}
	}
	//update docLabelProbMap 
	for (docId in docLabelProbMap){
		dist = docLabelProbMap[docId];
		delete dist[labelName];
		docLabelProbMap[docId] = dist;
	}
	//update allLabelDocMap
	delete allLabelDocMap[labelName];

	colors.splice(0, 0, labelToColor[labelName]);
	delete labelToColor[labelName];
	disableEditDel();
	if(mainWindow.canRunClassifier(mainWindow.docLabelMap))
		classifyForAL();
}
function editLabel(){
	//edits the label in the ui 
	//any doc that has that label will have the new label
	var clickTime = new Date().getTime() / 1000;
	labelName = $("input:radio[name=label-name]:checked").val();

	newLabelName = "";
	var renameTime;
	while(newLabelName == ""){
		newLabelName = prompt("Please enter the new label", labelName);
		newLabelName = newLabelName.trim().toLowerCase();
		renameTime = new Date().getTime() / 1000;
		if (newLabelName === null || newLabelName === false)
			return;
		if (newLabelName == "" || newLabelName == " "){
			var currMin = mainWindow.minute;
			var currSec = mainWindow.second;
			mainWindow.addRenameCancelLogs(clickTime, labelName, currMin, currSec);
			return;
		}
		if(newLabelName.trim().toLowerCase() in labelSet){
			var appear = new Date().getTime() / 1000;
			window.alert("Label \""+newLabelName.trim().toLowerCase()+ "\" already exists. Please choose a new label.");
			var okTime = new Date().getTime() / 1000;
			var currMin = mainWindow.minute;
			var currSec = mainWindow.second;
			var str = "Label \""+newLabelName.trim().toLowerCase()+ "\" already exists. Please choose a new label.";
			mainWindow.addAlertLogs(str, appearTime, okTime, currMin, currSec);
			return;
		}
		if (newLabelName.replace(/[\.,?!-\/#!$%\^&\*;:\'{}=\-_`~()]/g, "") != newLabelName) {
			var currMin = manWindow.minute;
			var currSec = mainWindow.second;
			mainWindow.invalidAddLabelLogs(newLabelName, renameTime, currMin, currSec);
			var appearTime = new Date().getTime() / 1000;
			window.alert("Labels can only contain letters and digits.");
			var okTime = new Date().getTime() / 1000;
			var currMin = mainWindow.minute;
			var currSec = mainWindow.second;
			var str = "Labels can only contain letters and digits.";
			mainWindow.addAlertLogs(str, appearTime, okTime, currMin, currSec);
			return;
		}
	}
	mainWindow.editALabel = true;
	mainWindow.editedPrevLabel = labelName;
	mainWindow.editedNewLabel = newLabelName;
	var currMin = mainWindow.minute;
	var currSec = mainWindow.second;
	mainWindow.addRenameLabelLogs(clickTime, renameTime, labelName, newLabelName, currMin, currSec);
	mainWindow.takeLogsInServer();
	//edit allLabelDocMap
	allLabelDocMap[newLabelName] = [];
	localAllLabelDocMap[newLabelName] = [];
	for(j in allLabelDocMap[labelName]){
		docid = allLabelDocMap[labelName][j];
		allLabelDocMap[newLabelName].push(docid);
	}

	delete allLabelDocMap[labelName];
	delete localAllLabelDocMap[labelName];

	//edit labelSet
	for(var label in labelSet) {
		if(label == labelName) {
			delete labelSet[labelName];
			labelSet[newLabelName] = true;
		}
	}
	//edit color
	labelToColor[newLabelName] = labelToColor[labelName];
	var elem = document.getElementById("label-div-"+labelName);

	radioStr  = "<div " +
	"\" id = \""+ "label-div-"+newLabelName+"\"></a>"+"<input type=\"radio\" checked name = \"label-name\" value=\""+
	newLabelName +"\" onchange ='enableEditDel()'>&nbsp;&nbsp;&nbsp;<a href='#' onclick = \"load_label_docs('"+url+"','"+null+"','"+newLabelName+"','"+0+"','"+numDocsPerPage+"')\"><font  color='"+labelToColor[newLabelName]+"'><b>"+
	newLabelName+"</b></font></a><br></div>";	

	$( elem ).replaceWith(radioStr);

	delete labelToColor[labelName];

	//editing from docLabelMap 
	for (docId in docLabelMap){
		docLabel = docLabelMap[docId];
		if(docLabel == labelName){
			docLabelMap[docId] = newLabelName;
		}
	}
	//update classificationDocLabelMap
	for (docId in classificationDocLabelMap){
		docLabel = classificationDocLabelMap[docId];
		if(docLabel == labelName){
			classificationDocLabelMap[docId] = newLabelName;
		}
	}

	//update docLabelProbMap 
	for (docId in docLabelProbMap){
		dist = docLabelProbMap[docId];
		dist[newLabelName] = dist[labelName];
		delete dist[labelName];
		docLabelProbMap[docId] = dist;
	}
	if(mainWindow.canRunClassifier(mainWindow.docLabelMap))
		classifyForAL();
}


//----------------------------------------------------------------------------------------
//Document info
function fillDocTopics(){
	//makes a string of docIds to the topics it has
	if(Object.keys(mainWindow.docToTopicMap).length == 0){
		for(var d in all_docs){
			var docId = all_docs[d]["name"];
			var highTopics = all_docs[d]["highestTopic"];
			docToTopicMap[docId] = highTopics;
		}
	}
}
function fillDocToSummaryMap(){
	if(Object.keys(mainWindow.docToSummaryMap).length == 0){
		for(var d in all_docs){
			var docId = all_docs[d]["name"];
			var summary = all_docs[d]["summary"];
			mainWindow.docToSummaryMap[docId] = summary;
		}
	}
}
//----------------------------------------------------------------------------------------
//Classify
function classify(){
	var runClassifierTime = new Date().getTime() / 1000;
	if(!canRunClassifier(docLabelMap)){
		var appearTime = new Date().getTime() / 1000;
		window.alert("No document labels found. Please label at least two documents!");
		var okTime = new Date().getTime() / 1000;
		var currMin = mainWindow.minute;
		var currSec = mainWindow.second;
		var str = "No document labels found. Please label at least two documents!";
		mainWindow.addAlertLogs(str, appearTime, okTime, currMin, currSec);
		return;
	}
	var min = mainWindow.minute;
	var sec = mainWindow.second;
	allLabelDocMap={};
	localAllLabelDocMap = {};
	classificationDocLabelMap = {};
	topLabelDocs = {};
	for (labelName in labelSet){
		allLabelDocMap[labelName] = [];
		localAllLabelDocMap[labelName] = [];
		topLabelDocs[labelName] = [];
	}

	numLabeled = 0;//reset the number of labeled documents
	mainWindow.hideDocs();

	$('#loading').modal({
		keyboard: false
	})
	$('#loading_words').html("Generating automatic labels and updating documents...");
	$('#loading').modal('show');
	$(".modal-backdrop").unbind();
	var output="";


	/*prints docid:label s. Needs to be complete*/
	result = "";
	for (i in docLabelMap){
		result += i+":"+docLabelMap[i]+",";
		label_val = docLabelMap[i];
		allLabelDocMap[label_val].push(i);
		localAllLabelDocMap[label_val].push(i);
	}
	result = result.substring(0, result.length-1);
	var labeledDocsStr = getLabeledDocsStr();
	var currMin = mainWindow.minute;
	var currSec = mainWindow.second;
	mainWindow.addClassificationLogs(runClassifierTime, currMin, currSec);
	var isFromScratch = mainWindow.getIsFromScratch(false);
	var endpoint=backend+"/Classify?"+"fromScratch="+isFromScratch+"&isFirstTime="+mainWindow.isFirstTime+"&AL=false&final=false"+"&username="+username+"&corpusname="+corpusname+
	"&topicsnum="+topicsnum+"&docLabelMap="+result+"&startSeconds="+startSeconds+"&labeledDocs="+labeledDocsStr+"&condition="+global_study_condition+
	"&editALabel="+mainWindow.editALabel+"&editedPrevLabel="+mainWindow.editedPrevLabel+"&editedNewLabel="+mainWindow.editedNewLabel+"&deleteALabel="+mainWindow.deleteALabel+
	"&deletedLabel="+mainWindow.deletedLabel+"&deletedDocLabel="+mainWindow.deleteDocLabel+"&deletedDocLabelId="+mainWindow.deletedDocLabelId+"&finalEvent="+mainWindow.finalEvent+"&min="+min+"&sec="+sec;
	mainWindow.finalEvent = "";
	mainWindow.resetScratchVariables();
	var output="";
	$.ajax({
		type: "GET",
		contentType: "application/x-www-form-urlencoded;charset=utf-8",
		url: endpoint,
		async: true,
		data: output,
		success: function(json) {
			var jsonSucessTime = new Date().getTime() / 1000;
			var currMin = mainWindow.minute;
			var currSec = mainWindow.second;
			mainWindow.addJsonSuccessTimeLogs(jsonSucessTime, currMin, currSec);
			//classification results
			doc_to_label = json.doc_to_label_map;
			doc_to_label_prob = json.doc_prob_map;
			top_label_docs = json.top_label_docs;
			ii = 0;
			for(var entryId in doc_to_label_prob){
				entry = doc_to_label_prob[entryId];
				docLabelProbMap[entry.docName] = entry.dist;
				maxPosteriorLabelProbMap[entry.docName] = 0;
				for(var j in docLabelProbMap[entry.docName]){
					prob = docLabelProbMap[entry.docName][j];
					if(Number(prob) > maxPosteriorLabelProbMap[entry.docName])
						maxPosteriorLabelProbMap[entry.docName] = Number(prob);
				}
			}
			for(var entryId in top_label_docs){
				entry = top_label_docs[entryId];
				var labelName = entry.labelName;
				var topDocs = entry.topDocs;
				for(var j in topDocs){
					var key = topDocs[j];
					topLabelDocs[labelName].push(key);
				}
			}

			for(var entryId in doc_to_label){
				entry = doc_to_label[entryId];
				if(topLabelDocs[entry.label].indexOf(entry.docName) != -1){
					classificationDocLabelMap[entry.docName] = entry.label;
					allLabelDocMap[entry.label].push(entry.docName);
					localAllLabelDocMap[entry.label].push(entry.docName);
				}
			}
			if(global_study_condition == TA_CONDITION || global_study_condition == TR_CONDITION)
				mainWindow.fillTopicALDocs(json);
			else
				mainWindow.fillBaselineALDocs(json);
			mainWindow.updateUIDocs(json);

			$('#loading').modal('hide');
			updateAutoDocColors();
			var endTime = new Date().getTime() / 1000;
			var currMin = mainWindow.minute;
			var currSec = mainWindow.second;
			mainWindow.addClassificationEndTimeLog(endTime, currMin, currSec);
			mainWindow.takeLogsInServer();
			mainWindow.isFirstTime = false;
			if(mainWindow.isLabelView){
				//restart the label
				if(mainWindow.loadedLabelName in mainWindow.allLabelDocMap == true 
						&& mainWindow.allLabelDocMap[mainWindow.loadedLabelName].length != 0){	
			
						var url = mainWindow.backend+"/DisplayData?topic=Labels";				
						mainWindow.load_label_docs(url, "null", mainWindow.loadedLabelName, '0', mainWindow.numDocsPerPage, true);
				}
			}
		}
	});
}//end classify()
function classifyForAL(){
	if(Object.keys(mainWindow.docLabelMap).length < 2 || Object.keys(mainWindow.labelSet).length < 2){
		var appearTime = new Date().getTime() / 1000;
		window.alert("You should have at least 2 documents labeled with 2 different labels!");
		var okTime = new Date().getTime() / 1000;
		var currMin = mainWindow.minute;
		var currSec = mainWindow.second;
		var str = "You should have at least 2 documents labeled with 2 different labels!";
		mainWindow.addAlertLogs(str, appearTime, okTime, currMin, currSec);
		mainWindow.AL = false;
		return;
	}
	var min = mainWindow.minute;
	var sec = mainWindow.second;
	var startUpdateTime = new Date().getTime() / 1000;

	mainWindow.takeLogsInServer();
	mainWindow.AL = true;

	mainWindow.hideDocs();

	$('#loading').modal({
		keyboard: false
	})
	$('#loading_words').html("Updating documents...");
	$('#loading').modal('show');
	$(".modal-backdrop").unbind();

	var output="";
	/*prints docid:label s. Needs to be complete*/
	result = "";
	for (i in mainWindow.docLabelMap){
		result+= i+":"+mainWindow.docLabelMap[i]+",";
	}
	result = result.substring(0, result.length-1);
	timesStr = "";

	numLabeledInTopicsStr = "";
	for(var i = 0 ; i < mainWindow.topicsnum; i++){
		numLabeledInTopicsStr += String(i)+":"+mainWindow.labeledTopicsDocs[i].length+",";
	}
	numLabeledInTopicsStr = numLabeledInTopicsStr.substring(0, numLabeledInTopicsStr.length-1);
	var isFromScratch = mainWindow.getIsFromScratch(true);
	var currMin = mainWindow.minute;
	var currSec = mainWindow.second;
	mainWindow.addUpdateDocsLogs(startUpdateTime, currMin, currSec);
	mainWindow.takeLogsInServer();

	//send in the labeled docs in each topic in the logs
	var labeledDocsStr = getLabeledDocsStr();

	var endpoint = mainWindow.backend+"/Classify?"+"fromScratch="+isFromScratch+"&isFirstTime="+mainWindow.isFirstTime+"&AL=true&final=false"+"&username="+mainWindow.username+"&corpusname="+mainWindow.corpusname+
	"&topicsnum="+topicsnum+"&docLabelMap="+result+"&numLabeledInTopics="+numLabeledInTopicsStr+"&condition="+global_study_condition+"&labeledDocs="+labeledDocsStr+"&editALabel="+mainWindow.editALabel+
	"&editedPrevLabel="+mainWindow.editedPrevLabel+"&editedNewLabel="+mainWindow.editedNewLabel+"&deleteALabel="+mainWindow.deleteALabel+"&deletedLabel="+mainWindow.deletedLabel+
	"&deletedDocLabel="+mainWindow.deleteDocLabel+"&deletedDocLabelId="+mainWindow.deletedDocLabelId+"&finalEvent="+mainWindow.finalEvent+"&min="+min+"&sec="+sec;
	mainWindow.finalEvent = "";
	mainWindow.resetScratchVariables();
	var output="";
	$.ajax({
		type: "GET",
		contentType: "application/x-www-form-urlencoded;charset=utf-8",
		url: endpoint,
		async: true,
		data: output,
		success: function(json) {
			var jsonSucessTime = new Date().getTime() / 1000;
			var currMin = mainWindow.minute;
			var currSec = mainWindow.second;
			mainWindow.addJsonSuccessTimeLogs(jsonSucessTime, currMin, currSec);
			currTopIndex = 0;
			if(global_study_condition == TA_CONDITION || global_study_condition == TR_CONDITION)
				mainWindow.fillTopicALDocs(json);
			else
				mainWindow.fillBaselineALDocs(json);
			mainWindow.updateUIDocs(json);
			mainWindow.updateUsedLabels(json);
			$('#loading').modal('hide');
			var endTime = new Date().getTime() / 1000;
			var currMin = mainWindow.minute;
			var currSec = mainWindow.second;
			mainWindow.addUpdateDocsEndTimeLog(endTime, currMin, currSec);
			mainWindow.takeLogsInServer();
			mainWindow.isFirstTime = false;
		}
	});
}
function finalClassify(){//classify all documents but just take logs

	if(!canRunClassifier(docLabelMap)){
		return;
	}
	var min = mainWindow.minute;
	var sec = mainWindow.second;
	var output="";
	/*prints docid:label s. Needs to be complete*/
	result = "";
	for (i in docLabelMap){
		result+= i+":"+docLabelMap[i]+",";
	}
	result = result.substring(0, result.length-1);
	var labeledDocsStr = getLabeledDocsStr();
	var isFromScratch = mainWindow.getIsFromScratch(false);
	var endpoint=backend+"/Classify?"+"fromScratch="+isFromScratch+"&isFirstTime="+mainWindow.isFirstTime+"&AL=false&final=true"+"&username="+username+"&corpusname="+corpusname+
	"&topicsnum="+topicsnum+"&docLabelMap="+result+"&labeledDocs="+labeledDocsStr+"&condition="+global_study_condition+
	"&editALabel="+mainWindow.editALabel+"&editedPrevLabel="+mainWindow.editedPrevLabel+"&editedNewLabel="+mainWindow.editedNewLabel+"&deleteALabel="+
	mainWindow.deleteALabel+"&deletedLabel="+mainWindow.deletedLabel+"&deletedDocLabel="+mainWindow.deleteDocLabel+"&deletedDocLabelId="+mainWindow.deletedDocLabelId+"&finalEvent="+mainWindow.finalEvent+"&min="+min+"&sec="+sec;
	mainWindow.finalEvent = "";
	mainWindow.resetScratchVariables();

	var output="";
	$.ajax({
		type: "GET",
		contentType: "application/x-www-form-urlencoded;charset=utf-8",
		url: endpoint,
		async: true,
		data: output,
		success: function() {
			mainWindow.isFirstTime = false;
		}
	});
}
function suggestDocsFirst(isAuto){
	suggestedPosition = 0;
	suggestDocs(isAuto, newLabel);
}
function suggestDocs(isAuto, newLabel){
	mainWindow.takeLogsInServer();
	isSuggestDocs = true;
	suggestedDocs = [];
	var suggestedId = "";
	classifyForAL();
}
//----------------------------------------------------------------------------------------
//UI docs and their colors
function updateUIDocs(json){
	mainWindow.fillDocTopics();
	if(mainWindow.global_study_condition == TA_CONDITION || mainWindow.global_study_condition == TR_CONDITION){
		for (var i = 0 ; i < topicsnum; i++){
			var topicIndex = i;
			//add already labeled docs
			var labeled = mainWindow.labeledTopicsDocs[topicIndex];
			mainWindow.topicToAllDisplayedDocs[""+topicIndex] = [];
			mainWindow.document.getElementById("topic-docs-"+topicIndex).innerHTML = "";
			var innerHTMLStr = "";
			innerHTMLStr += "<table id=\"summary-table-topic-"+topicIndex+"\">";

			for(var j in labeled){
				var labeledDocId = labeled[j];
				innerHTMLStr += mainWindow.addDocToList(labeledDocId, topicIndex);
			}
			//add AL docs and top topic docs sorted on uncertainty
			for (var j in mainWindow.topicToALTopIds[""+topicIndex]){
				var docId = mainWindow.topicToALTopIds[""+topicIndex][j];				
				innerHTMLStr += mainWindow.addDocToList(docId, topicIndex);
			}
			mainWindow.document.getElementById("topic-docs-"+topicIndex).innerHTML += "</table>";
			mainWindow.document.getElementById("topic-docs-"+i).innerHTML = innerHTMLStr;
			//updates color in UI
			for(var j in labeled){
				var labeledDocId = labeled[j];
				mainWindow.updateColor(labeledDocId);
			}
			for (var j in mainWindow.topicToALTopIds[""+topicIndex]){
				var docId = mainWindow.topicToALTopIds[""+topicIndex][j];
				mainWindow.updateColor(docId);
			}
		}
		var highestTopic = json.highestTopic;
		mainWindow.optTopic = highestTopic;
		
		//draw red box around highest doc
		mainWindow.optDocId = mainWindow.topicToALTopIds[""+highestTopic][0];
		mainWindow.addOptDocBorder(mainWindow.optDocId);
	}
	else{
		mainWindow.allBaselineDocs = [];
		mainWindow.document.getElementById("mainform_items").innerHTML = "";
		var innerHTMLStr = "<table id=\"summary-table\">";
		//window.alert(Object.keys(mainWindow.baselineLabeledDocs).length);
		//add labeled docs
		if(mainWindow.docLabelMap != null && Object.keys(mainWindow.docLabelMap).length != 0){
		
			for(var i in mainWindow.baselineLabeledDocs){
				var docId = mainWindow.baselineLabeledDocs[i];
				innerHTMLStr += mainWindow.addBaselineDocToList(docId);
			}
		}
		//add AL docs to the list sorted based on uncertainty
		for (var j in mainWindow.baselineALDocs){
			var docId = mainWindow.baselineALDocs[j];				
			innerHTMLStr += mainWindow.addBaselineDocToList(docId);
		}
		innerHTMLStr += "</table>";
		mainWindow.document.getElementById("mainform_items").innerHTML = innerHTMLStr;
		//update colors in UI
		for (var j in mainWindow.baselineLabeledDocs){
			var docId = mainWindow.baselineLabeledDocs[j];				
			mainWindow.updateColor(docId);
		}
		for (var j in mainWindow.baselineALDocs){
			var docId = mainWindow.baselineALDocs[j];	
			mainWindow.updateColor(docId);
		}
		//draw red box around highest doc
		mainWindow.optDocId = mainWindow.baselineALDocs[0];
		mainWindow.addOptDocBorder(mainWindow.optDocId);
	}
	mainWindow.updateYellowHighlight();
}
function updateYellowHighlight(){
	var tmp = mainWindow.lastLabeledDocDiv.split("-");
	tmp.splice(0,1);
	var docid_wo_topicid = "";
	for(i in tmp){
		docid_wo_topicid += tmp[i]+"-";
	}
	docid_wo_topicid = docid_wo_topicid.substring(0 , docid_wo_topicid.length-1);
	if(mainWindow.checkExists(docid_wo_topicid) && docid_wo_topicid in mainWindow.docLabelMap)//if the doc exists in the normal list
		mainWindow.document.getElementById(mainWindow.lastLabeledDocDiv).style.backgroundColor = 'yellow';
}
//update the color of automatically labeled documents in main interface
function updateAutoDocColors(){
	for(docId in docIdToIndexMap){
		docIdWTopic = mainWindow.getDocIdWithTopic(docId);
		if(mainWindow.checkExists(docId)){				
			document.getElementById(docIdWTopic).style.backgroundColor = '';
			if(docId in classificationDocLabelMap == false && docId in docLabelMap == false){//if not in classification and not in docLabelMap
				document.getElementById(docIdWTopic).style.color = '#B0B0B0';
				document.getElementById(docIdWTopic).style.fontWeight= "normal";
				document.getElementById(docIdWTopic).style.fontSize= "small";
			}
			else if(docId in classificationDocLabelMap){
				label_val = classificationDocLabelMap[docId];
				if(label_val != ''){
					document.getElementById(docIdWTopic).style.color = labelToColor[label_val];
					document.getElementById(docIdWTopic).style.backgroundColor = '#E6E6E6';
				}
			}
		}
	}
	mainWindow.updateYellowHighlight();
}
function deleteUserDocLabel(docId, currWindow, isLabelDocs){
	docIdWTopic = currWindow.getDocIdWithTopic(docId);
	currLabel = currWindow.docLabelMap[docId];
	delete currWindow.docLabelMap[docId];

	if(mainWindow.checkExists(docId)){
		currWindow.document.getElementById(docIdWTopic).style.color = '#B0B0B0';
		currWindow.document.getElementById(docIdWTopic).style.fontWeight= "normal";
		currWindow.document.getElementById(docIdWTopic).style.fontSize= "small";
		currWindow.document.getElementById(docIdWTopic).style.backgroundColor = '';
	}

	index = currWindow.allLabelDocMap[currLabel].indexOf(String(docId));//find index of doc in prev label array
	currWindow.allLabelDocMap[currLabel].splice(index,1);//remove from prev label array
	if(!isLabelDocs){
		index = currWindow.localAllLabelDocMap[currLabel].indexOf(String(docId));//find index of doc in prev label array
		currWindow.localAllLabelDocMap[currLabel].splice(index,1);//remove from prev label array
	}
}

function deleteAutoDocLabel(docId, currWindow, isLabelDocs){
	var docIdWTopic = currWindow.getDocIdWithTopic(docId);
	if(mainWindow.checkExists(docId)){
		currWindow.document.getElementById(docIdWTopic).style.color = '#B0B0B0';
		currWindow.document.getElementById(docIdWTopic).style.fontWeight= "normal";
		currWindow.document.getElementById(docIdWTopic).style.fontSize= "small";
		currWindow.document.getElementById(docIdWTopic).style.backgroundColor= '';
	}
	currLabel = currWindow.classificationDocLabelMap[docId];

	if(currWindow.allLabelDocMap[currLabel].indexOf(String(docId)) != -1){
		//in label view, when docs get updated, the doc might not be in there anymore. if that's not the case, delete it
		index = currWindow.allLabelDocMap[currLabel].indexOf(String(docId));//find index of doc in prev label array
		currWindow.allLabelDocMap[currLabel].splice(index,1);//remove from prev label array
	}
	if(!isLabelDocs){
		index = currWindow.localAllLabelDocMap[currLabel].indexOf(String(docId));//find index of doc in prev label array
		currWindow.localAllLabelDocMap[currLabel].splice(index,1);//remove from prev label array
	}
	if (docId in currWindow.classificationDocLabelMap){
		delete currWindow.classificationDocLabelMap[docId];
		delete currWindow.maxPosteriorLabelProbMap[docId];
	}
}
jQuery.fn.scrollTo = function(elem) { 
	//scrolls to a sub div in an scrollable div
	$(this).scrollTop($(this).scrollTop() - $(this).offset().top + $(elem).offset().top - 10); 
	return this; 
};
function addOptDocBorder(){
	var highestTopic = mainWindow.docToTopicMap[mainWindow.optDocId];
	var divId = "topic"+highestTopic+"-"+mainWindow.optDocId;
	//herehere
	if (mainWindow.global_study_condition == TA_CONDITION || mainWindow.global_study_condition == TR_CONDITION){
		//scroll to the specified div in highest topic div
		$('html, body').animate({
			scrollTop: $("#"+divId).offset().top-100
		}, 200);
		//$("#topic-docs-"+highestTopic).scrollTo("#"+divId);
		var table = mainWindow.document.getElementById("summary-table-topic-"+highestTopic);  
		//window.alert(table+":"+"summary-table-topic-"+highestTopic);
		var row = table.rows.namedItem("row_"+mainWindow.optDocId); 
	}
	else{//puts a red border around opt doc column
		$('html, body').animate({
			scrollTop: $("#"+divId).offset().top-100
		}, 200);
		var table = mainWindow.document.getElementById("summary-table");   
		var row = table.rows.namedItem("row_"+mainWindow.optDocId); 
	}
	row.style.border = "4px solid #FF0000"; 

}
function addBaselineDocToList(docId){
	//adds a doc to the ui in baseline
	var innerHTMLStr = "";
	var url = backend+"/DisplayData";
	var docIdWTopic = mainWindow.getDocIdWithTopic(docId);
	innerHTMLStr += "<tr id=\"row_"+docId+"\"><td style=\"white-space:nowrap; overflow: hidden; max-width: 0; text-overflow: ellipsis;\"><span> <a href='#' id=" + docIdWTopic+" onclick=\"load_doc('" +url + "','" + docIdWTopic + "','" + "0" + "','1', null, false);return false;\">" + mainWindow.docToSummaryMap[docId] +"</a><font>&nbsp;</font></span></td></tr>";
	mainWindow.allBaselineDocs.push(docId);
	return innerHTMLStr;

}
function addDocToList(docId, topicIndex){
	//adds a doc to the list based on its topic
	var url = backend+"/DisplayData";
	var docIdWTopic = mainWindow.getDocIdWithTopic(docId);

	mainWindow.topicToAllDisplayedDocs[""+topicIndex].push(docId);
	var innerHTMLStr = "";		
	var summary = mainWindow.docToSummaryMap[docId];

	innerHTMLStr += "<tr id=\"row_"+docId+"\"><td style=\"white-space:nowrap; overflow: hidden; max-width: 0; text-overflow: ellipsis;\"><span> <a href='#' id=" + docIdWTopic+" onclick=\"load_doc('" +url + "','" + docIdWTopic + "','" + topicIndex + "','1', null, false);return false;\">" + mainWindow.docToSummaryMap[docId] +"</a><font>&nbsp;</font></span></td></tr>";
	return innerHTMLStr;
}
function updateColor(docId){
	//updates the color and background color based on if they are labeled by user/classifier/undefined
	var docIdWTopic = mainWindow.getDocIdWithTopic(docId);
	if(docId in mainWindow.docLabelMap){
		var label_val = mainWindow.docLabelMap[docId];
		mainWindow.document.getElementById(docIdWTopic).style.color = mainWindow.labelToColor[label_val];
	}
	else if(docId in mainWindow.classificationDocLabelMap){
		var label_val = mainWindow.classificationDocLabelMap[docId];
		mainWindow.document.getElementById(docIdWTopic).style.color = mainWindow.labelToColor[label_val];
		mainWindow.document.getElementById(docIdWTopic).style.backgroundColor = "#E6E6E6";
	}
}
function hideDocs(){
	if(mainWindow.global_study_condition == TA_CONDITION || mainWindow.global_study_condition == TR_CONDITION){
		for (var i = 0 ; i < mainWindow.topicsnum; i++){
			mainWindow.document.getElementById("topic-docs-"+i).innerHTML = "";
		}
	}
	else
		mainWindow.document.getElementById("mainform_items").innerHTML = "";
}
function updateUsedLabels(json){
	usedLabels = json.labels;
}
function fillBaselineALDocs(topIdsJson){
	mainWindow.baselineALDocs = [];
	var topIds = topIdsJson.topIds;
	for(var i in topIds){
		var id = topIds[i];
		mainWindow.baselineALDocs.push(id);
	}
}
function fillTopicALDocs(topIdsJson){
	//window.alert(JSON.stringify(topIdsJson));
	var topIdsInTopics = topIdsJson.topIds;
	for(var i in topIdsInTopics){
		var topicElem = topIdsInTopics[i]
		var topicIndex = topicElem.topic;
		var ids = topicElem.ids;
		mainWindow.topicToALTopIds[""+topicIndex] = ids;
	}
}

//----------------------------------------------------------------------------------------
//Incremental learning params
function resetScratchVariables(){
	mainWindow.newLabel = false;
	mainWindow.deleteDocLabel = false;
	mainWindow.deletedDocLabelId = null;
	mainWindow.newlyAddedLabel = false;
	mainWindow.deleteALabel = false;
	mainWindow.deletedLabel = null;
	mainWindow.editALabel = false;
	mainWindow.editedPrevLabel = null;
	mainWindow.editedNewLabel = null;
}
function getIsFromScratch(isAL){
	//returns true if we want to train from scratch
	if(mainWindow.newLabel || mainWindow.deleteDocLabel || mainWindow.deleteALabel || mainWindow.editALabel || !isAL || mainWindow.newlyAddedLabel)//if a new label was added or a doc label was deleted or a label was deleted or not AL, train from scratch
		return true;
	return false;
}

function getLabeledDocsStr(){
	//returns in string which is the parameter for the docs labeled in each topic or docs labeled in baseline by user
	if(mainWindow.global_study_condition == TA_CONDITION || mainWindow.global_study_condition == TR_CONDITION){
		var topicLabeledDocsStr = "";
		for(var i = 0 ; i < mainWindow.topicsnum; i++){
			topicLabeledDocsStr += i + ":";
			for(var j in mainWindow.labeledTopicsDocs[i])
				topicLabeledDocsStr += mainWindow.labeledTopicsDocs[i][j]+",";
			topicLabeledDocsStr = topicLabeledDocsStr.substring(0, topicLabeledDocsStr.length-1);
			topicLabeledDocsStr += ";";
		}
		topicLabeledDocsStr = topicLabeledDocsStr.substring(0, topicLabeledDocsStr.length-1);
		return topicLabeledDocsStr;
	}
	else{
		baselineLabeledDocsStr = "";
		for(var i in mainWindow.baselineLabeledDocs){
			var docId = mainWindow.baselineLabeledDocs[i];
			baselineLabeledDocsStr += docId+",";
		}
		baselineLabeledDocsStr = baselineLabeledDocsStr.substring(0, baselineLabeledDocsStr.length-1);
		return baselineLabeledDocsStr;
	}
}

function getDocIdWithTopic(docId){
	mainWindow.fillDocTopics();
	var highestTopic = mainWindow.docToTopicMap[docId];
	return "topic"+highestTopic+"-"+docId;

}
function checkExists(docId){
	//returns true if a document exists in UI
	if(global_study_condition == TA_CONDITION || global_study_condition == TR_CONDITION){
		for(var i = 0 ; i < topicsnum; i++){
			var topicDisplayedDocs = mainWindow.topicToAllDisplayedDocs[i];
			if(topicDisplayedDocs.indexOf(docId) != -1)
				return true;
		}
		return false;
	}
	else{
		if(mainWindow.allBaselineDocs.indexOf(docId) != -1)
			return true;
		return false;
	}

}

function setProgressBar(){
	//sets the progress bar based on labeledTopicsDocs
	var cnt = 0;
	for(var i = 0 ; i < mainWindow.topicsnum; i++){
		var labeled = mainWindow.labeledTopicsDocs[i];
		var numLabeledInTopic = Object.keys(labeled).length;
		if (numLabeledInTopic != 0)
			cnt++;
	}
	var width = (cnt/mainWindow.topicsnum)*100;
	var percentage = Math.round(width * 100) / 100;
	$("#progree-inner-div").html(percentage+"%");
	$("#progree-inner-div").attr("style","width:"+ width+"%");
}