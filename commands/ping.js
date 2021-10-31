const createEmbed = require('../embed.js');

module.exports = {
	name: 'ping',
	description: 'Test the bot\'s response time',
	usage: '',
	aliases: [],

	execute(interaction, callback) {
		const embed = createEmbed({
			title: 'Pong!',
			description: `**Latency** : ${Math.abs(Date.now() - interaction.createdTimestamp)}ms\n**API Latency** : ${Math.round(interaction.client.ws.ping)}ms`
		});

		callback({ embeds: [embed], empheral: true });
	}
}