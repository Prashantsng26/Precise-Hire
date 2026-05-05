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

async function check() {
  const cTable = 'precisehire_candidates';
  const jTable = 'precisehire_jobs';
  
  try {
    const cRes = await docClient.send(new ScanCommand({ TableName: cTable }));
    const jRes = await docClient.send(new ScanCommand({ TableName: jTable }));
    
    console.log('--- DATABASE VERIFICATION ---');
    console.log(`Candidates in ${cTable}: ${cRes.Items.length}`);
    console.log(`Jobs in ${jTable}: ${jRes.Items.length}`);
    
    if (cRes.Items.length > 0) {
        const scores = cRes.Items.map(c => c.weighted_score).filter(s => s !== undefined);
        const avg = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0;
        console.log(`Average Score calculated: ${avg}`);
    }
  } catch (e) {
    console.error('Database Error:', e.message);
  }
}

check();
