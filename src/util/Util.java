package util;

import java.io.BufferedReader;
import java.io.DataInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.HashMap;

import javax.servlet.http.HttpServletRequest;

import alto.ErrorForUI;

public class Util {
	
	public static ArrayList<String> loadFileList(String filelistname, HttpServletRequest req) throws ErrorForUI {
		ArrayList<String> filelist = new ArrayList<String> ();
		try {
			//FileInputStream infstream = new FileInputStream(filelistname);
			//DataInputStream in = new DataInputStream(infstream);
			BufferedReader br = new BufferedReader(new InputStreamReader(req.getSession().getServletContext().getResourceAsStream(filelistname)));
			
			String strLine;
			//Read File Line By Line
			int id = -1;
			while ((strLine = br.readLine()) != null) {
				id++;
				strLine = strLine.trim();
				filelist.add(strLine);
				if(filelist.size() != id + 1) {
					System.out.println("Error in loadFileList!");
					System.exit(1);
				}
			}
			//in.close();
		} catch (IOException e) {
			e.printStackTrace();
			throw new ErrorForUI(e);
		}
		return filelist;
	}
	
	public static HashMap<String, String> loadUrls(String filename, HttpServletRequest req) throws ErrorForUI {
		HashMap<String, String> urls = new HashMap<String, String> ();
		ArrayList<String> list = util.Util.loadFileList(filename, req);
		
		for(String line : list) {
			String[] words = line.split(" ");
			urls.put(words[0], words[1]);
		}
		
		return urls;
	}
	
	public static String readFile(String filename) throws Exception {
		String words = "";
		try{
			FileInputStream docfstream = new FileInputStream(filename);
			DataInputStream docin = new DataInputStream(docfstream);
			BufferedReader docbr = new BufferedReader(new InputStreamReader(docin));
			String strLine;
			//Read File Line By Line
			while ((strLine = docbr.readLine()) != null) {
				strLine = strLine.trim();
				words += strLine + " ";
			}
			docin.close();
		} catch (Exception e) {
			e.printStackTrace();
			throw e;
		}
		words = words.trim();
		return words;
	}
	
	public static void creatDir(String dir) throws IOException{
		//if(util.Constants.FOR_DEPLOY)
			//return;
		
		File theDir = new File(dir);
		if (!theDir.exists()) {
			if (theDir.mkdir()) {
				System.out.println("Output Directory " + dir + " created!");
			} else {
				System.out.println("No output directory!");
				throw new IOException();
			}
		}
		
	}
	public static double log2(double num){
		return Math.log(num)/Math.log(2);
	}
	public static boolean checkExist (String filename) {
		File file = new File(filename);
		if (file.exists()) {
			return true;
		} else {
			return false;
		}
	}

}
