package com.minecraftauth.managers;

import com.minecraftauth.MinecraftAuthPlugin;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.NamedTextColor;
import net.kyori.adventure.title.Title;
import org.bukkit.Bukkit;
import org.bukkit.entity.Player;
import org.bukkit.scheduler.BukkitTask;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Manages verification timers for unverified players
 */
public class VerificationManager {
    
    private final MinecraftAuthPlugin plugin;
    private final Map<UUID, BukkitTask> verificationTimers = new HashMap<>();
    private static final int VERIFICATION_TIME_SECONDS = 300; // 5 minutes
    
    public VerificationManager(MinecraftAuthPlugin plugin) {
        this.plugin = plugin;
    }
    
    /**
     * Start verification timer for a player
     */
    public void startVerificationTimer(Player player) {
        // Cancel existing timer if any
        cancelVerificationTimer(player);
        
        UUID playerId = player.getUniqueId();
        
        // Schedule repeating task every second
        BukkitTask task = Bukkit.getScheduler().runTaskTimer(plugin, new Runnable() {
            int secondsRemaining = VERIFICATION_TIME_SECONDS;
            
            @Override
            public void run() {
                if (!player.isOnline()) {
                    cancelVerificationTimer(player);
                    return;
                }
                
                // Check if player is now verified
                if (plugin.getAuthenticatedPlayerNames().contains(player.getName())) {
                    cancelVerificationTimer(player);
                    return;
                }
                
                secondsRemaining--;
                
                // Send warnings at specific intervals
                if (secondsRemaining == 240) { // 4 minutes
                    sendWarning(player, "4 minutes");
                } else if (secondsRemaining == 180) { // 3 minutes
                    sendWarning(player, "3 minutes");
                } else if (secondsRemaining == 120) { // 2 minutes
                    sendWarning(player, "2 minutes");
                } else if (secondsRemaining == 60) { // 1 minute
                    sendWarning(player, "1 minute");
                } else if (secondsRemaining == 30) { // 30 seconds
                    sendWarning(player, "30 seconds");
                } else if (secondsRemaining <= 10 && secondsRemaining > 0) { // Final countdown
                    player.sendActionBar(Component.text("⚠ Kicked in " + secondsRemaining + " seconds!")
                            .color(NamedTextColor.RED));
                }
                
                // Time's up!
                if (secondsRemaining <= 0) {
                    kickPlayer(player);
                    cancelVerificationTimer(player);
                }
            }
        }, 0L, 20L); // Run every second (20 ticks)
        
        verificationTimers.put(playerId, task);
    }
    
    /**
     * Cancel verification timer for a player
     */
    public void cancelVerificationTimer(Player player) {
        UUID playerId = player.getUniqueId();
        BukkitTask task = verificationTimers.get(playerId);
        if (task != null) {
            task.cancel();
            verificationTimers.remove(playerId);
        }
    }
    
    /**
     * Send verification warning to player
     */
    private void sendWarning(Player player, String timeRemaining) {
        player.sendMessage(Component.text(""));
        player.sendMessage(Component.text("⚠ VERIFICATION REQUIRED")
                .color(NamedTextColor.RED));
        player.sendMessage(Component.text("You have " + timeRemaining + " to verify your account!")
                .color(NamedTextColor.YELLOW));
        player.sendMessage(Component.text("Type /register or /login to authenticate")
                .color(NamedTextColor.WHITE));
        player.sendMessage(Component.text(""));
        
        // Send title
        player.showTitle(Title.title(
                Component.text("⚠ Verify Account", NamedTextColor.RED),
                Component.text(timeRemaining + " remaining", NamedTextColor.YELLOW),
                Title.Times.times(Duration.ofMillis(500), Duration.ofSeconds(2), Duration.ofMillis(500))
        ));
        
        // Play warning sound
        player.playSound(player.getLocation(), org.bukkit.Sound.BLOCK_NOTE_BLOCK_PLING, 1.0f, 0.5f);
    }
    
    /**
     * Kick player for not verifying
     */
    private void kickPlayer(Player player) {
        player.kick(Component.text("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n")
                .color(NamedTextColor.DARK_GRAY)
                .append(Component.text("⏱ Verification Timeout\n\n")
                        .color(NamedTextColor.RED))
                .append(Component.text("You were kicked for not verifying your account within 5 minutes.\n\n")
                        .color(NamedTextColor.WHITE))
                .append(Component.text("To play on Streetly SMP:\n")
                        .color(NamedTextColor.YELLOW))
                .append(Component.text("1. Rejoin the server\n")
                        .color(NamedTextColor.WHITE))
                .append(Component.text("2. Type /register and follow the link\n")
                        .color(NamedTextColor.WHITE))
                .append(Component.text("3. Complete registration at: ")
                        .color(NamedTextColor.WHITE))
                .append(Component.text("mc-verify.tsvweb.co.uk\n\n")
                        .color(NamedTextColor.AQUA))
                .append(Component.text("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
                        .color(NamedTextColor.DARK_GRAY)));
        
        plugin.getLogger().info(player.getName() + " was kicked for not verifying within 5 minutes");
    }
    
    /**
     * Clean up all timers (called on plugin disable)
     */
    public void shutdown() {
        verificationTimers.values().forEach(BukkitTask::cancel);
        verificationTimers.clear();
    }
}
