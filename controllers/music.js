
const ytdl = require('ytdl-core-discord');

const {
	getVoiceConnection,
	createAudioPlayer,
	AudioPlayerStatus,
	NoSubscriberBehavior,
	createAudioResource,
} = require('@discordjs/voice');


const queues = new Map();
// guildId: {
// 	queue: [
// 		{
// 			url: String,
// 			songTitle: String,
// 			duration: Number,
// 			author: String,
// 			requestedBy: 'user tag (Scoutboy06#3524)'
// 		}
// 	],
// 	player: AudioPlayer,
//	isPlaying: Boolean,
// }




async function addSongToQueue({ url, guildId, details = false }) {

	let newSongData;

	if(details) {
		newSongData = await getSongMeta(url);
	}


	const guildIsInList = queues.has(guildId);
	if(!guildIsInList) queues.set(guildId, url);
	else queues.get(guildId).queue.push(url);


	const returnData = {
		queue: queues.get(guildId).queue,
	};

	if(newSongData) {
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

		if(queue.length > 0) playNextSong(guildId);
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
	if(typeof queue[0] === 'string') {
		queue[0] = await getSongMeta(queue[0]);
	}


	const stream = await ytdl(queue[0].url, {
		filter: 'audioonly',
		quality: 'highestaudio',
		highWaterMark: 1048576 * 200, // (200 MB)
	});
	const resource = createAudioResource(stream);

	player.play(resource);

	data.isPlaying = true;


	// Also checking second item in queue
	if(typeof queue[1] === 'string') {
		queue[1] = await getSongMeta(queue[1]);
	}
}




async function getSongMeta(url) {
	const songMeta = await ytdl.getBasicInfo(url);
	const { title, ownerChannelName, lengthSeconds, thumbnails } = songMeta.videoDetails;

	return {
		url,
		songTitle: title,
		author: ownerChannelName,
		duration: lengthSeconds,
		thumbnail: thumbnails[0].url,
	};
}





module.exports = {
	addSongToQueue,
	autoPlay,
	playNextSong,

	queues,
}