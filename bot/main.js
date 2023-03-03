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
            MemberDB.setUp(owner.id, {
                channel: thread.id
            })
        }
    })

    function reactionRoleUpdate() {
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
    }

    client.on("ready", async () => {
        print(`${client.user.username} Initialized!`)
        reactionRoleUpdate()
    })

    client.on("messageCreate", msg => {
        print(msg.content)
    })
}