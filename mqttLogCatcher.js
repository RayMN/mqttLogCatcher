/********************************************************************
* Program: mqttLogCatcher
* Module: mqttLogCatcher.js
* Description: Captures the content of a MQTT Topics and writes them
*              to a file
* Inputs: MQTT Broker, Topic(s), ClientID, File Location
* Outputs: File
*
* Author: Ray Wilson
*               wilsonprw@gmail.com
*
* Revisions:
*               Date            Who     Description
*               ----------      ----    ----------------------------------------
*               2019-10-02      prw     Created
*
********************************************************************/

// minimist captures command line parameters in an easy to use way.
const args = require('minimist')(process.argv.slice(2));
if (!args.b || !args.t || !args.f || !args.c) {
        console.log('');
        console.log('   ERROR: Insufficient number of arguments!');
        console.log(' Example: node MQTTCapture.js -b BROKER -t TOPIC1 [-t TOPIC2] -c CLIENT -f FILEDIR [-d]');
        console.log('   Where:');
        console.log('         -b is the broker URL ex: "mqtt://localhost:1883".');
        console.log('         -t [one or more] is a topic ex: "dev/6881/core/log".');
        console.log('         -c is this client ID ex : "index.js".');
        console.log('         -f base log directory.');
        console.log('         -d [optional] is for debug mode that enables console output.');
		console.log('');
		if (args.d) {
			if (args.b) { console.log('BROKER  = '+args.b); }
			if (args.t) { console.log('TOPIC   = '+args.t); }
			if (args.c) { console.log('CLIENTs = '+args.c); }
			if (args.f) { console.log('FILEDIR = '+args.f); }
			if (args.d) { console.log('Debug   = True'); } else { console.log('Debug   = False'); }
			if (args.d) { console.log(''); }
		}
		console.log('');
		process.exit(1);
}

if (args.d) {
	if (args.b) { console.log('DEUBG: BROKER  = '+args.b); }
	if (args.t) { console.log('DEUBG: TOPIC   = '+args.t); }
	if (args.c) { console.log('DEUBG: CLIENT  = '+args.c); }
	if (args.f) { console.log('DEUBG: LOGGILE = '+args.f); }
	if (args.d) { console.log('DEUBG: Debug   = True'); }
	if (args.d) { console.log(''); }
}
var MQTT = require("mqtt");
var fs = require("fs");

var client  = MQTT.connect(args.b, {clientId: args.c});
client.on("connect", onConnected);
client.on("message", onMessageReceived);

function onConnected() {
	if (Array.isArray(args.t)) {
		for (var i = 0; i < args.t.length; i++) {
					client.subscribe(args.t[i]);
		}
	} else {
		client.subscribe(args.t);
	}
}

function onMessageReceived(topic, message) {
	// topic string looks like: dev/1234/myApp/logging
	// Gather the source information from the topic
	var src = topic.split("/");
	var source = {
			"environment":src[0],
			"instance":src[1],
			"application":src[2],
			"reason":src[3]
	};

	// message string is a json object
	// Build the log message from the inbound message
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

	// Check to see if the message is a "log" message
	// Expecting json messages
	if(source.reason === "log") {
		var fn = args.f + source.environment +"-"+ source.instance +"-"+ source.application +"-"+ source.reason + ".json";
		if (args.d) { console.log("DEBUG: TO log: " + JSON.stringify(theMsg) +"\n"); }
		fs.appendFile(fn, JSON.stringify(theMsg)+"\n", (err) => {
			// throws an error, you could also catch it here
			if (err) throw err;
			// success case, the file was saved
		});
	}

	// Check to see if the message is a "test" message
	// expeting ascii data - json, xml, html ... what ever
	if(source.reason === "test") {
		var fn = args.f + source.environment +"-"+ source.instance +"-"+ source.application +"-"+ source.reason + ".txt";
		if (args.d) { console.log("DEBUG: TO test: " + message +"\n"); }
		fs.appendFile(fn, message + "\n", (err) => {
			// throws an error, you could also catch it here
			if (err) throw err;
			// success case, the file was saved
		});
	}

}