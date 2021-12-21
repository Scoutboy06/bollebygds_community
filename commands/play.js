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

		if (!(channel && channelId && guildId)) {
			const embed = createEmbed({
				title: "You're not in a VC",
				desctiption: "You're currently not connected to a voice channel",
				type: 'error',
			});

			return callback({ embeds: [embed], empheral: true });
		}

		const connection = getVoiceConnection(guildId);

		if (!connection) {
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

		if (url) {
			if (!ytdl.validateURL(url)) {
				const embed = createEmbed({
					type: 'error',
					title: 'Invalid url',
					desc: 'The URL that you sent is not a valid YouTube url.',
				});

				callback({ embeds: [embed], empheral: true });
			}

			const { queue, songTitle, author, duration, thumbnail } =
				await addSongToQueue({
					url,
					guildId,
					member: member.user.tag,
					details: true,
				});

			// If the queue's length is 1, then that means that there were no music playing before
			// if(queue.length === 1) autoPlay({ guildId });
			if (!queues.get(guildId)?.isPlaying) autoPlay({ guildId });

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
		} else if (playlistUrl) {
			const { thumbnails, items, url, estimatedItemCount, title, author } =
				await ytpl(playlistUrl, { pages: Infinity });

			const urls = items.map(vid => vid.url);
			queues.get(guildId).queue.push(...urls);

			if (!queues.get(guildId).isPlaying) autoPlay({ guildId });

			const embed = createEmbed({
				author: {
					name: 'Added to queue',
					icon_url: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp`,
				},
				title,
				url,
				thumbnail:
					thumbnails[2].url || thumbnails[1].url || thumbnails[0].url || '',
				fields: [
					{
						name: 'Creator',
						value: author || 'Unknown',
						inline: true,
					},
					{
						name: 'Number of Songs',
						value: String(estimatedItemCount) || 'null',
						inline: true,
					},
				],
			});

			callback({ embeds: [embed], empheral: false });
		} else {
		}
	},
};

function secondsToTimestamp(sec) {
	const hours = Math.floor(sec / 60 / 60);
	const minutes = Math.floor(sec / 60) - hours * 60;
	const seconds = sec - minutes * 60 - hours * 60;

	return `${hours > 0 ? hours + ':' : ''}${doubleDigit(minutes)}:${doubleDigit(
		seconds
	)}`;
}

function doubleDigit(n) {
	if (n < 10) n = '0' + n;
	return n;
}
