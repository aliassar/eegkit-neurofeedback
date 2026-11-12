import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { GameSession } from "@/components/games/GameSession";
import { getGame } from "@/lib/games";
import { useProfiles } from "@/state/profiles";

export default function Play() {
  const { game: gameId } = useLocalSearchParams<{ game: string }>();
  const { active, loaded } = useProfiles();
  const router = useRouter();
  const [run, setRun] = useState(0);
  const game = getGame(String(gameId));
  if (!loaded) return null;
  if (!game || !active) return <Redirect href="/" />;
  return (
    <GameSession
      key={run}
      game={game}
      profile={active}
      onExit={() => (router.canGoBack() ? router.back() : router.replace("/"))}
      onPlayAgain={() => setRun((r) => r + 1)}
    />
  );
}
