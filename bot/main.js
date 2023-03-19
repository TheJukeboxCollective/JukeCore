const print = console.log
const fs = require('node:fs')

const token = process.env['token']
const GUILD_ID = process.env['guild']
const CLIENT_ID = process.env['client']

const WELCOME_CHANNEL = process.env['wchl']
const INFO_CHANNEL = process.env['ichl']
const WELCOME_EMOJI = process.env['emoji_w']

const PC_CHANNEL = process.env['pc_chl']
const PC_TOKEN_ROLE = process.env['pc_role']
const JUKER_ROLE = process.env['juker_role']
const ROLES_CHANNEL = process.env['rchl']

const SUPER_JUKER_ROLE = process.env['super_juker_role']
const BOXEE_ROLE = process.env['boxee_role']
const JUKEBOXER_ROLE = process.env['jukeboxer_role']
const ARCHJUKER_ROLE = process.env['archjuker_role']

const REACT_CHL = process.env['react_chl']
const REACT_MSG = process.env['react_msg']
const MUSICIAN_ROLE = process.env['musi_role']
const SUBSCRIBER_ROLE = process.env['sub_role']

const {MemberDB, ChannelDB} = require("../jukedb.js")

const { REST } = require('@discordjs/rest')
const { Routes } = require('discord-api-types/v9')

const { ChatInputCommandInteraction, Collection, Events } = require('discord.js')

