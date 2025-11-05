package com.minecraftauth.commands;

import com.minecraftauth.MinecraftAuthPlugin;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.NamedTextColor;
import org.bukkit.Bukkit;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public class ReportCommand implements CommandExecutor {
    
    private final MinecraftAuthPlugin plugin;
    
    public ReportCommand(MinecraftAuthPlugin plugin) {
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
        
        // Check if player is authenticated
        if (!plugin.isAuthenticated(reporter.getUniqueId())) {
            reporter.sendMessage(Component.text("You must be logged in to use this command!")
                    .color(NamedTextColor.RED));
            return true;
        }
        
        // Validate arguments: /report <player> <description>
        if (args.length < 2) {
            reporter.sendMessage(Component.text("Usage: /report <player> <description>")
                    .color(NamedTextColor.RED));
            return true;
        }
        
        String reportedPlayerName = args[0];
        String description = String.join(" ", java.util.Arrays.copyOfRange(args, 1, args.length));
        
        // Check if reported player exists and is verified
        Player reportedPlayer = Bukkit.getPlayer(reportedPlayerName);
        if (reportedPlayer == null) {
            // Check if player exists in database even if offline
            if (!plugin.getDatabaseManager().playerExists(reportedPlayerName)) {
                reporter.sendMessage(Component.text("Player '" + reportedPlayerName + "' not found!")
                        .color(NamedTextColor.RED));
                return true;
            }
        }
        
        // Don't allow self-reporting
        if (reporter.getName().equalsIgnoreCase(reportedPlayerName)) {
            reporter.sendMessage(Component.text("You cannot report yourself!")
                    .color(NamedTextColor.RED));
            return true;
        }
        
        // Create report in database
        boolean success = plugin.getDatabaseManager().createReport(
                reporter.getName(),
                reportedPlayerName,
                description
        );
        
        if (!success) {
            reporter.sendMessage(Component.text("Failed to create report. Please try again.")
                    .color(NamedTextColor.RED));
            return true;
        }
        
        // Send confirmation to reporter
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
                .append(Component.text(description).color(NamedTextColor.WHITE)));
        reporter.sendMessage(Component.text(""));
        reporter.sendMessage(Component.text("A staff member will review your report shortly.")
                .color(NamedTextColor.YELLOW));
        reporter.sendMessage(Component.text("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
                .color(NamedTextColor.DARK_GRAY));
        reporter.sendMessage(Component.text(""));
        
        // Send Discord webhook notification (async)
        Bukkit.getScheduler().runTaskAsynchronously(plugin, () -> {
            sendDiscordWebhook(reporter.getName(), reportedPlayerName, description);
        });
        
        return true;
    }
    
    private void sendDiscordWebhook(String reporter, String reported, String description) {
        String webhookUrl = plugin.getConfig().getString("discord.webhook-url");
        if (webhookUrl == null || webhookUrl.isEmpty() || webhookUrl.equals("DISCORD_WEBHOOK_URL_HERE")) {
            plugin.getLogger().warning("Discord webhook URL not configured. Skipping Discord notification.");
            return;
        }
        
        try {
            URL url = new URL(webhookUrl);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setDoOutput(true);
            
            // Build JSON payload
            String json = String.format(
                "{\"embeds\": [{" +
                    "\"title\": \"🚨 New Player Report\"," +
                    "\"color\": 15158332," +
                    "\"fields\": [" +
                        "{\"name\": \"Reporter\", \"value\": \"%s\", \"inline\": true}," +
                        "{\"name\": \"Reported Player\", \"value\": \"%s\", \"inline\": true}," +
                        "{\"name\": \"Description\", \"value\": \"%s\", \"inline\": false}" +
                    "]," +
                    "\"timestamp\": \"%s\"" +
                "}]}",
                escapeJson(reporter),
                escapeJson(reported),
                escapeJson(description),
                java.time.Instant.now().toString()
            );
            
            try (OutputStream os = connection.getOutputStream()) {
                byte[] input = json.getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }
            
            int responseCode = connection.getResponseCode();
            if (responseCode == 204 || responseCode == 200) {
                plugin.getLogger().info("Report webhook sent successfully to Discord");
            } else {
                plugin.getLogger().warning("Discord webhook returned status code: " + responseCode);
            }
            
        } catch (Exception e) {
            plugin.getLogger().warning("Failed to send Discord webhook: " + e.getMessage());
        }
    }
    
    private String escapeJson(String str) {
        return str.replace("\\", "\\\\")
                  .replace("\"", "\\\"")
                  .replace("\n", "\\n")
                  .replace("\r", "\\r")
                  .replace("\t", "\\t");
    }
}
