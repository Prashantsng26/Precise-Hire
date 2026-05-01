import { docClient } from '../config/awsConfig.js';
import { PutCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const JOBS_TABLE = process.env.DYNAMODB_TABLE_JOBS;
const CANDIDATES_TABLE = process.env.DYNAMODB_TABLE_CANDIDATES;

export async function saveJob(jobData) {
  const item = {
    ...jobData,
    status: 'active',
    createdAt: new Date().toISOString()
  };
  await docClient.send(new PutCommand({
    TableName: JOBS_TABLE,
    Item: item
  }));
  return item;
}

export async function saveCandidates(candidates, jobId) {
  let savedCount = 0;
  for (const candidate of candidates) {
    const item = {
      ...candidate,
      jobId,
      currentRound: 'ATS Screening',
      status: 'pending',
      resumeText: candidate.resumeText ? candidate.resumeText.substring(0, 10000) : null
    };
    await docClient.send(new PutCommand({
      TableName: CANDIDATES_TABLE,
      Item: item
    }));
    savedCount++;
  }
  console.log(`Saved ${savedCount} candidates to DynamoDB for job ${jobId}`);
  return savedCount;
}

export async function getCandidatesByJob(jobId) {
  const response = await docClient.send(new ScanCommand({
    TableName: CANDIDATES_TABLE,
    FilterExpression: 'jobId = :jobId',
    ExpressionAttributeValues: { ':jobId': jobId }
  }));
  return response.Items || [];
}

export async function updateCandidate(candidateId, jobId, updates) {
  const updateExpression = [];
  const expressionAttributeValues = {};
  const expressionAttributeNames = {};

  Object.keys(updates).forEach((key, index) => {
    const attrName = `#attr${index}`;
    const attrVal = `:val${index}`;
    updateExpression.push(`${attrName} = ${attrVal}`);
    expressionAttributeNames[attrName] = key;
    expressionAttributeValues[attrVal] = updates[key];
  });

  await docClient.send(new UpdateCommand({
    TableName: CANDIDATES_TABLE,
    Key: { candidateId, jobId },
    UpdateExpression: `SET ${updateExpression.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues
  }));
}

export async function getDashboardStats() {
  const jobs = await docClient.send(new ScanCommand({ TableName: JOBS_TABLE }));
  const candidates = await docClient.send(new ScanCommand({ TableName: CANDIDATES_TABLE }));
  
  const totalCandidates = candidates.Items?.length || 0;
  const activeJobs = jobs.Items?.length || 0;
  
  const scores = candidates.Items
    ?.map(c => c.weighted_score)
    .filter(s => s !== undefined) || [];
  
  const avgScore = scores.length > 0 
    ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
    : 0;

  return {
    totalCandidates,
    avgScore,
    activeJobs,
    totalJobs: activeJobs,
    recentJobs: (jobs.Items || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
  };
}
