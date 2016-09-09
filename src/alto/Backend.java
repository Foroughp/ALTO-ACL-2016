package alto;

import java.io.IOException;
import javax.servlet.http.HttpServletRequest;

import alto.ErrorForUI;
public class Backend {

	public static String createNewSession(String username, HttpServletRequest req) throws ErrorForUI, IOException
	{
		String json="";
		System.out.println("Creating new session: corpus: " + util.Constants.CORPUS_NAME + ", username: " + username + ", topicsnum: " + util.Constants.NUM_TOPICS);
		TopicModeling treeTM = new TopicModeling(req);
		json = treeTM.changeFormat(req);
		return json;
	}
}
