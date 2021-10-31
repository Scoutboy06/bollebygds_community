const createEmbed = require('../embed.js');

const { getVoiceConnection } = require('@discordjs/voice');



module.exports = {
	name: 'leave',
	description: 'Leave the current voice channel',
	usage: '',
	aliases: [''],

	execute(interaction, callback) {
		const connection = getVoiceConnection(interaction.guildId);

		if(connection) {
			try {
				connection.destroy();

				const embed = createEmbed({
					title: 'Successfully left voice channel',
					description: 'Disconnected from ' + interaction.member.voice.channel.name,
				});
	
				callback({ embeds: [embed], empheral: true });
			}

			catch(err) {
				console.error(err);
			}
		}

		else {
			const embed = createEmbed({
				type: 'error',
				title: 'Not in a VC',
				description: 'This bot is currently not connected to a voice channel'
			});

			callback({ embeds: [embed], empheral: true });
		}
	}
}