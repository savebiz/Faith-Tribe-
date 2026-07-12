import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import ffmpegPath from 'ffmpeg-static';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { devotionalId } = req.body || req.query;

  if (!devotionalId) {
    return res.status(400).json({ error: 'devotionalId is required' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.API_KEY || '';

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Supabase credentials are not configured on the server' });
  }

  if (!apiKey) {
    return res.status(500).json({ error: 'Google Gemini API key is not configured on the server' });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const ai = new GoogleGenAI({ apiKey });

  try {
    // 1. Fetch devotional details
    const { data: devotional, error: devError } = await supabaseAdmin
      .from('devotionals')
      .select('*')
      .eq('id', devotionalId)
      .maybeSingle();

    if (devError || !devotional) {
      return res.status(404).json({ error: `Devotional not found: ${devError?.message || 'Unknown error'}` });
    }

    console.log(`Generating audio and video for devotional: "${devotional.title}"`);

    // Define unique temp directory inside /tmp
    const tempDir = path.join('/tmp', `devotional-${devotionalId}`);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const audioPathLocal = path.join(tempDir, 'narration.mp3');
    const videoPathLocal = path.join(tempDir, 'devotional-video.mp4');

    // 2. Synthesize Narration via Google Cloud TTS API
    // We synthesize the Title, Memory Verse, and Body Content
    const speechText = `
      Today's Devotional: ${devotional.title}.
      Memory Verse: ${devotional.memory_verse || ''}.
      Bible Reading Reference: ${devotional.bible_reading_ref || ''}.
      Message:
      ${devotional.body_content}
      Prayer Point:
      ${devotional.prayer_point || ''}
    `.trim();

    console.log("Synthesizing audio narration with Google Cloud TTS...");
    const ttsUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
    const ttsRes = await fetch(ttsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: { text: speechText },
        voice: { languageCode: 'en-NG', name: 'en-NG-Standard-A' },
        audioConfig: { audioEncoding: 'MP3' }
      })
    });

    if (!ttsRes.ok) {
      const errText = await ttsRes.text();
      throw new Error(`Google Cloud TTS API failed: ${ttsRes.status} - ${errText}`);
    }

    const ttsData: any = await ttsRes.json();
    const audioBuffer = Buffer.from(ttsData.audioContent, 'base64');
    fs.writeFileSync(audioPathLocal, audioBuffer);
    console.log("Audio narration successfully generated.");

    // Upload audio to Supabase Storage
    const supabaseAudioPath = `devotional-audio/${devotionalId}.mp3`;
    const { error: audioUploadError } = await supabaseAdmin.storage
      .from('devotional-media')
      .upload(supabaseAudioPath, audioBuffer, { contentType: 'audio/mp3', upsert: true });

    if (audioUploadError) {
      console.warn("Storage upload warning (Audio):", audioUploadError.message);
    }

    // 3. Generate Scenic Illustration Prompts via Gemini
    console.log("Generating visual scene prompts with Gemini...");
    const promptRefinerText = `
      You are an expert video producer. Given this Christian devotional text, suggest 4 short, visually beautiful, gentle, and reverent scene descriptions suitable for AI illustration.
      Keep descriptions abstract, warm, and symbolic (e.g. "A peaceful path winding through a misty green forest under gentle sun rays", "hands lifted up in prayer against a warm sunset sky"). Do not attempt to depict specific real people.
      Return the 4 scene descriptions as a plain JSON array of strings. Do not include markdown code block syntax.
      Devotional Title: ${devotional.title}
      Devotional Body: ${devotional.body_content}
    `.trim();

    const geminiRes = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: promptRefinerText,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    let rawText = geminiRes.text || '[]';
    // Clean codeblock markers if any
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    let scenePrompts: string[] = [];
    try {
      scenePrompts = JSON.parse(rawText);
    } catch (e) {
      console.warn("Failed to parse Gemini scene prompts JSON, falling back to defaults.", rawText);
      scenePrompts = [
        "A peaceful sunrise over a tranquil lake with soft morning mist",
        "A winding path through a golden wheat field under a clear sky",
        "Gentle candle light illuminating an open Bible in a warm room",
        "A majestic tree standing strong on a mountain top during sunset"
      ];
    }

    // Ensure we have exactly 4 scene prompts
    scenePrompts = scenePrompts.slice(0, 4);

    // 4. Generate Images via Google Cloud Imagen Model
    console.log("Generating scene illustrations with Google Cloud Imagen...");
    const imageLocalPaths: string[] = [];

    for (let idx = 0; idx < scenePrompts.length; idx++) {
      const promptText = `${scenePrompts[idx]}, gentle, warm, illustrative artistic style, soft lighting`;
      try {
        console.log(`Generating scene ${idx + 1}/${scenePrompts.length}: "${scenePrompts[idx]}"`);
        
        const imagenRes = await ai.models.generateImages({
          model: 'imagen-3.0-generate-002',
          prompt: promptText,
          config: {
            numberOfImages: 1,
            outputMimeType: 'image/png',
            aspectRatio: '16:9'
          }
        });

        if (imagenRes.generatedImages && imagenRes.generatedImages[0]) {
          const imageBytes = imagenRes.generatedImages[0].image.imageBytes;
          const imageBuffer = Buffer.from(imageBytes, 'base64');
          const imgLocalPath = path.join(tempDir, `scene-${idx}.png`);
          fs.writeFileSync(imgLocalPath, imageBuffer);
          imageLocalPaths.push(imgLocalPath);

          // Upload image to storage
          const supabaseImgPath = `devotional-images/${devotionalId}-${idx}.png`;
          await supabaseAdmin.storage
            .from('devotional-media')
            .upload(supabaseImgPath, imageBuffer, { contentType: 'image/png', upsert: true });
        }
      } catch (err: any) {
        console.error(`Failed to generate image ${idx} via Imagen:`, err.message || err);
      }
    }

    // Failsafe: if some images failed to generate, copy a default placeholder or duplicate the successful ones
    if (imageLocalPaths.length === 0) {
      throw new Error("Failed to generate any illustrative scenes for the video.");
    }
    while (imageLocalPaths.length < 4) {
      // duplicate the last successful image
      const src = imageLocalPaths[imageLocalPaths.length - 1];
      const dest = path.join(tempDir, `scene-${imageLocalPaths.length}.png`);
      fs.copyFileSync(src, dest);
      imageLocalPaths.push(dest);
    }

    // 5. Video Composition with Ffmpeg
    console.log("Composing video with ffmpeg-static...");
    if (!ffmpegPath) {
      throw new Error("ffmpeg binary not found in the environment");
    }

    // Determine audio duration to pace scenes correctly
    // We can run ffmpeg probe or inspect duration, or let ffmpeg auto-calculate
    // To make it easy, we can calculate duration roughly or use simple ffmpeg filter chain.
    // For 4 images, we loop each image for 1/4 of total duration or 10 seconds each.
    // Let's loop each of the 4 images for 8 seconds (total 32 seconds) or sync exactly.
    // A robust, standard filter chain that crossfades 4 images and adds Ken Burns (zoompan) zoom:
    // We can zoompan each image and overlay them.
    // Let's run a robust, simple shell execution:
    const cmd = `"${ffmpegPath}" -y -f concat -safe 0 -i - -i "${audioPathLocal}" -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest "${videoPathLocal}"`;
    
    // Write concat file
    const concatFilePath = path.join(tempDir, 'concat.txt');
    // We allocate 10 seconds per scene
    const concatContent = imageLocalPaths.map(p => `file '${p}'\nduration 10.0`).join('\n') + `\nfile '${imageLocalPaths[imageLocalPaths.length - 1]}'`;
    fs.writeFileSync(concatFilePath, concatContent);

    // Run execution
    const execCmd = `"${ffmpegPath}" -y -f concat -safe 0 -i "${concatFilePath}" -i "${audioPathLocal}" -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest "${videoPathLocal}"`;
    console.log(`Running ffmpeg: ${execCmd}`);
    execSync(execCmd, { stdio: 'inherit' });
    console.log("Video composition complete.");

    // Upload compiled video to Supabase
    const videoBuffer = fs.readFileSync(videoPathLocal);
    const supabaseVideoPath = `devotional-video/${devotionalId}.mp4`;
    const { error: videoUploadError } = await supabaseAdmin.storage
      .from('devotional-media')
      .upload(supabaseVideoPath, videoBuffer, { contentType: 'video/mp4', upsert: true });

    if (videoUploadError) {
      console.warn("Storage upload warning (Video):", videoUploadError.message);
    }

    // 6. Clean up temp files
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {
      // ignore cleanup errors
    }

    // 7. Update devotionals row
    await supabaseAdmin
      .from('devotionals')
      .update({
        audio_path: supabaseAudioPath,
        video_path: supabaseVideoPath
      })
      .eq('id', devotionalId);

    return res.status(200).json({
      success: true,
      audioPath: supabaseAudioPath,
      videoPath: supabaseVideoPath
    });
  } catch (err: any) {
    console.error("Video Generation Error:", err);
    return res.status(500).json({ error: `Video generation pipeline failed: ${err.message}` });
  }
}
