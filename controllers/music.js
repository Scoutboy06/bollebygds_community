
const ytdl = require('ytdl-core-discord');

const {
	getVoiceConnection,
	createAudioPlayer,
	AudioPlayerStatus,
	NoSubscriberBehavior,
	createAudioResource,
} = require('@discordjs/voice');


const queues = new Map();
// guildId: [
// 	{
// 		url: String,
// 		songTitle: String,
// 		duration: Number,
// 		author: String,
// 		requestedBy: 'user tag (Scoutboy06#3524)'
// 	}
// ]




async function addSongToQueue({ url, connection, guildId, member }) {

	const songMeta = await ytdl.getBasicInfo(url);
	const { title, ownerChannelName, lengthSeconds, thumbnails } = songMeta.videoDetails;
	
	// console.log(songMeta);
	// console.log('------------------');
	// console.log(songMeta);
	// console.log(url);
	// console.log(title);
	// console.log(ownerChannelName);
	// console.log(lengthSeconds);
	// console.log(member);
	// console.log(thumbnails);


	const newSongData = {
		url,
		songTitle: title,
		author: ownerChannelName,
		duration: lengthSeconds,
		requestedBy: member,
		thumbnail: thumbnails[0].url,
	};


	const guildHasQueue = queues.has(guildId);
	if(!guildHasQueue) queues.set(guildId, [ newSongData ]);
	else {
		// console.log(newSongData);
		queues.get(guildId).push(newSongData);
	}


	return {
		queue: queues.get(guildId),
		...newSongData,
	}
}




async function autoPlay({ guildId }) {

	const connection = getVoiceConnection(guildId);
	const queue = queues.get(guildId);


	async function play(url) {
		const stream = await ytdl(url, {
			filter: 'audioonly',
			quality: 'highestaudio',
			highWaterMark: 1048576 * 32, // (32 MB)
		});
		const resource = createAudioResource(stream);

		player.play(resource);
	}



	const player = createAudioPlayer({
		behaviors: {
			noSubscriber: NoSubscriberBehavior.Pause,
		},
	});


	player.on(AudioPlayerStatus.Playing, () => {
		console.log('The audio player has started playing!');
	});

	player.on('error', console.error);

	player.on(AudioPlayerStatus.Idle, () => {
		console.log('Audio player is idle');

		queue.shift();

		if(queue.length > 0) play(queue[0].url);
		else {
			queues.delete(guildId);
			connection.destroy();
		}
	});


	await play(queue[0].url);
	connection.subscribe(player);
}



module.exports = {
	addSongToQueue,
	autoPlay,

	queues,
}