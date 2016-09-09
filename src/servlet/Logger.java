package servlet;


import java.io.BufferedWriter;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.text.SimpleDateFormat;
import java.util.Calendar;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

//TODO: if there is no label, throws an exception. FIX!
public class Logger extends HttpServlet {
	private static final long serialVersionUID = 1L;
	protected void doGet(HttpServletRequest req, HttpServletResponse resp)
			throws ServletException, IOException {
		//System.out.println("taking logs.....");
		String userName = req.getParameter("username");
		String corpusName = req.getParameter("corpusname");
		String logFileNum = req.getParameter("logfilenum");
		String logStr = req.getParameter("logStr");
		//String condition = req.getParameter("condition")
		String dir = util.Constants.RESULT_DIR+corpusName+"/log/";
		String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss").format(Calendar.getInstance().getTime());

		String filename = getServletContext().getRealPath("/"+dir+userName+"_log_"+logFileNum+"_"+timeStamp+".log");
		Writer writer = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(filename),"UTF8"));
		writer.write(logStr);
		writer.close();
		//System.out.println("finished taking logs");
	}
}
