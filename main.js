import { Client, GatewayIntentBits, Events, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, Collection, Colors } from 'discord.js';
import 'dotenv/config';
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

const maxPartySize = 12;

client.on(Events.InteractionCreate, async interaction => {

  const commandUserNickname = interaction.member.nickname;
  const commandUserId = interaction.member.id;

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
        .setFooter({ text: `Tổ đội được tạo bởi ${commandUserNickname}` });

      try {

        const partyMsg = await interaction.reply({
          content: `${commandUserNickname} đã tạo tổ đội mới`,
          components: [partyRow],
          embeds: [partyEmbed],
          fetchReply: true
        });

        const filter = interaction => interaction.customId === 'btnAccept' || interaction.customId === 'btnDecline' || interaction.customId === 'btnDismiss';

        const partyCollector = partyMsg.createMessageComponentCollector({ filter });

        partyCollector.on('collect', async i => {

          const collectorUserId = i.member.id;
          const collectorUserNickname = i.member.nickname;

          const buttonName = i.customId;

          if (buttonName === 'btnAccept') {

            if (registered.size >= 12) {
              i.reply({ content: `${collectorUserNickname} ơi tổ đội đã đủ người rồi`, ephemeral: true });
              return;
            }

            if (registered.has(collectorUserId)) {
              i.reply({ content: 'Bạn đã tham gia rồi', ephemeral: true });
              return;
            }

            try {

              if (declined.has(collectorUserId)) {
                declined.delete(collectorUserId);
              }

              registered.set(collectorUserId, collectorUserNickname);

              updatedPartyEmbed = EmbedBuilder.from(partyEmbed).addFields(
                {
                  name: `Tham gia (`+ registered.size.toString() +`)`,
                  value: Array.from(registered.values()).join('\n') || 'NaN',
                  inline: true
                },
                {
                  name: `Từ chối (`+ declined.size.toString() +`)`,
                  value: Array.from(declined.values()).join('\n') || 'NaN',
                  inline: true
                }
              );

              await i.update({
                content: `${collectorUserNickname} đã tham gia tổ đội`,
                components: [partyRow],
                embeds: [updatedPartyEmbed]
              });
            } catch (err) {
              console.error(err);
              await i.reply({ content: `Có lỗi xảy ra trong quá trình tham gia tổ đội, copy nội dung bên dưới gửi cho Thiên Đạo nhé, cám ơn ạ!\n${err}`, ephemeral: true });
            }
          }

          if (buttonName === 'btnDecline') {
            if (declined.has(collectorUserId)) {
              i.reply({ content: `${collectorUserNickname} ơi bạn đã từ chối rồi`, ephemeral: true });
            }
            try {
              if (registered.has(collectorUserId)) {
                registered.delete(collectorUserId);
              }
              if (!declined.has(collectorUserId)) {
                declined.set(collectorUserId, collectorUserNickname);
                updatedPartyEmbed = EmbedBuilder.from(partyEmbed).addFields(
                  {
                    name: `Tham gia (`+ registered.size.toString() +`)`,
                    value: Array.from(registered.values()).join('\n') || 'NaN',
                    inline: true
                  },
                  {
                    name: `Từ chối (`+ declined.size.toString() +`)`,
                    value: Array.from(declined.values()).join('\n') || 'NaN',
                    inline: true
                  }
                );
                await i.update({
                  content: `${collectorUserNickname} đã từ chối tổ đội!`,
                  components: [partyRow],
                  embeds: [updatedPartyEmbed]
                });
              }
            }
            catch (err) {
              console.error(err);
              await i.reply({ content: `Có lỗi xảy ra trong quá trình từ chối tổ đội, copy nội dung bên dưới gửi cho Thiên Đạo nhé, cám ơn ạ!\n${err}`, ephemeral: true });
            }
          }

          if (buttonName === 'btnDismiss') {
            if (collectorUserId !== commandUserId) {
              i.reply({ content: `${collectorUserNickname} ơi bạn không phải đội trưởng của tổ đội này nên bạn không thể giải tán nó được.`, ephemeral: true });
              return;
            }

            try {
              await interaction.delete({
                content: `Tổ đội đã giải tán!`,
                embeds: [updatedPartyEmbed],
                components: []
              });
              i.reply({ content: `${collectorUserNickname} đã giải tán tổ đội!`, embeds: [updatedPartyEmbed], components: []});
            } catch (err) {
              console.error(err);
              await i.reply({ content: `Có lỗi xảy ra trong quá trình giải tán tổ đội, copy nội dung bên dưới gửi cho Thiên Đạo nhé, cám ơn ạ!\n${err}`, ephemeral: true });
            }
          }

        });

        partyCollector.on('end', async collectedData => {
          console.log(`${collectedData.size} items was collected.`);
          try {
            await interaction.editReply({
              content: `Tổ đội đã giải tán!`,
              embeds: [updatedPartyEmbed],
              components: []
            });
          }
          catch (err) {
            await interaction.reply({ content: `Có lỗi xảy ra trong quá trình kết thúc tổ đội, copy nội dung bên dưới gửi cho Thiên Đạo nhé, cám ơn ạ!\n${err}`, ephemeral: true });
          }
        })
      } catch (err) {
        console.error(err);
        await interaction.reply({ content: `Có lỗi xảy ra trong quá trình tạo tổ đội, copy nội dung bên dưới gửi cho Thiên Đạo nhé, cám ơn ạ!\n${err}`, ephemeral: true });
      }



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