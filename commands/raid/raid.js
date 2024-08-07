const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, Collection, AllowedMentionsTypes } = require('discord.js');

const raidList = [
    { name: 'Thiên Cơ Mê Thành - Ngoại Thành', id: 'tcmt1' },
    { name: 'Thiên Cơ Mê Thành - Nội Thành', id: 'tcmt2' }
];

function getRaidName(raidId) {
    const raid = raidList.filter(e => e.id === raidId);
    return (raid) ? raid[0].name : 'Không tìm thấy phó bản'
}

const availableRoles = ['1151505566510886922', '1125674304621785108', '1159746286258491392'];
// 1151505566510886922 bang chủ
// 1125674304621785108 chấp pháp giả
// 1159746286258491392 đường chủ

const classRoles = ['1125686423996084315', '1125686633254096947', '1125686698844639252',
     '1139479014738755674', '1125685368654676029', '1125686502622507078', '1125686775046754314', '1240969487847653438'];

// 1125686423996084315 tố vấn
// 1125686633254096947 toái mộng
// 1125686698844639252 thần tương
// 1139479014738755674 long ngâm
// 1125685368654676029 thiết y
// 1125686502622507078 huyết hà
// 1125686775046754314 cửu linh
// 1240969487847653438 huyền cơ

const classIcon = new Map();
classIcon.set('1125686775046754314', '1270665633931067492');
classIcon.set('1240969487847653438', '1270665635839348849');
classIcon.set('1125686502622507078', '1270665637986963456');
classIcon.set('1139479014738755674', '1270665639941505146');
classIcon.set('1125686698844639252', '1270665646048415826');
classIcon.set('1125685368654676029', '1270665647776464941');
classIcon.set('1125686633254096947', '1270665641787002991');
classIcon.set('1125686423996084315', '1270665644312105052');
// 1270665633931067492 Cửu Linh
// 1270665635839348849 Huyền Cơ
// 1270665637986963456 Huyết Hà
// 1270665639941505146 Long Ngâm
// 1270665646048415826 Thần Tương
// 1270665647776464941 Thiết Ý
// 1270665641787002991 Toái Mộng
// 1270665644312105052 Tố Vấn

