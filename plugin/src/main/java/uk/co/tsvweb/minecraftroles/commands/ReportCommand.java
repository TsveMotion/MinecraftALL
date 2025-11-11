package uk.co.tsvweb.minecraftroles.commands;

import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.NamedTextColor;
import org.bukkit.Bukkit;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;
import uk.co.tsvweb.minecraftroles.MinecraftRoles;

public class ReportCommand implements CommandExecutor {
    
    private final MinecraftRoles plugin;
    
    public ReportCommand(MinecraftRoles plugin) {
        this.plugin = plugin;
    }
    
    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (!(sender instanceof Player)) {
            sender.sendMessage(Component.text("This command can only be used by players!")
                    .color(NamedTextColor.RED));
            return true;
        }
        
        Player reporter = (Player) sender;
        
        // Validate arguments: /report <player> <reason>
        if (args.length < 2) {
            reporter.sendMessage(Component.text("Usage: /report <player> <reason>")
                    .color(NamedTextColor.RED));
            return true;
        }
        
        String reportedPlayerName = args[0];
        String reason = String.join(" ", java.util.Arrays.copyOfRange(args, 1, args.length));
        
        // Don't allow self-reporting
        if (reporter.getName().equalsIgnoreCase(reportedPlayerName)) {
            reporter.sendMessage(Component.text("You cannot report yourself!")
                    .color(NamedTextColor.RED));
            return true;
        }
        
        // Submit report via API (async)
        plugin.getWebAPIClient().submitReport(reporter.getName(), reportedPlayerName, reason)
                .thenAccept(success -> {
                    if (success) {
                        reporter.sendMessage(Component.text(""));
                        reporter.sendMessage(Component.text("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
                                .color(NamedTextColor.DARK_GRAY));
                        reporter.sendMessage(Component.text("✓ Report Submitted")
                                .color(NamedTextColor.GREEN));
                        reporter.sendMessage(Component.text(""));
                        reporter.sendMessage(Component.text("Player: ")
                                .color(NamedTextColor.GRAY)
                                .append(Component.text(reportedPlayerName).color(NamedTextColor.WHITE)));
                        reporter.sendMessage(Component.text("Reason: ")
                                .color(NamedTextColor.GRAY)
                                .append(Component.text(reason).color(NamedTextColor.WHITE)));
                        reporter.sendMessage(Component.text(""));
                        reporter.sendMessage(Component.text("A staff member will review your report shortly.")
                                .color(NamedTextColor.YELLOW));
                        reporter.sendMessage(Component.text("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
                                .color(NamedTextColor.DARK_GRAY));
                        reporter.sendMessage(Component.text(""));
                    } else {
                        reporter.sendMessage(Component.text("Failed to submit report. Please try again later.")
                                .color(NamedTextColor.RED));
                    }
                });
        
        return true;
    }
}
