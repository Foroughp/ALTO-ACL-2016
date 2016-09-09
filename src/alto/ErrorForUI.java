package alto;

import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.io.UnsupportedEncodingException;

public class ErrorForUI extends Exception {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	private String message;
	private String stack; 
	public ErrorForUI(Throwable t) {
		ByteArrayOutputStream baos = new ByteArrayOutputStream();
		PrintStream ps = new PrintStream(baos);
		t.printStackTrace(ps);
		try {
			setStack(baos.toString("UTF-8"));
			setMessage(t.getMessage());
		} catch (UnsupportedEncodingException e) {
			setMessage("Unsupported Encoding");
		}
	}
	public String getMessage() {
		return message;
	}
	private void setMessage(String message) {
		this.message = message;
	}
	public String getStack() {
		return stack;
	}
	private void setStack(String stack) {
		this.stack = stack;
	}

}
