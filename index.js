const { login, commands, refreshSlashCommands } = require('./config.js');
const { queues } = require('./controllers/music.js');
const dotenv = require('dotenv');

dotenv.config();


async function main() {
  queues.clear();

  const client = await login();

  // await refreshSlashCommands(client);


  client.on('interactionCreate', async interaction => {
    if(!interaction.isCommand()) return;
  
    // console.log(interaction);
    // console.log(interaction.options);
  
    const cmd = interaction.commandName;
  
    commands.forEach(command => {
      if(command.name === cmd || command.aliases.indexOf(cmd) > -1) {
        command.execute(interaction, async msg => {
          await interaction.reply(msg);
        });
      }
    });
  });
}



main();