package alto;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.DataInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.StringTokenizer;
import java.util.TreeMap;

//gets a folder of data and outputs the feature file in following format:
// docid 1:count 2:count ...
//bag of words + topics

public class Featurizer{
	
	public String baseDir = util.Constants.ABS_BASE_DIR;
	public ArrayList<String> ids = new ArrayList<String>();
	;
	public TreeMap<String, String> idToTextMap = new TreeMap<String, String>();
	public TreeMap<String, TreeMap<Integer, Integer>> idToTokenCounts = new TreeMap<String, TreeMap<Integer, Integer>>();
	public HashMap<String, TreeMap<Integer, Double>> docIdToTopicProb = new HashMap<String, TreeMap<Integer, Double>>();
	public HashMap<String, Integer> vocabToIndex = new HashMap<String,Integer>();
	public TreeMap<Integer, String> indexToVocab = new TreeMap<Integer, String>();

	public void featurize() throws IOException{
		String featuresDir = baseDir+"results/"+util.Constants.CORPUS_NAME + "/output/T"+
	String.valueOf(util.Constants.NUM_TOPICS)+"/init/"+util.Constants.CORPUS_NAME+".feat";

		if(util.Util.checkExist(featuresDir))
			return;
		Writer writer = null;
		writer = new BufferedWriter(new OutputStreamWriter(
				new FileOutputStream(featuresDir), "utf-8"));
		
		getData();
		fillVocab();
		if(ids.size() == 0){
			//getting doc ids
			String dir = util.Constants.TEXT_DATA_DIR;

			File folder = new File(dir);
			File[] listOfFiles = folder.listFiles();
			for(int i = 0 ; i < listOfFiles.length; i++){
				System.out.println("Featurizing file :"+listOfFiles[i].getName());
				ids.add(listOfFiles[i].getName());
				extractFeatures(listOfFiles[i].getName(), writer);
			}
		}
		writer.close();
	}

	public void fillVocab() throws IOException{
		FileInputStream infstream = new FileInputStream(this.baseDir+"results/"+util.Constants.CORPUS_NAME + "/input/"+util.Constants.CORPUS_NAME+ ".voc");
		DataInputStream in = new DataInputStream(infstream);
		BufferedReader br = new BufferedReader(new InputStreamReader(in));
		String strLine = "";
		int lineNum = 1;
		while((strLine= br.readLine()) != null){
			String[] items = strLine.split("\\s+");
			vocabToIndex.put(items[1], lineNum);
			indexToVocab.put(lineNum, items[1]);
			lineNum++;
		}
		br.close();
	}
	
	public void getData()
			throws IOException {
		// Reads doc id and doc text from file and fills in the map
		String dir = util.Constants.TEXT_DATA_DIR;
		File folder = new File(dir);
		File[] listOfFiles = folder.listFiles();

		if (idToTextMap.keySet().size() == 0) {
			idToTextMap = new TreeMap<String, String>();
			for(int i = 0 ; i < listOfFiles.length; i++){
				FileInputStream infstream = new FileInputStream(listOfFiles[i].getAbsolutePath());
				DataInputStream in = new DataInputStream(infstream);
				BufferedReader br = new BufferedReader(new InputStreamReader(in));
				String strLine;
				String id = listOfFiles[i].getName();
				String text = "";
				while ((strLine = br.readLine()) != null){
					text += strLine;
				}
				idToTextMap.put(id, text);
				br.close();
			}
		}
	}

	public void extractFeatures(String id, Writer writer) throws IOException{
		// gets an id and creates a map from vocab index to their count as a feature
		TreeMap<Integer, Integer> indexToFreqMap = new TreeMap<Integer, Integer>();
		String text = idToTextMap.get(id);
		StringTokenizer st = new StringTokenizer(text);
		while (st.hasMoreElements()) {
			String token = st.nextToken();
			token = token.toLowerCase();//lowercase everything
			if(!vocabToIndex.containsKey(token)) //|| stopWords.contains(token))
				continue;
			int vocabIndex = vocabToIndex.get(token);
	
			if (!indexToFreqMap.containsKey(vocabIndex))
				indexToFreqMap.put(vocabIndex, 1);
			else {
				int freq = indexToFreqMap.get(vocabIndex);
				indexToFreqMap.put(vocabIndex, freq + 1);
			}
		}
		//write to file
		int numWordsFeatures = 0;
		numWordsFeatures = vocabToIndex.keySet().size();

		fillDocIdToTopicProbMap(docIdToTopicProb);

		String line="";
		line = line + id + " ";
			for(int index:indexToFreqMap.keySet()){
				line = line + String.valueOf(index) + ":"
						+ String.valueOf(indexToFreqMap.get(index)) + " ";
			}
		
		String topicFeatStr = getTopicProbFeature(docIdToTopicProb, id , numWordsFeatures+1);
		line += topicFeatStr;
		writer.write(line+"\n");
	}