module.exports = {
    data: new SlashCommandBuilder()
        .setName('raid')
        .setDescription('Lệnh dùng để tạo tổ đội!')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Hãy chọn phó bản muốn đi')
                .setRequired(true)
                .addChoices(
                    { name: 'Thiên Cơ Mê Thành (Ngoại Thành)', value: 'tcmt1' },
                    { name: 'Thiên Cơ Mê Thành (Nội Thành)', value: 'tcmt2' }
                )
        )
        .addRoleOption(option=>
            option.setName('role')
                .setDescription('Chọn nhóm (role) mà ngươi muốn tuyển')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('size')
                .setDescription('Đặt giới hạn tổ đội (mặc định là 12)')
        )
    ,
    async execute(interaction) {
        if (!availableRoles.some(roleId => interaction.member.roles.cache.has(roleId))) {
            await interaction.reply({ content: 'Hiện tại chỉ có Bang Chủ, Chấp Pháp Giả hoặc Đường Chủ mới có thể sử dụng lệnh này!', ephemeral: true });
            return;
        }
        const maxPartySize = 12;
        const role = interaction.options.getRole('role');
        const raidName = getRaidName(interaction.options.getString('name'));
        const raidSize = interaction.options.getString('size') || maxPartySize;

        // const commandUserNickname = interaction.member.nickname;
        const commandUserId = interaction.member.id;

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
            .setTitle(raidName)
            .setDescription(`Một tổ đội yêu cầu **${raidSize}** người tham gia phó bản **${raidName}** đã được tạo bởi <@${commandUserId}>. Chư vị trong <@&${role.id}> hãy mau mau nhanh chóng báo danh!`)
            .addFields({  name: 'Lưu ý', value: 'Nếu đã đủ số lượng người tham gia, chư vị sẽ được thêm vào danh sách dự bị để ưu tiên đi lượt thứ hai'})
            .setImage('https://i.ibb.co/SsbCBcC/image.png')
            .setFooter({ text: `Bấm vào các nút bên dưới để tham gia\nChỉ có đội trưởng mới được Giải tán tổ đội`});

        try {
            const partyMsg = await interaction.reply({
                content: `Ta vừa nghe <@${commandUserId}> muốn tạo tổ đội phó bản, chư vị trong <@&${role.id}> hãy mau mau báo danh.`,
                components: [partyRow],
                embeds: [partyEmbed],
                allowedMentions: { roles: [role.id] },
                fetchReply: true
            });

            const filter = interaction => interaction.customId === 'btnAccept' || interaction.customId === 'btnDecline' || interaction.customId === 'btnDismiss';

            const partyCollector = partyMsg.createMessageComponentCollector({ filter });

            partyCollector.on('collect', async i => {

                const collectorUserId = i.member.id;
                const collectorUserNickname = i.member.nickname;
                const collectorUserRoles = i.member.roles.cache.map(role=>role.id);
                // console.log(JSON.stringify(collectorUserRoles, null, 2));
                // console.log(JSON.stringify(classRoles, null, 2));

                const userClassRoleId = collectorUserRoles.filter(e => classRoles.includes(e));
                const userClassIconId = classIcon.get(userClassRoleId[0]);
                const userClassIconName = i.guild.emojis.cache.get(userClassIconId).name;
                
                console.log(JSON.stringify(userClassIconId, null, 2));
                console.log(JSON.stringify(userClassIconName, null, 2));

                const buttonName = i.customId;

                if (buttonName === 'btnAccept') {

                    if (registered.has(collectorUserId) || reserved.has(collectorUserId)) {
                        await i.reply({ content: `Ngươi đã đăng ký tham gia rồi`, ephemeral: true });
                        return;
                    }

                    try {

                        if (declined.has(collectorUserId)) {
                            declined.delete(collectorUserId);
                        }

                        (registered.size >= raidSize) ? reserved.set(collectorUserId, `<:${userClassIconName}:${userClassIconId}> ${collectorUserNickname}`) : registered.set(collectorUserId, `<:${userClassIconName}:${userClassIconId}> ${collectorUserNickname}`);

                        updatedPartyEmbed = EmbedBuilder.from(partyEmbed).addFields(
                            {
                                name: `Tham gia (` + registered.size.toString() + `)`,
                                value: Array.from(registered.values()).join(`\n`) || '...',
                                inline: true
                            },
                            {
                                name: `Dự bị (` + reserved.size.toString() + `)`,
                                value: Array.from(reserved.values()).join('\n') || '...',
                                inline: true
                            },
                            {
                                name: `Từ chối (` + declined.size.toString() + `)`,
                                value: Array.from(declined.values()).join('\n') || '...',
                                inline: false
                            }
                        );

                        const msgContent = (registered.size > raidSize) ? `<@${collectorUserId}> đã tham gia danh sách dự bị` : `<@${collectorUserId}> đã tham gia tổ đội`;

                        await i.update({
                            content: msgContent,
                            components: [partyRow],
                            embeds: [updatedPartyEmbed]
                        });

                    } catch (err) {
                        console.dir(err);
                        await i.reply({ content: `Có lỗi xảy ra trong quá trình tham gia tổ đội, copy nội dung bên dưới gửi cho Thiên Đạo nhé, cám ơn ạ!\n${err}`, ephemeral: true });
                    }
                }

                if (buttonName === 'btnDecline') {
                    if (declined.has(collectorUserId)) {
                        await i.reply({ content: `${collectorUserNickname} ơi ngươi đã từ chối rồi`, ephemeral: true });
                        return;
                    }
                    try {
                        let withdraw = false;
                        let replacement = false;
                        let reservedUserId = '';
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
                                reservedUserId = nextReservedId;
                                registered.set(nextReservedId, nextReservedNickname);
                                //remove reserver from reserved list
                                reserved.delete(nextReservedId);
                                replacement = true;
                            }
                        }
                        declined.set(collectorUserId, `<:${userClassIconName}:${userClassIconId}> ${collectorUserNickname}`);
                        updatedPartyEmbed = EmbedBuilder.from(partyEmbed).addFields(
                            {
                                name: `Tham gia (` + registered.size.toString() + `)`,
                                value: Array.from(registered.values()).join('\n') || '...',
                                inline: true
                            },
                            {
                                name: `Dự bị (` + reserved.size.toString() + `)`,
                                value: Array.from(reserved.values()).join('\n') || '...',
                                inline: true
                            },
                            {
                                name: `Từ chối (` + declined.size.toString() + `)`,
                                value: Array.from(declined.values()).join('\n') || '...',
                                inline: false
                            }
                        );
                        if(!withdraw && !replacement) {
                            const msgContent = `<@${collectorUserId}> đã từ chối tham gia`;
                            await i.update({
                                content: msgContent,
                                components: [partyRow],
                                embeds: [updatedPartyEmbed]
                            });
                        } else {
                            const msgContent = replacement ? `<@${collectorUserId}> đã rút khỏi tổ đội nên <@${reservedUserId}> sẽ vào tổ đội chính!` : `<@${collectorUserId}> đã rút khỏi tổ đội`;
                            await i.update({
                                content: msgContent,
                                components: [partyRow],
                                embeds: [updatedPartyEmbed]
                            });
                        }
                    }
                    catch (err) {
                        console.dir(err);
                        await i.reply({ content: `Có lỗi xảy ra trong quá trình từ chối tổ đội, copy nội dung bên dưới gửi cho Thiên Đạo nhé, cám ơn ạ!\n${err}`, ephemeral: true });
                    }
                }

                if (buttonName === 'btnDismiss') {
                    if (!availableRoles.some(roleId => i.member.roles.cache.has(roleId)) || collectorUserId !== commandUserId) {
                        await i.reply({ content: `${collectorUserNickname} ơi ngươi không phải đội trưởng của tổ đội này nên ngươi không thể giải tán nó được.`, ephemeral: true });
                        return;
                    }
                    if (availableRoles.some(roleId => i.member.roles.cache.has(roleId)) || collectorUserId === commandUserId) {
                        try {
                            if (registered.size == 0 && declined.size == 0 && reserved.size == 0) {
                                await interaction.editReply({ content: `<@${i.member.id}> đã giải tán tổ đội!`, embeds: [partyEmbed], components: [] });
                            } else {
                                await interaction.editReply({ content: `<@${i.member.id}> đã giải tán tổ đội!`, embeds: [updatedPartyEmbed], components: [] });
                            }
                        } catch (err) {
                            console.dir(err);
                            await i.reply({ content: `Có lỗi xảy ra trong quá trình giải tán tổ đội, copy nội dung bên dưới gửi cho Thiên Đạo nhé, cám ơn ạ!\n${err}`, ephemeral: true });
                        }
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
                    })
                }
                catch (err) {
                    console.dir(err);
                    await interaction.reply({ content: `Có lỗi xảy ra trong quá trình kết thúc tổ đội, copy nội dung bên dưới gửi cho Thiên Đạo nhé, cám ơn ạ!\n${err}`, ephemeral: true });
                }
            })
        } catch (err) {
            console.log(err);
            await interaction.reply({ content: `Có lỗi xảy ra trong quá trình tạo tổ đội, copy nội dung bên dưới gửi cho Thiên Đạo nhé, cám ơn ạ!\n${err}`, ephemeral: true });
        }
    },
};