const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Define the command prefix
const prefix = '!';

// Log when the bot is online
client.once('ready', () => {
  console.log('Bot is online!');
});

// Listen for messages
client.on('messageCreate', async message => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'join') {
    if (message.member.voice.channel) {
      const connection = joinVoiceChannel({
        channelId: message.member.voice.channel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
      });

      connection.on(VoiceConnectionStatus.Ready, () => {
        message.channel.send('Joined the voice channel!');
      });

      connection.on(VoiceConnectionStatus.Disconnected, () => {
        connection.destroy();
      });
    } else {
      message.reply('You need to join a voice channel first!');
    }
  } else if (command === 'play') {
    if (!message.member.voice.channel) {
      message.reply('You need to join a voice channel first!');
      return;
    }

    const connection = joinVoiceChannel({
      channelId: message.member.voice.channel.id,
      guildId: message.guild.id,
      adapterCreator: message.guild.voiceAdapterCreator,
    });

    const player = createAudioPlayer();
    if (args.length === 0) {
      message.reply('Please provide a song name or link!');
      return;
    }

    const searchQuery = args.join(' ');
    console.log('Searching for:', searchQuery);

    try {
      const { videos } = await ytSearch(searchQuery);
      console.log('Search Results:', videos); // Debugging line
      if (videos.length === 0) {
        message.reply('No results found!');
        return;
      }

      const song = videos[0];
      console.log('Found song:', song.title);

      const stream = ytdl(song.url, { filter: 'audioonly', quality: 'highestaudio' });
      const resource = createAudioResource(stream);

      player.play(resource);
      connection.subscribe(player);

      player.on(AudioPlayerStatus.Playing, () => {
        message.channel.send(`Now playing: ${song.title}`);
      });

      player.on('error', error => {
        console.error('Player Error:', error);
        message.channel.send('Error playing the song.');
      });

      connection.on(VoiceConnectionStatus.Disconnected, () => {
        connection.destroy();
      });

    } catch (error) {
      console.error('Search Error:', error);
      message.reply('There was an error with the search!');
    }
  } else if (command === 'leave') {
    if (!message.member.voice.channel) {
      message.reply('You need to join a voice channel first!');
      return;
    }

    const connection = joinVoiceChannel({
      channelId: message.member.voice.channel.id,
      guildId: message.guild.id,
      adapterCreator: message.guild.voiceAdapterCreator,
    });

    connection.destroy();
    message.channel.send('Left the voice channel!');
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
