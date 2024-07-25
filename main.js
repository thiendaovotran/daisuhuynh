import { Client, GatewayIntentBits, Events, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, Collection } from 'discord.js';
import 'dotenv/config';
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on(Events.InteractionCreate, async interaction => {

  const userNickname = interaction.member.nickname;
  const userId = interaction.member.id;

  if (interaction.isChatInputCommand()) {

    if (interaction.commandName === 'ping') {
      await interaction.reply('Pong!');
    }

    if (interaction.commandName === 'dungeon') {
      const registered = new Collection();
      const declined = new Collection();
      let updatedPartyEmbed = new EmbedBuilder();

      const btnDataSet = new Collection();
      btnDataSet.set('btnAccept', { label: 'Tham gia', style: ButtonStyle.Primary });
      btnDataSet.set('btnDecline', { label: 'Từ chối', style: ButtonStyle.Secondary });
      btnDataSet.set('btnDismiss', { label: 'Giải tán', style: ButtonStyle.Danger });

      const partyRow = new ActionRowBuilder();

      btnDataSet.forEach((value, key) => {
        const { label, style } = value;
        partyRow.addComponents(
          new ButtonBuilder()
            .setCustomId(key)
            .setLabel(label)
            .setStyle(style)
        );
      });

      const partyEmbed = new EmbedBuilder()
        .setTitle('Thiên Cơ Mê Thành - Nội Thành')
        .setDescription('Kiếm tóc trắng phiên bản 2.0 anh em ơi')
        .setImage('https://i.ibb.co/SsbCBcC/image.png')
        .setFooter({ text: `Tổ đội được tạo bởi ${userNickname}` });

      const partyMsg = await interaction.reply({
        content: `${userNickname} đã tạo tổ đội mới`,
        components: [partyRow],
        embeds: [partyEmbed],
        fetchReply: true
      });

      const filter = interaction => interaction.customId === 'btnAccept' || interaction.customId === 'btnDecline' || interaction.customId === 'btnDismiss';

      const partyCollector = partyMsg.createMessageComponentCollector({ filter });

      partyCollector.on('collect', async i => {

        const buttonName = i.customId;

        if (buttonName === 'btnAccept') {

          if (registered.has(userId)) {
            i.reply({ content: 'Bạn đã tham gia rồi', ephemeral: true });
            return;
          }

          if (declined.has(userId)) {
            declined.delete(userId);
          }

          registered.set(userId, userNickname);

          updatedPartyEmbed = EmbedBuilder.from(partyEmbed).addFields(
            {
              name: 'Tham gia',
              value: Array.from(registered.values()).join('\n') || 'NaN'
            },
            {
              name: 'Từ chối',
              value: Array.from(declined.values()).join('\n') || 'NaN'
            }
          );

          await i.update({
            content: `${userNickname} đã tham gia tổ đội`,
            components: [partyRow],
            embeds: [updatedPartyEmbed]
          });
        }

        if (buttonName === 'btnDecline') {
          if (registered.has(userId)) {
            registered.delete(userId);
          }
          if (!declined.has(userId)) {
            declined.set(userId, userNickname);
            updatedPartyEmbed = EmbedBuilder.from(partyEmbed).addFields(
              {
                name: 'Tham gia',
                value: Array.from(registered.values()).join('\n') || 'NaN'
              },
              {
                name: 'Từ chối',
                value: Array.from(declined.values()).join('\n') || 'NaN'
              }
            );
            await i.update({
              content: `${i.member.nickname} đã từ chối tổ đội!`,
              components: [partyRow],
              embeds: [updatedPartyEmbed]
            });
          } else {
            i.reply({ content: `${i.member.nickname} ơi bạn đã từ chối rồi`, ephemeral: true });
          }
        }

        if (buttonName === 'btnDismiss') {
          if (i.member.id === userId) {
            await interaction.editReply({
              content: `Tổ đội đã giải tán!`,
              embeds: [updatedPartyEmbed],
              components: []
            })
            i.reply({ content: `${userNickname} đã giải tán tổ đội!` });
          } else {
            i.reply({ content: `${i.member.nickname} ơi bạn không phải đội trưởng của tổ đội này nên bạn không thể giải tán nó được.`, ephemeral: false });
          }
        }

      });

      partyCollector.on('end', async collectedData => {
        console.log(`${collectedData.size} items was collected.`);
        await interaction.editReply({
          content: `Tổ đội đã giải tán!`,
          embeds: [updatedPartyEmbed],
          components: []
        });
      })

    }
  }

  // ACCEPT BUTTON

  // if (interaction.isButton() && interaction.customId === 'btnAccept') {

  //   // Prevent user to continue if user already registered
  //   if (acceptedList.includes(inputUser)) {
  //     await interaction.reply({ content: 'Bạn đã đăng ký tham gia rồi!', ephemeral: true });
  //     return;
  //   }

  //   // Prevent user to continue if registered are full
  //   if (acceptedList.length >= 12) {
  //     await interaction.reply({ content: 'Tổ đội đã đủ người!', ephemeral: true });
  //     return;
  //   }

  //   try {
  //     acceptedList.push(inputUser);
  //     // Remove user to the declinedList if exist
  //     if (declinedList.includes(inputUser)) {
  //       declinedList = declinedList.filter(m => m !== inputUser);
  //     }

  //     const printAccepted = acceptedList.join('\n') || 'NaN';
  //     const printDeclined = declinedList.join('\n') || 'NaN';

  //     const updatedEmbed = EmbedBuilder.from(partyEmbed).addFields(
  //       {
  //         name: "Đã tham gia",
  //         value: printAccepted,
  //         inline: true,
  //       },
  //       {
  //         name: "Đã từ chối",
  //         value: printDeclined,
  //         inline: true,
  //       }
  //     );

  //     await interaction.update({
  //       content: `${inputUser} đã tham gia tổ đội.`,
  //       components: [btnActionRow],
  //       embeds: [updatedEmbed]
  //     });s

  //   }
  //   catch (err) {
  //     await interaction.reply({
  //       content: `Đã có lỗi trong quá trình tham gia tổ đội, hãy cho Thiên Đạo biết nội dung lỗi sau đây nhé:\n${err}`,
  //       ephemeral: true
  //     });
  //   }

  // }

  // Decline button

  // if (interaction.isButton() && interaction.customId === 'btnDecline') {

  //   // Prevent user to continue if user already declined
  //   if (declinedList.includes(inputUser)) {
  //     await interaction.reply({ content: 'Bạn đã từ chối tổ đội lần này!', ephemeral: true });
  //     return;
  //   }

  //   try {
  //     declinedList.push(inputUser);

  //     // Remove user from 
  //     if (acceptedList.includes(inputUser)) {
  //       acceptedList = acceptedList.filter(m => m !== inputUser);
  //     }

  //     const printAccepted = acceptedList.join('\n').toString() || 'NaN';
  //     const printDeclined = declinedList.join('\n').toString() || 'NaN';

  //     const updatedEmbed = EmbedBuilder.from(partyEmbed).addFields(
  //       {
  //         name: "Đã tham gia",
  //         value: printAccepted,
  //         inline: true,
  //       },
  //       {
  //         name: "Đã từ chối",
  //         value: printDeclined,
  //         inline: true,
  //       });

  //     await interaction.update({
  //       content: `${inputUser} đã từ chối tham gia.`,
  //       components: [btnActionRow],
  //       embeds: [updatedEmbed]
  //     });

  //   } catch (err) {
  //     await interaction.reply({
  //       content: `Đã có lỗi trong quá trình tham từ chối, hãy cho Thiên Đạo biết nội dung lỗi sau đây nhé:\n${err}`,
  //       ephemeral: true
  //     });
  //   }
  // }

  // Dismiss button

  // if (interaction.isButton() && interaction.customId === 'btnDismiss') {
  //   if (inputUser !== createdBy) {
  //     await interaction.reply({ content: 'Bạn không phải là đội trưởng, bạn không thể giải tán đội này!', ephemeral: true });
  //   } else {
  //     acceptedList = [];
  //     declinedList = [];
  //     onGoing = false;
  //     createdBy = '';
  //     await interaction.update({
  //       content: `${interaction.member.nickname} đã giải tán đội ngũ.`,
  //       components: [],
  //       embeds: []
  //     })
  //   }
  // }

});

client.login(process.env.APP_TOKEN);