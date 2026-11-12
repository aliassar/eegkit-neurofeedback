import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Field } from "@/components/Field";
import { GrownUpScreen } from "@/components/GrownUpScreen";
import { Buddy } from "@/components/kid/Buddy";
import { Segmented } from "@/components/Segmented";
import {
  AVATAR_COUNT,
  BASELINE_CHOICES,
  createProfile,
  type Profile,
  ROUND_CHOICES,
  ROUND_SECONDS_CHOICES,
  validateName,
} from "@/lib/profiles";
import { PROTOCOLS } from "@/lib/protocols";
import { useProfiles } from "@/state/profiles";
import { useRecords } from "@/state/records";
import { useTheme } from "@/theme/theme";
import { radius, space } from "@/theme/tokens";

const ROUND_OPTIONS = ROUND_CHOICES.map((n) => ({ value: n, label: String(n) }));
const LENGTH_OPTIONS = ROUND_SECONDS_CHOICES.map((s) => ({
  value: s,
  label: s % 60 === 0 ? `${s / 60} min` : `${s / 60} min`.replace(".5", "½"),
}));
const BASELINE_OPTIONS = BASELINE_CHOICES.map((s) => ({ value: s, label: `${s} s` }));

export default function Children() {
  const { profiles, active, add } = useProfiles();
  const [adding, setAdding] = useState(profiles.length === 0);
  useEffect(() => {
    if (profiles.length === 0) setAdding(true);
  }, [profiles.length]);

  return (
    <GrownUpScreen
      title="Children"
      subtitle="Profiles, buddies and training plans. Use a first name or nickname."
    >
      {profiles.map((p) => (
        <ChildCard key={p.id} profile={p} playing={p.id === active?.id} />
      ))}
      {adding ? (
        <NewChild
          onDone={(profile) => {
            if (profile) add(profile);
            setAdding(false);
          }}
          cancellable={profiles.length > 0}
        />
      ) : (
        <Button label="Add a child" variant="secondary" onPress={() => setAdding(true)} />
      )}
    </GrownUpScreen>
  );
}

function NewChild({
  onDone,
  cancellable,
}: {
  readonly onDone: (profile: Profile | null) => void;
  readonly cancellable: boolean;
}) {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const save = () => {
    const problem = validateName(name);
    if (problem) {
      setError(problem);
      return;
    }
    onDone(createProfile(name, avatar));
  };
  return (
    <Card title="New child">
      <Field
        label="Name"
        value={name}
        onChangeText={(text) => {
          setName(text);
          setError(null);
        }}
        placeholder="First name or nickname"
        autoCapitalize="words"
        error={error ?? undefined}
        onSubmitEditing={save}
      />
      <AvatarPicker value={avatar} onChange={setAvatar} />
      <AppText variant="caption" tone="muted">
        Starts with the Theta/Beta protocol, 4 rounds of 2 minutes and a 30-second baseline. You can
        change this below once the profile exists.
      </AppText>
      <View style={styles.actions}>
        <Button label="Add child" onPress={save} style={styles.grow} />
        {cancellable ? (
          <Button
            label="Cancel"
            variant="secondary"
            onPress={() => onDone(null)}
            style={styles.grow}
          />
        ) : null}
      </View>
    </Card>
  );
}

