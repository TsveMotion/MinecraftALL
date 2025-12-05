package uk.co.tsvweb.minecraftroles.models;

public class PlayerRole {
    private final String symbol;
    private final String colorHex;
    private final boolean isAdmin;
    private final String fullName;
    private final Integer yearGroup;

    public PlayerRole(String symbol, String colorHex, boolean isAdmin, String fullName, Integer yearGroup) {
        this.symbol = symbol;
        this.colorHex = colorHex;
        this.isAdmin = isAdmin;
        this.fullName = fullName;
        this.yearGroup = yearGroup;
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

    public String getFullName() {
        return fullName;
    }

    public Integer getYearGroup() {
        return yearGroup;
    }

    @Override
    public String toString() {
        return "PlayerRole{" +
                "symbol='" + symbol + '\'' +
                ", colorHex='" + colorHex + '\'' +
                ", isAdmin=" + isAdmin +
                ", fullName='" + fullName + '\'' +
                ", yearGroup=" + yearGroup +
                '}';
    }
}
