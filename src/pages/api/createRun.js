// src/pages/api/createRun.js
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const threadID = process.env.THREAD_ID;
const assistantID = process.env.ASSISTANT_ID;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method should be POST' });
  } else {
    try {
      const run = await openai.beta.threads.runs.create(
        threadID,
        { assistant_id: assistantID }
      );
      res.status(200).json(run.data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Something went wrong" });
    }
  }
}
