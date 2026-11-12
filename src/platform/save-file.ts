import { Platform, Share } from "react-native";

/**
 * Hands a text file to the user: a download on the web, the share sheet on
 * iOS and Android (as text, which can be saved to Files, mailed or messaged).
 */
export async function saveTextFile(name: string, mime: string, text: string): Promise<void> {
  if (Platform.OS === "web") {
    const url = URL.createObjectURL(new Blob([text], { type: `${mime};charset=utf-8` }));
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }
  await Share.share({ title: name, message: text });
}
