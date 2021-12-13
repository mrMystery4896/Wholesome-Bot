require("dotenv").config();
const { Client, MessageAttachment } = require("discord.js");
const { getRandomImage } = require("./pixiv");
const cron = require("cron");

const client = new Client();
const PREFIX = "!";
let normalChannel;
let nsfwChannel;

let scheduledMessage = new cron.CronJob("01 05 01,13 * * *", async () => {
	if (normalChannel) {
		let attachment;
		let channel;
		let result = await getRandomImage();
		if (result === "error") return message.channel.send("error");
		//if result is nsfw and there is no nsfw channel, repeat the loop to attempt to find a non-nsfw image
		while (result.nsfw && !nsfwChannel) {
			result = await getRandomImage();
			console.log(result.nsfw);
			console.log(nsfwChannel);
		}
		if (result.nsfw) {
			channel = await client.channels.fetch(nsfwChannel);
		} else {
			channel = await client.channels.fetch(normalChannel);
		}
		channel.send("Here is your daily dose your wholesomeness ~UwU~");
		result.images.forEach((img) => {
			const sfbuff = new Buffer.from(img, "base64");
			attachment = new MessageAttachment(sfbuff, "image.jpg");
			channel.send(attachment);
		});
	}
});
scheduledMessage.start();

client.on("message", async (message) => {
	if (message.author.bot) return;
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
					normalChannel = message.channel.id;
					message.channel.send("This channel has been set to the normal channel");
				} else if (channelType === "nsfw") {
					nsfwChannel = message.channel.id;
					message.channel.send("This channel has been set to the nsfw channel");
				} else {
					message.channel.send("Invalid channel type. Please specify if it is normal or nsfw");
				}
				break;
			}

			default:
				break;
		}
	}
});

client.login(process.env.BOT_TOKEN);