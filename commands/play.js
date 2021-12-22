const createEmbed = require('../embed.js');
const { addSongToQueue, autoPlay, queues } = require('../controllers/music.js');

const { getVoiceConnection } = require('@discordjs/voice');

const { Spotify } = require('simple-spotify');
const spotify = new Spotify();
const ytpl = require('ytpl');

module.exports = {
	name: 'play',
	description: 'Play a song from YouTube',
	options: [
		{
			name: 'url',
			description: 'The url of the YouTube or Spotify song you want to play',
			required: false,
		},
		{
			name: 'playlist_url',
			description:
				'The url of the YouTube or Spotify playlist you want to play',
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

		const url = options.get('url')?.value;
		const playlistUrl = options.get('playlist_url')?.value;

		if (url) {
			const spotifySongRegex = new RegExp(
				'https://open.spotify.com/track/(?:[0-9a-z]+).*',
				'gi'
			);

			const youtubeSongRegex = new RegExp(
				'https://(?:www.)?(?:music.)?youtube.com/watch?.*',
				'gi'
			);

			if (url.match(spotifySongRegex) || url.match(youtubeSongRegex)) {
				const source = url.match(spotifySongRegex) ? 'spotify' : 'youtube';

				const { songTitle, author, duration, thumbnail } = await addSongToQueue(
					{
						url,
						guildId,
						member: member.user.tag,
						details: true,
						source: source,
					}
				);

				// If the queue's length is 1, then that means that there were no music playing before
				// if(queue.length === 1) autoPlay({ guildId });
				if (!queues.get(guildId).isPlaying) autoPlay({ guildId });

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
						{
							name: 'Source',
							value: source,
							inline: true,
						},
					],
				});

				callback({ embeds: [embed], empheral: true });
			} else {
				const embed = createEmbed({
					type: 'error',
					title: 'Invalid url',
					desc: 'The URL that you sent is not a valid song url.',
				});

				callback({ embeds: [embed], empheral: true });
			}
		} else if (playlistUrl) {
			const spotifyPlaylistRegex = new RegExp(
				'(?:https://)?open.spotify.com/playlist/.*',
				'gi'
			);
			const youtubePlaylistRegex = new RegExp(
				'(?:https://)?(?:www.)?(?:music.)?youtube.com/watch.*(list=[0-9a-z_-]+).*',
				'gi'
			);

			let data;

			if (playlistUrl.match(youtubePlaylistRegex)) {
				const source = 'youtube';

				const { thumbnails, items, url, estimatedItemCount, title, author } =
					await ytpl(playlistUrl, { pages: Infinity });

				const urls = items.map(vid => ({ url: vid.url, source }));
				queues.get(guildId).queue.push(...urls);

				data = {
					thumbnails,
					thumbnail:
						data.thumbnails[2].url ||
						data.thumbnails[1].url ||
						data.thumbnails[0].url,
					items,
					// url,
					url: playlistUrl,
					totalSongs: estimatedItemCount,
					title,
					author,
					source,
				};
			} else if (playlistUrl.match(spotifyPlaylistRegex)) {
				const source = 'spotify';

				const {
					images,
					name,
					owner,
					tracks: { items, total },
				} = await spotify.playlist(playlistUrl);

				console.log(items[0]);
				console.log(items[0].track);
				console.log(items[0].track.id);

				const urls = items.map(song => ({ url: song.track.id, source }));
				queues.get(guildId).queue.push(...urls);

				data = {
					thumbnails: images,
					thumbnail: images[0].url,
					items,
					url: playlistUrl,
					totalSongs: total,
					title: name,
					author: owner.display_name,
					source,
				};
			}

			if (!queues.get(guildId).isPlaying) autoPlay({ guildId });

			const embed = createEmbed({
				author: {
					name: 'Added to queue',
					icon_url: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp`,
				},
				title: data.title,
				url: data.url,
				thumbnail: data.thumbnail,
				fields: [
					{
						name: 'Creator',
						value: data.author || 'Unknown',
						inline: true,
					},
					{
						name: 'Number of Songs',
						value: String(data.totalSongs) || 'null',
						inline: true,
					},
					{
						name: 'Source',
						value: data.source == 'youtube' ? 'YouTube' : 'Spotify',
						inline: true,
					},
				],
			});

			callback({ embeds: [embed], empheral: false });
		} else {
			const embed = createEmbed({
				type: 'error',
				title: 'No argument specified',
				desc: "You need to select either 'url' or 'playlist_url' as an argument",
			});

			callback({ embeds: [embed], empheral: true });
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
