package servlet;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.DataInputStream;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;

import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.io.Writer;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Set;
import java.util.TreeMap;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import alto.LogisticRegressor;
import alto.TopicModeling;
import alto.TopicModeling.DocProb;


public class Classify extends HttpServlet {
	public static final String TA_CONDITION = "TA";
	public static final String TR_CONDITION = "TR";
	public static final String LA_CONDITION = "LA";
	public static final String LR_CONDITION = "LR";

	class ValueComparator implements Comparator<String> {//comparator to sort a treemap based on values 

		HashMap<String, Double> base;
		public ValueComparator(HashMap<String, Double> base) {
			this.base = base;
		}

		public int compare(String a, String b) {

			if (base.get(a).equals(base.get(b))){
				return a.compareTo(b);
			}else if (base.get(a) > base.get(b)) {
				return -1;
			} else {
				return 1;
			} 
		}
	}
	private static final long serialVersionUID = 1L;
	private String baseDir;
	public static ArrayList<String> ids;
	public static HashMap<String, ArrayList<String>> topLabelToIds;
	public static ArrayList<String> allTopLabelDocuments = null;
	public static HashMap<String, String> testingIdToLabel = null;
	public static HashMap<String, ArrayList<Double>> testingIdToProbs = null;
	@Override
	protected void doGet(HttpServletRequest req, HttpServletResponse resp){
		try{
			processRequest(req, resp);
		}catch(IOException ioE){
			System.out.println("IO Exception");
			ioE.printStackTrace();
		}catch(ServletException sE){
			System.out.println("Servlet Exception");
			sE.printStackTrace();
		}catch(Throwable t){
			System.out.println(t.getMessage());
			t.printStackTrace();
		}
	}
	private void processRequest(HttpServletRequest req, HttpServletResponse resp) throws IOException, ServletException {
		this.baseDir = util.Constants.RESULT_DIR;
		String corpusName = util.Constants.CORPUS_NAME;
		int numTopics = util.Constants.NUM_TOPICS;
		
		String min = req.getParameter("min");
		String sec = req.getParameter("sec");
		Boolean deleteALabel = Boolean.parseBoolean(req.getParameter("deleteALabel"));
		String deletedLabel = req.getParameter("deletedLabel");
		Boolean editALabel = Boolean.parseBoolean(req.getParameter("editALabel"));
		String editedPrevLabel = req.getParameter("editedPrevLabel");
		String editedNewLabel = req.getParameter("editedNewLabel");
		Boolean deletedDocLabel = Boolean.parseBoolean(req.getParameter("deletedDocLabel"));
		String deletedDocLabelId = req.getParameter("deletedDocLabelId");
		String userName = req.getParameter("username");
		boolean isFromScratch = Boolean.parseBoolean(req.getParameter("fromScratch"));
		String labeledDocsStr = req.getParameter("labeledDocs");
		String studyCondition = req.getParameter("condition");
		boolean isFirstTime = Boolean.parseBoolean(req.getParameter("isFirstTime"));
		String docToLabelMapStr = req.getParameter("docLabelMap");

		if(isFirstTime){
			topLabelToIds = null;
			allTopLabelDocuments = null;
			testingIdToLabel = null;
			testingIdToProbs = null;
		}
		int numBaselineDocs = numTopics*20;
		
		//Data holders
		HashMap<String, ArrayList<String>> labeledDocs = new HashMap<String, ArrayList<String>>();
		ArrayList<String> testingIdList = new ArrayList<String>();

		HashMap<String, String> updateTestingIdToLabel = new HashMap<String, String>();
		HashMap<String, ArrayList<Double>> updateTestingIdToProbs = new HashMap<String, ArrayList<Double>>();

		TreeMap<String, String> idToGoldenLabelMap = new TreeMap<String, String>();
		HashMap<String, HashSet<String>> userLabelToIds= new HashMap<String, HashSet<String>>();
		HashMap<String, HashSet<String>> goldenLabelToIds= new HashMap<String, HashSet<String>>();
		Set<String> trainingLabelSet = new HashSet<String>();

		TreeMap<String, String> idToLabelMap = getDocLabelMap(docToLabelMapStr);
		fillTopicLabeledDocs(studyCondition, labeledDocsStr, labeledDocs);
		HashMap<String, Integer> labelStrToInt = mapLabelStrToInt(idToLabelMap);

		PrintWriter out = resp.getWriter();
		boolean AL = Boolean.parseBoolean(req.getParameter("AL"));
		boolean isFinal = Boolean.parseBoolean(req.getParameter("final"));
		String finalEvent = req.getParameter("finalEvent");
		getTestingDocIds(TopicModeling.features, idToLabelMap, testingIdList);//fill testingIdList
		int numLabeledTotal = idToLabelMap.keySet().size();

		HashMap<String, ArrayList<String>> topIds = new HashMap<String, ArrayList<String>>();//maps a topic to its top displayed ids except user labeled ones
		HashMap<String, HashMap<String, Double>> docIdToUncertainty = new HashMap<String, HashMap<String, Double>>();//topic index to a map of id to uncertainty for logging
		String loggingMode = "";
		editDeleteUpdate(trainingLabelSet, editALabel, editedPrevLabel, editedNewLabel, deleteALabel, deletedLabel);
		int i = 0;
		if(AL){//write top ids in json string
			//update topLabelDocuments and allTopLabelDocuments if delete/edit a label
			LogisticRegressor w = new LogisticRegressor(TopicModeling.features, idToLabelMap, labelStrToInt, testingIdList, 
					updateTestingIdToLabel, updateTestingIdToProbs, corpusName, numTopics, isFromScratch, AL, isFirstTime, trainingLabelSet, req);
			if(deletedDocLabel){
				if(testingIdToLabel != null){
					if(testingIdToLabel.containsKey(deletedDocLabelId)){
						testingIdToLabel.remove(deletedDocLabelId);//remove from testing Id to label
						testingIdToProbs.remove(deletedDocLabelId);//remove from testing Id to probs
					}
				}
			}
			
			String json = "";
			//decide top ids based on new testingIdToLabel and testingIdToProbs
			String topIdsJson = getMostUncertainId(docIdToUncertainty, numLabeledTotal, studyCondition, updateTestingIdToProbs,
					labeledDocs, topIds, numTopics, labelStrToInt, numBaselineDocs);
			String labelSetJson= generateLabelSetJson(trainingLabelSet);
			json = topIdsJson + labelSetJson;
			resp.setContentType("application/json");
			resp.setCharacterEncoding("UTF-8");
			out.print(json);
			out.flush();
			
			//calculate purity based on the new labels all the time
			updateUserLabelToIDs(updateTestingIdToLabel, idToLabelMap, userLabelToIds);
			fillIdToGoldenLabel(idToGoldenLabelMap, goldenLabelToIds, req);
			double purity = -1;
			if(!idToGoldenLabelMap.isEmpty()){	
				int numDocs = idToGoldenLabelMap.keySet().size();
				purity = getPurity(userLabelToIds, idToGoldenLabelMap, numDocs);
			}
			loggingMode = "update";
			//take logs for displayed documents and their label based on previous tetsingIdToLabel and testingIdToProbs
			takeLogs(studyCondition, docIdToUncertainty, topIdsJson, labeledDocs, topIds, 
					updateTestingIdToLabel, updateTestingIdToProbs, idToLabelMap, 
					userLabelToIds, labelStrToInt, userName,
					corpusName, purity, loggingMode, isFinal, finalEvent, min, sec);
		}
		else {//write classification results in json string
			testingIdToLabel = new HashMap<String, String>();
			testingIdToProbs = new HashMap<String, ArrayList<Double>>();
			LogisticRegressor w = new LogisticRegressor(TopicModeling.features, idToLabelMap, labelStrToInt, testingIdList, 
					testingIdToLabel, testingIdToProbs, corpusName, numTopics, isFromScratch, AL, isFirstTime, trainingLabelSet, req);
			loggingMode = "classifier";
			//update topLabelToIds and allTopLabelDocuments
			topLabelToIds = getTopLabelDocuments(testingIdToProbs, labelStrToInt, testingIdToLabel);
			allTopLabelDocuments = getAllTopDocuments(topLabelToIds);
			String topIdsJson = "";
			if(!isFinal){
				resp.setContentType("application/json");
				resp.setCharacterEncoding("UTF-8");
				out.print("{\"doc_to_label_map\":[");
				for (String testingId : allTopLabelDocuments) {
					String labelStr = testingIdToLabel.get(testingId);
					out.print("{\"docName\":");
					out.print("\""+testingId + "\",");
					out.print("\"label\":");
					out.print("\"" + labelStr + "\"");
					if(i != allTopLabelDocuments.size()-1){
						out.print("},");
					}
					else{
						out.print("}");
					}
					i++;
				}
				out.print("],");
				//creates json for classification prob
				out.print("\"doc_prob_map\":[");
				i = 0;
				for(String testingId : allTopLabelDocuments){
					ArrayList<Double> probs = testingIdToProbs.get(testingId);
					out.print("{\"docName\":");
					out.print("\""+testingId + "\",");
					out.print("\"dist\":{");
					int j = 0;
					for(double prob:probs){
						String roundedProbStr = String.format("%.2f", prob);
						double roundedProb = Double.parseDouble(roundedProbStr);
						String labelStr = getLabelStr(labelStrToInt,j);
						out.print("\""+labelStr+"\":");
						if(j != probs.size() -1){
							out.print("\""+roundedProb+"\",");
						}
						else{
							out.print("\""+roundedProb+"\"");
						}
						j++;
					}
					if (i != allTopLabelDocuments.size() - 1){
						out.print("}},");
					}
					else{
						out.print("}}");
					}
					i++;
				}
				out.print("],");
				i = 0;
				out.print("\"top_label_docs\":[");
				for(String labelStr:labelStrToInt.keySet()){
					ArrayList<String> topDocs = topLabelToIds.get(labelStr);
					out.print("{\"labelName\":");
					out.print("\""+labelStr + "\",");
					out.print("\"topDocs\":{");
					int j = 1;
					for(String doc:topDocs){
						if(j != topDocs.size()){//changed here from numTopDocs
							out.print("\""+String.valueOf(j)+"\":\""+doc+"\",");
						}
						else{
							out.print("\""+String.valueOf(j)+"\":\""+doc+"\"");
						}
						j++;
					}
					if (i != labelStrToInt.size() - 1){
						out.print("}},");
					}
					else{
						out.print("}}");
					}
					i++;
				}
				out.print("],");
				topIdsJson = getMostUncertainId(docIdToUncertainty, numLabeledTotal, studyCondition, testingIdToProbs, labeledDocs, topIds, numTopics, labelStrToInt, numBaselineDocs);
				out.print(topIdsJson.substring(1));
				String labelSetJson= generateLabelSetJson(trainingLabelSet);
				out.print(labelSetJson);
				out.flush();
			}
			updateUserLabelToIDs(testingIdToLabel, idToLabelMap, userLabelToIds);
			fillIdToGoldenLabel(idToGoldenLabelMap, goldenLabelToIds, req);
			double purity = -1;
			if(!idToGoldenLabelMap.isEmpty()){
				int numDocs = idToGoldenLabelMap.keySet().size();
				purity = getPurity(userLabelToIds, idToGoldenLabelMap, numDocs);
			}
			takeLogs(studyCondition, docIdToUncertainty, topIdsJson, labeledDocs, topIds, updateTestingIdToLabel, updateTestingIdToProbs, idToLabelMap, userLabelToIds, labelStrToInt, userName,
					corpusName, purity, loggingMode, isFinal, finalEvent, min, sec);
		}

	}
	public void editDeleteUpdate(Set<String> trainingLabelSet, boolean editALabel, String editedPrevLabel, String editedNewLabel, boolean deleteALabel, String deletedLabel){
		
		if(deleteALabel){
			if(topLabelToIds!=null && allTopLabelDocuments!=null){
				if(topLabelToIds.containsKey(deletedLabel)){
					for(String docId:topLabelToIds.get(deletedLabel)){
						allTopLabelDocuments.remove(docId);
					}
					topLabelToIds.remove(deletedLabel);
				}
			}
		}

		//if edited a label, don't remove
		if(editALabel){
			if(testingIdToLabel != null){
				for(String testingId:testingIdToLabel.keySet()){
					if(testingIdToLabel.get(testingId).equals(editedPrevLabel)){
						testingIdToLabel.put(testingId, editedNewLabel);//update testingId to label
					}
				}
			}
			if(topLabelToIds!=null){
				if(topLabelToIds.containsKey(editedPrevLabel)){
					ArrayList<String> editedLabelDocIds = topLabelToIds.get(editedPrevLabel);//get all top docs in previous label
					topLabelToIds.remove(editedPrevLabel);//remove previous label from topLabelsToIds map
					topLabelToIds.put(editedNewLabel, editedLabelDocIds);//add the new label with previous docs to the map
				}
			}
		}

	}
	public String generateLabelSetJson(Set<String> trainingLabelSet) {
		String labelSetJson = ",\"labels\":[";
		for(String label:trainingLabelSet){
			labelSetJson += "\""+label+"\",";
		}
		labelSetJson = labelSetJson.substring(0,labelSetJson.length()-1);
		labelSetJson += "]}";
		return labelSetJson;
	}

