const http = require('http');
const https = require('https');
const Discord = require('discord.js');
const {prefix, token, steamKey} = require('./config.json');
const client = new Discord.Client();
const Gamedig = require('gamedig');
var fs = require('fs');
var SteamWebAPI = require('steamwebapi');
SteamWebAPI.setAPIKey(steamKey);

function finished(err) { // Vypis chyby u zápisu
    if(err) {
        return message.channel.send("Chyba: "+err);
    }
}

function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
      currentDate = Date.now();
    } while (currentDate - date < milliseconds);
  }

const httpAgent = new http.Agent({
    keepAlive: true
});

const httpsAgent = new https.Agent({
    keepAlive: true
});
 
const options = {                   /// Nastavení HTTPS Agenta
    agent: function (_parsedURL) {
        if (_parsedURL.protocol == 'http:') {
            return httpAgent;
        } else {
            return httpsAgent;
        }
    }
}

function checkSteamID(message, ser, player){        // Kontroluje hráče kde jsou připojeni a přepisuje 123
    var dataLoad = fs.readFileSync('triggerList.json');
    var hraci = JSON.parse(dataLoad);
    
    var seznam = "";
    console.log(hraci.enemy[0].name);
    
    for(i in hraci.enemy){
            console.log(seznam);
            seznam = seznam + hraci.enemy[i].steamID + ", ";
    }

        SteamWebAPI.getPlayerSummaries(seznam, function(response){ 
            if (typeof response.error !== 'undefined') {
                console.log(response.error)
            }
            else{
                response.response.players.forEach(guy =>{
                    
                    var test = ser.serverIP+":"+ser.GamePort;

                   console.log(guy.gameserverip + " / " + test);

                   if(guy.gameserverip == (ser.serverIP+":"+ser.GamePort)){
                    var obj = hraci.enemy.find(value => value.steamID == guy.steamid)
                    message.channel.send("| Pozor **" + obj.name + "** na: **" + ser.name + "** |\n everyone");
                   } 
                })

            }  
        });

    
    //console.log
}

async function Denie(message)
{
    const attachment = new Discord.MessageAttachment('https://media.giphy.com/media/1zlj55brLYCYmJqujn/giphy.gif');
    await message.channel.send(attachment);
    await message.channel.send("Kontaktujte Administrátora systému pro použití tohoto příkazu (Jendu)");
    return;
}

function ts(message){       //Vypsání všech lidí na sledovaných serverech
    var dataLoad = fs.readFileSync('serverList.json');
    var servery = JSON.parse(dataLoad);
    var hraci = " ";
    var dataLoad = fs.readFileSync('triggerList.json');
    var players = JSON.parse(dataLoad);// předělání dat na array

    var obj = players.ally.find(value => value.steamID == message.member.user.tag) // Kontrola
    if(obj != undefined){

        if(servery.servers == undefined){
            message.channel.send("**ERROR** 1st add server before using this command");
            return;
        } 
        servery.servers.forEach(ser => {
            vypis(message,ser,hraci)
        })
    }
    else
    {
        Denie(message);
        return;
    };
    
}


function server(message, args){     // vypsání populace daného serveru
    if(args[0] == null){
        message.channel.send("**Error**, syntax for for showing servers: *!server <Player Name>* \n**Example:** *!server superServer*");
    }
    var dataLoad = fs.readFileSync('serverList.json');
    var servery = JSON.parse(dataLoad);
    
    var dataLoad = fs.readFileSync('triggerList.json');
    var players = JSON.parse(dataLoad);// předělání dat na array

    var obj = players.ally.find(value => value.steamID == message.member.user.tag) // Kontrola
    if(obj != undefined){

        if(servery.servers == undefined){
            message.channel.send("**ERROR** 1st add server before using this command");
            return;
        } 
        var chosenOne = servery.servers.find(value => value.name == args[0] );
        
        if(chosenOne == undefined){
            message.channel.send("**Server not found** try: *!slist*");
            return;
        }
        
        vypis(message, chosenOne);
       
    }
    else
    {
        Denie(message);
        return;
    };


    
}

