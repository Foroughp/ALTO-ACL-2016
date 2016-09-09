function addLoadDocLogs(docId, topicIndex, position, positionUnlabeled, requestTime, openTime, currLabel, 
		labelDefiner, labelConfidence, currMin, currSec){
	//end time is save time if saved, close time if not saved and canceled, next/prev/cancel if in suggest doc view
	//currmin and curr sec are open time
	mainWindow.logStr += "OPENDOC:reqtime="+requestTime+",opentime="+openTime+",id="+docId+",topicIndex="+topicIndex+",pos="+position+",positionUnlabeled="+positionUnlabeled+",currlabel="+currLabel+",def="+
	labelDefiner+",confidence="+labelConfidence+",optTopic="+mainWindow.optTopic+",min="+String(currMin)+",sec="+String(currSec)+"%0A";
	mainWindow.takeLogsInServer();
}
function invalidAddLabelLogs(labelName, addTime, currMin, currSec){
	mainWindow.logStr += "InvalidAddLabel:time="+addTime+",labelname="+labelName+",min="+currMin+",sec="+currSec+"%0A";
	mainWindow.takeLogsInServer();
}
function addDeleteLabelViewLogs(deleteTime, docId, waitTime, currMin, currSec){
	mainWindow.logStr += "deleteLabelView:time="+deleteTime+",id="+docId+",waitTime="+waitTime+",min="+currMin+",sec="+currSec+"%0A";
	mainWindow.takeLogsInServer();
}
function addApplyCloseLogs(applyTime, docId, labelName, currMin, currSec){
	var waitTime = Number(applyTime) - Number(mainWindow.docOpenTime); 
	mainWindow.logStr += "ApplyClose:time="+applyTime+",id="+docId+",waitTime="+waitTime+",labelname="+labelName+",min="+currMin+",sec="+currSec+"%0A";
	mainWindow.takeLogsInServer();
}
function addApplyLogs(applyTime, docId, waitTime, labelName, currMin, currSec){
	mainWindow.logStr += "Apply:time="+applyTime+",id="+docId+",waitTime="+waitTime+",labelname="+labelName+",min="+currMin+",sec="+currSec+"%0A";
	mainWindow.takeLogsInServer();
}
function addChangeLabelLogs(changeTime,docId, waitTime, labelName, currMin, currSec){
	mainWindow.logStr += "Change:time="+changeTime+",id="+docId+",waitTime="+waitTime+",labelname="+labelName+",min="+currMin+",sec="+currSec+"%0A";
	mainWindow.takeLogsInServer();
}
function addApproveCloseLogs(approveTime, docId, labelName, currMin, currSec){
	var waitTime = Number(approveTime) - Number(mainWindow.docOpenTime); 
	mainWindow.logStr += "ApproveClose:time="+approveTime+",id="+docId+",waitTime="+waitTime+",labelname="+labelName+",min="+currMin+",sec="+currSec+"%0A";
	mainWindow.takeLogsInServer();
}
//function addApproveLogs(approveTime, docId, waitTime, labelName){
//	mainWindow.logStr += "Approve:time="+approveTime+",id="+docId+",waitTime="+waitTime+",labelname="+labelName+"%0A";
//	mainWindow.takeLogsInServer();
//}
function addSaveDocLogs(docId, saveTime, currLabel, labelDefiner, labelConfidence, newLabel, isLabelView, button, currMin, currSec){
	//saveTime is the time they click on save
	if(newLabel == '')
		newLabelStr = "NONE";
	else
		newLabelStr = newLabel;
	
	if(!isLabelView){
		//var labeledOptTopic = false;
		var waitTime = Number(mainWindow.applyTime) - Number(mainWindow.docOpenTime);
		//if (mainWindow.optTopic == mainWindow.topicIndex)//TODO:recheck equality
			//labeledOptTopic = true;
		mainWindow.logStr += "SAVELABEL:Labelview=False,savetime="+saveTime+",id="+docId+",currlabel="+currLabel+",def="+
		labelDefiner+",confidence="+labelConfidence+",newlabel="+newLabelStr+",topicIndex="+mainWindow.topicIndex
		+",pos="+mainWindow.globalPosition+",positionUnlabeled="+mainWindow.positionUnlabeled+",optTopic="+mainWindow.optTopic+",waitTime="+waitTime+",button="+button+",min="+currMin+",sec="+currSec+"%0A";
		
		mainWindow.finalEvent = "SAVELABEL:Labelview=False,savetime="+saveTime+",id="+docId+",currlabel="+currLabel+",def="+
		labelDefiner+",confidence="+labelConfidence+",newlabel="+newLabelStr+",topicIndex="+mainWindow.topicIndex
		+",pos="+mainWindow.globalPosition+",positionUnlabeled="+mainWindow.positionUnlabeled+",optTopic="+mainWindow.optTopic+",waitTime="+waitTime+",button="+button+",min="+currMin+",sec="+currSec;
	}
	else{
		var waitTime = Number(mainWindow.applyTime) - Number(mainWindow.lastLabelTime);
		mainWindow.logStr += "SAVELABEL:Labelview=True,savetime="+saveTime+",id="+docId+",currlabel="+currLabel+",def="+
		labelDefiner+",confidence="+labelConfidence+",newlabel="+newLabelStr+",waitTime="+waitTime+",button="+button+",min="+currMin+",sec="+currSec+"%0A";
		
		mainWindow.finalEvent = "SAVELABEL:Labelview=True,savetime="+saveTime+",id="+docId+",currlabel="+currLabel+",def="+
		labelDefiner+",confidence="+labelConfidence+",newlabel="+newLabelStr+",waitTime="+waitTime+",button="+button+",min="+currMin+",sec="+currSec;
	}
	mainWindow.takeLogsInServer();
}
function addStartLogs(startSeconds, study_condition){
	mainWindow.logStr += "STARTTIME="+startSeconds+",condition="+study_condition+"%0A";
	mainWindow.takeLogsInServer();
}
function addCloseLabelViewLogs(closeTime, labelName, currMin, currSec){
	mainWindow.logStr += "CLOSELABEL:time="+closeTime+",labelname="+labelName+",min="+currMin+",sec="+currSec+"%0A";
	mainWindow.takeLogsInServer();
}
//function addCloseSuggestDocsLogs(closeTime){
//	logStr += "CLOSESUGGEST:time="+closeTime+"%0A";
//}
function addCloseCrossNormalDocLogs(closeTime, docId, currMin, currSec){
	mainWindow.logStr = mainWindow.logStr.trim();
	//if(isSuggestDocs)
	//logStr += ",CROSSSUGGEST time="+closeTime+",id="+docId+"%0A";
	//else
	mainWindow.logStr += ",CROSS time="+closeTime+",id="+docId+",min="+currMin+",sec="+currSec+"%0A";
	mainWindow.takeLogsInServer();
}

