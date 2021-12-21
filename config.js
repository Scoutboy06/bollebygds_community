async function login() {
	return new Promise((resolve, reject) => {
		const { Client, Intents } = require('discord.js');
		const client = new Client({
			intents: [
				Intents.FLAGS.GUILDS,
				'GUILDS',
				'GUILD_MESSAGES',
				'GUILD_VOICE_STATES',
			],
		});
		// const intents = new Intents(32767);
		// const client = new Client({ intents });

		client.on('ready', () => {
			console.log(`Logged in as ${client.user.tag}`);
			client.user.setActivity('/help');
		});

		client.login(process.env.DISCORD_TOKEN);

		resolve(client);
	});
}

const commands = (function () {
	const cmd = new Map();
	const fs = require('fs');
	const commandFiles = fs
		.readdirSync('./commands')
		.filter(file => file.endsWith('.js'));

	for (const file of commandFiles) {
		const command = require(`./commands/${file}`);
		cmd.set(command.name, command);
	}

	return cmd;
})();

async function refreshSlashCommands(client) {
	const { REST } = require('@discordjs/rest');
	const { Routes } = require('discord-api-types/v9');
	const { SlashCommandBuilder } = require('@discordjs/builders');

	const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);

	try {
		console.log('Started refreshing application (/) commands.');

		const commandList = [];
		for (const [mapKey, command] of commands) {
			const data = new SlashCommandBuilder()
				.setName(command.name)
				.setDescription(command.description || command.desc);

			if (command.options) {
				command.options.forEach(({ name, description, required }) => {
					data.addStringOption(option =>
						option
							.setName(name)
							.setDescription(description)
							.setRequired(required)
					);
				});
			}

			commandList.push(data.toJSON());
		}

		await rest.put(
			Routes.applicationGuildCommands(
				process.env.DISCORD_CLIENT_ID,
				process.env.COMMUNITY_SERVER_ID
			),
			{ body: commandList }
		);

		console.log('Successfully reloaded application (/) commands.');
	} catch (err) {
		console.error(err);
	}
}

module.exports = {
	login,
	commands,
	refreshSlashCommands,
};
