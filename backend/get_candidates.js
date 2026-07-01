import 'dotenv/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});
const docClient = DynamoDBDocumentClient.from(client);

async function run() {
  try {
    const jobs = await docClient.send(new ScanCommand({ TableName: 'precisehire_jobs' }));
    const sortedJobs = jobs.Items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    console.log("Last Job:", sortedJobs[0]);
    
    if (sortedJobs[0]) {
      const jobId = sortedJobs[0].jobId;
      const candidates = await docClient.send(new ScanCommand({
        TableName: 'precisehire_candidates',
        FilterExpression: 'jobId = :jobId',
        ExpressionAttributeValues: { ':jobId': jobId }
      }));
      console.log(`Candidates for job ${jobId}:`, candidates.Items.map(c => ({
        candidateId: c.candidateId,
        name: c.name,
        weighted_score: c.weighted_score,
        status: c.status,
        justification: c.justification
      })));
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
}
run();
