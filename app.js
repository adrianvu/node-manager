var forever = require('forever-monitor');
	request = require('request'),
	express = require("express"),
	app = express(),
	http = require('http'),
	PORT = 5905,
	IPADDRESS = '127.0.0.1',
	processes = [],
	multer = require('multer'),
	bodyParser = require('body-parser'),
	process_obj = null,
	fs = require('fs'); 

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer());
app.use('/assets', express.static(__dirname + '/public'));

app.get("/", function(req, res){
    res.sendFile(__dirname + '/public/index.html');
});

app.get("/getProcessList", function(req, res){
	getProcessList(res);
});
app.post("/addProcess", function(req, res){
	var jsFile = req.body.jsFile;
	fs.exists(jsFile, function(exists) {
	  if (exists) {
		var new_process = new (forever.Monitor)(jsFile, {
			max: 99,
			silent: false,
			args: [{start: false}]
		});
		var process_obj = {start: false, file: jsFile, processObj: new_process};
		processes.push(process_obj);
		res.send(JSON.stringify({success: 1, msg: "new process added"}));
	  } else {
		res.send(JSON.stringify({success: 0, msg: "no such file exists"}));
	  }
	});

});
app.post("/processAction", function(req, res){
	var process_id = req.body.id;
	var action = req.body.action;
	var script = processes[parseInt(process_id)].file
	switch(action) {
		case "start":
			if (!processes[parseInt(process_id)].start) {
				try{
				processes[parseInt(process_id)].processObj.start();
				processes[parseInt(process_id)].start = true;
				res.send(JSON.stringify({success: 1, msg: "process " + processes[parseInt(process_id)].file + " is set to " + action + " action"}));
				} catch(e) {
					console.log(e);
				}
			}
			break;
		case "stop":
			if (processes[parseInt(process_id)].start) {
				processes[parseInt(process_id)].processObj.stop();
				processes[parseInt(process_id)].start = false;
				res.send(JSON.stringify({success: 1, msg: "process " + processes[parseInt(process_id)].file + " is set to " + action + " action"}));
				console.log("stopped");
			}
			break;
		case "restart":
			processes[parseInt(process_id)].start = true;
			processes[parseInt(process_id)].processObj.restart();
			res.send(JSON.stringify({success: 1, msg: "process " + processes[parseInt(process_id)].file + " is set to " + action + " action"}));
			break;
		case "remove":
			if (processes[parseInt(process_id)].start) {
				processes[parseInt(process_id)].processObj.stop();
			}
			processes.splice(parseInt(process_id), 1);
			res.send(JSON.stringify({success: 1, msg: "process " + script + " is set to " + action + " action"}));
			break;
	}
	//res.send(JSON.stringify(queryArr));
});

function getProcessList(res) {
	var queryArr = [];
	processes.forEach(function(process) {
		var process_obj = {start: process.start, file:process.file};
		queryArr.push(process_obj);
	});
	res.send(JSON.stringify(queryArr).toString());
}

var server = require('http').createServer(app);
server.listen(PORT, IPADDRESS);
console.log("Monitoring Server running on " + IPADDRESS + ":" + PORT);