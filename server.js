var ip      = require("ip"),
    mkdirp  = require('mkdirp'),
    fs      = require('fs'),
    http    = require('http'),
    sys     = require('sys'),
    shell   = require('shelljs/global'),
    readLn  = require('readline');



var storageLocation = "./files/storage.json";
var storage;

// Create storage //
if(fs.existsSync(storageLocation)) {
    console.log("Storage.json was found");
} else {
    var options = {
        bind      : "0.0.0.0",
        port      : 8080,
        logOutput : true
    };

    storage = {
        "options"  : options
    };

    mkdirp("./files/"); // Create the folders //
    saveStorage();
}

var commands = 
[
	{
	    url : "/reboot",
	    command : function() {
	    	return "Yo";
	    },
	},
    {
        url : "/temperature",
        command : function() {
            return executeCommand("temperature -f");
        }
    }
];


function saveStorage(onComplete) {
    fs.writeFile(storageLocation, JSON.stringify(storage), function(e) {
        if(e) throw e;

        console.log("Wrote to -> storage.json");
        if( onComplete !== null && typeof onComplete == "function" )
            onComplete();
    });
}

function readStorage(onComplete) {
    fs.readFile("./files/storage.json", function(err, data) {
        if(err) throw err;

        storage = JSON.parse(data);

        if (onComplete !== null)
            onComplete();
    });
}

function startServer() {
    readStorage(function() {
        http.createServer(function(request, result) {
        	if(!request || !result || request.url == "/favicon.ico") return;
            console.log("=> " + request.url.toLowerCase());

            for(var i = 0; i < commands.length; i++) {
                var command = commands[i];

                if(command.url.toLowerCase() == request.url.toLowerCase()) {
                	console.log("Executing: \"" + command.url + "\"");
                    var output = command.command();
                    writeToOutput(result, output ? output : responseAsJson("ok"));
                    if (request)
                        request.socket.end();
                    return;
                }
            }

        	writeToOutput(result, responseAsJson("no command found"));
            request.socket.end();
            
        }).listen(storage.options.port, storage.options.bind);
        console.log("Listening for commands on " + storage.options.bind + ":" + storage.options.port)
    });

}


function executeCommand(cmd) {
    return exec(cmd).output;
}

function waitForClose() {
	readLn.createInterface(process.stdin, process.stdout)
   	      .question("Press [Enter] to exit.\n", function(){ process.exit();});
}

function writeToOutput(response, body) {
	response.writeHead(200, 
		{
			'Content-Length': body.length,
			'Content-Type': 'application/json' 
		}
	);
	response.write(body);
	response.end();
}

function responseAsJson(response) {
	return JSON.stringify({ "response": response });
}

startServer();
waitForClose();