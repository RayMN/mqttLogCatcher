# mqttLogCatcher
The purpose of this module is the capture log messages, in json format, from one or more MQTT topics and write them to log files in a specified directory with file names based on the topic names.

# Usage
```
Example: node MQTTCapture.js -b BROKER -t TOPIC1 [-t TOPIC2] -c CLIENT -f FILEDIR [-d] [-h]
  Where:
    -b is the broker URL ex: "mqtt://localhost:1883".
    -t [one or more] is a topic ex: "dev/6881/app/log".
    -c is this client ID ex : "mqttLogCatcher".
    -f base log directory.
    -d [optional] is for debug mode that enables console output.
    -h [optional] this help message.
```
