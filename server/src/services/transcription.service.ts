import OpenAI from 'openai';
import speech from '@google-cloud/speech';
import fs from 'fs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy_key', // Ensure it doesn't crash if env missing during boot
});

// Configure Google Cloud Speech client
// Assumes GOOGLE_APPLICATION_CREDENTIALS env var is set pointing to the service account JSON
const speechClient = new speech.SpeechClient();

export async function transcribeAudio(filePath: string): Promise<string> {
  try {
    // 1. Try OpenAI Whisper first
    console.log(`[Transcription] Attempting Whisper for ${filePath}`);
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: 'whisper-1',
      language: 'ur', // Hint for Urdu
    });
    
    return transcription.text;
  } catch (openaiError: any) {
    console.error('[Transcription] OpenAI Whisper failed:', openaiError.message);
    console.log('[Transcription] Falling back to Google Cloud Speech-to-Text...');

    try {
      // 2. Fallback to Google Cloud Speech-to-Text
      const audioBytes = fs.readFileSync(filePath).toString('base64');
      
      const audio = {
        content: audioBytes,
      };
      
      // Determine encoding from file extension if possible, or use sensible defaults
      // Browsers often output webm (Opus) or mp4
      const config = {
        encoding: 'WEBM_OPUS' as const, // Assuming webm for browser uploads, adjust based on actual input
        sampleRateHertz: 48000,
        languageCode: 'ur-PK',
        alternativeLanguageCodes: ['ur-IN', 'en-US'],
      };

      const request = {
        audio: audio,
        config: config,
      };

      const [response] = await speechClient.recognize(request);
      
      const transcription = response.results
        ?.map(result => result.alternatives?.[0].transcript)
        .join('\n');

      if (!transcription) {
        throw new Error('Google Cloud returned empty transcription');
      }

      return transcription;
    } catch (gcError: any) {
      console.error('[Transcription] Google Cloud fallback also failed:', gcError.message);
      throw new Error('Both primary and fallback transcription services failed.');
    }
  }
}
