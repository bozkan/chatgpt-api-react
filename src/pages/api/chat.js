// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import axios from 'axios';
import OpenAI from 'openai';

export const maxDuration = 30; // This function can run for a maximum of 5 seconds
export const dynamic = 'force-dynamic';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // defaults to process.env["OPENAI_API_KEY"]
});

const threadID = process.env.THREAD_ID;
const assistantID = process.env.ASSISTANT_ID;

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const addMessage = (role, threadId, content) => {
    return openai.beta.threads.messages.create(
        threadId,
        { role: "user", content }
    )
}

const terminalStates = ["cancelled", "failed", "completed", "expired"];
const statusCheckLoop = async (openAiThreadId, runId) => {
    const run = await openai.beta.threads.runs.retrieve(
        openAiThreadId,
        runId
    );

    if(terminalStates.indexOf(run.status) < 0){
        await sleep(1000);
        return statusCheckLoop(openAiThreadId, runId);
    }

    return run.status;
}

const checkStatusAndPrintMessages = async (threadId, runId) => {
  let runStatus = await openai.beta.threads.runs.retrieve(threadId, runId);
  if(runStatus.status === "completed"){
      let messages = await openai.beta.threads.messages.list(threadId);
      messages.data.forEach((msg) => {
          const role = msg.role;
          const content = msg.content[0].text.value; 
          console.log(
              `${role.charAt(0).toUpperCase() + role.slice(1)}: ${content}`
          );
      });
  } else {
      console.log("Run is not completed yet.");
  }  
};

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

      await addMessage("user", threadID, body.content);
  
      const run = await openai.beta.threads.runs.create(
          threadID,
          { assistant_id: assistantID }
      );

      const status = await statusCheckLoop(threadID, run.id);

      const messages = await openai.beta.threads.messages.list(threadID);
      const msg = messages.data;
      let response = msg[0].content[0].text.value;
      res.status(200).json({ message: response });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Something went wrong" });
    }
  }
  
}
