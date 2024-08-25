const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, SlashCommandBuilder } = require('discord.js');

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
            placeholder: 'Philadelphia, PA',
            required: true,
            style: TextInputStyle.Short,
        });

        const actionRow = new ActionRowBuilder().addComponents(location);
        modal.addComponents(actionRow);
		await interaction.showModal(modal);

        const filter = (interaction) => interaction.customId === `playlist-${interaction.user.id}`;
        interaction
            .awaitModalSubmit({ filter, time: 30_000})
            .then((modalInteraction) => {
                const locationValue = modalInteraction.fields.getTextInputValue('locationInput');
                modalInteraction.reply(locationValue);
            })
            .catch((err) => {
                console.log(`Error: ${err}`)
            })

	},
};