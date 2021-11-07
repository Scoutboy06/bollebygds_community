
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
// }




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


	// const guildHasQueue = queues.get(guildId)?.queue;

	// if(!guildHasQueue) queues.get(guildId).queue = [ newSongData ];
	// else queues.get(guildId).queue.push(newSongData);
	const guildIsInList = queues.has(guildId);
	
	if(!guildIsInList) queues.set(guildId, {
		queue: [ newSongData ],
		// player: null
	});
	else queues.get(guildId).queue.push(newSongData);


	return {
		queue: queues.get(guildId).queue,
		...newSongData,
	}
}




async function autoPlay({ guildId }) {

	const connection = getVoiceConnection(guildId);
	const { queue, player } = queues.get(guildId);



	player.on('error', console.error);

	player.on(AudioPlayerStatus.Idle, () => {
		queue.shift();

		if(queue.length > 0) playSong({ url: queue[0].url, player });
		else {
			queues.delete(guildId);
			player.stop();
			connection.destroy();
		}
	});


	await playSong({ url: queue[0].url, player });
	connection.subscribe(player);
}




async function playSong({ url, player }) {
	const stream = await ytdl(url, {
		filter: 'audioonly',
		quality: 'highestaudio',
		highWaterMark: 1048576 * 32, // (32 MB)
	});
	const resource = createAudioResource(stream);

	player.play(resource);
}





module.exports = {
	addSongToQueue,
	autoPlay,
	playSong,

	queues,
}