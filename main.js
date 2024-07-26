import { Client, GatewayIntentBits, Events, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, Collection, Colors } from 'discord.js';
import 'dotenv/config';
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

const maxPartySize = 2;

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
      const reserved = new Collection();
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

            if (registered.has(collectorUserId) || reserved.has(collectorUserId)) {
              await i.reply({ content: 'Bạn đã đăng ký tham gia rồi', ephemeral: true });
              return;
            }

            try {

              if (declined.has(collectorUserId)) {
                declined.delete(collectorUserId);
              }

              (registered.size >= maxPartySize) ? reserved.set(collectorUserId, collectorUserNickname) : registered.set(collectorUserId, collectorUserNickname);

              updatedPartyEmbed = EmbedBuilder.from(partyEmbed).addFields(
                {
                  name: `Tham gia (` + registered.size.toString() + `)`,
                  value: Array.from(registered.values()).join('\n') || 'NaN',
                  inline: true
                },
                {
                  name: `Dự bị (` + reserved.size.toString() + `)`,
                  value: Array.from(reserved.values()).join('\n') || 'NaN',
                  inline: true
                },
                {
                  name: `Từ chối (` + declined.size.toString() + `)`,
                  value: Array.from(declined.values()).join('\n') || 'NaN',
                  inline: false
                }
              );

              const msgContent = (registered.size >= maxPartySize) ? `${collectorUserNickname} đã tham gia danh sách dự bị` : `${collectorUserNickname} đã tham gia tổ đội`;

              await i.update({
                content: msgContent,
                components: [partyRow],
                embeds: [updatedPartyEmbed]
              });

            } catch (err) {
              console.log(`Error: ${err}`);
              await i.reply({ content: `Có lỗi xảy ra trong quá trình tham gia tổ đội, copy nội dung bên dưới gửi cho Thiên Đạo nhé, cám ơn ạ!\n${err}`, ephemeral: true });
            }
          }

          if (buttonName === 'btnDecline') {
            if (declined.has(collectorUserId)) {
              await i.reply({ content: `${collectorUserNickname} ơi bạn đã từ chối rồi`, ephemeral: true });
              return;
            }
            try {
              let withdraw = false;
              let replacement = false;
              if (reserved.has(collectorUserId)) {
                reserved.delete(collectorUserId);
              }
              if (registered.has(collectorUserId)) {
                //remove user from register value
                registered.delete(collectorUserId);
                withdraw = true;

                if (reserved.size != 0) {
                  //register the next reserver
                  const nextReservedId = reserved.keys().next().value;
                  const nextReservedNickname = reserved.values().next().value;
                  registered.set(nextReservedId, nextReservedNickname);
                  //remove reserver from reserved list
                  reserved.delete(nextReservedId);
                  replacement = true;
                }
              }
              declined.set(collectorUserId, collectorUserNickname);
              updatedPartyEmbed = EmbedBuilder.from(partyEmbed).addFields(
                {
                  name: `Tham gia (` + registered.size.toString() + `)`,
                  value: Array.from(registered.values()).join('\n') || 'NaN',
                  inline: true
                },
                {
                  name: `Dự bị (` + reserved.size.toString() + `)`,
                  value: Array.from(reserved.values()).join('\n') || 'NaN',
                  inline: true
                },
                {
                  name: `Từ chối (` + declined.size.toString() + `)`,
                  value: Array.from(declined.values()).join('\n') || 'NaN',
                  inline: false
                }
              );
              const msgContent = `${collectorUserNickname} ${replacement
                  ? 'đã rút khỏi tổ đội nên một thành viên dự bị đã đăng ký sớm nhất sẽ được vào tổ đội chính!'
                  : withdraw
                    ? 'đã rút khỏi tổ đội!'
                    : 'đã từ chối tổ đội!'
                }`;
              await i.update({
                content: msgContent,
                components: [partyRow],
                embeds: [updatedPartyEmbed]
              });
            }
            catch (err) {
              console.log(`Error: ${err}`);
              await i.reply({ content: `Có lỗi xảy ra trong quá trình từ chối tổ đội, copy nội dung bên dưới gửi cho Thiên Đạo nhé, cám ơn ạ!\n${err}`, ephemeral: true });
            }
          }

          if (buttonName === 'btnDismiss') {
            if (collectorUserId !== commandUserId) {
              await i.reply({ content: `${collectorUserNickname} ơi bạn không phải đội trưởng của tổ đội này nên bạn không thể giải tán nó được.`, ephemeral: true });
              return;
            }

            try {
              await interaction.editReply({ content: `Tổ đội đã giải tán!`, embeds: [updatedPartyEmbed], components: [] });
              await i.reply({ content: `${collectorUserNickname} đã giải tán tổ đội!`});
            } catch (err) {
              console.log(`Error: ${err}`);
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
            console.log(`Error: ${err}`);
            await interaction.reply({ content: `Có lỗi xảy ra trong quá trình kết thúc tổ đội, copy nội dung bên dưới gửi cho Thiên Đạo nhé, cám ơn ạ!\n${err}`, ephemeral: true });
          }
        })
      } catch (err) {
        console.log(`Error: ${err}`);
        await interaction.reply({ content: `Có lỗi xảy ra trong quá trình tạo tổ đội, copy nội dung bên dưới gửi cho Thiên Đạo nhé, cám ơn ạ!\n${err}`, ephemeral: true });
      }
    }
    // end dungeon command
  }
});

client.login(process.env.APP_TOKEN);