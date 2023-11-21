// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import axios from 'axios';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // defaults to process.env["OPENAI_API_KEY"]
});

const threadID = process.env.THREAD_ID;
const assistantID = process.env.ASSISTANT_ID;

const addMessage = (threadId, content) => {
    return openai.beta.threads.messages.create(
        threadId,
        { role: "user", content }
    )
}

export default async function handler(req, res) {
  const referer = req.headers.referer || req.headers.referrer; // get the referer from the request headers

  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method should be POST' });
  } else if (process.env.NODE_ENV !== "development") {
    if (!referer || referer !== process.env.APP_URL) {
      res.status(401).json({ message: 'Unauthorized' });
    }
  }
  else {
    try {
      const { body } = req;
      const url = 'https://api.openai.com/v1/assistants/asst_9Ag52mNOljbOZ3oVdjfP0rIB/messages';
      const headers = {
        'Content-type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      };

      await addMessage(threadID, body.content);
  
      const run = await openai.beta.threads.runs.create(
          threadID,
          { assistant_id: assistantID }
      );

      const messages = await openai.beta.threads.messages.list(threadID);
      const msg = messages.data;
      console.log("MESS:", msg[msg.length-1].content);
      let response = msg[msg.length-1].content[0].text.value;
      res.status(200).json({ message: response });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Something went wrong" });
    }
  }
  
}
