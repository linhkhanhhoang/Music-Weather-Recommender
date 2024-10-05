const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const FLASK_API_URL = 'http://127.0.0.1:5000/recommend';
require('dotenv').config({ path: '../.env' });

const OPENWEATHERMAP_API_KEY = process.env.OPENWEATHER_API_KEY;
module.exports = {
    data: new SlashCommandBuilder()
        .setName('playlist')
        .setDescription('Give you a playlist based on your location weather'),
    async execute(interaction) {
        const modal = new ModalBuilder({
            customId: `playlist-${interaction.user.id}`,
            title: 'My Playlist',
        });

        const location = new TextInputBuilder({
            customId: 'locationInput',
            label: 'Your location',
            placeholder: 'Philadelphia',
            required: true,
            style: TextInputStyle.Short,
        });

        const actionRow = new ActionRowBuilder().addComponents(location);
        modal.addComponents(actionRow);
        await interaction.showModal(modal);

        const filter = (i) => i.customId === `playlist-${interaction.user.id}`;
        try {
            const modalInteraction = await interaction.awaitModalSubmit({ filter, time: 30_000 });
            const locationValue = modalInteraction.fields.getTextInputValue('locationInput');

            // Defer the reply to give more time for API processing
            await modalInteraction.deferReply();

            try {
                const response = await axios.post(FLASK_API_URL, {
                    location: locationValue,
                    api_key: OPENWEATHERMAP_API_KEY
                });

                const recommended_songs = response.data;

                // Create an embed for a nicer looking response
                const embed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle(`Weather-based Playlist for ${locationValue}`)
                    .setDescription('Here are your recommended songs based on the current weather:')

                // Add recommended songs to the embed
                let songList = '';
                for (let i = 0; i < recommended_songs.length; i++) {
                    songList += `${i + 1}. ${recommended_songs[i]}\n`;
                    // Discord has a limit of 1024 characters per field
                    if (songList.length > 900 || i === recommended_songs.length - 1) {
                        embed.addFields({ name: 'Recommended Songs', value: songList });
                        songList = '';
                    }
                }

                // Send the embed as a reply
                await modalInteraction.editReply({ embeds: [embed] });

            } catch (error) {
                console.error('Error calling Flask API:', error);
                await modalInteraction.editReply('Sorry, there was an error getting song recommendations. Please try again later.');
            }

        } catch (err) {
            console.log(`Error: ${err}`);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'Sorry, there was an error processing your request.', ephemeral: true });
            } else {
                await interaction.reply({ content: 'Sorry, there was an error processing your request.', ephemeral: true });
            }
        }
    },
};