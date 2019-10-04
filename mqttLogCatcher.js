/********************************************************************
* Program: mqttLogCatcher
* Module: mqttLogCatcher.js
* Description: Captures the content of a MQTT topic(s) and writes them
*              to a file(s)
* Inputs: MQTT Broker, Topic(s), ClientID, File Location
* Outputs: File
*
* Revisions:
*	Date        Who     Description
*	----------  ----    ----------------------------------------
*	2019-10-02	prw     Created
*	2019-10-04	prw	Few more minor tweaks, commenting
*
********************************************************************/

// minimist captures command line parameters in an easy to use way.
const args = require('minimist')(process.argv.slice(2));

// Check for required arguments (one of each -b, -t, -c, -f), display an error and exit if not present.
if ( args.h || (!args.b || !args.t || !args.f || !args.c)) {
	console.log('');
	console.log(' ERROR: Insufficient number of arguments!');
	console.log(' Example: node MQTTCapture.js -b BROKER -t TOPIC1 [-t TOPIC2] -c CLIENT -f FILEDIR [-d] [-h]');
	console.log('   Where:');
	console.log('         -b is the broker URL ex: "mqtt://localhost:1883".');
	console.log('         -t [one or more] is a topic ex: "dev/6881/app/log".');
	console.log('         -c is this client ID ex : "mqttLogCatcher".');
	console.log('         -f base log directory.');
	console.log('         -d [optional] is for debug mode that enables console output.');
	console.log('         -h [optional] this help message.');
	console.log('');
	if (args.d) {
		if (args.b) { console.log('BROKER  = '+args.b); }
		if (args.t) { console.log('TOPIC   = '+args.t); }
		if (args.c) { console.log('CLIENTs = '+args.c); }
		if (args.f) { console.log('FILEDIR = '+args.f); }
		if (args.d) { console.log('Debug   = True'); } else { console.log('Debug   = False'); }
		if (args.h) { console.log('Help    = True'); } else { console.log('Help    = False'); }
	}
	console.log('');
	process.exit(1);
}

// Display command line argument if debug is enabled
if (args.d) {
	if (args.b) { console.log('DEUBG: BROKER  = '+args.b); }
	if (args.t) { console.log('DEUBG: TOPIC   = '+args.t); }
	if (args.c) { console.log('DEUBG: CLIENT  = '+args.c); }
	if (args.f) { console.log('DEUBG: LOGGILE = '+args.f); }
	if (args.d) { console.log('DEUBG: Debug   = True'); }
	if (args.h) { console.log('DEUBG: Help    = True');
	if (args.d) { console.log(''); }
}

// Real program starts here
var MQTT = require("mqtt");
var fs = require("fs");

// Create a connection to the MQTT Broker
var client  = MQTT.connect(args.b, {clientId: args.c});
client.on("connect", onConnected);
client.on("message", onMessageReceived);

// Once connected subscribe to the or all of the topic provided
function onConnected() {
	if (Array.isArray(args.t)) {
		for (var i = 0; i < args.t.length; i++) {
			client.subscribe(args.t[i]);
		}
	} else {
		client.subscribe(args.t);
	}
}

// Process any message recieved
function onMessageReceived(topic, message) {
	// Gather the source information from the topic
	// My topic string looks like: dev/1234/myApp/log
	var src = topic.split("/");
	// Create a "source" json object for the log entry
	var source = {
		"env":src[0],
		"inst":src[1],
		"app":src[2],
		"reason":src[3]
	};

	// The intent of this application os to capture json formatted log entries.
	// if you would like process other specific format or only log parts of the
	// json message you will need to make edits to this section and / or the 
	// sections below that write to the log files.
	// For now this basically checks to see that the incoming message is a json
	// structure, otherwise it puts in an error structure.
	var theMsg = {};
	theMsg.source = source;
	try {
		if (args.d) { console.log("DEBUG: typeof message = " + typeof message); }
		theMsg.message =  JSON.parse(message);
		if (args.d) { console.log("DEBUG: typeof theMsg.message = " + typeof theMsg.message); }
		if ( typeof theMsg.message === "number") { throw err; }
	} catch {
		theMsg.message =  { "ERROR":"non-json data found" };
	}

	// Write to a log file based on the reason for logging.
	// Check to see if the message is a "log" message
	if(source.reason === "log") {
		var fn = args.f + source.environment +"-"+ source.instance +"-"+ source.application +"-"+ source.reason + ".json";
		if (args.d) { console.log("DEBUG: TO log: " + JSON.stringify(theMsg) +"\n"); }
		fs.appendFile(fn, JSON.stringify(theMsg)+"\n", (err) => { if (err) throw err; });
	
	// If you want to add other specific log files you would add a elseif here to handle each one.
	// I can see a source.reason === "err" and a source.reason === "txn" for instance.

	// All undefined logs will go into a txt file log
	// expeting ascii data - json, xml, html ... what ever as long as it's ascii text.	
	} else {

		var fn = args.f + source.environment +"-"+ source.instance +"-"+ source.application +"-"+ source.reason + ".txt";
		if (args.d) { console.log("DEBUG: TO test: " + message +"\n"); }
		fs.appendFile(fn, message + "\n", (err) => { if (err) throw err; });
	}
}

