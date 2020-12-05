const Discord = require("discord.js")
const fetch = require('node-fetch')


const client = new Discord.Client()
const config = require("./config.json")
const radio = require("./stations.json")

const deleteafter = 20000

const commandcooldown = 2000
const commandRecently = new Set()

const activity = 'MARCEAU 🎵!play🎵'
const acttype = "LISTENING"

client.on("error", (ex) => {
    console.error("ERROR " + ex)
})

if (config.debug) {
client.on('debug', console.log)
}

client.on('unhandledRejection', (reason, promise) => {
  console.log('Rejet non géré à :', reason.stack || reason)
})

client.on("ready", () => {
  console.log(`Le bot a démarré, avec ${client.users.cache.size} utilisateurs, dans ${client.channels.cache.size} canaux de ${client.guilds.cache.size} guildes.`) 
  client.user.setActivity(activity,{type: acttype})
})

client.on("guildCreate", guild => {
  console.log(`Nouvelle guilde rejoint : ${guild.name} (id: ${guild.id}). Cette guilde a ${guild.memberCount} membres !`)
  client.user.setActivity(activity,{type: acttype})
})

client.on("guildDelete", guild => {
  console.log(`J'ai été retiré de : ${guild.name} (id: ${guild.id})`)
  client.user.setActivity(activity,{type: acttype})
})