	public void getTestingDocIds(HashMap<String, HashMap<Integer, Float>> features, TreeMap<String, String> idToLabelMap, ArrayList<String> testingIdList) {
		for (String id : features.keySet()) {//TODO:Null pointer here
			if (!idToLabelMap.containsKey(id))
				testingIdList.add(id);
		}
	}
	public ArrayList<String> getAllTopDocuments(
			HashMap<String, ArrayList<String>> topLabelDocuments) {
		ArrayList<String> allTopDocuments = new ArrayList<String>();
		for(String label:topLabelDocuments.keySet()){
			for(String topDoc:topLabelDocuments.get(label)){
				if(!allTopDocuments.contains(topDoc))
					allTopDocuments.add(topDoc);
			}
		}
		return allTopDocuments;
	}
	public HashMap<String, ArrayList<String>> getTopLabelDocuments(HashMap<String, ArrayList<Double>> testingIdToProbs,
			HashMap<String, Integer> labelStrToInt, HashMap<String, String> testingIdToLabelMap){
		HashMap<String, ArrayList<String>> topLabelDocuments = new HashMap<String, ArrayList<String>>();
		HashMap<String, HashMap<String, Double>> labelProbs = new HashMap<String, HashMap<String, Double>>();

		for(String labelStr: labelStrToInt.keySet()){
			ArrayList<String> labelsList = new ArrayList<String>();
			topLabelDocuments.put(labelStr, labelsList);
			HashMap<String, Double> probMap = new HashMap<String, Double>();//maps testing id to label probs
			labelProbs.put(labelStr, probMap);
		}
		for(String id:testingIdToLabelMap.keySet()){
			ArrayList<Double> probs = testingIdToProbs.get(id);
			for(String labelStr: labelStrToInt.keySet()){
				int labelInt = labelStrToInt.get(labelStr);
				labelProbs.get(labelStr).put(id,probs.get(labelInt));
			}
		}
		//sort labelProbs based on probabilities (values)
		for(String labelStr: labelStrToInt.keySet()){
			HashMap<String, Double> idToProbMap = labelProbs.get(labelStr);
			ValueComparator vc =  new ValueComparator(idToProbMap);
			TreeMap<String,Double> sortedIdToProbMap = new TreeMap<String,Double>(vc);
			sortedIdToProbMap.putAll(idToProbMap);
			int cnt = 1;
			for(String id:sortedIdToProbMap.keySet()){
				if(cnt > util.Constants.NUM_TOP_DOCS)
					break;
				if(testingIdToLabelMap.get(id).equals(labelStr)){//if the label of top document is the current label
					topLabelDocuments.get(labelStr).add(id);
					cnt++;
				}
			}
		}
		return topLabelDocuments;
	}
	public double getEntropyForAL(String docId, ArrayList<Double> labelProbs){
		double ent = 0;
		for(Double prob:labelProbs){
			ent += prob * Math.log(prob)/Math.log(2);
		}
		return -1*ent;
	}
	public String getMostUncertainId(HashMap<String, HashMap<String, Double>> docIdToUncertainty, int numLabeledTotal, String studyCondition, 
			HashMap<String, ArrayList<Double>> testingIdToProbs,HashMap<String, ArrayList<String>> labeledDocs, HashMap<String,
			ArrayList<String>> topIds, int numTopics, HashMap<String, Integer> labelStrToInt, int numBaselineDocs) throws IOException{
		String topIdsJson = "";
		//claculates entropy for each test dataset and returns top 100 most uncertain documents for active learning
		if(studyCondition.equals(TA_CONDITION) || studyCondition.equals(TR_CONDITION)){
			topIdsJson = getMostUncertainIdTM(docIdToUncertainty, testingIdToProbs, labeledDocs, topIds, 
					numTopics, studyCondition);
		}
		else{//baseline and baseline_AL
			topIdsJson = getMostUncertainIdBaseline(docIdToUncertainty, numLabeledTotal, testingIdToProbs,
					topIds, studyCondition, numBaselineDocs);
		}
		//	System.out.println(topIdsJson);
		return topIdsJson;
	}
	public String getMostUncertainIdTM(HashMap<String, HashMap<String, Double>> docIdToUncertainty, 
			HashMap<String, ArrayList<Double>> testingIdToProbs,HashMap<String, ArrayList<String>> labeledDocs, HashMap<String,
			ArrayList<String>> topIds,
			int numTopics, String condition) throws IOException{

		String topIdsJson = "";
		HashMap<String, Double> topicToUncertaintyMed = new HashMap<String, Double>();
		//generate high docs for all topics
		topIdsJson += "{\"topIds\":[";
		//updates documents in topics based on uncertainty, updates topIdsJson and best topic to auto scroll to
		for(int i = 0 ; i < numTopics; i++){//for all topics
			HashMap<String, Double> topicIdToUncertaintyMap = new HashMap<String, Double>();
			ArrayList<String> topicTopIds = new ArrayList<String>();
			String topicIndex = String.valueOf(i);
			docIdToUncertainty.put(topicIndex, new HashMap<String, Double>());

			topIdsJson += "{\"topic\":"+"\""+topicIndex+"\",\"ids\":[";

			for(DocProb docObj:TopicModeling.topicToDocs.get(topicIndex)){//for all docs in that topic
				String docId = docObj.id;
				if(!testingIdToProbs.containsKey(docId))//if not in test set (in training set)
					continue;
				double highestTopicProb = Double.parseDouble(TopicModeling.docIdToHighestTopic.get(docId).get(1));
				//calculate entropy
				ArrayList<Double> labelProbs = testingIdToProbs.get(docId);
				double uncertainty = 0;
				if (condition.equals(TR_CONDITION)){
					double randEntropy = Math.random();
					uncertainty = randEntropy*highestTopicProb;
				}
				else if (condition.equals(TA_CONDITION)){
					double entropy = getEntropyForAL(docId, labelProbs);
					double normalizedEntropy = entropy / labelProbs.size();
					uncertainty = normalizedEntropy * highestTopicProb;
				}
				docIdToUncertainty.get(topicIndex).put(docId, uncertainty);
			}
			//sort based on uncertainty
			ValueComparator vc =  new ValueComparator(docIdToUncertainty.get(topicIndex));
			TreeMap<String,Double> sortedIdToUncertainty = new TreeMap<String,Double>(vc);
			sortedIdToUncertainty.putAll(docIdToUncertainty.get(topicIndex));
			//find median
			double uncertaintyMed = getMedianUncertainty(sortedIdToUncertainty);
			int numLabeled = 0;
			if(labeledDocs.containsKey(topicIndex))
				numLabeled = labeledDocs.get(topicIndex).size();
			if(numLabeled < 20){
				//fill topic top ids for AL
				int j = 0;
				for(String docId:sortedIdToUncertainty.keySet()){
					if(j < 20-numLabeled){
						topicTopIds.add(docId);
						topicIdToUncertaintyMap.put(docId, docIdToUncertainty.get(topicIndex).get(docId));
						topIdsJson += "\""+docId+"\","; 
						j++;
					}
					else
						break;
				}
				topIdsJson = topIdsJson.substring(0, topIdsJson.length()-1);
			}
			topIdsJson += "]},";
			topIds.put(topicIndex, topicTopIds);
			docIdToUncertainty.put(topicIndex, topicIdToUncertaintyMap);
			if (topicTopIds.size() > 0){
				topicToUncertaintyMed.put(topicIndex, uncertaintyMed);
			}
		}
		topIdsJson = topIdsJson.substring(0, topIdsJson.length()-1);
		topIdsJson += "],";
		int topicIndex = 0;
		//choose the best topic
		topicIndex = chooseBestTopic(topicToUncertaintyMed, labeledDocs, condition);
		topIdsJson += "\"highestTopic\":\""+topicIndex+"\"";
		//return its first uncertain id
		//System.out.println(topIdsJson);
		return topIdsJson;
	}
	public String getMostUncertainIdBaseline(HashMap<String, HashMap<String, Double>> docIdToUncertainty, int numLabeledTotal, 
			HashMap<String, ArrayList<Double>> testingIdToProbs,
			HashMap<String, ArrayList<String>> updatedIds, String condition, int numBaselineDocs) throws IOException{
		//finds the top udated Ids and returns the top IdsJson
		String topIdsJson = "";
		topIdsJson = "{\"topIds\":[";
		updatedIds.put("0", new ArrayList<String>());
		docIdToUncertainty.put("0", new HashMap<String, Double>());
		//most uncertain docs for baseline and baseline_Al
		for(String docId:testingIdToProbs.keySet()){
			double uncertainty = 0;
			ArrayList<Double> labelProbs = testingIdToProbs.get(docId);
			if (condition.equals(LR_CONDITION)){
				double randEntropy = Math.random();
				uncertainty = randEntropy;
			}
			else{
				double entropy = getEntropyForAL(docId, labelProbs);
				double normalizedEntropy = entropy / labelProbs.size();
				uncertainty = normalizedEntropy;
			}
			docIdToUncertainty.get("0").put(docId, uncertainty);
		}
		ValueComparator vc =  new ValueComparator(docIdToUncertainty.get("0"));
		TreeMap<String,Double> sortedIdToUncertainty = new TreeMap<String,Double>(vc);
		sortedIdToUncertainty.putAll(docIdToUncertainty.get("0"));
		int i = 0;
		for(String docId:sortedIdToUncertainty.keySet()){
			if (i >= numBaselineDocs-numLabeledTotal)
				break;
			updatedIds.get("0").add(docId);
			topIdsJson += "\""+docId+"\",";
			i++;
		}
		topIdsJson = topIdsJson.substring(0, topIdsJson.length()-1);
		topIdsJson += "]";
		return topIdsJson;
	}
	public double getMedianUncertainty(TreeMap<String, Double> sortedIdToUncertainty) {
		//returns the median uncertainty of docs in a topic
		ArrayList<String> sortedIds = new ArrayList<String>();
		for(String id:sortedIdToUncertainty.keySet()){
			sortedIds.add(id);
		}
		double median = 0;
		if (sortedIdToUncertainty.keySet().size() % 2 == 1){
			int middleIndex = (int)Math.floor(sortedIdToUncertainty.keySet().size()/2);
			String medianId = sortedIds.get(middleIndex);
			median = sortedIdToUncertainty.get(medianId);
		}
		else{
			int middleIndex = (int)Math.floor(sortedIdToUncertainty.keySet().size()/2);
			String medianId1 = sortedIds.get(middleIndex);
			String medianId2 = sortedIds.get(middleIndex+1);

			median = (sortedIdToUncertainty.get(medianId1)+sortedIdToUncertainty.get(medianId2))/2;
		}
		return median;
	}
	
