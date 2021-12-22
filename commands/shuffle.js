const createEmbed = require('../embed.js');

const { queues } = require('../controllers/music.js');

const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
	name: 'shuffle',
	description: 'Shuffle the current queue',
	// options: [],
	aliases: [],

	async execute(interaction, callback) {
		const { guildId, member, user, options } = interaction;
		const { channel, channelId } = member.voice;
		const connection = getVoiceConnection(guildId);

		if (!(channel && channelId && guildId)) {
			const embed = createEmbed({
				title: "You're not in a VC",
				desctiption: "You're currently not connected to a voice channel",
				type: 'error',
			});

			return callback({ embeds: [embed], empheral: true });
		} else if (!connection || !queues.has(guildId)) {
			const embed = createEmbed({
				type: 'error',
				title: 'Bot not in a VC',
				description: 'This bot is currently not connected to a voice channel',
			});

			return callback({ embeds: [embed], empheral: true });
		} else if (!queues.get(guildId).queue.length > 1) {
			const embed = createEmbed({
				type: 'error',
				title: 'Queue too short',
				desc:
					'The queue only has ' + queues.get(guildId).queue.length + ' songs',
			});

			return callback({ embeds: [embed], empheral: true });
		}

		queues.get(guildId).queue = shuffleArray(queues.get(guildId).queue);

		const embed = createEmbed({
			type: 'success',
			title: 'Successfully shuffled queue',
			desc: 'Shuffled ' + queues.get(guildId).queue.length + ' songs',
		});

		callback({ embeds: [embed], empheral: false });
	},
};

function shuffleArray(arr) {
	return arr.sort(() => Math.random() - 0.5);
}