function addCloseNormalDocLogs(closeTime, currMin, currSec){
	mainWindow.logStr = mainWindow.logStr.trim();
	mainWindow.logStr += ",CLOSE time="+closeTime+",min="+currMin+",sec="+currSec+"%0A";
	mainWindow.takeLogsInServer();
}
function addLabelLogs(addTime, isDocView, docId, labelName,  currMin, currSec){
	mainWindow.logStr += "ADDLABEL:addtime="+addTime+",labelname="+labelName+",docview="+isDocView+",id="+docId+",min="+currMin+",sec="+currSec+"%0A";
	mainWindow.takeLogsInServer();
}
function addClassificationLogs(clickTime, currMin, currSec){
	mainWindow.logStr += "RUNCLASSIFIER:clicktime="+clickTime+",min="+currMin+",sec="+currSec+"%0A";
	mainWindow.takeLogsInServer();
}
function addUpdateDocsLogs(startTime, currMin, currSec){
	mainWindow.logStr += "UPDATEDOCS:starttime="+startTime+",min="+currMin+",sec="+currSec+"%0A";
	mainWindow.takeLogsInServer();
}
function addClassificationEndTimeLog(endTime, currMin, currSec){
	mainWindow.logStr += "CLASSIFICATIONENDED:time="+endTime+",optTopic="+mainWindow.optTopic+",optDocId="+mainWindow.optDocId+",min="+currMin+",sec="+currSec+"%0A";
	mainWindow.takeLogsInServer();
}
function addUpdateDocsEndTimeLog(endTime, currMin, currSec){
	mainWindow.logStr += "UPDATEENDED:time="+endTime+",optTopic="+mainWindow.optTopic+",optDocId="+mainWindow.optDocId+",min="+currMin+",sec="+currSec+"%0A";
	mainWindow.takeLogsInServer();
}
////////
function addJsonSuccessTimeLogs(time, currMin, currSec){
	mainWindow.logStr += "JSONSUCESS:time="+time+",min="+currMin+",sec="+currSec+"%0A";
	mainWindow.takeLogsInServer();
}
//function addPopupLogs(appearTime, currMin, currSec){
//	mainWindow.logStr += "POPUPAPPEARED:time="+appearTime+",min="+currMin+",sec="+currSec+"%0A";
//	mainWindow.takeLogsInServer();
//}
function addAlertLogs(str, appearTime, okTime, currMin, currSec){//curr min and curr sec are okTime
	mainWindow.logStr += "ALERTLOG:time="+appearTime+",oktime="+okTime+",msg="+str+",min="+currMin+",sec="+currSec+"%0A";
}
//function addNextDocLogs(clickTime, currDocId, newDocDisplayed, event){
//	logStr += "CLICKNEXTSUGGEST:time="+clickTime+",id="+currDocId +",newdoc="+newDocDisplayed+",event="+event+"%0A";
//}
//function addPrevDocLogs(clickTime, currDocId, prevDocId){
//	logStr += "CLICKPREVSUGGEST:time="+clickTime+",id="+currDocId + ",previd="
//	+prevDocId+"%0A";
//}

