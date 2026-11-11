import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ScoreChart } from "@/components/ScoreChart";
import { Screen } from "@/components/Screen";
import { SessionStats } from "@/components/SessionStats";
import { getProtocol } from "@/lib/protocols";
import { formatDuration, type SessionRecord } from "@/lib/session";
import { useSessions } from "@/state/sessions";
import { useTheme } from "@/theme/theme";
import { radius, space } from "@/theme/tokens";

function formatDate(iso: string): string {
  const date = new Date(iso);
  return `${date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  })}, ${date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
}

export default function HistoryScreen() {
  const { sessions, loaded, remove } = useSessions();
  const router = useRouter();

  if (loaded && sessions.length === 0) {
    return (
      <Screen title="History">
        <Card title="No sessions yet">
          <AppText tone="muted">
            Finished training sessions are saved on this device and appear here, with how much of
            the time you spent in the reward zone.
          </AppText>
          <Button label="Start training" onPress={() => router.navigate("/train")} />
        </Card>
      </Screen>
    );
  }

  const totalSeconds = sessions.reduce((sum, s) => sum + s.durationSeconds, 0);
  return (
    <Screen
      title="History"
      subtitle={`${sessions.length} ${sessions.length === 1 ? "session" : "sessions"} · ${formatDuration(totalSeconds)} of training`}
    >
      {sessions.map((session) => (
        <SessionCard key={session.id} session={session} onDelete={() => remove(session.id)} />
      ))}
      <AppText variant="caption" tone="muted">
        Stored only on this device. Scores are relative to each session's own baseline.
      </AppText>
    </Screen>
  );
}

function SessionCard({
  session,
  onDelete,
}: {
  readonly session: SessionRecord;
  readonly onDelete: () => void;
}) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const protocol = getProtocol(session.protocol);

  // A second tap within a few seconds deletes; otherwise the button resets.
  useEffect(() => {
    if (!confirming) return;
    const timer = setTimeout(() => setConfirming(false), 4000);
    return () => clearTimeout(timer);
  }, [confirming]);

  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.titles}>
          <AppText variant="heading">{protocol?.name ?? session.protocol}</AppText>
          <AppText variant="caption" tone="muted">
            {formatDate(session.startedAt)} · {session.channels.length} ch ·{" "}
            {session.baselineSeconds} s baseline
          </AppText>
        </View>
        {session.source === "demo" ? (
          <View style={[styles.badge, { borderColor: colors.border }]}>
            <AppText variant="caption" tone="muted">
              Simulated
            </AppText>
          </View>
        ) : null}
      </View>
      <SessionStats summary={session} />
      {expanded ? (
        <ScoreChart series={session.series} durationSeconds={session.durationSeconds} />
      ) : null}
      <View style={styles.actions}>
        <Button
          compact
          variant="ghost"
          label={expanded ? "Hide chart" : "Show chart"}
          accessibilityState={{ expanded }}
          onPress={() => setExpanded((e) => !e)}
        />
        <Button
          compact
          variant="danger"
          label={confirming ? "Tap again to delete" : "Delete"}
          onPress={() => (confirming ? onDelete() : setConfirming(true))}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "flex-start", gap: space.md },
  titles: { flex: 1, gap: 2 },
  badge: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
  },
  actions: { flexDirection: "row", justifyContent: "space-between", gap: space.md },
});