function vypis(message, ser){  ////////////////////////////////////////// Funkce na vypsání hráčů na serveru
    var lister = " ";
    var hraciSeznam = " ";
    Gamedig.query({
        type: 'arkse',
        host: ser.serverIP,
        port: ser.QueryPort
        
    }).then((state) => {

        message.channel.send("\n | **" +state.name  + "** | **("+ state.raw.numplayers + "/" + state.maxplayers + ")** |\n ");

        if (state.raw.numplayers == 0) {
            
            hraciSeznam += "``` Server is Empty ``` ";
            hraciSeznam += ("`>>>` steam://connect/"+ser.serverIP+":"+ser.QueryPort+" `<<<`\n");
            hraciSeznam += "** **";
            message.channel.send(hraciSeznam);
        } 
        else {
            state.players.forEach(player =>{
                
                if(player.name == undefined){
                    hraciSeznam += "```| Joining... | Joining... |```";
                }
                else{
                    var sec = player.time;
                    sec = Math.floor(sec);
                    hours = Math.floor(sec / 3600);
                    sec %= 3600;
                    minutes = Math.floor(sec / 60);
                    seconds = sec % 60;
                    console.log(sec + hours + minutes + seconds); 
                    
                    checkSteamID(message, ser, player);
                    hraciSeznam += ("```| " + player.name + " | " + hours +":"+ minutes + ":"+ seconds +" |```");
                }
            })
            hraciSeznam += ("`>>>` steam://connect/"+ser.serverIP+":"+ser.QueryPort+" `<<<`\n");
            hraciSeznam += "** **";
            message.channel.send(hraciSeznam);
        }

    }).catch((error) => {
        message.channel.send(ser.name+" is offline");
    });
    
}

function cae(args, message){         /// Funkce na přidání hráču na seznam hledaných hráčů
    if(args[0] == null || args[1] == null || args[2] != null){
        message.channel.send("**Error**, syntax for adding tracked players is: *!cae <Player Name> <Player SteamId>* \n**Example:** *!cae JamesBond 007*"
        );
    }
    else{
        var dataLoad = fs.readFileSync('triggerList.json');
        var ennemies = JSON.parse(dataLoad);// předělání dat na array
        
        var obj = ennemies.enemy.find(value => value.name == args[0] )
        if(obj != undefined){
            var index = ennemies.enemy.findIndex(obj => obj.name == args[0]);
            ennemies.enemy.splice(index,1,{name: args[0], steamID: args[1]});

            message.channel.send("| **"+obj.name+"'s player Id was changed**  from: **" + obj.steamID + "** to id: **" + args[1]+ "**");

        }
        else{
            message.channel.send("| **Player: "+args[0] + "** | **Player Id: " + args[1]  + "** | was **added to the list** of enemy players |");
            ennemies.enemy.push(
                {name: args[0], steamID: args[1]}
            );
        }
                
         var data = JSON.stringify(ennemies, null,1);

        fs.writeFile(
            'triggerList.json', 
            data,
            "utf-8", 
            finished);
    }
}

function cre(args, message){         /// Funkce na přidání hráču na seznam hledaných hráčů
    if(args[0] == null || args[1] != null){
        message.channel.send("**Error**, syntax for removing enemy players is: *!cre <Player Name>* \n**Example:** *!cre JamesBond* ");
    }
    else{
        var dataLoad = fs.readFileSync('triggerList.json');
        var ennemies = JSON.parse(dataLoad);// předělání dat na array
        
        if(ennemies.enemy.find(value => value.name == args[0] ) == undefined){
            message.channel.send("Player was **not found** try *!plist* to see all enemy players");
            return;
        } 
        else{
            var index = ennemies.enemy.findIndex(obj => obj.name == args[0]);
            ennemies.enemy.splice(index,1);
            message.channel.send("| Player: **" + args[0] + "** was **removed** from the list of enemy players | ");
        }

        var data = JSON.stringify(ennemies, null, 2);

        fs.writeFile(
            'triggerList.json', 
            data,
            "utf-8", 
            finished);
    }
}

