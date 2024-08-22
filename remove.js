const { REST, Routes } = require('discord.js');
require('dotenv').config();

const rest = new REST({ version: '10' }).setToken(process.env.APP_TOKEN);


rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: [] })
    .then(() => console.log('Successfully deleted all global application commands.'))
    .catch(console.error);

rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: [] })
    .then(() => console.log('Successfully deleted all guild commands.'))
    .catch(console.error);