function AvatarPicker({
  value,
  onChange,
}: {
  readonly value: number;
  readonly onChange: (v: number) => void;
}) {
  const { colors } = useTheme();
  return (
    <View>
      <AppText variant="label" tone="muted">
        Buddy
      </AppText>
      <View style={styles.avatars} accessibilityRole="radiogroup" accessibilityLabel="Buddy">
        {Array.from({ length: AVATAR_COUNT }, (_, i) => (
          <Pressable
            // biome-ignore lint/suspicious/noArrayIndexKey: one per design.
            key={i}
            accessibilityRole="radio"
            accessibilityLabel={`Buddy ${i + 1}`}
            accessibilityState={{ checked: i === value }}
            onPress={() => onChange(i)}
            style={[
              styles.avatar,
              { borderColor: i === value ? colors.accent : "transparent" },
              i === value && { backgroundColor: colors.accentSoft },
            ]}
          >
            <Buddy avatar={i} size={52} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function ChildCard({ profile, playing }: { readonly profile: Profile; readonly playing: boolean }) {
  const { colors } = useTheme();
  const { update, remove, setActive } = useProfiles();
  const { removeProfileData } = useRecords();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [confirming, setConfirming] = useState(false);
  const protocol = PROTOCOLS.find((p) => p.id === profile.protocol);

  useEffect(() => {
    if (!confirming) return;
    const timer = setTimeout(() => setConfirming(false), 4000);
    return () => clearTimeout(timer);
  }, [confirming]);

  return (
    <Card>
      <View style={styles.head}>
        <Buddy avatar={profile.avatar} size={56} />
        <View style={styles.grow}>
          <AppText variant="heading">{profile.name}</AppText>
          <AppText variant="caption" tone="muted">
            {protocol?.name} · {profile.rounds} × {profile.roundSeconds / 60} min ·{" "}
            {profile.baselineSeconds} s baseline
          </AppText>
        </View>
        {playing ? (
          <View style={[styles.tag, { backgroundColor: colors.accentSoft }]}>
            <AppText variant="caption" tone="accent">
              Playing now
            </AppText>
          </View>
        ) : (
          <Button compact variant="ghost" label="Play as" onPress={() => setActive(profile.id)} />
        )}
      </View>

      {editing ? (
        <View style={styles.form}>
          <Field
            label="Name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            error={validateName(name) ?? undefined}
            onBlur={() => {
              if (!validateName(name)) update(profile.id, { name: name.trim() });
            }}
          />
          <AvatarPicker
            value={profile.avatar}
            onChange={(avatar) => update(profile.id, { avatar })}
          />
          <View style={styles.section}>
            <AppText variant="label" tone="muted">
              Protocol
            </AppText>
            {PROTOCOLS.map((p) => {
              const on = p.id === profile.protocol;
              return (
                <Pressable
                  key={p.id}
                  accessibilityRole="radio"
                  accessibilityLabel={`${p.name}: ${p.goal}`}
                  accessibilityState={{ checked: on }}
                  onPress={() => update(profile.id, { protocol: p.id })}
                  style={[
                    styles.option,
                    {
                      borderColor: on ? colors.accent : colors.border,
                      backgroundColor: on ? colors.accentSoft : colors.surface,
                    },
                  ]}
                >
                  <View style={styles.optionHead}>
                    <AppText variant="label" style={styles.grow}>
                      {p.name}
                    </AppText>
                    <AppText variant="caption" tone="accent">
                      {p.goal}
                    </AppText>
                  </View>
                  <AppText variant="caption" tone="muted">
                    {p.description}
                  </AppText>
                  <AppText variant="caption" tone="muted">
                    Electrode: {p.placement}.
                  </AppText>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.section}>
            <AppText variant="label" tone="muted">
              Rounds per session
            </AppText>
            <Segmented
              label="Rounds per session"
              options={ROUND_OPTIONS}
              value={profile.rounds}
              onChange={(rounds) => update(profile.id, { rounds })}
            />
          </View>
          <View style={styles.section}>
            <AppText variant="label" tone="muted">
              Round length
            </AppText>
            <Segmented
              label="Round length"
              options={LENGTH_OPTIONS}
              value={profile.roundSeconds}
              onChange={(roundSeconds) => update(profile.id, { roundSeconds })}
            />
          </View>
          <View style={styles.section}>
            <AppText variant="label" tone="muted">
              Resting baseline
            </AppText>
            <Segmented
              label="Resting baseline"
              options={BASELINE_OPTIONS}
              value={profile.baselineSeconds}
              onChange={(baselineSeconds) => update(profile.id, { baselineSeconds })}
            />
          </View>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button
          compact
          variant="ghost"
          label={editing ? "Done" : "Edit plan"}
          accessibilityState={{ expanded: editing }}
          onPress={() => setEditing((e) => !e)}
        />
        <Button
          compact
          variant="danger"
          label={confirming ? "Tap again: delete profile and data" : "Delete"}
          onPress={() => {
            if (!confirming) {
              setConfirming(true);
              return;
            }
            removeProfileData(profile.id);
            remove(profile.id);
          }}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", gap: space.md },
  grow: { flex: 1 },
  tag: { borderRadius: radius.pill, paddingHorizontal: space.sm, paddingVertical: 4 },
  form: { gap: space.lg },
  section: { gap: space.sm },
  option: { borderWidth: 1, borderRadius: radius.md, padding: space.md, gap: 4 },
  optionHead: { flexDirection: "row", alignItems: "center", gap: space.sm },
  avatars: { flexDirection: "row", flexWrap: "wrap", gap: space.sm, marginTop: space.sm },
  avatar: { borderWidth: 2, borderRadius: radius.md, padding: 4 },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: space.sm,
  },
});
