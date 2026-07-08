# Cognee Memory Architecture Explanation

This document provides a clear, high-level explanation of how the Cognee memory integration works in this project. It covers how data is separated per user, how the creation and retrieval lifecycles operate, and how the system scales.

## 1. How User Separation Works

The user separation in this project is handled **semantically through the knowledge graph** rather than through strict database-level isolation.

- **Single Global Dataset (The "Brain"):** The application connects to Cognee using a single global dataset name defined by the `COGNEE_USER_ID` environment variable. All memories for all users are injected into this shared graph.
- **Semantic Isolation at Creation:** When an interview is completed, the memory payload explicitly includes a unique `userId` field (usually the Clerk user ID) attached inside the data object.
- **Prompt-Based Filtering at Retrieval:** When querying Cognee, the system uses semantic recall prompts that explicitly restrict the search to a specific user. For example, the query string dynamically injects the candidate's ID: 
  > *"Retrieve only relevant previous semantic interview memories for candidate **[USER_ID]** preparing for..."*
  
This relies on Cognee's search and the underlying LLM to correctly traverse the graph and only extract nodes associated with that `userId`.

## 2. What Data It Contains

The data saved into Cognee isn't raw interview transcripts or audio. Instead, it is a highly distilled, structured JSON payload called `InterviewSemanticMemory`. It contains:

- **Identity & Context:** `userId`, `interviewId`, `company`, `role`, and `interviewType`.
- **Scores (0-100):** Specific metrics for overall readiness, technical, communication, behavioral, problem-solving, and confidence.
- **Extracted Arrays:** `strengths`, `weaknesses`, `missingTopics`, and `recommendations`.
- **Summaries:** A dynamically generated text summary of the performance, and an optional `historicalTrend`.

## 3. The File Name (Interview ID vs. User ID)

When you look at the files stored in Cognee (e.g., `interview-memory-cmr826dnq000f8cu99az7ud3i-1783272777418`), the ID in the filename is **not** the User ID.

- `bb6b50ca...` (The Dataset/Brain ID) = The `COGNEE_USER_ID` global environment variable.
- `cmr826dnq...` (In the filename) = The **Interview ID**.
- The actual candidate's **User ID** is stored *inside* the contents of that JSON file. 

When Cognee processes the uploaded file, it extracts all the JSON contents (including the `userId` inside it) and maps it into its Knowledge Graph.

## 4. The Lifecycle: `remember()` and `improve()`

Data ingestion operates in a classic two-step pipeline: **Upload**, then **Process**.

### A. `remember()` (The Upload Step)
This function takes the structured JSON memory object, packages it into a virtual file, and uploads it to Cognee's storage via `POST /api/v1/remember`. At this stage, Cognee has saved the file, but it **has not** yet extracted the concepts or built the Knowledge Graph.

### B. `improve()` (The Processing Step)
Immediately after uploading, the application calls `POST /api/v1/improve`. This commands Cognee's AI engine to read the newly uploaded file, extract **Entities** (e.g., "Candidate 123", "React.js"), map **Relationships** (e.g., *[Candidate 123] -> [has weakness in] -> [React.js]*), and update the searchable vector index.

## 5. How Data is Retrieved (`recall()`)

Retrieval happens at two specific points to create a personalized experience:
1. **Question-Generation Recall (Start of Interview):** Fetches recurring strengths/weaknesses to inject into the Gemini prompt that generates the interview questions.
2. **Historical Evaluation Recall (End of Interview):** Fetches previous scores and trends to give Gemini a historical baseline when grading the *current* interview.

Retrieval uses **Semantic Search**. The system sends a plain English prompt to Cognee's graph (e.g., *"What are this candidate's weaknesses?"*). It does not search by file name.

## 6. Scaling, `topK`, and Cost

### Will it return 50 memories if the user has 50 interviews?
**No.** The `recall()` function uses a parameter called `topK: 5`. This means Cognee will rank every memory in its graph based on relevance and only return the **5 most mathematically relevant** memory chunks, ignoring the rest. 

Furthermore, the application slices the returned text to a strict character limit (3,500 chars) before sending it to Gemini, guaranteeing that the LLM prompt never explodes in size.

### Does the cost increase as interviews increase?
- **Storage & Processing Cost (Increases):** Every completed interview runs `remember()` and `improve()`. The ingestion cost scales directly with usage because the AI has to process the new data.
- **Retrieval / Recall Cost (Stays Flat):** Because of Vector Search algorithms, searching 50 documents is virtually the same speed and cost as searching 5 documents. Because `topK` caps the returned results to 5, the token cost of generating questions with Gemini also stays strictly capped.