client.on("message", async message => {
  if(message.author.bot) return
        if(message.content.indexOf(config.prefix) !== 0) return
                if (commandRecently.has(message.author.id)) {
                        message.delete().catch(O_o=>{})
                        message.channel.send(`Ralentir, pas si vite ! Vous allez bientôt entendre ces doux airs ! (RALENTIR : ${commandcooldown/1000}s ) - ${message.author}`)
                        .then(msg => { 
                                msg.delete({ timeout: deleteafter }) 
                        })
                } else {
                        const args = message.content.slice(config.prefix.length).trim().split(/ +/g)
                        const command = args.shift().toLowerCase()

                        if (command === "eval") {
                                if(message.author.id !== config.botOwner) {
                                        // Someone sent a command we recognize but the user is not bot owner. => Do nothing just ignore the command.
                                        return
                                }
                        try {
                                message.delete().catch(O_o=>{})
                                const evalargs = message.content.split(" ").slice(1)
                                const code = evalargs.join(" ")
                                let evaled = eval(code)
                                
                                if (typeof evaled !== "string")
                                    evaled = require("util").inspect(evaled)

                                        message.channel.send(clean(evaled), {code:"xl"})
                                        .then(msg => { 
                                                msg.delete({ timeout: 120000 }) 
                                        })
                                } catch (err) {
                                        message.reply(`\`ERROR\` \`\`\`xl\n${clean(err)}\n\`\`\``)
                                        .then(msg => { 
                                                msg.delete({ timeout: 120000 }) 
                                        })
                        }
  }

  if(command === "ping") {
	message.delete().catch(O_o=>{})
        const m = await message.channel.send("Ping?")
        m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ws.ping)}ms`)
        .then(msg => { 
                msg.delete({ timeout: deleteafter }) 
        })
  }
  
if(command == 'help') {
        const playingEmbed = new Discord.MessageEmbed()
                .setColor('#0099ff')
                .setTitle('MARCEAU - HELP')
                .setURL(config.webURL)
                .setAuthor(client.user.username,config.webURL+config.logoPath,config.webURL)
                .setTimestamp()
                .addField("!help","Cette commande renvoie une liste de commandes !")
                .addField("!invite","Obtenez un lien d'invitation pour m'ajouter à votre serveur !")
                .addField("!stations","En savoir plus sur **MARCEAU**s stations !")
                .addField("!play [station]","Syntonisez votre station préférée ! Il suffit d'écrire !play pour voir les stations !")
                .addField("!stop","En avoir assez ?! Cela oblige le bot à quitter votre canal vocal.")
                .addField("!np [station]","Ce qui est diffusé sur la ou les stations ? Avec cela, vous saurez !")
                .addField("!ping","Gigue sonore? Vérifiez la latence avec ceci!")
                .setFooter(client.user.username, client.user.avatarURL)
        message.delete().catch(O_o=>{})
        message.channel.send(playingEmbed)
        .then(msg => {
                msg.delete({ timeout: deleteafter })
        })
}

if(command == 'stop') {
		if (!message.member.voice.channel) return
                        message.member.voice.channel.leave()
                        message.delete().catch(O_o=>{})
		return
	}

if(command == 'invite') {
        const inviteEmbed = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle('Invitez-moi sur votre serveur')
        .setURL(config.webURL)
        .setAuthor(client.user.username, config.webURL+config.logoPath,config.webURL)
        .setTimestamp()
        .addField("Lien d'invitation :","https://discordapp.com/oauth2/authorize?client_id="+client.user.id+"&scope=bot&permissions=36826432")                                       
        .setFooter(client.user.username, client.user.avatarURL)
        message.react('😍')
        message.react('👏')
        message.react('🕺')
        message.react('🎶')
        message.channel.send(inviteEmbed)
        .then(msg => {
                message.delete({ timeout: deleteafter }).catch(O_o=>{})
                msg.delete({ timeout: deleteafter })
        })
}

  if(command === "play") {
	if (!message.member.voice.channel) { 
		message.delete().catch(O_o=>{})
                message.channel.send('Vous n êtes pas dans un canal vocal, **rejoindre un chat vocal et réessayer !**')
                .then(msg => { 
                        msg.delete({ timeout: deleteafter }) 
                })
	        return
	} else {
                const searchStation = args.join(" ").toLowerCase()
                let url
                let radiostation
                let streamurl
                let channel_id
                let found=false
                
                        Object.keys(radio).forEach(function(stn) {
                        if (radio[stn].alias.includes(searchStation)) {
                                url = config.webURL + stn
                                radiostation = radio[stn].name
                                streamurl = radio[stn].streamurl
                                channel_id = radio[stn].channel_id
                                found=true
                        }
                })
        
                if (found) {
                        let now = new Date(new Date().toString().split('GMT')[0]+' UTC').toISOString().split('.')[0]
                        let past = new Date().toISOString().split('T')[0]+'T00:00:00'

                        try {
                        message.member.voice.channel.join()
                        .then(connection => {
                                fetch(config.apiURL+'timeline?channel_id='+channel_id+'&client_id=0&to='+now+'&from='+past+'&limit=1')
                                .then(res => res.json())
                                .then(json => {
                                const playingEmbed = new Discord.MessageEmbed()
                                        .setColor('#0099ff')
                                        .setTitle('Lecture en cours')
                                        .setURL(config.webURL)
                                        .setAuthor(client.user.username,config.webURL+config.logoPath,config.webURL)
                                        .setTimestamp()
                                        .addField(radiostation,url)                                       
                                        .addField("Morceau en cours :",json[0].song.artist_name + " - " + json[0].song.title)
                                        .setImage(config.cdnURL + json[0].song.cover_art)
                                        .setFooter(client.user.username, client.user.avatarURL)
                                message.delete().catch(O_o=>{})
                                message.channel.send(playingEmbed)
                                .then(msg => {
                                        msg.delete({ timeout: deleteafter })
                                })
                        return connection.play(streamurl)
                        })
                        .then(dispatcher => {
                                dispatcher.on('error', console.error)
                        })
                })
        } catch (ex) {
                console.log(ex.stack);
        }
        } else {
                const pEmbed = new Discord.MessageEmbed()
                                .setColor('#0099ff')
                                .setTitle('Écouter la radio')
                                .setURL(config.webURL)
                                .setAuthor(client.user.username,config.webURL+config.logoPath,config.webURL)
                                .setTimestamp()
                                .setDescription("Vous devez sélectionner la chaîne !")
                                .setFooter(client.user.username, client.user.avatarURL)
                        for(var stn in radio) { 
                                stnName = radio[stn].name
                                cmd = "!play " + radio[stn].alias
                                pEmbed.addField('Ecouter ' + stnName,cmd)
                        }
                        message.delete().catch(O_o=>{})
                        message.channel.send(pEmbed)
                        .then(msg => {
                                msg.delete({ timeout: deleteafter })
                        })
                }
        }
  }

if (command === 'stations') {
	fetch(config.apiURL+'channel')
	.then(res => res.json())
	.then(json => {
        var length = json.length

        if (length < 25) {
	const stationsEmbed = new Discord.MessageEmbed()
                .setColor('#0099ff')
                .setTitle('Liste des stations')
                .setURL(config.webURL)
                .setAuthor(client.user.username,config.webURL+config.logoPath,config.webURL)
                .setTimestamp()
                .setFooter(client.user.username, client.user.avatarURL)
                for (var i = 0;i < length; i++) {
                const obj = json[i]
                stationsEmbed.addField(obj.name,obj.description || 'Pas de description disponible.')
                }
                message.delete().catch(O_o=>{})
                message.channel.send(stationsEmbed)
                .then(msg => {
                        msg.delete({ timeout: deleteafter })
                })
        } else {
        	const stationsEmbed = new Discord.MessageEmbed()
                .setColor('#0099ff')
                .setTitle('Liste des stations')
                .setURL(config.webURL)
                .setAuthor(client.user.username,config.webURL+config.logoPath,config.webURL)
                .setTimestamp()
                .setFooter(client.user.username, client.user.avatarURL)
                for (var i = 0;i < 25; i++) {
                const obj = json[i]
                stationsEmbed.addField(obj.name,obj.description || 'Pas de description disponible.')
                }

                const stationsEmbed2 = new Discord.MessageEmbed()
                .setColor('#0099ff')
                .setTitle('Liste des stations')
                .setURL(config.webURL)
                .setAuthor(client.user.username,config.webURL+config.logoPath,config.webURL)
                .setTimestamp()
                .setFooter(client.user.username, client.user.avatarURL)
                for (var i = 25;i < length; i++) {
                const obj2 = json[i]
                stationsEmbed2.addField(obj2.name,obj2.description || 'Pas de description disponible.')
                }

                message.delete().catch(O_o=>{})
                message.channel.send(stationsEmbed)
                .then(msg => {
                        message.channel.send(stationsEmbed2)
                        .then(msg2 => {
                                msg2.delete({ timeout: deleteafter })
                        })
                        msg.delete({ timeout: deleteafter })
                })      
                }
	})
}

if (command === 'np') {
        const searchStation = args.join(" ").toLowerCase()
        let url
        let radiostation
        let streamurl
        let channel_id
        let found=false
        
                Object.keys(radio).forEach(function(stn) {
                if (radio[stn].alias.includes(searchStation)) {
                        url = config.webURL + stn
                        radiostation = radio[stn].name
                        streamurl = radio[stn].streamurl
                        channel_id = radio[stn].channel_id
                        found=true
                }
        })

        if (found) {
                let now = new Date(new Date().toString().split('GMT')[0]+' UTC').toISOString().split('.')[0]
                let past = new Date().toISOString().split('T')[0]+'T00:00:00'

                try {
                fetch(config.apiURL+'timeline?channel_id='+channel_id+'&client_id=0&to='+now+'&from='+past+'&limit=1')
                .then(res => res.json())
                .then(json => {
                const playingEmbed = new Discord.MessageEmbed()
                        .setColor('#0099ff')
                        .setTitle('Lecture en cours')
                        .setURL(config.webURL)
                        .setAuthor(client.user.username,config.webURL+config.logoPath,config.webURL)
                        .setTimestamp()
                        .addField(radiostation,url)                                       
                        .addField("Morceau en cours :",json[0].song.artist_name + " - " + json[0].song.title)
                        .setImage(config.cdnURL + json[0].song.cover_art)
                        .setFooter(client.user.username, client.user.avatarURL)
                message.delete().catch(O_o=>{})
                message.channel.send(playingEmbed)
                .then(msg => {
                        msg.delete({ timeout: deleteafter })
                })
        })
} catch (ex) {
        console.log(ex.stack);
} 
} else {
        fetch(config.apiURL+'channel')
        .then(res => res.json())
        .then(json => {
        var length = json.length

        if (length <25) {
        const npEmbed = new Discord.MessageEmbed()
                .setColor('#0099ff')
                .setTitle('Lecture en cours')
                .setURL(config.webURL)
                .setAuthor(client.user.username,config.webURL+config.logoPath,config.webURL)
                .setTimestamp()
                .setFooter(client.user.username, client.user.avatarURL)
                for (var i = 0;i < length; i++) {
                        const obj = json[i]
                        if (obj.currentsong == null) { 
                                npEmbed.addField(obj.name,'Rien à jouer') 
                        } else {
                                var artist
                        if (obj.currentsong.song.artist_name == null) { 
                                artist = 'pas de nom d artiste' 
                        } else { 
                                artist = obj.currentsong.song.artist_name 
                        }
                        var title
                        if (obj.currentsong.song.title == null) { 
                                title = 'pas de titre de chanson' 
                        } else { 
                                title = obj.currentsong.song.artist_name 
                        }
                        var song = artist + ' - ' + title
                        var artist = (obj.currentsong.song.artist_name ? obj.currentsong.song.artist_name : 'Aucune information sur l artiste.')
                        var title = (obj.currentsong.song.title ? obj.currentsong.song.title : 'Aucun titre de chanson disponible.')
                        npEmbed.addField(obj.name,`${artist} - ${title}`)
                        }
                        message.delete().catch(O_o=>{})
                        message.channel.send(npEmbed)
                        .then(msg => {
                                msg.delete({ timeout: deleteafter })
                        })
                }
        } else {
                const npEmbed = new Discord.MessageEmbed()             
                .setColor('#0099ff')
                .setTitle('Lecture en cours')
                .setURL(config.webURL)
                .setAuthor(client.user.username,config.webURL+config.logoPath,config.webURL)
                .setTimestamp()
                .setFooter(client.user.username, client.user.avatarURL)
                for (var i = 0;i < 25; i++) {
                        const obj = json[i]
                        if (obj.currentsong == null) { 
                                npEmbed.addField(obj.name,'Rien à jouer') 
                        } else {
                                var artist
                        if (obj.currentsong.song.artist_name == null) { 
                                artist = 'pas de nom d artiste' 
                        } else { 
                                artist = obj.currentsong.song.artist_name 
                        }
                        var title
                        if (obj.currentsong.song.title == null) { 
                                title = 'pas de titre de chanson' 
                        } else { 
                                title = obj.currentsong.song.artist_name 
                        }
                        var song = artist + ' - ' + title
                        var artist = (obj.currentsong.song.artist_name ? obj.currentsong.song.artist_name : 'Aucune information sur l artiste.')
                        var title = (obj.currentsong.song.title ? obj.currentsong.song.title : 'Aucun titre de chanson disponible.')
                        npEmbed.addField(obj.name,`${artist} - ${title}`)
                        }
                }
                const npEmbed2 = new Discord.MessageEmbed()
                .setColor('#0099ff')
                .setTitle('Lecture en cours')
                .setURL(config.webURL)
                .setAuthor(client.user.username,config.webURL+config.logoPath,config.webURL)
                .setTimestamp()
                .setFooter(client.user.username, client.user.avatarURL)
                for (var i = 25;i < length; i++) {
                        const obj2 = json[i]
                        if (obj2.currentsong == null) { 
                                npEmbed2.addField(obj2.name,'Nothing playing') 
                        } else {
                                var artist2
                        if (obj2.currentsong.song.artist_name == null) { 
                                artist2 = 'pas de nom d artiste' 
                        } else { 
                                artist2 = obj2.currentsong.song.artist_name 
                        }
                        var title2
                        if (obj2.currentsong.song.title == null) { 
                                title2 = 'pas de titre de chanson' 
                        } else { 
                                title2 = obj2.currentsong.song.artist_name 
                        }
                        var song2 = artist + ' - ' + title
                        var artist2 = (obj2.currentsong.song.artist_name ? obj2.currentsong.song.artist_name : 'Aucune information sur l artiste.')
                        var title2 = (obj2.currentsong.song.title ? obj2.currentsong.song.title : 'Aucun titre de chanson disponible.')
                        npEmbed2.addField(obj2.name,`${artist2} - ${title2}`)
                        }
                }      
	message.delete().catch(O_o=>{})
        message.channel.send(npEmbed)
        .then(msg => {
                message.channel.send(npEmbed2)
                .then(msg2 => {
                        msg2.delete({ timeout: deleteafter })
                })
	        msg.delete({ timeout: deleteafter })
        })
      }

  })
}
}
        commandRecently.add(message.author.id)
        setTimeout(() => {
                commandRecently.delete(message.author.id)
        }, commandcooldown)
    }
})
client.login(config.token)


function clean(text) {
  if (typeof(text) === "string")
    return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203))
  else
      return text
}