import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { aiApi } from './api/ai';
import type { ParsedExpense } from '@types/index';

export async function requestMicrophonePermission(): Promise<boolean> {
  const { status } = await Audio.requestPermissionsAsync();
  return status === 'granted';
}

export async function transcribeAndParseExpense(
  transcript: string,
  baseCurrency: string
): Promise<ParsedExpense> {
  return aiApi.parseVoice(transcript, baseCurrency);
}

export function speakText(text: string): void {
  Speech.speak(text, { language: 'en', rate: 0.9 });
}
