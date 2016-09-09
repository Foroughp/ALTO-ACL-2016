## Introduction

This file walks through the process for using ALTO (http://aclweb.org/anthology/P/P16/P16-1110.pdf) for label induction and document labeling. The code also allows you to use the other three conditions in the paper.

## Check out
```
git clone https://github.com/Foroughp/ALTO-ACL-2016.git
```

## Requirements
You need to have tomcat installed on your computer. Find your tomcat related directories. Let $TOMCAT be the tomcat directory.

## Compiling and Running
Let BASEDIR be the directory of ALTO code.

Please try the synthetic data first:
### Set constants:
 Open $BASEDIR/src/util/Constants.java, set the ABS_BASE_DIR to the abs path of $BASEDIR/WebContent/results, and TEXT_DATA_DIR to the abs path of $BASEDIR/text_data/synthetic/
### Compile: 
- `cd $BASEDIR`

- `mkdir WebContent/WEB-INF/classes`

- `javac -cp WebContent/WEB-INF/lib/*:$TOMCAT/* src/*/*.java -d WebContent/WEB-INF/classes`

### Copy to the tomcat webapps:
- `cp -r WebContent $TOMCAT/webapps/`

- `mv $TOMCAT/webapps/WebContent $TOMCAT/webapps/alto-release`

### Run server:
- Start the server: `$TOMCAT/bin/catalina.sh start`

- Open your browser: http://localhost:8080/alto-release/

- Start using ALTO (see next step)

- Stop the server: `$TOMCAT/catalina.sh stop`

### Try ALTO:
check the ALTO paper in ACL 2016 for details about this interface
	
- Type user name, choose a condition, and click "Start".
- You can click the documents to see the actual content.
- If in TA or TR conditions, check the topics: the top words and top related documents for each topic are displayed. You can click the documents to see the actual content.
- You can assign a label to the document either from the existing labels or creating a new one.
- Once you have at least two labels, the system will suggest a document to label by scrolling to that document and drawing a red box around it.
- The logs are available in the results directory

## Trying a new dataset:
Here are some steps for trying a new dataset with ALTO:
Assume your data name is CORPUS. Put the data in the $BASEDIR/text_data/$CORPUS folder. Each document needs to be in a separate file.

- `mkdir $BASEDIR/WebContent/results/$CORPUS`
- `mkdir $BASEDIR/WebContent/results/$CORPUS/input`

### Generate the files in the data folder:
- $CORPUS.html: Follow the synthetic.html format. Keep the headers the same, and follow the same way to format your documents. Note that you don't have to make all your documents in one html file, you can split them to several small ones, as long as they are consistent with the url defined in $CORPUS.url.
- $CORPUS.titles: Follow the synthetic.titles format. The content will be used for display in the interface. For synthetic data, the titles are the same as actual content. However, for a real-world data, titles will be shorter than content.

### Generate the files in the input folder:
- The mallet input data $CORPUS-topic-input.mallet: `./bin/mallet import-dir --input $BASEDIR/text_data/$CORPUS --output $BASEDIR/WebContent/results/$CORPUS/input/$CORPUS-topic-input.mallet --keep-sequence` (Please refer to mallet website for more details.)
- $CORPUS.url: Follow the synthetic.url format. Notice this is related with the *.html in $BASEDIR/WebContent/data/. The url basically defines the path to look for the document in the synthetic.html file. 

- $CORPUS.gold: the gold labels associated with documents. Follow the format in synthetic.gold. Note that this file is optional. If you don't have gold label standards for your dataset, purity will be calculated as -1. 

### Generate the files in the output folder:
- The model.topics and model.docs files: `./bin/mallet train-topics --input $BASEDIR/WebContent/results/$CORPUS/input/$CORPUS-topic-input.mallet --num-topics $NUMTOPICS --topic-word-weights-file  $BASEDIR/WebContent/results/$CORPUS/output/model.topics --output-doc-topics $BASEDIR/WebContent/results/$CORPUS/output/model.docs` (Please refer to mallet website for more details.)

### Setup new data in the interface:
- Change the CORPUS_NAME and TEXT_DATA_DIR variables in $BASEDIR/WebContent/src/util/Constants.java.
- Change the topic model setting in $BASEDIR/src/util/Constants.java.
- If need be, change the counting down time: Look for "var start_itm = 40;" in WebContent/ui.html and change the number "15" to the time you want.