	public int chooseBestTopic(HashMap<String, Double> topicToUncertaintyMed, HashMap<String, ArrayList<String>> labeledDocs, String condition) {
		//calculates the median uncertainty for documents in a topic and returns 
		//the topic index that has the max median
		String optTopicIndex="";
		if(condition.equals(TR_CONDITION)){
			//choose a random topic that has at least one unlabeled document
			HashMap<String, Double> topicToLabeledNum = new HashMap<String, Double> ();
			ArrayList<String> unlabeledTopics = new ArrayList<String>();
			for(String topicIndex: labeledDocs.keySet()){
				topicToLabeledNum.put(topicIndex, (double)labeledDocs.get(topicIndex).size());
				if(labeledDocs.get(topicIndex).size() < 20)
					unlabeledTopics.add(topicIndex);
			}
			Collections.shuffle(unlabeledTopics);
			optTopicIndex = unlabeledTopics.get(0);
		}
		else if(condition.equals(TA_CONDITION)){
			//if condition == TA, choose the topic that has the max median of uncertainty
			ValueComparator vc =  new ValueComparator(topicToUncertaintyMed);
			TreeMap<String,Double> sortedTopicToUncertaintyMed = new TreeMap<String,Double>(vc);
			sortedTopicToUncertaintyMed.putAll(topicToUncertaintyMed);
			optTopicIndex = sortedTopicToUncertaintyMed.firstKey();
		}
		return Integer.parseInt(optTopicIndex);
	}

