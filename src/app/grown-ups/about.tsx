import Constants from "expo-constants";
import { Linking, StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { GrownUpScreen } from "@/components/GrownUpScreen";
import { space } from "@/theme/tokens";

const LINKS = [
  {
    label: "Source code (eegkit-neurofeedback)",
    url: "https://github.com/aliassar/eegkit-neurofeedback",
  },
  { label: "eegkit (signal processing)", url: "https://github.com/aliassar/eegkit" },
  { label: "eegkit-react (hooks)", url: "https://github.com/aliassar/eegkit-react" },
];

const REFERENCES = [
  "Arns, de Ridder, Strehl, Breteler & Coenen (2009). Efficacy of neurofeedback treatment in ADHD: the effects on inattention, impulsivity and hyperactivity: a meta-analysis. Clinical EEG and Neuroscience 40(3), 180–189.",
  "Cortese et al. (2016). Neurofeedback for attention-deficit/hyperactivity disorder: meta-analysis of clinical and neuropsychological outcomes from randomized controlled trials. Journal of the American Academy of Child & Adolescent Psychiatry 55(6), 444–455.",
  "Arns, Conners & Kraemer (2013). A decade of EEG theta/beta ratio research in ADHD: a meta-analysis. Journal of Attention Disorders 17(5), 374–383.",
  "Pope, Bogart & Bartolome (1995). Biocybernetic system evaluates indices of operator engagement in automated task. Biological Psychology 40(1–2), 187–195.",
];

export default function About() {
  return (
    <GrownUpScreen title="About" subtitle="Focus Games, an open-source neurofeedback trainer.">
      <Card title="Please read">
        <AppText variant="label" tone="fair">
          Not a medical device. Not a diagnosis or treatment for ADHD.
        </AppText>
        <AppText tone="muted">
          Focus Games turns an EEG attention measure into simple games. It has not been evaluated or
          cleared by any regulator. It does not diagnose ADHD or any other condition, and it is not
          a treatment. Use it alongside, not instead of, the care your child's doctor, psychologist
          or therapist provides, and talk to them before changing any treatment.
        </AppText>
        <AppText tone="muted">
          The evidence for neurofeedback in ADHD is mixed. Meta-analyses find improvements when
          parents rate symptoms, but smaller or no effects when raters don't know which treatment a
          child received (Cortese et al. 2016). The theta/beta ratio is not a reliable diagnostic
          marker (Arns et al. 2013). Scores here are relative to your child's own baseline on the
          day; they say nothing about whether a child has ADHD.
        </AppText>
      </Card>

      <Card title="Privacy">
        <AppText tone="muted">
          Everything stays on this device: profiles, sessions and focus checks are stored locally.
          There are no accounts, no analytics and no tracking. The app sends no data anywhere; it
          only receives the EEG stream you set up. Data leaves the device only when you export it.
          Deleting a child's profile deletes their data.
        </AppText>
      </Card>

      <Card title="How the score works">
        <AppText tone="muted">
          Each session starts with a short resting baseline. During play, the chosen protocol's EEG
          measure (for example the theta/beta ratio at Cz) is compared with that baseline four times
          a second. The game rewards moments that are clearly better than the child's own resting
          level, never an absolute number. Windows with blinks or movement are skipped, and the game
          pauses when the headset signal is poor.
        </AppText>
      </Card>

      <Card title="References">
        {REFERENCES.map((r) => (
          <AppText key={r} variant="caption" tone="muted">
            {r}
          </AppText>
        ))}
      </Card>

      <Card title="Open source">
        <AppText tone="muted">MIT licensed, built on eegkit and eegkit-react.</AppText>
        <View style={styles.links}>
          {LINKS.map((link) => (
            <Button
              key={link.url}
              compact
              variant="ghost"
              label={link.label}
              accessibilityRole="link"
              accessibilityHint={link.url}
              onPress={() => Linking.openURL(link.url)}
              style={styles.link}
            />
          ))}
        </View>
        <AppText variant="caption" tone="muted">
          Version {Constants.expoConfig?.version ?? "0.2.0"}
        </AppText>
      </Card>
    </GrownUpScreen>
  );
}

const styles = StyleSheet.create({
  links: { alignItems: "flex-start", gap: space.xs },
  link: { paddingHorizontal: 0 },
});
