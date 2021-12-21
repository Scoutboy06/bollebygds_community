const ytdl = require('ytdl-core-discord');

const {
	getVoiceConnection,
	createAudioPlayer,
	AudioPlayerStatus,
	NoSubscriberBehavior,
	createAudioResource,
} = require('@discordjs/voice');

const { Spotify } = require('simple-spotify');
const spotify = new Spotify();

const Scraper = require('@yimura/scraper').default;
const youtube = new Scraper();

const queues = new Map();
// guildId: {
// 	queue: [
// 		{
// 			url: String,
// 			songTitle: String,
// 			duration: Number,
// 			author: String,
// 			requestedBy: 'user tag (Scoutboy06#3524)',
//			source: 'spotify' | 'youtube',
// 		}
// 	],
// 	player: AudioPlayer,
//	isPlaying: Boolean,
// }

async function addSongToQueue({ url, guildId, details = false, source }) {
	if (!details) {
		queues.get(guildId).queue.push({ url, source });
		return;
	}

	const newSongData = await getSongMeta(url, source);

	queues.get(guildId).queue.push(newSongData);

	const returnData = {
		queue: queues.get(guildId).queue,
		source,
	};

	if (newSongData) {
		returnData.url = newSongData.url;
		returnData.songTitle = newSongData.songTitle;
		returnData.author = newSongData.author;
		returnData.duration = newSongData.duration;
		returnData.thumbnail = newSongData.thumbnail;
	}

	return returnData;
}

async function autoPlay({ guildId }) {
	const connection = getVoiceConnection(guildId);
	const { queue, player } = queues.get(guildId);

	player.on('error', console.error);

	player.on(AudioPlayerStatus.Idle, () => {
		queues.get(guildId).isPlaying = false;

		queue.shift();

		if (queue.length > 0) playNextSong(guildId);
		else {
			// queues.delete(guildId);
			// player.stop();
			// connection.destroy();
		}
	});

	await playNextSong(guildId);
	connection.subscribe(player);
}

async function playNextSong(guildId) {
	const data = queues.get(guildId);
	const { player, queue } = data;

	// If only has url and not metadata
	if (!queue[0]?.yt_url) {
		queue[0] = await getSongMeta(queue[0].url, queue[0].source);
	}

	const stream = await ytdl(queue[0].yt_url, {
		filter: 'audioonly',
		quality: 'highestaudio',
		highWaterMark: 1048576 * 200, // (200 MB)
	});
	const resource = createAudioResource(stream);

	player.play(resource);

	data.isPlaying = true;

	// Also checking second item in queue
	if (queue[1] && !queue[1]?.yt_url) {
		queue[1] = await getSongMeta(queue[1].url, queue[1].source);
	}
}

async function getSongMeta(url, source) {
	if (source === 'youtube') {
		const songMeta = await ytdl.getBasicInfo(url);
		const { title, ownerChannelName, lengthSeconds, thumbnails } =
			songMeta.videoDetails;

		return {
			yt_url: url,
			url,
			songTitle: title,
			author: ownerChannelName,
			duration: lengthSeconds,
			thumbnail: thumbnails[0].url,
			source,
		};
	} else if (source === 'spotify') {
		const songMeta = await spotify.track(url);

		const { yt_url } = await searchYoutube(
			songMeta.name + ' - ' + songMeta.artists[0].name + ' (Lyrics)'
		);

		return {
			yt_url,
			url,
			songTitle: songMeta.name,
			author: songMeta.artists[0].name,
			duration: Math.round(Number(songMeta.duration_ms) / 1000),
			thumbnail: songMeta.album.images[1].url,
			source,
		};
	}
}

async function searchYoutube(term) {
	const results = await youtube.search(term);

	return {
		yt_url: results.videos[0].link,
	};
}

module.exports = {
	addSongToQueue,
	autoPlay,
	playNextSong,

	queues,
};