	public void takeLogs(String studyCondition, HashMap<String, HashMap<String, Double>> docIdToUncertainty, String topIdsJson, HashMap<String, ArrayList<String>> topicLabeledDocs,
			HashMap<String, ArrayList<String>> topIds, HashMap<String, String> updateTestingIdToLabel, HashMap<String, ArrayList<Double>> updateTestingIdToProbs, 
			TreeMap<String, String> idToLabelMap,
			HashMap<String, HashSet<String>> userLabelToIds, HashMap<String, Integer> labelStrToInt, String userName,
			String corpusName, double purity, String loggingMode, boolean isFinal, String finalEvent, String min, String sec) throws IOException{
		long time = System.currentTimeMillis();
		String dir = util.Constants.RESULT_DIR+corpusName+"/log/";
		String fileName = "";
		if(loggingMode.equals("classifier")){
			String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss").format(Calendar.getInstance().getTime());
			fileName = userName + "_" + timeStamp+".log";
		}
		else{
			String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss").format(Calendar.getInstance().getTime());
			fileName = userName + "_" + timeStamp+"_update.log";
		}
		//String filename = getServletContext().getRealPath("/"+dir+fileName);
		String filename = util.Constants.ABS_BASE_DIR+"results/"+ util.Constants.CORPUS_NAME+"/log/"+fileName;

		Writer writer = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(filename),"UTF8"));

		writer.write(userName + "\n");
		writer.write("-----------------------------------------------\n");
		writer.write("time= "+time+"_"+min+":"+sec+"\n");
		writer.write("isFinal= "+isFinal+"\n");

		writer.write("purity = "+String.valueOf(purity)+"\n");
		writer.write("size of label set = " + userLabelToIds.keySet().size() + "\n");
		writer.write("final event = " + finalEvent + "\n");

		writer.write("-----------------------------------------------\n");
		//document logs such as displayed docs' labels based on last classifier labels
		if(!isFinal){
			writer.write("TOP IDS:\n");
			ArrayList<String> topicLabeledDocIdsList;
			for(String topicIndex : topicLabeledDocs.keySet()){
				writer.write("topic "+topicIndex+"\n");
				topicLabeledDocIdsList = topicLabeledDocs.get(topicIndex);
				for(String docId:topicLabeledDocIdsList){
					writer.write(docId+":"+idToLabelMap.get(docId)+",USER"+"\n");
				}
				for (String docId:topIds.get(topicIndex)){
					if(allTopLabelDocuments == null)//before running classifier
						writer.write(docId+":NONE,"+docIdToUncertainty.get(topicIndex).get(docId)+"\n");
					else{//after the classifier has run once
						if(allTopLabelDocuments.contains(docId)){//assigned a label in UI
							if(testingIdToLabel.containsKey(docId))//tetsing Id contains the doc
								writer.write(docId+":"+testingIdToLabel.get(docId)+","+docIdToUncertainty.get(topicIndex).get(docId)+",CLASSIFIER,"+Collections.max(testingIdToProbs.get(docId))+"\n");
							else//deleted the label
								writer.write(docId+":NONE,"+docIdToUncertainty.get(topicIndex).get(docId)+"\n");
						}
						else
							writer.write(docId+":NONE,"+docIdToUncertainty.get(topicIndex).get(docId)+"\n");
					}
				}
			}
		}
		//classification logs always based on the recent classifier (AL or classify)
		writer.write("User labels:\n");

		for(String id:idToLabelMap.keySet()){
			String label = idToLabelMap.get(id);
			writer.write(id+":"+label+"\n");
		}
		if(loggingMode.equals("update")){
			if(allTopLabelDocuments != null){
				writer.write("Classification results:\n");
				for(String id: allTopLabelDocuments){
					if(!updateTestingIdToProbs.containsKey(id))
						continue;
					String labelString = updateTestingIdToLabel.get(id);
					writer.write(id+":"+labelString+",");
					ArrayList<Double> probs = updateTestingIdToProbs.get(id);
					double maxProb = Collections.max(probs);
					writer.write(maxProb + "\n");
				}

				writer.write("All classification results:\n");
				for(String id: updateTestingIdToLabel.keySet()){
					String labelString = updateTestingIdToLabel.get(id);
					writer.write(id+":"+labelString+",");
					ArrayList<Double> probs = updateTestingIdToProbs.get(id);
					double maxProb = Collections.max(probs);
					writer.write(maxProb + "\n");
				}
			}
		}
		else{
			if(allTopLabelDocuments != null){
				writer.write("Classification results:\n");
				for(String id: allTopLabelDocuments){
					if(!testingIdToProbs.containsKey(id))
						continue;
					String labelString = testingIdToLabel.get(id);
					writer.write(id+":"+labelString+",");
					ArrayList<Double> probs = testingIdToProbs.get(id);
					//System.out.println(id);
					double maxProb = Collections.max(probs);
					writer.write(maxProb + "\n");
				}

				writer.write("All classification results:\n");
				for(String id: testingIdToLabel.keySet()){
					String labelString = testingIdToLabel.get(id);
					writer.write(id+":"+labelString+",");
					ArrayList<Double> probs = testingIdToProbs.get(id);
					double maxProb = Collections.max(probs);
					writer.write(maxProb + "\n");
				}
			}
		}
		writer.close();
	}

	
	public HashMap<String, Integer> mapLabelStrToInt(
			TreeMap<String, String> idToLabelMap) {
		/* maps a label from string to a unique integer starting from 1 */
		HashMap<String, Integer> labelStrToInt = new HashMap<String, Integer>();
		int labelInt = 0;
		for (String id : idToLabelMap.keySet()) {
			String labelStr = idToLabelMap.get(id);
			if (!labelStrToInt.containsKey(labelStr)) {
				//labelInt++;
				labelStrToInt.put(labelStr, labelInt);
				labelInt++;
			}
		}
		return labelStrToInt;
	}

	public String getLabelStr(HashMap<String, Integer> labelStrToInt,
			double labelInt) {
		// go back to the string label after getting results
		// gets the strtoint map and a int label and
		// returns the string version of that label
		for (String labelStr : labelStrToInt.keySet()) {
			if (labelStrToInt.get(labelStr) == labelInt)
				return labelStr;
		}
		return " ";
	}

	public TreeMap<String, String> getDocLabelMap(String docToLabelMapStr) {
		/* stores document id and label in a map */
		TreeMap<String, String> idToLabelMap = new TreeMap<String, String>();
		String[] entities = docToLabelMapStr.split(",");
		if (entities.length > 0){
			for (String entity : entities) {
				String[] docLabel = entity.split(":");
				String docId = docLabel[0];
				String label = docLabel[1];
				idToLabelMap.put(docId, label);
			}
		}
		return idToLabelMap;
	}
	public void fillTopicLabeledDocs(String condition, String labeledDocsStr, HashMap<String, ArrayList<String>> labeledDocs){
		//fills the topic index to labeled documents in that topic map
		if(condition.equals(TR_CONDITION) || condition.equals(TA_CONDITION)){
			if(labeledDocsStr.length() > 0){
				String[] entities = labeledDocsStr.split(";");
				if (entities.length > 0){
					ArrayList<String> docIdsList;
					for (String entity : entities) {
						if(!entity.contains(":")){
							String topicIndex = entity;
							docIdsList = new ArrayList<String>();
							labeledDocs.put(topicIndex, docIdsList);
							continue;
						}
						String[] data = entity.split(":");
						String topicIndex = data[0];
						String docIdsStr = data[1];
						String[] docIds = docIdsStr.split(",");
						docIdsList = new ArrayList<String>();
						for(String id:docIds)
							docIdsList.add(id);
						labeledDocs.put(topicIndex, docIdsList);
					}
				}
			}
		}
		else{
			String[] entities = labeledDocsStr.split(",");
			if (entities.length > 0){
				String topicIndex = "0";
				ArrayList<String> docIdsList = new ArrayList<String>();
				for (String docId : entities) {
					docIdsList.add(docId);
				}
				labeledDocs.put(topicIndex, docIdsList);
			}
		}
	
	}

	public void updateUserLabelToIDs(HashMap<String, String> testingIdToLabelMap, 
			TreeMap<String, String> idToLabelMap, HashMap<String, HashSet<String>> userLabelToIds){
		for(String id:idToLabelMap.keySet()){
			String label = idToLabelMap.get(id);
			if(!userLabelToIds.containsKey(label)){
				HashSet<String> a = new HashSet<String>();
				userLabelToIds.put(label, a);
				userLabelToIds.get(label).add(id);
			}
			else{
				userLabelToIds.get(label).add(id);
			}
		}
		for(String id:testingIdToLabelMap.keySet()){
			String label = testingIdToLabelMap.get(id);
			if(!userLabelToIds.containsKey(label)){
				HashSet<String> a = new HashSet<String>();
				userLabelToIds.put(label, a);
				userLabelToIds.get(label).add(id);
			}
			else{
				userLabelToIds.get(label).add(id);
			}
		}
	}
	public void fillIdToGoldenLabel( TreeMap<String, String> idToGoldenLabel, HashMap<String, HashSet<String>>
	goldenLabelToIds, HttpServletRequest req) throws IOException{
		//fills in goldenLabelToIds and idToGoldenLabel
		//updates userLabelToIds based on those documents that their label is null in the file
		//String dir = backend + util.Constants.CORPUS_NAME+"/input/" + util.Constants.CORPUS_NAME+".gold";
		String dir = util.Constants.ABS_BASE_DIR+"results/"+util.Constants.CORPUS_NAME+"/input/" + util.Constants.CORPUS_NAME+".gold";
	
		if(!util.Util.checkExist(dir)){
			System.out.println("No gold label file found.");
			return;
		}
	
		//filling golden labels based on topics_corpus.txt
		//BufferedReader	br = new BufferedReader(new InputStreamReader(req.getSession().getServletContext().getResourceAsStream("/"+dir)));
		FileInputStream infstream = new FileInputStream(dir);
		DataInputStream in = new DataInputStream(infstream);
		BufferedReader br = new BufferedReader(new InputStreamReader(in));
		String strLine;
		String id, goldenLabel;

		while ((strLine = br.readLine()) != null){
			String[] items = strLine.split("\\s+");
			id = items[0];
			goldenLabel = items[1];
			if (!goldenLabelToIds.containsKey(goldenLabel)){
				HashSet<String> a = new HashSet<String>();
				a.add(id);
				goldenLabelToIds.put(goldenLabel, a);
			}
			else{
				goldenLabelToIds.get(goldenLabel).add(id);
			}
			idToGoldenLabel.put(id, goldenLabel);
		}
		br.close();
	}
	public double getPurity(HashMap<String, HashSet<String>> userLabelToIds, 
			TreeMap<String, String> idToGoldenLabel, int numDocs){
		//calculates purity score for the existing labeling
		int sum = 0;
		for(String userLabel:userLabelToIds.keySet()){//for each cluster
			int mostFreqGoldenLabel = 0;
			HashMap<String,Integer> goldenLabelFreq = new HashMap<String, Integer>();

			for(String docId:userLabelToIds.get(userLabel)){
				String goldenLabel = idToGoldenLabel.get(docId);
				if(!goldenLabelFreq.keySet().contains(goldenLabel))
					goldenLabelFreq.put(goldenLabel, 1);
				else
					goldenLabelFreq.put(goldenLabel, goldenLabelFreq.get(goldenLabel)+1);
			}
			for(String goldenLabel:goldenLabelFreq.keySet()){
				if (goldenLabelFreq.get(goldenLabel) > mostFreqGoldenLabel)
					mostFreqGoldenLabel = goldenLabelFreq.get(goldenLabel);
			}
			sum += mostFreqGoldenLabel;
		}
		double purity =(sum+0.0)/numDocs; 

		return purity;
	}
}
