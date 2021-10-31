const createEmbed = require('../embed.js');

const ytdl = require('ytdl-core-discord');

const {
	createAudioPlayer,
	NoSubscriberBehavior,
	AudioPlayerStatus,
	getVoiceConnection,
	joinVoiceChannel,
} = require('@discordjs/voice');



module.exports = {
	name: 'join',
	description: 'Make the bot join your current voice channel',
	usage: '',
	aliases: ['j'],

	async execute(interaction, callback) {
		const { guildId } = interaction;
		const { channel, channelId } = interaction.member.voice;

		if(channel && channelId && guildId) {

			if(getVoiceConnection(guildId)) {
				const embed = createEmbed({
					type: 'error',
					title: 'Already connected to a VC',
					description: 'This bot is already connected to a voice channel on this server',
				});

				callback({ embeds: [embed], empheral: true });
				return;
			}



			joinVoiceChannel({
				channelId,
				guildId,
				adapterCreator: channel.guild.voiceAdapterCreator,
			});



			const embed = createEmbed({
				title: 'Successfully joined voice channel',
				description: 'Joined ' + channel.name,
			});

			callback({ embeds: [embed], empheral: true });
		}

		else {
			const embed = createEmbed({
				type: 'error',
				title: 'Voice channel not found',
				description: 'You need to be in a voice channel',
			})

			callback({ embeds: [embed], empheral: true });
		}
	}
}