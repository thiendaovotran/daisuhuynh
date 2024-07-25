import { REST, Routes } from 'discord.js';
import 'dotenv/config';

const commands = [
  {
    name: 'ping',
    description: 'Replies with Pong!',
  },
  {
    name: 'dungeon',
    description: 'Create dungeon party!'
  }
];

const rest = new REST({ version: '10' }).setToken(process.env.APP_TOKEN);

try {
  console.log('Started refreshing application (/) commands.');

  await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands });

  console.log('Successfully reloaded application (/) commands.');
} catch (error) {
  console.error(error);
}