function addLoadLabelDocsLog(firstTime, clickTime, openTime, labelName, displayedIds, isRefreshed, currMin, currSec){
	if(firstTime)
		mainWindow.logStr += "CLICKLABEL:time="+clickTime + ",opentime="+openTime+",labelname="+labelName+",ids=";
	else
		mainWindow.logStr += "time="+clickTime +",opentime="+openTime+",labelname="+labelName+",ids=";

	for(var i in displayedIds){
		mainWindow.logStr += displayedIds[i]+"_";
	}
	mainWindow.logStr = mainWindow.logStr.substring(0, mainWindow.logStr.length-1);
	mainWindow.logStr += ",refreshed="+isRefreshed+",min="+currMin+",sec="+currSec;
	mainWindow.logStr += "%0A";
	mainWindow.takeLogsInServer();
}
function addDeleteLabelLogs(clickTime, labelName, currMin, currSec){
	mainWindow.logStr += "DELETELABEL:time="+clickTime+",labelname="+labelName+",min="+currMin+",sec="+currSec+"%0A";
	mainWindow.finalEvent = "DELETELABEL:time="+clickTime+",labelname="+labelName+",min="+currMin+",sec="+currSec;
	mainWindow.takeLogsInServer();
}
function addRenameLabelLogs(clickTime, renameTime, labelName, newLabelName, currMin, currSec){
	mainWindow.logStr += "RENAMELABEL:time="+clickTime+",renametime="+renameTime+",prevlabel="+labelName+",newlabel="+newLabelName+",min="+currMin+",sec="+currSec+"%0A";
	mainWindow.finalEvent = "RENAMELABEL:time="+clickTime+",renametime="+renameTime+",prevlabel="+labelName+",newlabel="+newLabelName+",min="+currMin+",sec="+currSec;
	mainWindow.takeLogsInServer();
}
function addRenameCancelLogs(clickTime, labelName, currMin, currSec){
	mainWindow.logStr += "RENAMELABELCANCEL:clickTime="+clickTime+",label="+labelName+",min="+currMin+",sec="+currSec+"%0A";
}
//function addSuggestDocLogs(clickTime, autoSuggestDocs){
//	logStr += "CLICKSUGGEST:time="+clickTime+",auto="+autoSuggestDocs+"%0A";
//}
/*function takeSurveyLogs(clickTime){
	mainWindow.logStr += "CLICKEDFINISH:time="+clickTime+"%0A";
	mainWindow.takeLogsInServer();
}*/
function getCurrLabel(docId, docLabelMap, classificationDocLabelMap){
	if(docId in docLabelMap){
		return docLabelMap[docId];
	}
	else if(docId in classificationDocLabelMap){
		return classificationDocLabelMap[docId];
	}
	else{
		return "NONE";
	}
}

function getLabelDefiner(docId, docLabelMap, classificationDocLabelMap){
	if(docId in docLabelMap){
		return "USER";
	}
	else if(docId in classificationDocLabelMap){
		return "CLASSIFIER";
	}
	else{
		return "NONE";
	}
}
function getLabelConfidence(docId, docLabelMap, classificationDocLabelMap, maxPosteriorLabelProbMap){
	if(docId in docLabelMap){
		return "USER";
	}
	else if(docId in classificationDocLabelMap){
		return maxPosteriorLabelProbMap[docId];
	}
	else{
		return "NONE";
	}
}
function takeFinalLogs(){
	//gray out everything
	$.blockUI({ message: null });
	
	//send request to server
	var endpoint = backend+"/Logger?"+"logStr="+mainWindow.logStr+"&corpusname="+corpusname+"&username="+username+"&logfilenum="+String(logFileNum+"_Final");
	var output="";
	$.ajax({
		type: "GET",
		contentType: "application/x-www-form-urlencoded;charset=utf-8",
		url: endpoint,
		async: true,
		data: output,
		success: function() {
		}
	});
	mainWindow.logStr = "";
	mainWindow.logFileNum++;
}
function takeLogsInServer(){
	var logLines = mainWindow.logStr.split("%0A");
	if(Object.keys(logLines).length > 30){
		//send request to server
		var endpoint = backend+"/Logger?"+"logStr="+mainWindow.logStr+"&corpusname="+mainWindow.corpusname+"&username="+mainWindow.username+"&logfilenum="+String(mainWindow.logFileNum);
		var output="";
		$.ajax({
			type: "GET",
			contentType: "application/x-www-form-urlencoded;charset=utf-8",
			url: endpoint,
			async: true,
			data: output,
			success: function() {
			}
		});
		mainWindow.logStr = "";
		mainWindow.logFileNum++;
	}
}