	public void fillDocIdToTopicProbMap(HashMap<String, TreeMap<Integer, Double>> docIdToTopicProb) throws IOException{
		//reads in model.docs file and fills in id to topic prob map
		FileInputStream infstream = new FileInputStream(baseDir+"results/"+util.Constants.CORPUS_NAME+"/output/T"+
		util.Constants.NUM_TOPICS+""+"/init/"+"model.docs");
		DataInputStream in = new DataInputStream(infstream);
		BufferedReader br = new BufferedReader(new InputStreamReader(in));
		String strLine;
		br.readLine();//header
		while ((strLine = br.readLine()) != null){
			strLine = strLine.trim();
			String[] str = strLine.split("\\s+");
			String fullPath = str[1];
			String docId = fullPath.substring(fullPath.lastIndexOf("/")+1);
			int numtopics = (str.length-2) / 2;
			TreeMap<Integer, Double> topicToProb = new TreeMap<Integer, Double>();
			docIdToTopicProb.put(docId, topicToProb);
			for(int tt = 0; tt < numtopics; tt++) {
				int index = 2 * tt + 2;
				int topic = Integer.parseInt(str[index]);
				Double prob = Double.parseDouble(str[index+1]);

				docIdToTopicProb.get(docId).put(topic, prob);
			}
		}
		br.close();
	}
	public static String getTopicProbFeature(
			HashMap<String, TreeMap<Integer, Double>> docIdToTopicProb, String docId,
			int featureIndex) {
		//creates a line in the feature format for topic probs
		String line = "";
		for (int i = 0; i < util.Constants.NUM_TOPICS; i++) {
			line += String.valueOf(featureIndex) + ":" + docIdToTopicProb.get(docId).get(i) + " ";
			featureIndex++;
		}
		return line;
	}

	public void writeFeaturesToFile(boolean ngrams, String dataFileName,int numTopics, String corpusName, HashMap<String, TreeMap<Integer, Double>> docIdToTopicProb)
			throws IOException {
		System.out.println("writing features to file...");

		fillDocIdToTopicProbMap(docIdToTopicProb);

		// Writing training file
		int numWordsFeatures = 0;
		if(ngrams)
			numWordsFeatures = vocabToIndex.keySet().size();
		else
			numWordsFeatures = 0;

		System.out.println("****Dimension = "+ numWordsFeatures);
		Writer writer = null;
		writer = new BufferedWriter(new OutputStreamWriter(
				new FileOutputStream(dataFileName), "utf-8"));
		for (String id : ids) {
			System.out.println("Writing features to the file... "+ id);
			String line = "";

			line = line + id + " ";
			if (ngrams){
				for(int vocabIndex:indexToVocab.keySet()){
					if(idToTokenCounts.get(id).containsKey(vocabIndex)){
						line = line + String.valueOf(vocabIndex) + ":"
								+ String.valueOf(idToTokenCounts.get(id).get(vocabIndex)) + " ";
					}
					else{
						line = line + String.valueOf(vocabIndex) + ":"
								+ "0" + " ";
					}
				}
			}
			String topicFeatStr = getTopicProbFeature(docIdToTopicProb, id , numWordsFeatures+1);
			line += topicFeatStr;
			writer.write(line+"\n");
		}
		writer.close();
		System.out.println("Finished writing features...");
	}
	public static HashMap<String, Integer> mapFeatureStrToInt(
			TreeMap<String, TreeMap<String, Integer>> featureMap, HashMap<Integer, String> featureIntToStr) {
		// maps a token feature from string to a unique integer starting from 1
		HashMap<String, Integer> featureStrToInt = new HashMap<String, Integer>();
		int featureInt = 0;
		for(String id: featureMap.keySet()){
			for (String featureStr : featureMap.get(id).keySet()) {
				if (!featureStrToInt.containsKey(featureStr)) {
					featureInt++;
					featureStrToInt.put(featureStr, featureInt);
					featureIntToStr.put(featureInt, featureStr);
				}
			}
		}

		return featureStrToInt;
	}
}