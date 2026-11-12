import { useRouter } from "expo-router";
import { useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ChildPicker } from "@/components/ChildPicker";
import { GrownUpScreen } from "@/components/GrownUpScreen";
import { TrendChart } from "@/components/TrendChart";
import { exportBaseName, exportJson, focusChecksToCsv, sessionsToCsv } from "@/lib/export";
import { totalRounds } from "@/lib/focus-meter";
import { formatDuration, formatPercent, mean } from "@/lib/format";
import { getGame } from "@/lib/games";
import { getProtocol } from "@/lib/protocols";
import type { FocusCheckRecord, SessionRecord } from "@/lib/records";
import { saveTextFile } from "@/platform/save-file";
import { useProfiles } from "@/state/profiles";
import { useChildRecords } from "@/state/records";
import { useTheme } from "@/theme/theme";
import { radius, space } from "@/theme/tokens";

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
const dateTime = (iso: string) =>
  `${new Date(iso).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}, ${new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;

export default function Progress() {
  const { profiles, active, setActive } = useProfiles();
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | undefined>(active?.id);
  const child = profiles.find((p) => p.id === selectedId) ?? active;
  const { sessions, checks } = useChildRecords(child?.id);

  if (!child) {
    return (
      <GrownUpScreen title="Progress">
        <Card title="Add a child to start">
          <AppText tone="muted">
            Each child gets a profile with their own buddy, training protocol and progress. Nothing
            leaves this device.
          </AppText>
          <Button label="Add a child" onPress={() => router.navigate("/grown-ups/children")} />
        </Card>
      </GrownUpScreen>
    );
  }

  const oldestFirst = [...sessions].reverse();
  const totals = oldestFirst.map((s) => totalRounds(s.rounds));
  const recent = totals.slice(-5);
  const time = totals.reduce((sum, t) => sum + t.durationSeconds, 0);
  const bestStreak = Math.max(0, ...totals.map((t) => t.longestStreakSeconds));
  const exportAll = async (what: "sessions" | "checks" | "json") => {
    const base = exportBaseName(child);
    if (what === "sessions")
      await saveTextFile(`${base}-sessions.csv`, "text/csv", sessionsToCsv(child, sessions));
    else if (what === "checks")
      await saveTextFile(`${base}-focus-checks.csv`, "text/csv", focusChecksToCsv(child, checks));
    else
      await saveTextFile(`${base}.json`, "application/json", exportJson(child, sessions, checks));
  };

  return (
    <GrownUpScreen title="Progress" subtitle="Practice data, stored only on this device.">
      {profiles.length > 1 ? (
        <ChildPicker
          profiles={profiles}
          selected={child.id}
          onSelect={(id) => {
            setSelectedId(id);
            setActive(id);
          }}
        />
      ) : null}

      <View style={styles.tiles}>
        <Tile label="Sessions" value={String(sessions.length)} />
        <Tile label="Training time" value={formatDuration(time)} />
        <Tile
          label="Focused, last 5"
          value={formatPercent(mean(recent.map((t) => t.focusedFraction)))}
        />
        <Tile label="Longest streak" value={bestStreak > 0 ? `${Math.round(bestStreak)} s` : "–"} />
      </View>

      <Card title="Time focused per session">
        {sessions.length === 0 ? (
          <AppText tone="muted">
            No sessions yet. When {child.name} plays, each session's share of focused time shows up
            here.
          </AppText>
        ) : (
          <>
            <TrendChart
              values={totals.map((t) => t.focusedFraction)}
              yMin={0}
              yMax={1}
              formatY={(v) => `${Math.round(v * 100)}%`}
              label={`Share of time focused across ${sessions.length} sessions`}
              firstLabel={shortDate(oldestFirst[0]?.startedAt ?? "")}
              lastLabel={shortDate(oldestFirst[oldestFirst.length - 1]?.startedAt ?? "")}
            />
            <AppText variant="caption" tone="muted">
              "Focused" means the attention score was clearly above {child.name}'s own resting
              baseline for that session. Look at the trend over weeks; single sessions vary a lot.
            </AppText>
          </>
        )}
      </Card>

      {sessions.length > 0 ? (
        <Card title="Sessions">
          {sessions.slice(0, 30).map((s) => (
            <SessionRow key={s.id} session={s} />
          ))}
          {sessions.length > 30 ? (
            <AppText variant="caption" tone="muted">
              Showing the latest 30. Export to see all {sessions.length}.
            </AppText>
          ) : null}
        </Card>
      ) : null}

      <Card title="Focus check">
        <AppText tone="muted">
          A 2½-minute tap/don't-tap task without feedback: tap for the sun, not for the moon.
          Reaction time, missed suns (omissions) and tapped moons (commissions) are recorded with
          the EEG attention metric. Repeat it every week or two under similar conditions. It is a
          practice measure, not a diagnostic test.
        </AppText>
        <Button
          label={`Start a focus check with ${child.name}`}
          onPress={() => router.push("/focus-check")}
        />
        {checks.length > 0 ? <FocusChecks checks={checks} /> : null}
      </Card>

      <Card title="Export">
        <AppText tone="muted">
          {Platform.OS === "web"
            ? `Download ${child.name}'s data to share with a clinician or keep a backup.`
            : `Share ${child.name}'s data as text through the share sheet, e.g. to Files or email.`}
        </AppText>
        <View style={styles.actions}>
          <Button
            compact
            variant="secondary"
            label="Sessions (CSV)"
            disabled={sessions.length === 0}
            onPress={() => exportAll("sessions")}
          />
          <Button
            compact
            variant="secondary"
            label="Focus checks (CSV)"
            disabled={checks.length === 0}
            onPress={() => exportAll("checks")}
          />
          <Button
            compact
            variant="secondary"
            label="Everything (JSON)"
            onPress={() => exportAll("json")}
          />
        </View>
      </Card>
    </GrownUpScreen>
  );
}

