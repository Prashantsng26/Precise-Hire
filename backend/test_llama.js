import 'dotenv/config';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1'
});

async function run() {
  console.log("Calling Llama with API key:", process.env.NVIDIA_API_KEY ? "Present" : "Missing");
  try {
    const completion = await client.chat.completions.create({
      model: 'meta/llama-3.1-70b-instruct',
      messages: [{ role: 'user', content: 'Say hello' }],
      temperature: 0.1,
      max_tokens: 50,
    });
    console.log("Success:", completion.choices[0].message.content);
  } catch (e) {
    console.error("Error:", e.message);
  }
}

run();
