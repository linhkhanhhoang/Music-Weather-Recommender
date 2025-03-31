const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
require('dotenv').config({ path: '../.env' });

const FLASK_API_URL = process.env.EC2_URL;
const OPENWEATHERMAP_API_KEY = process.env.OPENWEATHER_API_KEY;
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('playlist')
        .setDescription('Give you a playlist based on your location weather'),
    
    async execute(interaction) {
        const modal = new ModalBuilder()
            .setCustomId(`playlist-${interaction.user.id}`)
            .setTitle('My Playlist');

        const locationInput = new TextInputBuilder()
            .setCustomId('locationInput')
            .setLabel('Your location')
            .setPlaceholder('Philadelphia')
            .setRequired(true)
            .setStyle(TextInputStyle.Short);

        modal.addComponents(new ActionRowBuilder().addComponents(locationInput));
        await interaction.showModal(modal);

        const filter = (i) => i.customId === `playlist-${interaction.user.id}`;
        try {
            const modalInteraction = await interaction.awaitModalSubmit({ filter, time: 30_000 });
            const locationValue = modalInteraction.fields.getTextInputValue('locationInput');

            await modalInteraction.deferReply();

            // Call Flask API to get recommended songs
            let recommendedSongs;
            try {
                const response = await axios.post(FLASK_API_URL, {
                    location: locationValue,
                    api_key: OPENWEATHERMAP_API_KEY
                });
                recommendedSongs = response.data; // Assuming an array of Spotify track IDs
            } catch (error) {
                console.error('Error calling Flask API:', error);
                return await modalInteraction.editReply('Sorry, there was an error getting song recommendations. Please try again later.');
            }

            // Get Spotify access token
            const accessToken = await getSpotifyAccessToken();
            if (!accessToken) {
                return await modalInteraction.editReply('Unable to connect to Spotify. Please try again later.');
            }

            // Fetch song details from Spotify
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`🎵 Weather-based Playlist for ${locationValue}`)
                .setDescription('Here are your recommended songs based on the current weather:')
                .setFooter({ text: 'Generated using OpenWeather & Spotify API' });

            for (let i = 0; i < recommendedSongs.length; i++) {
                const trackId = recommendedSongs[i].split(":")[2]; // Assuming IDs
                const trackData = await getSpotifyTrack(trackId, accessToken);

                if (trackData) {
                    const songName = trackData.name;
                    const artistName = trackData.artists.map(artist => artist.name).join(', ');
                    const albumImage = trackData.album.images[0]?.url || '';
                    
                    embed.addFields({
                        name: `${i + 1}. ${songName} - ${artistName}`,
                        value: `[Listen on Spotify](https://open.spotify.com/track/${trackId})`,
                        inline: false
                    });

                    if (i === 0 && albumImage) embed.setThumbnail(albumImage); // Show album image only for the first song
                }
            }

            await modalInteraction.editReply({ embeds: [embed] });

        } catch (err) {
            console.error('Error processing interaction:', err);
            await interaction.followUp({ content: '⚠️ An error occurred while processing your request.', ephemeral: true });
        }
    }
};

// Function to get Spotify Access Token
async function getSpotifyAccessToken() {
    try {
        const url = 'https://accounts.spotify.com/api/token';
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
        };
        const data = new URLSearchParams({ grant_type: 'client_credentials' });

        const response = await axios.post(url, data, { headers });
        return response.data.access_token;
    } catch (error) {
        console.error('Error getting Spotify access token:', error.response?.data || error.message);
        return null;
    }
}

// Function to fetch track details from Spotify
async function getSpotifyTrack(trackId, accessToken) {
    try {
        const url = `https://api.spotify.com/v1/tracks/${trackId}`;
        const response = await axios.get(url, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching track ${trackId}:`, error.response?.data || error.message);
        return null;
    }
}
