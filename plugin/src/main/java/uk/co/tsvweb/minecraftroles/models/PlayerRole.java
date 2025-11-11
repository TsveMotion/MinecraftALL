package uk.co.tsvweb.minecraftroles.models;

public class PlayerRole {
    private final String symbol;
    private final String colorHex;
    private final boolean isAdmin;

    public PlayerRole(String symbol, String colorHex, boolean isAdmin) {
        this.symbol = symbol;
        this.colorHex = colorHex;
        this.isAdmin = isAdmin;
    }

    public String getSymbol() {
        return symbol;
    }

    public String getColorHex() {
        return colorHex;
    }

    public boolean isAdmin() {
        return isAdmin;
    }

    @Override
    public String toString() {
        return "PlayerRole{" +
                "symbol='" + symbol + '\'' +
                ", colorHex='" + colorHex + '\'' +
                ", isAdmin=" + isAdmin +
                '}';
    }
}
