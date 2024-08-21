import Groq from "groq-sdk";

async function groqComponent(audioFile) {
  const groq = new Groq({
    apiKey: process.env.REACT_APP_GROQ_API_KEY,
    dangerouslyAllowBrowser: true,
  });

  try {
    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-large-v3",
      temperature: 0,
      response_format: "verbose_json",
    });

    return transcription.text;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export default groqComponent;