module.exports = client => {
    //// SLASH COMMAND SETUP ////

    client.commands = new Collection()
    const commands = []
    const commandFiles = fs.readdirSync('./bot/commands').filter(file => file.endsWith('.js'))

    for (const file of commandFiles) {
        if (!file.startsWith("!")) {
            const command = require(`./commands/${file}`)
            var commandJSON = JSON.stringify(command.data)
            commands.push(command.data)

            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command)
            }
        }
    }

    client.on(Events.InteractionCreate, async interaction => {
        if (!interaction.isChatInputCommand()) return;

        const command = client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    })

    const rest = new REST({ version: '10' }).setToken(token)

    async function registerSlashCommands() {
        try {
            print(`Started refreshing ${commands.length} application (/) commands.`);

            // The put method is used to fully refresh all commands in the guild with the current set
            const data = await rest.put(
                Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
                { body: commands },
            );

            print(`Successfully reloaded ${data.length} application (/) commands.`);
        } catch (error) {
            console.error(error);
        }
    }

    registerSlashCommands()



    //// DISCORD.JS INITIALIZE ////

    client.on("channelDelete", async (channel) => {
        let this_PC = await ChannelDB.get(channel.id)
        if (this_PC) {
            let user_id = this_PC.owner
            MemberDB.orig_set(user_id, "channel", null)
            ChannelDB.remove(channel.id)
            let user = await client.users.fetch(user_id)
            user.send(`**‼ Your PC has been deleted! ‼**\n*(This is __permanent__ and cannot be undone)*`)
        }
    })

    client.on("guildMemberAdd", async (member) => {
        let channel = await client.channels.fetch(WELCOME_CHANNEL)
        channel.send(`${WELCOME_EMOJI} **Welcome, <@${member.id}>, to TheJukeBox Music Community!** ${WELCOME_EMOJI}\n*(Check out <#${INFO_CHANNEL}> for more information, or get your roles in <#${ROLES_CHANNEL}>)*`)
        member.roles.add(PC_TOKEN_ROLE)
        member.roles.add(JUKER_ROLE)
    })

    client.on("threadCreate", async (thread) => {
        if (thread.parentId == PC_CHANNEL) {
            let owner = await thread.guild.members.fetch(thread.ownerId)
            // print(`Removing role ${PC_TOKEN_ROLE} from ${owner.displayName}...`)
            owner.roles.remove(PC_TOKEN_ROLE)
        }
    })

    async function reactionRoleUpdate(guild) {
        //// REACTION ROLE INTEGRATION
        client.channels.fetch(REACT_CHL).then(channel => { // CACHE REACTION ROLE MESSAGE
            channel.messages.fetch(REACT_MSG, {cache: true})
        })

        const REACTION_ROLES = {
            "🔴": SUBSCRIBER_ROLE,
            "🔵": MUSICIAN_ROLE,
        }

        client.on('messageReactionAdd', async (reaction, user) => { // Adding Reaction Roles
            if (reaction.message.id == REACT_MSG) {
                let member = await reaction.message.guild.members.fetch(user.id)
                if (Object.keys(REACTION_ROLES).includes(reaction.emoji.name)) {
                    member.roles.add(REACTION_ROLES[reaction.emoji.name])
                }
            }
        })

        client.on('messageReactionRemove', async (reaction, user) => { // Removing Reaction Roles
            if (reaction.message.id == REACT_MSG) {
                let member = await reaction.message.guild.members.fetch(user.id)
                if (Object.keys(REACTION_ROLES).includes(reaction.emoji.name)) {
                    member.roles.remove(REACTION_ROLES[reaction.emoji.name])
                }
            }
        })

        var reactionMSG = await (await client.channels.fetch(REACT_CHL)).messages.fetch(REACT_MSG)
        var actualLists = {}
        await Object.keys(REACTION_ROLES).asyncForEach(async emote => {
            // print(emote)
            actualLists[emote] = Array.from((await reactionMSG.reactions.cache.get(emote).users.fetch()).keys())
        })

        Array.from(guild.members.cache.values()).asyncForEach(async member => {
            await member.roles.add(JUKER_ROLE)

            await Object.keys(REACTION_ROLES).asyncForEach(async emote => {
                var thisRole = REACTION_ROLES[emote]
                var thisList = actualLists[emote]
                if (member.roles.cache.has(thisRole) && !thisList.includes(member.id)) {
                    await member.roles.remove(thisRole)
                } else if (!member.roles.cache.has(thisRole) && thisList.includes(member.id)) {
                    await member.roles.add(thisRole)
                }
            })
        })

        print("- Reaction roles updated!")
    }

    async function updateBadgesAndTiers(guild) {
        async function memberUpdater(member) {
            var thisProm;

            const TIER_ROLES = [
                ARCHJUKER_ROLE,     // 5 - 1 == 4
                JUKEBOXER_ROLE,     // 5 - 2 == 3
                BOXEE_ROLE,         // 5 - 3 == 2
                SUPER_JUKER_ROLE,   // 5 - 4 == 1
                JUKER_ROLE,         // 5 - 5 == 0
            ]

            // TIER_ROLES.forEach((roleId, ind) => {
            await MemberDB._updateData()
            for (let ind = 0; ind < TIER_ROLES.length; ind++) {
                let roleId = TIER_ROLES[ind]
                if (member.roles.cache.has(roleId)) {
                    let newVal = (TIER_ROLES.length-(ind+1))
                    if (MemberDB.getNow(member.id).tier != newVal) {
                        thisProm = MemberDB.set(member.id, "tier", newVal)
                    }
                    break;
                }
            }

            await thisProm
        }

        await Array.from(guild.members.cache.values()).asyncForEach(memberUpdater)

        client.on("guildMemberUpdate", async (oldMember, newMember) => { memberUpdater(newMember) })

        print("- Tiers & Badges sync'd!")
    }

    async function updateTokens(guild) {
        var forumChannel = await client.channels.fetch(PC_CHANNEL)
        var pcOwners = Array.from(forumChannel.threads.cache.values()).map(PC => { return PC.ownerId })
        await Array.from(guild.members.cache.values()).asyncForEach(async member => {
            if (!pcOwners.includes(member.id)) {
                if (!member.roles.cache.has(PC_TOKEN_ROLE)) { await member.roles.add(PC_TOKEN_ROLE) }
                // print(`${member.user.username} Does not own a PC`)
            } else {
                if (member.roles.cache.has(PC_TOKEN_ROLE)) { await member.roles.remove(PC_TOKEN_ROLE) }
                // print(`${member.user.username} OWNS A PC, WTFF`)
            }
        })
        print("- PC Tokens updated!")
    }

    client.on("ready", async () => {
        print(`Bot Logged in...`)

        let guild = await client.guilds.fetch(GUILD_ID)
        let theseProms = [
            reactionRoleUpdate(guild),
            // updateBadgesAndTiers(guild),
            updateTokens(guild),
        ]

        await Promise.all(theseProms)

        print(`${client.user.username} Initialized!`)
    })

    client.on("messageCreate", async msg => {
        if (msg.channel.type != 1 || msg.author.id != client.user.id) { print(`${msg.author.username}: ${msg.content}`) }
        var BLUTO_ID = "229319768874680320"
        var ignores = [BLUTO_ID, CLIENT_ID]
        if (msg.channel.type == 1 && !ignores.includes(msg.author.id) ) { // Who tf DMing the bot tho??
            let Bluto = await client.users.fetch(BLUTO_ID)
            Bluto.send(`DM from <@${msg.author.id}>:\n--------\n${msg.content}`)
        }
    })
}