function Tile({ label, value }: { readonly label: string; readonly value: string }) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.tile, { backgroundColor: colors.surface, borderColor: colors.border }]}
      accessible
      accessibilityLabel={`${label}: ${value}`}
    >
      <AppText variant="heading" numeric>
        {value}
      </AppText>
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
    </View>
  );
}

function SessionRow({ session }: { readonly session: SessionRecord }) {
  const { colors } = useTheme();
  const t = totalRounds(session.rounds);
  const game = getGame(session.game);
  const protocol = getProtocol(session.protocol);
  return (
    <View style={[styles.row, { borderColor: colors.border }]}>
      <View style={styles.rowHead}>
        <AppText variant="label" style={styles.grow}>
          {game?.title} · {protocol?.name}
        </AppText>
        {session.source === "demo" ? (
          <View style={[styles.badge, { borderColor: colors.border }]}>
            <AppText variant="caption" tone="muted">
              Simulated
            </AppText>
          </View>
        ) : null}
      </View>
      <AppText variant="caption" tone="muted">
        {dateTime(session.startedAt)} · {session.rounds.length} round
        {session.rounds.length === 1 ? "" : "s"}
        {session.completed ? "" : " (stopped early)"}
      </AppText>
      <AppText variant="body" numeric>
        {formatPercent(t.focusedFraction)} focused · longest streak{" "}
        {Math.round(t.longestStreakSeconds)} s · {t.stars} stars
      </AppText>
      <View style={styles.bars} accessibilityLabel="Focused share per round">
        {session.rounds.map((r, i) => (
          <View
            // biome-ignore lint/suspicious/noArrayIndexKey: rounds are positional.
            key={i}
            style={[styles.barTrack, { backgroundColor: colors.surfaceRaised }]}
          >
            <View
              style={[
                styles.barFill,
                {
                  backgroundColor: colors.accent,
                  height: `${Math.round(r.focusedFraction * 100)}%`,
                },
              ]}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

function FocusChecks({ checks }: { readonly checks: readonly FocusCheckRecord[] }) {
  const { colors } = useTheme();
  const oldestFirst = [...checks].reverse();
  const rts = oldestFirst.map((c) => c.meanRtMs);
  const finite = rts.filter(Number.isFinite);
  return (
    <View style={styles.checks}>
      {finite.length > 1 ? (
        <TrendChart
          values={rts}
          yMin={Math.floor(Math.min(...finite) / 100) * 100}
          yMax={Math.ceil(Math.max(...finite) / 100) * 100}
          formatY={(v) => `${Math.round(v)}`}
          label="Mean reaction time per focus check, milliseconds"
          firstLabel={`RT, ms · ${shortDate(oldestFirst[0]?.startedAt ?? "")}`}
          lastLabel={shortDate(oldestFirst[oldestFirst.length - 1]?.startedAt ?? "")}
        />
      ) : null}
      {checks.slice(0, 10).map((c) => (
        <View key={c.id} style={[styles.row, { borderColor: colors.border }]}>
          <AppText variant="label">{dateTime(c.startedAt)}</AppText>
          <AppText variant="body" numeric>
            RT{" "}
            {Number.isFinite(c.meanRtMs)
              ? `${c.meanRtMs} ± ${Number.isFinite(c.rtSdMs) ? c.rtSdMs : "–"} ms`
              : "–"}{" "}
            · omissions {c.omissions}/{c.goTrials} · commissions {c.commissions}/{c.noGoTrials}
          </AppText>
          <AppText variant="caption" tone="muted">
            {c.protocol && Number.isFinite(c.eegMetric)
              ? `EEG ${getProtocol(c.protocol)?.name} metric during the task: ${c.eegMetric.toFixed(2)}${c.source === "demo" ? " (simulated)" : ""}`
              : "No EEG recorded"}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tiles: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  tile: {
    flexGrow: 1,
    flexBasis: 140,
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 2,
  },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  row: { gap: 2, paddingTop: space.md, borderTopWidth: StyleSheet.hairlineWidth },
  rowHead: { flexDirection: "row", alignItems: "center", gap: space.sm },
  grow: { flex: 1 },
  badge: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: space.sm },
  bars: { flexDirection: "row", gap: 4, height: 28, alignItems: "flex-end", marginTop: space.xs },
  barTrack: {
    width: 18,
    height: 28,
    borderRadius: 4,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  barFill: { width: "100%" },
  checks: { gap: space.sm },
});
