package servlet;

import java.io.IOException;
import java.io.PrintWriter;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import alto.Backend;
import alto.ErrorForUI;

/**
 * Servlet implementation class DataLoader
 */
public class DataLoader extends HttpServlet {
	private static final long serialVersionUID = 1L;
       
    /**
     * @see HttpServlet#HttpServlet()
     */
    public DataLoader() {
        super();
    }

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {		
		doPost(request, response);
	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doPost(HttpServletRequest req, HttpServletResponse response) throws ServletException, IOException {
		PrintWriter out = response.getWriter();
		String json="";
	try{	
		String username = req.getParameter("username");
		json = Backend.createNewSession(username, req);
		
		System.out.println(json);
		response.setContentType("application/json");
		response.setCharacterEncoding("UTF-8");

		out.print(json);
		out.flush();
	}catch(alto.ErrorForUI e){
		out.print("{\"hasError\": true, \"message\":"+e.getMessage()+", \"stack:\":+"+e.getStack()
				+", \"base directory: "+util.Constants.RESULT_DIR+"\" }");
		out.flush();
	}
	}
}
