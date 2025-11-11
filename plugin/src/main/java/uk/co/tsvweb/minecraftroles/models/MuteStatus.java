package uk.co.tsvweb.minecraftroles.models;

public class MuteStatus {
    private final boolean muted;
    private final String endsAt;
    private final String reason;

    public MuteStatus(boolean muted, String endsAt, String reason) {
        this.muted = muted;
        this.endsAt = endsAt;
        this.reason = reason;
    }

    public boolean isMuted() {
        return muted;
    }

    public String getEndsAt() {
        return endsAt;
    }

    public String getReason() {
        return reason;
    }

    @Override
    public String toString() {
        return "MuteStatus{" +
                "muted=" + muted +
                ", endsAt='" + endsAt + '\'' +
                ", reason='" + reason + '\'' +
                '}';
    }
}
