require("dotenv").config();
const PixivApi = require("pixiv-api-client");
const axios = require("axios");

const pixiv = new PixivApi();

process
	.on("unhandledRejection", (error) => {
		console.log("[unhandledRejection]:\n", error);
	})
	.on("uncaughtException", (error) => {
		console.log("[uncaughtException]:\n", error);
		process.exit(0);
	});

async function makeRequest(imgUrl) {
	const config = {
		method: "get",
		url: imgUrl,
		headers: {
			referer: "https://pixiv.net",
		},
		responseType: "arraybuffer",
	};

	const res = await axios(config);
	const imageBase64 = res.data.toString("base64");

	return imageBase64;
}

const getIllustUrl = async (pixivId) => {
	await pixiv.refreshAccessToken(process.env.REFRESH_TOKEN);
	const result = await pixiv.illustDetail(pixivId);
	let value = {
		nsfw: true,
	};
	if (result.illust.x_restrict === 0) {
		value.nsfw = false;
	}
	let imgStr = [];
	if (result.illust.page_count > 1) {
		for (let item of result.illust.meta_pages) {
			imgStr.push(await makeRequest(item.image_urls.original));
		}
	} else {
		imgStr.push(await makeRequest(result.illust.meta_single_page.original_image_url));
	}
	return {
		...value,
		images: imgStr,
	};
};

const getRandomImage = async () => {
	await pixiv.refreshAccessToken(process.env.REFRESH_TOKEN);
	const following = await pixiv.userFollowing(29936626);
	const users = following.user_previews;
	const selectedArtist = users[Math.floor(Math.random() * users.length)];
	const result = await pixiv.userIllusts(selectedArtist.user.id);
	const randomIllust = result.illusts[Math.floor(Math.random() * result.illusts.length)];
	return await getIllustUrl(randomIllust.id);
};

module.exports = { getRandomImage };