function cas(args, message){         /// Přidání serveru do seznamu serverů
    if(args[0] == null || args[1] == null || args[2] == null || args[3] == null){
        message.channel.send("**Error**, syntax for adding server is: *!cas <Server Name> <Server IP> <Query Port> <Game Port>* \n**Example:** *!cas SuperServer 123.94.56.47 20774 7000"
                +"\n Server ip and Q. port can be found if you view info about the server or on battleamtrics, Address format: 109.10.61.109:25200, 7000"
                +"\n **25200** is **port** and **109.10.61.109** is **IP**, **Game port** around 7000 is Game Port ");
    }
    else{
        var dataLoad = fs.readFileSync('serverList.json');
        var server = JSON.parse(dataLoad);// předělání dat na array
        
        var obj = server.servers.find(value => value.name == args[0] )
        if(obj != undefined){
            var index = server.servers.findIndex(obj => obj.name == args[0]);
            server.servers.splice(index,1,{name: args[0], serverIP: args[1], QueryPort: args[2], GamePort: args[3]});

            message.channel.send("| **"+obj.name+"'s Ip and port was changed**  from: **" + obj.serverIP + ":"+ obj.QueryPort +" , "
            + obj.GamePort +"** to: **" + args[1]+ ":"+ args[2] +" , "+ args[3] +"**");

        }
        else{
            message.channel.send("| **Server: "+args[0] + "** | **Server IP: " + args[1]  + "** | **Q. port: " + args[2]  
            +"** | **G. port: " + args[3]  +"** |was **added to the list** of servers |");
            server.servers.push(
                {name: args[0], serverIP: args[1], QueryPort: args[2], GamePort: args[3]}
            );
        }
        var data = JSON.stringify(server, null, 2);

        fs.writeFile(
            'serverList.json', 
            data,
            "utf-8", 
            finished);
    }
}

function crs(args, message){         /// odebrání serveru ze seznamu serverů
    if(args[0] == null){
        message.channel.send("**Error**, syntax for removing server is: *!crs <Server Name>* \n**Example:** *!cas SuperServer*");
    }
    else{
       
        var dataLoad = fs.readFileSync('serverList.json');
        var servery = JSON.parse(dataLoad);// předělání dat na array
        
        if(servery.servers.find(value => value.name == args[0] ) == undefined){
            message.channel.send("server was **not found** try *!plist* to see all enemy players");
            return;
        } 
        else{
            var index = servery.servers.findIndex(obj => obj.name == args[0]);
            servery.servers.splice(index,1);
                message.channel.send("| **"+args[0]+"'s was removed** from server list |");
        }
        
        var data = JSON.stringify(servery, null, 2);

        fs.writeFile(
            'serverList.json', 
            data,
            "utf-8", 
            finished
        );
        
    }
}

function caa(args, message){         /// Funkce na přidání hráču na seznam hledaných hráčů
    if(args[0] == null || args[1] == null || args[2] != null){
        message.channel.send("**Error**, syntax for adding allied players is: *!caa <Player Name> <Player DiscordId>* \n**Example:** *!caa JamesBond Bond#007*");
    }
    else{
        var dataLoad = fs.readFileSync('triggerList.json');
        var players = JSON.parse(dataLoad);// předělání dat na array
        
        var obj = players.ally.find(value => value.name == args[0] ) // Vyhledávání v .JSON Pokud ho tam nenajde, přidá ho do listu
        if(obj != undefined){
            var index = players.ally.findIndex(obj => obj.name == args[0]);    //SteamID = DiscordID
            players.ally.splice(index,1,{name: args[0], steamID: args[1]});

            message.channel.send("| **"+obj.name+"'s player Id was changed**  from: **" + obj.steamID + "** to id: **" + args[1]+ "**");

        }
        else{
            message.channel.send("| **Player: "+args[0] + "** | **Player Id: " + args[1]  + "** | was **added to the list** of allied players |");
            players.ally.push(
                {name: args[0], steamID: args[1]}
            );
        }
                
         var data = JSON.stringify(players, null,1);

        fs.writeFile(
            'triggerList.json', 
            data,
            "utf-8", 
            finished);
    }
}

function cra(args, message){         /// Funkce na přidání hráču na seznam hledaných hráčů
    if(args[0] == null || args[1] != null){
        message.channel.send("**Error**, syntax for removing allied players is: *!cra <Player Name>* \n**Example:** *!cra JamesBond* ");
    }
    else{
        var dataLoad = fs.readFileSync('triggerList.json');
        var ennemies = JSON.parse(dataLoad);// předělání dat na array
        
        if(ennemies.ally.find(value => value.name == args[0] ) == undefined){
            message.channel.send("Player was **not found** try *!plist* to see all allied players");
            return;
        } 
        else{
            var index = ennemies.ally.findIndex(obj => obj.name == args[0]);
            ennemies.ally.splice(index,1);
                message.channel.send("| Player: **" + args[0] + "** was **removed** from the list of allied players | ");
        }

        var data = JSON.stringify(ennemies, null, 2);

        fs.writeFile(
            'triggerList.json', 
            data,
            "utf-8", 
            finished);
    }
}

