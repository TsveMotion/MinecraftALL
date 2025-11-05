package com.minecraftauth.commands;

import com.minecraftauth.MinecraftAuthPlugin;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.event.ClickEvent;
import net.kyori.adventure.text.format.NamedTextColor;
import net.kyori.adventure.text.format.TextDecoration;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;

public class LinksCommand implements CommandExecutor {
    
    private final MinecraftAuthPlugin plugin;
    
    public LinksCommand(MinecraftAuthPlugin plugin) {
        this.plugin = plugin;
    }
    
    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (!(sender instanceof Player)) {
            sender.sendMessage("This command can only be used by players.");
            return true;
        }
        
        Player player = (Player) sender;
        
        // Send header
        player.sendMessage(Component.text(""));
        player.sendMessage(Component.text("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
                .color(NamedTextColor.DARK_GRAY));
        player.sendMessage(Component.text("🔗 Streetly SMP Links")
                .color(NamedTextColor.GOLD)
                .decorate(TextDecoration.BOLD));
        player.sendMessage(Component.text("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
                .color(NamedTextColor.DARK_GRAY));
        player.sendMessage(Component.text(""));
        
        // Website link
        player.sendMessage(Component.text("🌐 Website & Dashboard")
                .color(NamedTextColor.AQUA)
                .decorate(TextDecoration.BOLD));
        player.sendMessage(Component.text("   https://mc-verify.tsvweb.co.uk")
                .color(NamedTextColor.WHITE)
                .clickEvent(ClickEvent.openUrl("https://mc-verify.tsvweb.co.uk")));
        player.sendMessage(Component.text("   » Login, view stats, and manage your account")
                .color(NamedTextColor.GRAY));
        player.sendMessage(Component.text(""));
        
        // Registration link
        player.sendMessage(Component.text("📝 Register Your Account")
                .color(NamedTextColor.GREEN)
                .decorate(TextDecoration.BOLD));
        player.sendMessage(Component.text("   Use /register in-game to get your link!")
                .color(NamedTextColor.YELLOW));
        player.sendMessage(Component.text(""));
        
        // Main site
        player.sendMessage(Component.text("🏢 Hosted By")
                .color(NamedTextColor.LIGHT_PURPLE)
                .decorate(TextDecoration.BOLD));
        player.sendMessage(Component.text("   https://tsvweb.co.uk")
                .color(NamedTextColor.WHITE)
                .clickEvent(ClickEvent.openUrl("https://tsvweb.co.uk")));
        player.sendMessage(Component.text("   » Professional web hosting & development")
                .color(NamedTextColor.GRAY));
        player.sendMessage(Component.text(""));
        
        // Footer
        player.sendMessage(Component.text("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
                .color(NamedTextColor.DARK_GRAY));
        player.sendMessage(Component.text("💡 Tip: Click the links above to open them!")
                .color(NamedTextColor.YELLOW));
        player.sendMessage(Component.text("   (Java players can click directly)")
                .color(NamedTextColor.GRAY));
        player.sendMessage(Component.text("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
                .color(NamedTextColor.DARK_GRAY));
        player.sendMessage(Component.text(""));
        
        return true;
    }
}
