// 1. Initialize a new project with: npm init -y, and create an 4 js files .env file
// 2. npm i "@pinecone-database/pinecone@^0.0.10" dotenv@^16.0.3 langchain@^0.0.73
// 3. Obtain API key from OpenAI (https://platform.openai.com/account/api-keys)
// 4. Obtain API key from Pinecone (https://app.pinecone.io/)
// 5. Enter API keys in .env file
// Optional: if you want to use other file loaders (https://js.langchain.com/docs/modules/indexes/document_loaders/examples/file_loaders/)
import { PineconeClient } from "@pinecone-database/pinecone";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import * as dotenv from "dotenv";
import { createPineconeIndex } from "./1-createPineconeIndex.js";
import { updatePinecone } from "./2-updatePinecone.js";
import { queryPineconeVectorStoreAndQueryLLM } from "./3-queryPineconeAndQueryGPT.js";
import { createRequire } from "module";
import fs from "fs";
const require = createRequire(import.meta.url);

const filePath = 'documents/datafile.txt';


// 6. Load environment variables
dotenv.config();

//express server
const express = require('express')
const app = express()
const port = 1337
app.use(express.json())
app.use(require('cors')())

// 7. Set up variables for the filename, question, and index settings
const question = "I am 28 years old. I drank water in the morning. when should should i drink next?";
const indexName = "your-pinecone-index-name";
const vectorDimension = 1536;
// 8. Run the main async function
const client = new PineconeClient();

(async () => {
  try {
    // 9. Initialize Pinecone client with API key and environment
    await client.init({
      apiKey: process.env.PINECONE_API_KEY,
      environment: process.env.PINECONE_ENVIRONMENT,
    });
  // 10. Check if Pinecone index exists and create if necessary
    await createPineconeIndex(client, indexName, vectorDimension);
  // 11. Set up DirectoryLoader to load documents from the ./documents directory
    const loader = new DirectoryLoader("./documents", {
      ".txt": (path) => new TextLoader(path),
      ".pdf": (path) => new PDFLoader(path),
    });
    const docs = await loader.load();
  // 12. Update Pinecone vector store with document embeddings
  //   await updatePinecone(client, indexName, docs);
  // 13. Query Pinecone vector store and GPT model for an answer
  //   await queryPineconeVectorStoreAndQueryLLM(client, indexName, question);
  }catch (error) {
    console.error("An error occurred:", error);
  }

  })();


//route

app.post('/strings', (req, res) => {
  const strings = req.body;

  if (!Array.isArray(strings)) {
    return res.status(400).json({ error: 'Invalid data. Expected an array of strings.' });
  }

  // Perform any desired operations with the array of strings
  console.log('Received strings:', strings);

  // Send a response indicating success
  res.json({ message: 'Strings received successfully.' });
});


app.post('/news', async (req, res) => {
  const strings = req.body

  if (!Array.isArray(strings)) {
    return res.status(400).json({ error: 'Invalid data. Expected an array of strings.' });
  }

  // const docs = [
  //   {id:123,title:"how i met your mother",description:"barney is crazy",createdAt:"Mon Jul 24 2023 12:36:28 GMT+0530"},
  //   {id:456,title: "ted is honest",description:"description",createdAt:"Mon Jul 24 2023 12:36:28 GMT+0530"}
  // ];

  const docs =strings


  await updatePinecone(client, indexName, docs);


  res.json({"message":"ok"});


});

app.get('/',(req,res)=>{
  res.send("hello")
})

app.post('/api', async (req,res)=>{
    const {prompt} = req.body
    const client = new PineconeClient();
    await client.init({
    apiKey: process.env.PINECONE_API_KEY,
    environment: process.env.PINECONE_ENVIRONMENT,
  });
    console.log(req.body.question)
    const indexName = "your-pinecone-index-name";
    const result = await queryPineconeVectorStoreAndQueryLLM(client, indexName, req.body);
    res.json({
      "message":result
    })
})


app.listen(port,()=>console.log(`App is running on ${port}`))