function pList(message){         /// výpis hráčů

    var dataLoad = fs.readFileSync('triggerList.json');
    var fPlayers = JSON.parse(dataLoad);// předělání na string
    
    message.channel.send("           **Allies**            ");
    fPlayers.ally.forEach(ally => {
        message.channel.send("``` | Player: " + ally.name + " ally ID: " + ally.steamID + " | \n```");
    })
    
    message.channel.send("           **Enemies**            ");
    fPlayers.enemy.forEach(ene => {
        message.channel.send("``` | Player: " + ene.name + " Enemy ID: " + ene.steamID + " | \n```");
    })
}

function sList(message){         /// výpis serverů

    var dataLoad = fs.readFileSync('serverList.json');
    var servery = JSON.parse(dataLoad);// předělání na string
    
    servery.servers.forEach(ser => {
        message.channel.send("``` | Server: " + ser.name + " server IP: " + ser.serverIP + " Query Port: "+ ser.QueryPort + " Game Port: "+ ser.GamePort + " | \n```");
    })

}

function Help(message){
    var prikazi = 
        "```server <nazev> - Vypíše info o serveru``` \n"+ 
        "```ts - (Track Servers) vypíše všechny servery ```\n"+
        "```cae <Nepřitel> <SteamID> - Přidání nepřítele```\n"+
        "```cre <Nepřitel> - odebere nepřítele ze seznamu``` \n" +
        "```caa <Spojenec> - <DiscordID> - přidá spojence (Člověk co může používat bota)```\n" +
        "```cra <Spojenec> - odebere spojence (Člověk co může používat bota)```\n" +
        "```plist - vypsání seznamu hráčů```\n" +
        "```slist - vypsání seznamu sledovaných serverů```\n"
    
    message.channel.send(prikazi);
    
}

client.once('ready', () => {
    console.log('Ready!');
   
});

client.on('message', message => {
	if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).split(' ');
    const command = args.shift().toLowerCase();
     

    switch(command) {
        case 'server':
            server(message, args);
        break;

        case 'ts':        // Vypsání Hlídaných serverů
            ts(message);
        break;
        
        case ("cae"):   // přidání enemy hráču do seznamu
            cae(args, message);     
        break;

        case ("cre"): // Odstranění enemy hráču ze seznamu
           cre(args, message);     
        break;

        case ("caa"):   // přidání ally hráču do seznamu
        if(message.member.user.tag == "Jenda#1429") 
        {
            caa(args, message);
        }
        else 
        {
            Denie(message);
        }
        break;

        case ("cra"): // Odstranění ally hráču ze seznamu
           cra(args, message);     
        break;

        case ("cas"): // Přidání serverů do seznamu
           cas(args, message);     
        break;

        case ("crs"): // odebrání serverů ze seznamu
           crs(args, message); 
        break;

        case ("plist"): // výpis seznamu lidí
            pList(message);
        break;

        case ("slist"): // výpis seznamu serverů
            sList(message);
        break;

        case("tts"):
        var zprava = " ";
        args.forEach(arg => {
            
            zprava += arg;
            zprava += ' ';
        });

        message.channel.send(zprava, {
            tts: true
        });
        break;

        case("ls"):
        client.guilds.cache.forEach( async guild => {
            await message.channel.send("``` " + guild.name + " | " + guild.id + " ```");
            await message.channel.lastMessage.react('🍎')
        });
        break;
        // if(guild.name == DisName)
        // {
        //     message.guild.leave(guild.id)
        // }

        case("help"):
        Help(message);
            break;
        // Just add any case commands if you want to.
     }
});

client.login(token);


/* Všechny kanály, kdeje připojen
client.channels.cache.forEach(channel => {
            console.log(`${channel.name } | ${channel.id} `)
        });
*/


/*var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';
// Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});
bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});
bot.on('message', function (user, userID, channelID, message, evt) {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.substring(0, 1) == '!') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];
       
        args = args.splice(1);
        
        
     }
});*/

