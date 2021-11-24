const createEmbed = require('../embed.js');
const { queues, playNextSong } = require('../controllers/music.js');

const ytdl = require('ytdl-core-discord');

const {
	getVoiceConnection,
} = require('@discordjs/voice');



module.exports = {
	name: 'skip',
	description: 'Skip to the next song',
	options: [
		{
			name: 'number_of_songs',
			description: 'Skip to a specific index in the queue',
			required: false,
		}
	],
	aliases: ['s'],

	async execute(interaction, callback) {
		const { guildId, member, user, options } = interaction;
		const { channel, channelId } = member.voice;

		const connection = getVoiceConnection(guildId);

		if(!connection) {
			const embed = createEmbed({
				type: 'error',
				title: 'Not connected to VC',
				description: 'This bot is currently not connected to a voice channel',
			});

			callback({ embeds: [embed], empheral: true });
			return;
		}



		let { queue, player } = queues.get(guildId);


		const numberOfSongsToSkip = options.get('number_of_songs')?.value;

		if(numberOfSongsToSkip) queue = queue.slice(parseInt(numberOfSongsToSkip));
		else queue.shift();

		queues.get(guildId).queue = queue;


		if(queue.length > 0) playNextSong(guildId);
		else player.stop();
		

		const embed = createEmbed({
			title: `Skipped ${numberOfSongsToSkip ? numberOfSongsToSkip + ' songs' : 'a song'}`,
		});

		callback({ embeds: [embed], empheral: true });
	}
}