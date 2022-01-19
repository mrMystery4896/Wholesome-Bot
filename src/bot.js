require("dotenv").config();
const { Client, MessageAttachment } = require("discord.js");
const { getRandomImage } = require("./pixiv");
const cron = require("cron");
const fs = require("fs");

const client = new Client();
const PREFIX = "!";

let rawData = fs.readFileSync("channels.json");
let channels = JSON.parse(rawData);

let scheduledMessage = new cron.CronJob(
	"0 0 7,19 * * *",
	async () => {
		var currentdate = new Date();
		var datetime =
			currentdate.getDate() +
			"/" +
			(currentdate.getMonth() + 1) +
			"/" +
			currentdate.getFullYear() +
			" @ " +
			currentdate.getHours() +
			":" +
			currentdate.getMinutes() +
			":" +
			currentdate.getSeconds();
		console.log("Running scheduler at ", datetime);
		console.log("Normal Channel", channels.normalChannel);
		console.log("nsfw Channel", channels.nsfwChannel);
		if (channels.normalChannel) {
			console.log("Fetching data...");
			let attachment;
			let channel;
			let result = await getRandomImage();
			if (result === "error") return console.log("error");
			//if result is nsfw and there is no nsfw channel, repeat the loop to attempt to find a non-nsfw image
			while (result.nsfw && !channels.nsfwChannel) {
				result = await getRandomImage();
			}
			if (result.nsfw) {
				channel = await client.channels.fetch(channels.nsfwChannel);
			} else {
				channel = await client.channels.fetch(channels.normalChannel);
			}
			channel.send("Here is your daily dose your wholesomeness ~UwU~");
			result.images.forEach((img) => {
				const sfbuff = new Buffer.from(img, "base64");
				attachment = new MessageAttachment(sfbuff, "image.jpg");
				channel.send(attachment);
			});
			console.log("Image Sent");
		}
	},
	null,
	false,
	"Asia/Kuala_Lumpur"
);
scheduledMessage.start();

client.on("message", async (message) => {
	if (message.author.bot) {
		return;
	}
	if (message.content.startsWith(PREFIX)) {
		const [CMD_NAME, ...args] = message.content.trim().substring(PREFIX.length).split(/\s+/);
		switch (CMD_NAME) {
			case "set": {
				if (args.length === 0)
					return message.channel.send(
						"Invalid parameters. Please provide either normal or nsfw after the command"
					);
				const channelType = args[0];
				if (channelType === "normal") {
					channels.normalChannel = message.channel.id;
					message.channel.send("This channel has been set to the normal channel");
					let data = JSON.stringify(channels);
					fs.writeFileSync("channels.json", data);
					console.log(message.channel.id, message.channel.name);
				} else if (channelType === "nsfw") {
					channels.nsfwChannel = message.channel.id;
					let data = JSON.stringify(channels);
					fs.writeFileSync("channels.json", data);
					message.channel.send("This channel has been set to the nsfw channel");
				} else {
					message.channel.send("Invalid channel type. Please specify if it is normal or nsfw");
				}
				break;
			}

			case "github": {
				message.channel.send(
					"Here's a link to the GitHub repository: https://github.com/mrMystery4896/Wholesome-Bot"
				);
				break;
			}

			case "help": {
				message.channel.send(
					"```!set (normal/nsfw): set the current channel to post images here. Nsfw pictures will be posted to nsfw channel.\n!github: get the GitHub link to the repository\n!help: display this message.```"
				);
				break;
			}

			default: {
				message.channel.send("This is an invalid command!");
				break;
			}
		}
	}
});

client.login(process.env.BOT_TOKEN);
