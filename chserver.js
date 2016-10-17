//var num=[[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0]];
var players=2;
var ch=0;
var player=[['player1','red'],['player2','green']];
var express=require('express');
var app=express();
port=process.env.PORT ||3000;
//port=443;
app.use(express.static(__dirname));
app.get("/",function(req,res){
	res.render("index.html");
})
var webSocketServer=require("websocket").server;
var server= require("http").createServer(app);
server.on("connection",function(socket){
	console.log("connection from: ",socket.address().address);});
var ws=new webSocketServer({
	httpServer :server,
	autoAcceptConnections: true
	});
console.log(port);
server.listen(port);

var clients=[];
ws.on("connect" , connectHandler);
function connectHandler(conn){
	conn.nickname=conn.remoteAddress;
	conn.on("message", messageHandler);
	conn.on("close", closeHandler);
	if(clients.length<players)
		{clients.push(conn);
		console.log(conn.nickname + "entered the game");}
	else
		{console.log("overlimit");
		closeHandler();
		}

}

function broadcast(data){
	clients.forEach(function(client){
		client.sendUTF(data);
	});
}
function closeHandler(){
	var index=clients.indexOf(this);
	if(index>-1){
		clients.splice(index,1);
	}
		console.log(this.nickname + "left the game");
		var logsd=">>>"+this.nickname + " left the game";
		broadcast(JSON.stringify(['logsContent',logsd,'red']));
		broadcast(JSON.stringify(['popups',this.nickname+" left game",'red']));
}

function messageHandler(message){
	var data=JSON.parse(message.utf8Data);
	if(data[0]=='initializePlayer'){
		initializePlayer(data[1],this);
	}
	else if (data[0]=='onclicked') {
		onclicked(data);
	}
	else if (data[0]=='reinit') {
		ch=0;
	}
	console.log(this.nickname +"  "+data);
	if(clients.length>=2)
		gameloop();
}

function gameloop(){
	if(ch==1) ch=2;
	else ch=1;
	clients.forEach(function(client){
		if(client.nickname==clients[ch-1].nickname){
				client.sendUTF(JSON.stringify(['updateui','auto',player[ch-1][0],player[ch-1][1]]));
		}
		else {
				client.sendUTF(JSON.stringify(['updateui','none',player[ch-1][0],player[ch-1][1]]));
		}
	});
}
function initializePlayer(name,conn){
	conn.nickname=name;
	if(clients.length==1){
		player[0][0]=clients[0].nickname;
		broadcast(JSON.stringify(['logsContent','>>>'+player[0][0]+" entered game",'blue']));
		broadcast(JSON.stringify(['popups',player[0][0]+" entered game",'blue']));
	}
	if(clients.length==2){
		player[1][0]=clients[1].nickname;
		broadcast(JSON.stringify(['logsContent','>>>'+player[1][0]+" entered game",'blue']));
		broadcast(JSON.stringify(['popups',player[1][0]+" entered game",'blue']));
		ch=1;
		broadcast(JSON.stringify(['initializePlayer',player]));
		broadcast(JSON.stringify(['logsContent','>>>'+'GAME STARTED','green']));
	}
}

var onclicked=function(msg){
	msg[0]='initiate';
	msg=JSON.stringify(msg);
	broadcast(msg);
}
