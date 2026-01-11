import 'dotenv/config';
import { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    Events, 
    ChannelType 
} from 'discord.js';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

// --- SETTINGS (ENSURE THESE ARE CORRECT) ---
const VERIFY_CHANNEL_ID = '1456710533419110564';
const APPEALS_CHANNEL_ID = '1434689294198505552';
const VERIFIED_ROLE_ID = '1457777097127759953';
const UNVERIFIED_ROLE_ID = '1457781588640403497';
const QUARANTINE_ROLE_ID = '1459277459571867720';

client.once(Events.ClientReady, async () => {
    console.log(`✅ Bot Online as ${client.user.tag}`);

    // Setup Panels with error catching
    await setupPanel(VERIFY_CHANNEL_ID, {
        title: '🔒 Server Verification',
        desc: 'Click the button below to verify and gain access.',
        btnLabel: 'Verify ✅',
        btnId: 'verify_btn',
        btnStyle: ButtonStyle.Success,
        color: 0x2ecc71
    });

    await setupPanel(APPEALS_CHANNEL_ID, {
        title: '📝 Quarantine Appeal Portal',
        desc: 'Click below to appeal your quarantine status.',
        btnLabel: 'Appeal',
        btnId: 'appeal_btn',
        btnStyle: ButtonStyle.Primary,
        color: 0x5865f2
    });
});

async function setupPanel(channelId, config) {
    try {
        const channel = await client.channels.fetch(channelId);
        if (!channel) return;

        const messages = await channel.messages.fetch({ limit: 10 });
        if (messages.find(m => m.author.id === client.user.id)) return;

        const embed = new EmbedBuilder()
            .setTitle(config.title)
            .setDescription(config.desc)
            .setColor(config.color);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(config.btnId).setLabel(config.btnLabel).setStyle(config.btnStyle)
        );

        await channel.send({ embeds: [embed], components: [row] });
    } catch (error) {
        console.warn(`⚠️ Skipping channel ${channelId}: Bot is not in server or lacks permission.`);
    }
}

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isButton()) return;
    const { customId, member } = interaction;

    try {
        if (customId === 'verify_btn') {
            await member.roles.add(VERIFIED_ROLE_ID);
            if (member.roles.cache.has(UNVERIFIED_ROLE_ID)) await member.roles.remove(UNVERIFIED_ROLE_ID);
            return interaction.reply({ content: '✅ Verified!', ephemeral: true });
        }

        if (customId === 'appeal_btn') {
            if (!member.roles.cache.has(QUARANTINE_ROLE_ID)) {
                return interaction.reply({ content: '❌ You are not quarantined.', ephemeral: true });
            }
            await member.roles.remove(QUARANTINE_ROLE_ID);
            return interaction.reply({ content: '✅ Quarantine role removed!', ephemeral: true });
        }
    } catch (err) {
        console.error("Role error:", err);
        return interaction.reply({ content: '❌ I cannot manage your roles. Check my hierarchy!', ephemeral: true });
    }
});

client.login(process.env.DISCORD_TOKEN);