const createEmbed = require('../embed.js');
const { addSongToQueue, autoPlay, queues } = require('../controllers/music.js');

const { getVoiceConnection } = require('@discordjs/voice');

const ytdl = require('ytdl-core-discord');
const ytpl = require('ytpl');



module.exports = {
	name: 'play',
	description: 'Play a song from YouTube',
	options: [
		{
			name: 'url',
			description: 'The YouTube url of the song you want to play',
			required: false,
		},
		{
			name: 'playlist_url',
			description: 'The YouTube url of the playlist you want to play',
			required: false,
		},
	],
	// usage: '<url>',
	aliases: ['p'],

	async execute(interaction, callback) {
		const { guildId, member, user, options } = interaction;
		const { channel, channelId } = member.voice;


		if(!(channel && channelId && guildId)) {
			const embed = createEmbed({
				title: 'You\'re not in a VC',
				desctiption: 'You\'re currently not connected to a voice channel',
				type: 'error',
			});

			return callback({ embeds: [embed], empheral: true });
		}


		const connection = getVoiceConnection(guildId);

		if(!connection) {
			const embed = createEmbed({
				type: 'error',
				title: 'Bot not in a VC',
				description: 'This bot is currently not connected to a voice channel',
			});

			return callback({ embeds: [embed], empheral: true });
		}

		// const url = 'https://www.youtube.com/watch?v=i1P-9IspBus';
		const url = options.get('url')?.value;
		const playlistUrl = options.get('playlist_url')?.value;

		if(url) {
			if(!ytdl.validateURL(url)) {
				const embed =  createEmbed({
					type: 'error',
					title: 'Invalid url',
					desc: 'The URL that you sent is not a valid YouTube url.'
				});

				callback({ embeds: [embed], empheral: true });
			}
		
		
			const { queue, songTitle, author, duration, requestedBy, thumbnail } = await addSongToQueue({ url, connection, guildId, member: member.user.tag });
		
			// If the queue's length is 1, then that means that there were no music playing before
			// if(queue.length === 1) autoPlay({ guildId });
			if(!queues.get({ guildId }).isPlaying) autoPlay({ guildId });
		
		
		
			const embed = createEmbed({
				author: {
					name: 'Added to queue',
					icon_url: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp`,
				},
				title: songTitle,
				url,
				thumbnail,
				fields: [
					{
						name: 'Channel',
						value: author,
						inline: true,
					},
					{
						name: 'Song Duration',
						value: secondsToTimestamp(parseInt(duration)),
						inline: true,
					},
				],
			});

			callback({ embeds: [embed], empheral: true });
		}

		else if (playlistUrl) {
			const videos = await ytpl(playlistUrl, { pages: Infinity });
			for(let i = 0; i < videos.items.length; i++) {
				await addSongToQueue({
					url: videos.items[i].url,
					connection,
					guildId,
					member,
				})
			}

			if(!queues.get({ guildId }).isPlaying) autoPlay({ guildId });
		}

		else {}

		
		


		// callback({ embeds: [embed], empheral: false });
	}
}




function secondsToTimestamp(sec) {
	const hours = Math.floor(sec / 60 / 60);
	const minutes = Math.floor(sec / 60) - (hours * 60);
	const seconds = sec - (minutes * 60) - (hours * 60);

	return `${hours > 0 ? hours + ':' : ''}${doubleDigit(minutes)}:${doubleDigit(seconds)}`;
}



function doubleDigit(n) {
	if(n < 10) n = '0' + n;
	return n;
}